import { dataSupabase as supabase } from './dataSupabaseClient.ts';
import { ShiftSwapRequest, DEFAULT_SHIFT_DEFINITIONS } from '../types.ts';
import { requestSwapShift } from './scheduleService.ts';
import { recalculateAttendanceMetrics } from './attendanceMetricsService.ts';

export interface CreateShiftSwapPayload {
    requesterEmployeeId: string;
    requesterScheduleId: string;
    targetEmployeeId: string;
    targetScheduleId: string;
    reason: string;
}

async function sendNotificationNote(recipientId?: string, senderId?: string, title?: string, content?: string) {
    if (!recipientId || !senderId || !title || !content) return;
    try {
        await (supabase as any).from('employee_notes').insert({
            employee_id: recipientId,
            sender_id: senderId,
            category: 'schedule_coordination',
            priority: 'normal',
            title,
            content,
            status: 'unread',
            direction: 'top_down',
        });
    } catch { /* silent fallback */ }
}

/**
 * Buat pengajuan tukar shift baru dari Karyawan Pemohon ke Rekan Kerja.
 */
export async function createShiftSwapRequest(payload: CreateShiftSwapPayload): Promise<ShiftSwapRequest> {
    const { data, error } = await (supabase as any)
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

    // Send automatic notification note to peer
    await sendNotificationNote(
        payload.targetEmployeeId,
        payload.requesterEmployeeId,
        '🔄 Permintaan Tukar Shift Baru',
        `Rekan kerja Anda mengajukan pertukaran shift. Alasan: ${payload.reason}. Silakan buka menu Tukar Shift untuk konfirmasi.`
    );

    return data as ShiftSwapRequest;
}

/**
 * Tanggapan dari Rekan Kerja (Tahap 1 Approval).
 */
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

    const { data, error } = await (supabase as any)
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

    if (data?.requester_employee_id) {
        if (approved) {
            await sendNotificationNote(
                data.requester_employee_id,
                targetEmployeeId,
                '✅ Pertukaran Shift Disetujui Rekan Kerja',
                'Rekan kerja Anda telah menyetujui pengajuan tukar shift. Pengajuan kini diteruskan ke Kepala Ruangan untuk persetujuan akhir.'
            );
        } else {
            await sendNotificationNote(
                data.requester_employee_id,
                targetEmployeeId,
                '❌ Pertukaran Shift Ditolak Rekan Kerja',
                'Pengajuan tukar shift Anda ditolak oleh rekan kerja yang bersangkutan.'
            );
        }
    }

    return data as ShiftSwapRequest;
}

/**
 * Persetujuan dari Kepala Unit / Supervisor (Tahap 2 Final Approval).
 * Saat disetujui, jadwal di tabel employee_schedules akan otomatis di-swap!
 */
export async function approveShiftSwapByUnitHead(
    requestId: string,
    approverEmployeeId: string,
    note?: string
): Promise<ShiftSwapRequest> {
    // 1. Ambil rincian pengajuan tukar shift
    const { data: request, error: fetchError } = await (supabase as any)
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

    // 2. Eksekusi Atomic Swap pada jadwal kerja
    await requestSwapShift(
        request.requester_schedule_id,
        request.target_schedule_id,
        request.reason,
        approverEmployeeId
    );

    // 3. Update status pengajuan menjadi approved
    const now = new Date().toISOString();
    const { data: updatedRequest, error: updateError } = await (supabase as any)
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

    // Send notifications to both employees
    if (request.requester_employee_id) {
        await sendNotificationNote(
            request.requester_employee_id,
            approverEmployeeId,
            '🎉 Pertukaran Shift RESMI DISETUJUI',
            `Pengajuan tukar shift Anda telah disetujui oleh Kepala Ruangan. Jadwal kerja baru Anda sudah aktif.`
        );
    }
    if (request.target_employee_id) {
        await sendNotificationNote(
            request.target_employee_id,
            approverEmployeeId,
            '🎉 Pertukaran Shift RESMI DISETUJUI',
            `Pertukaran shift telah disetujui oleh Kepala Ruangan. Jadwal kerja baru Anda sudah aktif.`
        );
    }

    // TASK 6.1 (B1): Trigger otomatis rekalkulasi absensi jika sudah ada catatan absensi di tanggal terkait
    try {
        const { data: swappedSchedules } = await (supabase as any)
            .from('employee_schedules')
            .select('employee_id, schedule_date')
            .in('id', [request.requester_schedule_id, request.target_schedule_id]);

        if (swappedSchedules && swappedSchedules.length > 0) {
            for (const s of swappedSchedules) {
                if (s.schedule_date && s.employee_id) {
                    await recalculateAttendanceMetrics(
                        s.schedule_date,
                        s.schedule_date,
                        DEFAULT_SHIFT_DEFINITIONS,
                        undefined,
                        [s.employee_id]
                    );
                }
            }
        }
    } catch (recalcErr) {
        console.warn('[shiftSwapService] Background recalculate error after swap:', recalcErr);
    }

    return updatedRequest as ShiftSwapRequest;
}

/**
 * Penolakan dari Kepala Unit / Supervisor (Tahap 2).
 */
export async function rejectShiftSwapByUnitHead(
    requestId: string,
    approverEmployeeId: string,
    note?: string
): Promise<ShiftSwapRequest> {
    const now = new Date().toISOString();
    const { data, error } = await (supabase as any)
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

    if (data?.requester_employee_id) {
        await sendNotificationNote(
            data.requester_employee_id,
            approverEmployeeId,
            '❌ Pertukaran Shift Ditolak Kepala Ruangan',
            `Pengajuan tukar shift Anda ditolak oleh Kepala Ruangan. Alasan: ${note || '-'}`
        );
    }

    return data as ShiftSwapRequest;
}

/**
 * Mengambil daftar pengajuan tukar shift dengan join data karyawan & jadwal.
 */
export async function getShiftSwapRequests(options?: {
    employeeId?: string;
    asTargetOnly?: boolean;
    asRequesterOnly?: boolean;
    statusFilter?: string;
}): Promise<ShiftSwapRequest[]> {
    let query = (supabase as any)
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
