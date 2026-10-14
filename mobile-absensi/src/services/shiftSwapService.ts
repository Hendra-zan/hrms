import { supabase } from '../config/supabase';
import { ShiftSwapRequest } from '../types';

export interface CreateShiftSwapPayload {
  requesterEmployeeId: string;
  requesterScheduleId: string;
  targetEmployeeId: string;
  targetScheduleId: string;
  reason: string;
}

export async function createShiftSwapRequest(payload: CreateShiftSwapPayload): Promise<ShiftSwapRequest> {
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .insert({
      requester_employee_id: payload.requesterEmployeeId,
      requester_schedule_id: payload.requesterScheduleId,
      target_employee_id: payload.targetEmployeeId,
      target_schedule_id: payload.targetScheduleId,
      reason: payload.reason,
      peer_status: 'pending',
      unit_approval_status: 'pending',
      overall_status: 'pending_peer',
    })
    .select()
    .single();

  if (error) {
    console.error('Failed to create shift swap request:', error);
    throw new Error(error.message || 'Gagal membuat pengajuan tukar shift.');
  }

  return data as ShiftSwapRequest;
}

export async function respondShiftSwapByPeer(
  requestId: string,
  targetEmployeeId: string,
  approved: boolean
): Promise<ShiftSwapRequest> {
  const now = new Date().toISOString();
  const updatePayload = approved
    ? {
        peer_status: 'approved',
        peer_responded_at: now,
        overall_status: 'pending_unit',
      }
    : {
        peer_status: 'rejected',
        peer_responded_at: now,
        overall_status: 'rejected',
      };

  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update(updatePayload)
    .eq('id', requestId)
    .eq('target_employee_id', targetEmployeeId)
    .select()
    .single();

  if (error) {
    console.error('Failed to respond to shift swap request by peer:', error);
    throw new Error(error.message || 'Gagal memproses persetujuan rekan kerja.');
  }

  return data as ShiftSwapRequest;
}

export async function getShiftSwapRequests(options?: {
  employeeId?: string;
  asTargetOnly?: boolean;
  asRequesterOnly?: boolean;
  statusFilter?: string;
}): Promise<ShiftSwapRequest[]> {
  let query = supabase
    .from('shift_swap_requests')
    .select(`
      *,
      requester_employee:employees!requester_employee_id(id, nama, foto, jabatan, departemen),
      target_employee:employees!target_employee_id(id, nama, foto, jabatan, departemen),
      unit_approver_employee:employees!unit_approved_by(id, nama),
      requester_schedule:employee_schedules!requester_schedule_id(id, schedule_date, shift_name, shift_start_time, shift_end_time),
      target_schedule:employee_schedules!target_schedule_id(id, schedule_date, shift_name, shift_start_time, shift_end_time)
    `)
    .order('created_at', { ascending: false });

  if (options?.asTargetOnly && options.employeeId) {
    query = query.eq('target_employee_id', options.employeeId);
  } else if (options?.asRequesterOnly && options.employeeId) {
    query = query.eq('requester_employee_id', options.employeeId);
  } else if (options?.employeeId) {
    query = query.or(`requester_employee_id.eq.${options.employeeId},target_employee_id.eq.${options.employeeId}`);
  }

  if (options?.statusFilter && options.statusFilter !== 'all') {
    query = query.eq('overall_status', options.statusFilter);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Failed to fetch shift swap requests:', error);
    return [];
  }

  return (data || []) as ShiftSwapRequest[];
}

