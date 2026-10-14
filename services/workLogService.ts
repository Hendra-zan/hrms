import { supabase } from './supabaseClient.ts';
import { WorkLogEntry, WorkLogCategory, WorkLogShift, WorkLogStatus } from '../types.ts';

const LOCAL_STORAGE_KEY = 'hrms_work_logs_v1';

function getLocalLogs(): WorkLogEntry[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalLogs(logs: WorkLogEntry[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(logs));
  } catch (err) {
    console.warn('[workLogService] Failed to save to localStorage:', err);
  }
}

const getWorkLogsTable = () => (supabase as any).from('employee_work_logs');

export const workLogService = {
  /**
   * Ambil logbook aktivitas kerja milik seorang karyawan (staf)
   */
  async fetchWorkLogs(employeeId: string, startDate?: string, endDate?: string): Promise<WorkLogEntry[]> {
    if (!employeeId) return [];

    try {
      let query = getWorkLogsTable()
        .select('*')
        .eq('employee_id', employeeId)
        .order('log_date', { ascending: false })
        .order('start_time', { ascending: false });

      if (startDate) query = query.gte('log_date', startDate);
      if (endDate) query = query.lte('log_date', endDate);

      const { data, error } = await query;

      if (error) {
        if (error.message?.includes('Could not find the table') || error.message?.includes('permission denied')) {
          console.info('[workLogService] DB table employee_work_logs not accessible/ready, using local storage.');
        } else {
          console.warn('[workLogService] DB fetch fallback to local:', error.message);
        }
        return getLocalLogs().filter((l) => l.employeeId === employeeId);
      }

      const logs: WorkLogEntry[] = (data || []).map((row: any) => ({
        id: row.id,
        employeeId: row.employee_id,
        employeeNama: row.employee_nama,
        unitKerjaId: row.unit_kerja_id || row.unitKerjaId,
        logDate: row.log_date || row.logDate,
        shift: (row.shift as WorkLogShift) || 'pagi',
        startTime: row.start_time || row.startTime || '08:00',
        endTime: row.end_time || row.endTime || '16:00',
        durationMinutes: row.duration_minutes || row.durationMinutes || 0,
        title: row.title,
        activityDescription: row.activity_description || row.activityDescription || '',
        category: (row.category as WorkLogCategory) || 'pelayanan_pasien',
        patientCount: row.patient_count || row.patientCount || undefined,
        location: row.location || undefined,
        status: (row.status as WorkLogStatus) || 'draft',
        verifiedBy: row.verified_by || row.verifiedBy,
        verifiedAt: row.verified_at || row.verifiedAt,
        verifierNotes: row.verifier_notes || row.verifierNotes,
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
      }));

      // Cache locally
      const otherLogs = getLocalLogs().filter((l) => l.employeeId !== employeeId);
      saveLocalLogs([...otherLogs, ...logs]);

      return logs;
    } catch (err) {
      console.warn('[workLogService] Fetch error, fallback local:', err);
      return getLocalLogs().filter((l) => l.employeeId === employeeId);
    }
  },

  /**
   * Ambil daftar logbook seluruh staf unit kerja (untuk Kepala Ruangan / Karu)
   */
  async fetchUnitWorkLogs(unitKerjaId?: string, statusFilter?: string): Promise<WorkLogEntry[]> {
    try {
      let query = getWorkLogsTable()
        .select('*')
        .order('log_date', { ascending: false });

      if (unitKerjaId) {
        query = query.or(`unit_kerja_id.eq.${unitKerjaId},unitKerjaId.eq.${unitKerjaId}`);
      }
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('[workLogService] Unit fetch fallback local:', error.message);
        return getLocalLogs().filter((l) => !unitKerjaId || l.unitKerjaId === unitKerjaId);
      }

      return (data || []).map((row: any) => ({
        id: row.id,
        employeeId: row.employee_id,
        employeeNama: row.employee_nama,
        unitKerjaId: row.unit_kerja_id || row.unitKerjaId,
        logDate: row.log_date || row.logDate,
        shift: (row.shift as WorkLogShift) || 'pagi',
        startTime: row.start_time || row.startTime || '08:00',
        endTime: row.end_time || row.endTime || '16:00',
        durationMinutes: row.duration_minutes || row.durationMinutes || 0,
        title: row.title,
        activityDescription: row.activity_description || row.activityDescription || '',
        category: (row.category as WorkLogCategory) || 'pelayanan_pasien',
        patientCount: row.patient_count || row.patientCount || undefined,
        location: row.location || undefined,
        status: (row.status as WorkLogStatus) || 'draft',
        verifiedBy: row.verified_by || row.verifiedBy,
        verifiedAt: row.verified_at || row.verifiedAt,
        verifierNotes: row.verifier_notes || row.verifierNotes,
        createdAt: row.created_at || row.createdAt,
        updatedAt: row.updated_at || row.updatedAt,
      }));
    } catch (err) {
      console.warn('[workLogService] Unit fetch error:', err);
      return getLocalLogs();
    }
  },

  /**
   * Buat entri Logbook Aktivitas Kerja baru
   */
  async createWorkLog(entry: Omit<WorkLogEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; data?: WorkLogEntry; error?: string }> {
    const nowIso = new Date().toISOString();
    const newLog: WorkLogEntry = {
      ...entry,
      id: `wlog-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    try {
      const { data, error } = await getWorkLogsTable()
        .insert({
          employee_id: entry.employeeId,
          employee_nama: entry.employeeNama,
          unit_kerja_id: entry.unitKerjaId,
          log_date: entry.logDate,
          shift: entry.shift,
          start_time: entry.startTime,
          end_time: entry.endTime,
          duration_minutes: entry.durationMinutes,
          title: entry.title,
          activity_description: entry.activityDescription,
          category: entry.category,
          patient_count: entry.patientCount,
          location: entry.location,
          status: entry.status || 'submitted',
        })
        .select()
        .single();

      if (error) {
        console.warn('[workLogService] DB insert fallback to local:', error.message);
        const local = getLocalLogs();
        saveLocalLogs([newLog, ...local]);
        return { success: true, data: newLog };
      }

      const row: any = data;
      const created: WorkLogEntry = {
        id: row.id,
        employeeId: row.employee_id,
        employeeNama: row.employee_nama,
        unitKerjaId: row.unit_kerja_id,
        logDate: row.log_date,
        shift: row.shift as WorkLogShift,
        startTime: row.start_time,
        endTime: row.end_time,
        durationMinutes: row.duration_minutes,
        title: row.title,
        activityDescription: row.activity_description,
        category: row.category as WorkLogCategory,
        patientCount: row.patient_count,
        location: row.location,
        status: row.status as WorkLogStatus,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };

      const local = getLocalLogs();
      saveLocalLogs([created, ...local]);

      return { success: true, data: created };
    } catch (err: any) {
      console.warn('[workLogService] Create error fallback local:', err);
      const local = getLocalLogs();
      saveLocalLogs([newLog, ...local]);
      return { success: true, data: newLog };
    }
  },

  /**
   * Update entri logbook
   */
  async updateWorkLog(id: string, entry: Partial<WorkLogEntry>): Promise<boolean> {
    const nowIso = new Date().toISOString();

    try {
      const payload: any = { updated_at: nowIso };
      if (entry.title) payload.title = entry.title;
      if (entry.activityDescription) payload.activity_description = entry.activityDescription;
      if (entry.category) payload.category = entry.category;
      if (entry.shift) payload.shift = entry.shift;
      if (entry.startTime) payload.start_time = entry.startTime;
      if (entry.endTime) payload.end_time = entry.endTime;
      if (entry.durationMinutes !== undefined) payload.duration_minutes = entry.durationMinutes;
      if (entry.patientCount !== undefined) payload.patient_count = entry.patientCount;
      if (entry.location !== undefined) payload.location = entry.location;
      if (entry.status) payload.status = entry.status;

      const { error } = await getWorkLogsTable()
        .update(payload)
        .eq('id', id);

      if (error) {
        console.warn('[workLogService] DB update fallback local:', error.message);
      }

      const local = getLocalLogs().map((l) => (l.id === id ? { ...l, ...entry, updatedAt: nowIso } : l));
      saveLocalLogs(local);

      return true;
    } catch (err) {
      console.warn('[workLogService] Update error:', err);
      return false;
    }
  },

  /**
   * Hapus entri logbook
   */
  async deleteWorkLog(id: string): Promise<boolean> {
    try {
      const { error } = await getWorkLogsTable()
        .delete()
        .eq('id', id);

      if (error) {
        console.warn('[workLogService] DB delete fallback local:', error.message);
      }

      const local = getLocalLogs().filter((l) => l.id !== id);
      saveLocalLogs(local);
      return true;
    } catch (err) {
      console.warn('[workLogService] Delete error:', err);
      return false;
    }
  },

  /**
   * Verifikasi oleh Karu (Approve / Reject)
   */
  async verifyWorkLog(id: string, verifierNama: string, status: 'approved' | 'rejected', verifierNotes?: string): Promise<boolean> {
    const nowIso = new Date().toISOString();

    try {
      const { error } = await getWorkLogsTable()
        .update({
          status,
          verified_by: verifierNama,
          verified_at: nowIso,
          verifier_notes: verifierNotes || null,
          updated_at: nowIso,
        })
        .eq('id', id);

      if (error) {
        console.warn('[workLogService] Verify DB error fallback local:', error.message);
      }

      const local = getLocalLogs().map((l) => {
        if (l.id === id) {
          return {
            ...l,
            status,
            verifiedBy: verifierNama,
            verifiedAt: nowIso,
            verifierNotes: verifierNotes || l.verifierNotes,
            updatedAt: nowIso,
          };
        }
        return l;
      });
      saveLocalLogs(local);

      return true;
    } catch (err) {
      console.warn('[workLogService] Verify error:', err);
      return false;
    }
  },
};
