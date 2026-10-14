import { useCallback } from 'react';
import { supabase } from '../../services/supabaseClient.ts';
import { AttendanceRecord, AttendanceRevisionHistory } from '../../types.ts';
import { useAppDataActions } from '../../stores/appStore.ts';
import { mapAttendanceRecordToUI } from '../../utils/dataMapping.ts';
import {
  isSchemaErrorMessage,
  mapAttendanceForDb,
  normalizeAttendanceRecord,
} from '../../utils/attendanceSaveMapping.ts';
import {
  ATTENDANCE_REVISION_HISTORY_CACHE_KEY,
  getCachedUnavailable,
  setCachedUnavailable,
  isAttendanceWorkflowMissingError,
} from './types.ts';

export { normalizeAttendanceRecord };

export const useAttendanceSaveRecord = () => {
  const { setAttendanceRecords } = useAppDataActions();

  const saveAttendanceRecord = useCallback(
    async (record: Omit<AttendanceRecord, 'id'>): Promise<{ saved: AttendanceRecord | null; usedSnakeCase: boolean; error?: any }> => {
      const normalizedRecord: any = normalizeAttendanceRecord(record as any);

      const trySave = async (isSnakeCase: boolean) => {
        return supabase
          .from('attendance')
          .upsert(mapAttendanceForDb(normalizedRecord, isSnakeCase), {
            onConflict: isSnakeCase ? 'employee_id,date' : 'employeeId,tanggal',
          })
          .select('*')
          .single();
      };

      let saveResult = await trySave(false);
      let usedSnakeCase = false;

      if (saveResult.error) {
        const errorMessage = String(saveResult.error.message || '').toLowerCase();

        if (errorMessage.includes('duplicate key') || errorMessage.includes('unique')) {
          const updated = await supabase
            .from('attendance')
            .update(mapAttendanceForDb(normalizedRecord, false))
            .eq('employeeId', normalizedRecord.employeeId)
            .eq('tanggal', normalizedRecord.tanggal)
            .select('*');

          if (updated.error) {
            return { saved: null, usedSnakeCase: false, error: updated.error };
          }

          saveResult = { data: (updated.data as any)?.[0] ?? null, error: null } as any;
        } else if (isSchemaErrorMessage(errorMessage)) {
          const fallbackSave = await trySave(true);
          if (fallbackSave.error) {
            const fallbackMessage = String(fallbackSave.error.message || '').toLowerCase();
            if (fallbackMessage.includes('duplicate key') || fallbackMessage.includes('unique')) {
              const updated = await supabase
                .from('attendance')
                .update(mapAttendanceForDb(normalizedRecord, true))
                .eq('employee_id', normalizedRecord.employeeId)
                .eq('date', normalizedRecord.tanggal)
                .select('*');

              if (updated.error) {
                return { saved: null, usedSnakeCase: true, error: updated.error };
              }
              saveResult = { data: (updated.data as any)?.[0] ?? null, error: null } as any;
              usedSnakeCase = true;
            } else {
              return { saved: null, usedSnakeCase: true, error: fallbackSave.error };
            }
          } else {
            saveResult = fallbackSave as any;
            usedSnakeCase = true;
          }
        } else {
          return { saved: null, usedSnakeCase: false, error: saveResult.error };
        }
      }

      const savedRow = saveResult.data ? mapAttendanceRecordToUI(saveResult.data) : null;
      if (!savedRow) {
        return { saved: null, usedSnakeCase, error: 'Data tersimpan tidak valid.' };
      }

      setAttendanceRecords((prev) => {
        const existingIndex = prev.findIndex(
          (r) => r.employeeId === savedRow.employeeId && r.tanggal === savedRow.tanggal
        );

        if (existingIndex === -1) {
          return [savedRow, ...prev];
        }

        return prev.map((item, index) => (index === existingIndex ? savedRow : item));
      });

      return { saved: savedRow, usedSnakeCase };
    },
    [setAttendanceRecords]
  );

  const recordRevisionHistory = useCallback(
    async (historyPayload: Omit<AttendanceRevisionHistory, 'id' | 'created_at'>): Promise<void> => {
      if (getCachedUnavailable(ATTENDANCE_REVISION_HISTORY_CACHE_KEY)) return;

      const payload = {
        attendance_id: historyPayload.attendance_id,
        employee_id: historyPayload.employee_id,
        attendance_date: historyPayload.attendance_date,
        action: historyPayload.action,
        before_data: historyPayload.before_data,
        after_data: historyPayload.after_data,
        reason_code: historyPayload.reason_code,
        reason_detail: historyPayload.reason_detail,
        changed_by: historyPayload.changed_by,
      };

      const { error } = await supabase.from('attendance_revision_history' as any).insert([payload]);

      if (error) {
        if (isAttendanceWorkflowMissingError(error, 'attendance_revision_history')) {
          setCachedUnavailable(ATTENDANCE_REVISION_HISTORY_CACHE_KEY, true);
        }
      }
    },
    []
  );

  return {
    saveAttendanceRecord,
    recordRevisionHistory,
    normalizeAttendanceRecord,
  };
};
