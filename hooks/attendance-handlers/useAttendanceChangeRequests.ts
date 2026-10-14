import { useCallback } from 'react';
import { supabase } from '../../services/supabaseClient.ts';
import { createAuditLog } from '../../services/auditLogService.ts';
import {
  AttendanceChangeRequest,
  AttendanceRecord,
  AttendanceRevisionHistory,
} from '../../types.ts';
import {
  ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY,
  ATTENDANCE_REVISION_HISTORY_CACHE_KEY,
  getCachedUnavailable,
  setCachedUnavailable,
  isAttendanceWorkflowMissingError,
} from './types.ts';

interface UseAttendanceChangeRequestsProps {
  authUser?: any;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, error?: any) => void;
  saveAttendanceRecord: (record: Omit<AttendanceRecord, 'id'>) => Promise<{
    saved: AttendanceRecord | null;
    usedSnakeCase: boolean;
    error?: any;
  }>;
}

export const useAttendanceChangeRequests = ({
  authUser,
  showSuccess,
  showError,
  saveAttendanceRecord,
}: UseAttendanceChangeRequestsProps) => {
  const isWorkflowUnavailable = (cacheKey: string) => getCachedUnavailable(cacheKey);

  const loadPendingAttendanceChangeRequests = useCallback(async (): Promise<AttendanceChangeRequest[]> => {
    if (getCachedUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY)) {
      return [];
    }

    const { data, error } = await supabase
      .from('attendance_change_requests')
      .select('*')
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      if (isAttendanceWorkflowMissingError(error, 'attendance_change_requests')) {
        setCachedUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY, true);
      }
      return [];
    }

    setCachedUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY, false);
    return (data || []) as AttendanceChangeRequest[];
  }, []);

  const loadAttendanceRevisionHistory = useCallback(async (): Promise<AttendanceRevisionHistory[]> => {
    if (getCachedUnavailable(ATTENDANCE_REVISION_HISTORY_CACHE_KEY)) {
      return [];
    }

    const { data, error } = await supabase
      .from('attendance_revision_history')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(200);

    if (error) {
      if (isAttendanceWorkflowMissingError(error, 'attendance_revision_history')) {
        setCachedUnavailable(ATTENDANCE_REVISION_HISTORY_CACHE_KEY, true);
      }
      return [];
    }

    setCachedUnavailable(ATTENDANCE_REVISION_HISTORY_CACHE_KEY, false);
    return (data || []) as AttendanceRevisionHistory[];
  }, []);

  const handleApproveAttendanceChangeRequest = useCallback(
    async (requestId: string, reviewNote?: string): Promise<boolean> => {
      try {
        if (isWorkflowUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY)) {
          showError(
            'Workflow approval belum aktif',
            'Tabel workflow absensi belum tersedia. Jalankan database-setup-step6-attendance-governance.sql.'
          );
          return false;
        }

        const { data: request, error: requestError } = await supabase
          .from('attendance_change_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (requestError || !request) {
          showError('Gagal approve', requestError || 'Request tidak ditemukan');
          return false;
        }

        if (request.status !== 'pending') {
          showError('Validasi gagal', 'Request sudah diproses sebelumnya.');
          return false;
        }

        if (request.maker_user_id && authUser?.id && request.maker_user_id === authUser.id) {
          showError('Konflik maker-checker', 'Maker tidak boleh meng-approve request miliknya sendiri.');
          return false;
        }

        const proposed = request.proposed_data || {};
        const { saved: savedRow, error: saveError } = await saveAttendanceRecord(proposed as any);

        if (saveError || !savedRow) {
          showError('Gagal apply perubahan absensi', saveError || 'Data absensi gagal disimpan');
          return false;
        }

        const { error: updateError } = await supabase
          .from('attendance_change_requests')
          .update({
            status: 'approved',
            checker_user_id: authUser?.id || null,
            review_note: reviewNote || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', request.id)
          .eq('status', 'pending');

        if (updateError) {
          if (savedRow?.id) {
            await supabase.from('attendance').delete().eq('id', savedRow.id);
          }
          showError('Gagal update status request — perubahan absensi telah dibatalkan', updateError);
          return false;
        }

        await createAuditLog({
          action: 'UPDATE',
          entityType: 'attendance',
          entityId: request.id,
          entityName: `Attendance request ${request.employee_id}`,
          oldData: { status: 'pending' },
          newData: { status: 'approved' },
          description: `Menyetujui perubahan absensi (${request.reason_code}) untuk karyawan ${request.employee_id}`,
          portalType: 'operational',
          metadata: {
            source: 'useAttendanceHandlers',
            workflow: 'maker-checker',
            requestId: request.id,
          },
        });

        showSuccess('Request perubahan absensi berhasil di-approve dan diterapkan.');
        return true;
      } catch (error: any) {
        showError('Gagal approve request absensi', error);
        return false;
      }
    },
    [authUser?.id, saveAttendanceRecord, showError, showSuccess]
  );

  const handleRejectAttendanceChangeRequest = useCallback(
    async (requestId: string, reviewNote?: string): Promise<boolean> => {
      try {
        if (isWorkflowUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY)) {
          showError(
            'Workflow approval belum aktif',
            'Tabel workflow absensi belum tersedia. Jalankan database-setup-step6-attendance-governance.sql.'
          );
          return false;
        }

        const { data: request, error: requestError } = await supabase
          .from('attendance_change_requests')
          .select('*')
          .eq('id', requestId)
          .single();

        if (requestError || !request) {
          showError('Gagal reject', requestError || 'Request tidak ditemukan');
          return false;
        }

        if (request.status !== 'pending') {
          showError('Validasi gagal', 'Request sudah diproses sebelumnya.');
          return false;
        }

        if (request.maker_user_id && authUser?.id && request.maker_user_id === authUser.id) {
          showError('Konflik maker-checker', 'Maker tidak boleh me-reject request miliknya sendiri.');
          return false;
        }

        const { error: updateError } = await supabase
          .from('attendance_change_requests')
          .update({
            status: 'rejected',
            checker_user_id: authUser?.id || null,
            review_note: reviewNote || null,
            reviewed_at: new Date().toISOString(),
          })
          .eq('id', request.id)
          .eq('status', 'pending');

        if (updateError) {
          showError('Gagal reject request', updateError);
          return false;
        }

        await createAuditLog({
          action: 'UPDATE',
          entityType: 'attendance',
          entityId: request.id,
          entityName: `Attendance request ${request.employee_id}`,
          oldData: { status: 'pending' },
          newData: { status: 'rejected' },
          description: `Menolak perubahan absensi (${request.reason_code}) untuk karyawan ${request.employee_id}`,
          portalType: 'operational',
          metadata: {
            source: 'useAttendanceHandlers',
            workflow: 'maker-checker',
            requestId: request.id,
          },
        });

        showSuccess('Request perubahan absensi berhasil ditolak.');
        return true;
      } catch (error: any) {
        showError('Gagal reject request absensi', error);
        return false;
      }
    },
    [authUser?.id, showError, showSuccess]
  );

  return {
    loadPendingAttendanceChangeRequests,
    loadAttendanceRevisionHistory,
    handleApproveAttendanceChangeRequest,
    handleRejectAttendanceChangeRequest,
  };
};
