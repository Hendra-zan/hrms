/**
 * src/services/requestService.ts
 *
 * CRUD pengajuan Cuti / Izin / Overtime / Reimburse dari karyawan.
 *
 * Skema DB bervariasi antar environment (camelCase vs snake_case). Service
 * mencoba camelCase dulu; jika Supabase mengeluh kolom tidak ada, otomatis
 * re-attempt dengan snake_case — pola yang sama seperti `attendanceService`.
 */
import { supabase } from '../config/supabase';
import type { MobileUser } from '../types';
import { logMobileAudit } from './auditService';
import { dbSchemaService } from './dbSchemaService';

export type RequestType = 'Cuti' | 'Izin' | 'Overtime' | 'Reimburse';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: RequestType;
  startDate: string;  // YYYY-MM-DD
  endDate: string;
  reason: string;
  status: RequestStatus;
  amount?: number;
  approvedBy?: string;
  approvedAt?: string;
  createdAt?: string;
  overtimeMetadata?: any;
}

export interface LeaveRequestDraft {
  type: RequestType;
  startDate: string;
  endDate: string;
  reason: string;
  amount?: number;
}

const isSchemaError = (msg: string): boolean => {
  const m = String(msg || '').toLowerCase();
  return (
    m.includes('does not exist') ||
    m.includes('column') ||
    m.includes('schema cache')
  );
};

const mapRow = (row: any): LeaveRequest => ({
  id: String(row.id || ''),
  employeeId: String(row.employeeId || row.employee_id || ''),
  type: (row.type || 'Izin') as RequestType,
  startDate: String(row.startDate || row.start_date || ''),
  endDate: String(row.endDate || row.end_date || ''),
  reason: row.reason || '',
  status: (row.status || 'Pending') as RequestStatus,
  amount: typeof row.amount === 'number' ? row.amount : undefined,
  approvedBy: row.approvedBy || row.approved_by || undefined,
  approvedAt: row.approvedAt || row.approved_at || undefined,
  createdAt: row.requestedAt || row.createdAt || row.created_at || undefined,
  overtimeMetadata: row.overtimeMetadata || row.overtime_metadata || null,
});

const buildPayload = (employeeId: string, draft: LeaveRequestDraft, snake: boolean) => {
  if (snake) {
    return {
      employee_id: employeeId,
      type: draft.type,
      start_date: draft.startDate,
      end_date: draft.endDate,
      reason: draft.reason,
      status: 'Pending' as RequestStatus,
      amount: draft.amount ?? null,
    };
  }
  return {
    employeeId,
    type: draft.type,
    startDate: draft.startDate,
    endDate: draft.endDate,
    reason: draft.reason,
    status: 'Pending' as RequestStatus,
    amount: draft.amount ?? null,
  };
};

const validateDraft = (draft: LeaveRequestDraft): void => {
  if (!draft.type) throw new Error('Jenis pengajuan wajib dipilih.');
  if (!draft.startDate || !draft.endDate) throw new Error('Tanggal mulai/selesai wajib diisi.');
  if (draft.startDate > draft.endDate) {
    throw new Error('Tanggal mulai tidak boleh setelah tanggal selesai.');
  }
  if (!draft.reason || draft.reason.trim().length < 5) {
    throw new Error('Alasan minimal 5 karakter.');
  }
  if (draft.type === 'Reimburse' && (draft.amount === undefined || draft.amount <= 0)) {
    throw new Error('Jumlah reimburse wajib diisi untuk tipe Reimburse.');
  }
};