export async function requestSwapShift(
  scheduleId1: string,
  scheduleId2: string,
  reason: string,
  approvedBy: string
): Promise<void> {
  const { data: schedules, error: loadErr } = await supabase
    .from('employee_schedules')
    .select('*')
    .in('id', [scheduleId1, scheduleId2]);

  if (loadErr) throw loadErr;
  if (!schedules || schedules.length !== 2) throw new Error('Jadwal tidak ditemukan');

  const s1 = schedules.find((s: any) => s.id === scheduleId1) as any;
  const s2 = schedules.find((s: any) => s.id === scheduleId2) as any;

  const now = new Date().toISOString();

  const update1Payload = {
    shift_name: s2.shift_name,
    shift_start_time: s2.shift_start_time,
    shift_end_time: s2.shift_end_time,
    is_off_day: s2.is_off_day,
    status: 'swapped',
    swapped_with_employee_id: s2.employee_id,
    swapped_with_schedule_id: scheduleId2,
    swap_reason: reason,
    swap_approved_by: approvedBy,
    swap_approved_at: now,
  };

  const update2Payload = {
    shift_name: s1.shift_name,
    shift_start_time: s1.shift_start_time,
    shift_end_time: s1.shift_end_time,
    is_off_day: s1.is_off_day,
    status: 'swapped',
    swapped_with_employee_id: s1.employee_id,
    swapped_with_schedule_id: scheduleId1,
    swap_reason: reason,
    swap_approved_by: approvedBy,
    swap_approved_at: now,
  };

  const { error: err1 } = await supabase
    .from('employee_schedules')
    .update(update1Payload)
    .eq('id', scheduleId1);

  if (err1) throw new Error(`Gagal swap jadwal pertama: ${err1.message}`);

  const { error: err2 } = await supabase
    .from('employee_schedules')
    .update(update2Payload)
    .eq('id', scheduleId2);

  if (err2) {
    await supabase
      .from('employee_schedules')
      .update({
        shift_name: s1.shift_name,
        shift_start_time: s1.shift_start_time,
        shift_end_time: s1.shift_end_time,
        is_off_day: s1.is_off_day,
        status: s1.status,
        swapped_with_employee_id: null,
        swapped_with_schedule_id: null,
        swap_reason: null,
        swap_approved_by: null,
        swap_approved_at: null,
      } as any)
      .eq('id', scheduleId1);
    throw new Error(`Gagal swap jadwal kedua (perubahan pertama telah dibatalkan): ${err2.message}`);
  }
}

export async function approveShiftSwapByUnitHead(
  requestId: string,
  approverEmployeeId: string,
  note?: string
): Promise<ShiftSwapRequest> {
  const { data: request, error: fetchError } = await supabase
    .from('shift_swap_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (fetchError || !request) {
    throw new Error('Pengajuan tukar shift tidak ditemukan.');
  }

  if (request.peer_status !== 'approved') {
    throw new Error('Pengajuan belum disetujui oleh rekan kerja yang bersangkutan.');
  }

  if (request.overall_status !== 'pending_unit') {
    throw new Error(`Pengajuan tidak dalam status menunggu persetujuan Kepala Unit (Status: ${request.overall_status}).`);
  }

  await requestSwapShift(
    request.requester_schedule_id,
    request.target_schedule_id,
    request.reason,
    approverEmployeeId
  );

  const now = new Date().toISOString();
  const { data: updatedRequest, error: updateError } = await supabase
    .from('shift_swap_requests')
    .update({
      unit_approval_status: 'approved',
      unit_approved_by: approverEmployeeId,
      unit_approved_at: now,
      unit_approval_note: note || 'Disetujui oleh Kepala Unit',
      overall_status: 'approved',
      updated_at: now,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (updateError) {
    console.error('Failed to finalize shift swap request status:', updateError);
    throw new Error('Gagal memperbarui status pengajuan setelah pertukaran jadwal.');
  }

  return updatedRequest as ShiftSwapRequest;
}

export async function rejectShiftSwapByUnitHead(
  requestId: string,
  approverEmployeeId: string,
  note?: string
): Promise<ShiftSwapRequest> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('shift_swap_requests')
    .update({
      unit_approval_status: 'rejected',
      unit_approved_by: approverEmployeeId,
      unit_approved_at: now,
      unit_approval_note: note || 'Ditolak oleh Kepala Unit',
      overall_status: 'rejected',
      updated_at: now,
    })
    .eq('id', requestId)
    .select()
    .single();

  if (error) {
    console.error('Failed to reject shift swap request:', error);
    throw new Error(error.message || 'Gagal menolak pengajuan tukar shift.');
  }

  return data as ShiftSwapRequest;
}
