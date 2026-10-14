import { AttendanceChangeRequest, AttendanceRecord, AttendanceReasonCode, AttendanceRevisionHistory } from '../../types.ts';

export const ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY = 'hrms.attendance_change_requests_unavailable';
export const ATTENDANCE_REVISION_HISTORY_CACHE_KEY = 'hrms.attendance_revision_history_unavailable';

export const getCachedUnavailable = (cacheKey: string): boolean => {
  try {
    return localStorage.getItem(cacheKey) === '1';
  } catch {
    return false;
  }
};

export const setCachedUnavailable = (cacheKey: string, isUnavailable: boolean): void => {
  try {
    if (isUnavailable) {
      localStorage.setItem(cacheKey, '1');
    } else {
      localStorage.removeItem(cacheKey);
    }
  } catch {
    // Ignore storage access errors.
  }
};

export const isAttendanceWorkflowMissingError = (error: any, tableName: string): boolean => {
  const code = String(error?.code || '').toUpperCase();
  const message = String(error?.message || '').toLowerCase();
  const normalizedTable = String(tableName || '').toLowerCase();

  return (
    code === 'PGRST205' ||
    (message.includes(normalizedTable) && (message.includes('does not exist') || message.includes('not found'))) ||
    (message.includes('could not find the table') && message.includes(normalizedTable))
  );
};