const calculateWorkingDays = (startDate: string, endDate: string, isShiftWorker: boolean = false): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let count = 0;
  let current = new Date(start);

  while (current <= end) {
    const day = current.getDay();
    if (isShiftWorker || (day !== 0 && day !== 6)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count > 0 ? count : 1;
};

export const requestService = {
  async create(employeeId: string, draft: LeaveRequestDraft): Promise<LeaveRequest> {
    validateDraft(draft);

    const insert = async (snake: boolean) => {
      const { data, error } = await supabase
        .from('requests')
        .insert(buildPayload(employeeId, draft, snake))
        .select('*')
        .single();
      return { data, error };
    };

    const snake = await dbSchemaService.useSnakeCase();
    let result = await insert(snake);
    if (result.error && isSchemaError(result.error.message)) {
      result = await insert(!snake);
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    if (result.error) throw new Error(result.error.message);
    if (!result.data) throw new Error('Pengajuan tidak terbaca ulang setelah disimpan.');

    return mapRow(result.data);
  },

  async listForEmployee(employeeId: string, limit = 50): Promise<LeaveRequest[]> {
    const query = async (snake: boolean) => {
      const column = snake ? 'employee_id' : 'employeeId';
      const orderCol = snake ? 'requested_at' : 'requestedAt';
      const { data, error } = await supabase
        .from('requests')
        .select('*')
        .eq(column, employeeId)
        .order(orderCol, { ascending: false })
        .limit(limit);
      return { data, error };
    };

    const snake = await dbSchemaService.useSnakeCase();
    let result = await query(snake);
    if (result.error && isSchemaError(result.error.message)) {
      result = await query(!snake);
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    if (result.error) throw new Error(result.error.message);
    return (result.data || []).map(mapRow);
  },

  /**
   * Batalkan pengajuan yang masih `Pending`. Hanya pemilik request yang
   * boleh memanggil — RLS di server adalah safeguard utama, di client kita
   * cek `status === 'Pending'` agar tidak perlu round-trip.
   *
   * Karena schema tidak punya status `Cancelled`, kita pakai DELETE.
   */
  async cancel(requestId: string): Promise<void> {
    const { error } = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId)
      .eq('status', 'Pending'); // safety: jangan delete yang sudah disetujui
    if (error) throw new Error(error.message);
  },

  /**
   * Hitung total hari Cuti yang sudah disetujui untuk tahun berjalan.
   * Berguna untuk derive sisa cuti realtime: `sisaCuti - usedThisYear`.
   */
  async getApprovedLeaveDaysThisYear(employeeId: string): Promise<number> {
    const year = new Date().getFullYear();
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const query = async (snake: boolean) => {
      const empCol = snake ? 'employee_id' : 'employeeId';
      const startCol = snake ? 'start_date' : 'startDate';
      const endCol = snake ? 'end_date' : 'endDate';
      const { data, error } = await supabase
        .from('requests')
        .select(`${startCol}, ${endCol}`)
        .eq(empCol, employeeId)
        .eq('type', 'Cuti')
        .eq('status', 'Approved')
        .gte(startCol, yearStart)
        .lte(endCol, yearEnd);
      return { data, error };
    };

    const snake = await dbSchemaService.useSnakeCase();
    let result = await query(snake);
    if (result.error && isSchemaError(result.error.message)) {
      result = await query(!snake);
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    if (result.error) return 0;

    let total = 0;
    for (const row of (result.data || []) as any[]) {
      const start = String(row.startDate || row.start_date || '');
      const end = String(row.endDate || row.end_date || '');
      if (!start || !end) continue;
      const s = new Date(start);
      const e = new Date(end);
      if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) continue;
      const days = Math.floor((e.getTime() - s.getTime()) / 86400000) + 1;
      if (days > 0) total += days;
    }
    return total;
  },

  /** Jumlah pengajuan yang masih pending — dipakai badge di nav/dashboard. */
  async countPending(employeeId: string): Promise<number> {
    const query = async (snake: boolean) => {
      const column = snake ? 'employee_id' : 'employeeId';
      const { count, error } = await supabase
        .from('requests')
        .select('id', { count: 'exact', head: true })
        .eq(column, employeeId)
        .eq('status', 'Pending');
      return { count, error };
    };

    const snake = await dbSchemaService.useSnakeCase();
    let result = await query(snake);
    if (result.error && isSchemaError(result.error.message)) {
      result = await query(!snake);
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    if (result.error) return 0;
    return result.count || 0;
  },

  async updateOvertimeMetadata(requestId: string, metadata: any): Promise<void> {
    const update = async (snake: boolean) => {
      const col = snake ? 'overtime_metadata' : 'overtimeMetadata';
      const { error } = await supabase
        .from('requests')
        .update({ [col]: metadata })
        .eq('id', requestId);
      return { error };
    };

    const snake = await dbSchemaService.useSnakeCase();
    let result = await update(snake);
    if (result.error && isSchemaError(result.error.message)) {
      result = await update(!snake);
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    if (result.error) throw new Error(result.error.message);
  },

  async listUnitRequests(managedUnitId: string, limit = 50): Promise<(LeaveRequest & { employeeName: string; employeeJabatan?: string; employeeFoto?: string })[]> {
    const loadEmps = async (snake: boolean) => {
      const col = snake ? 'unit_kerja_id' : 'unitKerjaId';
      return await supabase
        .from('employees')
        .select('id, nama, jabatan, foto')
        .eq(col, managedUnitId)
        .neq('status', 'Non-Aktif');
    };
    
    const snake = await dbSchemaService.useSnakeCase();
    let empRes = await loadEmps(snake);
    if (empRes.error && isSchemaError(empRes.error.message)) {
      empRes = await loadEmps(!snake);
      if (!empRes.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    
    if (empRes.error) throw new Error(empRes.error.message);
    const emps = empRes.data || [];
    if (emps.length === 0) return [];
    
    const empIds = emps.map((e: any) => e.id);
    
    const query = async (snake: boolean) => {
      const col = snake ? 'employee_id' : 'employeeId';
      const orderCol = snake ? 'requested_at' : 'requestedAt';
      return await supabase
        .from('requests')
        .select('*')
        .in(col, empIds)
        .eq('status', 'Pending')
        .order(orderCol, { ascending: false })
        .limit(limit);
    };
    
    let reqRes = await query(snake);
    if (reqRes.error && isSchemaError(reqRes.error.message)) {
      reqRes = await query(!snake);
      if (!reqRes.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }
    
    if (reqRes.error) throw new Error(reqRes.error.message);
    const requests = reqRes.data || [];
    
    return requests.map((row: any) => {
      const req = mapRow(row);
      const emp = emps.find((e: any) => e.id === req.employeeId);
      return {
        ...req,
        employeeName: emp?.nama || 'Karyawan',
        employeeJabatan: emp?.jabatan,
        employeeFoto: emp?.foto,
      };
    });
  },

  async approveOrRejectRequest(
    requestId: string,
    type: RequestType,
    newStatus: 'Approved' | 'Rejected',
    karu: MobileUser
  ): Promise<void> {
    const { data: request, error: fetchErr } = await supabase
      .from('requests')
      .select('*')
      .eq('id', requestId)
      .single();
      
    if (fetchErr || !request) {
      throw new Error(fetchErr?.message || 'Permohonan tidak ditemukan.');
    }
    
    const leaveReq = mapRow(request);
    
    if (type === 'Cuti' && newStatus === 'Approved') {
      const { data: employee, error: empFetchErr } = await supabase
        .from('employees')
        .select('id, sisaCuti, sisa_cuti, unitKerjaId, unit_kerja_id, units:units!unitKerjaId(nama)')
        .eq('id', leaveReq.employeeId)
        .single();
        
      if (empFetchErr || !employee) {
        throw new Error(empFetchErr?.message || 'Data karyawan pemohon tidak ditemukan.');
      }
      
      const currentSisaCuti = typeof employee.sisaCuti === 'number'
        ? employee.sisaCuti
        : typeof employee.sisa_cuti === 'number'
        ? employee.sisa_cuti
        : 0;
        
      const unitName = Array.isArray(employee.units)
        ? employee.units[0]?.nama
        : (employee.units as any)?.nama || '';
      const isShiftWorker = Boolean(
        unitName &&
        !unitName.toLowerCase().includes('manajemen') &&
        !unitName.toLowerCase().includes('administrasi')
      );
      
      const diffDays = calculateWorkingDays(leaveReq.startDate, leaveReq.endDate, isShiftWorker);
      const newSisaCuti = currentSisaCuti - diffDays;
      
      if (newSisaCuti < 0) {
        throw new Error(
          `Sisa cuti tidak mencukupi. Sisa cuti: ${currentSisaCuti} hari, permohonan: ${diffDays} hari.`
        );
      }
      
      const updateEmp = async (snake: boolean) => {
        const col = snake ? 'sisa_cuti' : 'sisaCuti';
        return await supabase
          .from('employees')
          .update({ [col]: newSisaCuti })
          .eq('id', employee.id);
      };
      
      const snake = await dbSchemaService.useSnakeCase();
      let empUpdateRes = await updateEmp(snake);
      if (empUpdateRes.error && isSchemaError(empUpdateRes.error.message)) {
        empUpdateRes = await updateEmp(!snake);
        if (!empUpdateRes.error) {
          dbSchemaService.setUseSnakeCase(!snake);
        }
      }
      
      if (empUpdateRes.error) {
        throw new Error(`Gagal memperbarui sisa cuti karyawan: ${empUpdateRes.error.message}`);
      }
    }
    
    const now = new Date().toISOString();
    const updateReq = async (snake: boolean) => {
      const payload: Record<string, any> = snake
        ? {
            status: newStatus,
            approved_by: karu.employeeId || karu.id,
            approved_at: now,
          }
        : {
            status: newStatus,
            approvedBy: karu.employeeId || karu.id,
            approvedAt: now,
          };
      return await supabase
        .from('requests')
        .update(payload)
        .eq('id', requestId);
    };
    
    const snakeVal = await dbSchemaService.useSnakeCase();
    let reqUpdateRes = await updateReq(snakeVal);
    if (reqUpdateRes.error && isSchemaError(reqUpdateRes.error.message)) {
      reqUpdateRes = await updateReq(!snakeVal);
      if (!reqUpdateRes.error) {
        dbSchemaService.setUseSnakeCase(!snakeVal);
      }
    }
    
    if (reqUpdateRes.error) {
      throw new Error(`Gagal memperbarui status permohonan: ${reqUpdateRes.error.message}`);
    }
    
    void logMobileAudit({
      user: karu,
      action: newStatus === 'Approved' ? 'REQUEST_APPROVE' : 'REQUEST_REJECT',
      entityName: `${type} ID: ${requestId}`,
      metadata: {
        requestId,
        requestType: type,
        status: newStatus,
        employeeId: leaveReq.employeeId,
      },
      description: `${newStatus === 'Approved' ? 'Menyetujui' : 'Menolak'} permohonan ${type} milik staf`,
    });
  },
};
