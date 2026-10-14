import type { AttendanceRecord, MobileUser } from '../../../types';

export interface AttendanceScreenProps {
  user: MobileUser;
  records: AttendanceRecord[];
  onRefresh: () => Promise<void>;
}

export const isTransientNetworkError = (message: string): boolean => {
  const m = String(message || '').toLowerCase();
  return (
    m.includes('network') ||
    m.includes('failed to fetch') ||
    m.includes('timeout') ||
    m.includes('timed out') ||
    m.includes('aborted') ||
    m.includes('econnrefused') ||
    m.includes('enetunreach')
  );
};
