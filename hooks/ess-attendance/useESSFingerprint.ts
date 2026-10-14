/**
 * hooks/ess-attendance/useESSFingerprint.ts
 * Helper hook untuk penanganan presensi sidik jari desktop U.are.U 4500.
 */

import { Employee } from '../../types.ts';
import { PendingCheckIn } from './types.ts';

interface UseESSFingerprintProps {
  user: Employee;
  officeLat: number;
  officeLng: number;
  onSaveAttendance: (record: any) => Promise<boolean> | boolean;
  calculateAttendanceSummary: (clockIn: string, clockOut: string) => { isLate: boolean; overtimeHours: number };
  persistPendingCheckIn: (val: PendingCheckIn | null) => void;
  setAttendanceActionError: (err: string | null) => void;
  setIsAttendanceSubmitting: (submitting: boolean) => void;
  setIsFingerprintModalOpen: (open: boolean) => void;
}

export function useESSFingerprint({
  user,
  officeLat,
  officeLng,
  onSaveAttendance,
  calculateAttendanceSummary,
  persistPendingCheckIn,
  setAttendanceActionError,
  setIsAttendanceSubmitting,
  setIsFingerprintModalOpen,
}: UseESSFingerprintProps) {
  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getNowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const handleFingerprintSuccess = async (
    verificationActionType: 'checkin' | 'checkout',
    data: { hostname?: string; ip_local?: string },
    pendingCheckIn: PendingCheckIn | null,
    todaysClockIn?: string
  ) => {
    setIsAttendanceSubmitting(true);
    const pcLabel = data.hostname ? `${data.hostname}${data.ip_local ? ` (${data.ip_local})` : ''}` : 'Workstation PC Kantor (Fingerprint)';
    const nowTime = getNowTime();

    try {
      if (verificationActionType === 'checkin') {
        const { isLate } = calculateAttendanceSummary(nowTime, nowTime);
        const draft = {
          tanggal: getTodayDate(),
          clockIn: nowTime,
          clockOut: '',
          location: pcLabel,
          latitude: officeLat || 0,
          longitude: officeLng || 0,
          isLate,
          overtimeHours: 0,
          status: 'Approved' as const,
          source: 'fingerprint-desktop' as const,
          notes: `Absensi Mandiri Sidik Jari U.are.U 4500 (${pcLabel})`,
          biometricType: 'fingerprint' as const,
          biometricVerified: true,
        };
        const saved = await onSaveAttendance({
          employeeId: user.id,
          ...draft,
        });
        if (saved) {
          persistPendingCheckIn(draft);
          setAttendanceActionError(null);
        }
      } else {
        const checkInTime = pendingCheckIn?.clockIn || todaysClockIn || '08:00';
        const { isLate, overtimeHours } = calculateAttendanceSummary(checkInTime, nowTime);
        const saved = await onSaveAttendance({
          employeeId: user.id,
          tanggal: getTodayDate(),
          clockIn: checkInTime,
          clockOut: nowTime,
          location: pcLabel,
          latitude: officeLat || 0,
          longitude: officeLng || 0,
          isLate: pendingCheckIn ? calculateAttendanceSummary(checkInTime, checkInTime).isLate : isLate,
          overtimeHours,
          status: 'Approved',
          source: 'fingerprint-desktop',
          notes: `Absensi Out Sidik Jari U.are.U 4500 (${pcLabel})`,
          biometricType: 'fingerprint',
          biometricVerified: true,
        });
        if (saved) {
          persistPendingCheckIn(null);
          setAttendanceActionError(null);
        }
      }
    } catch {
      setAttendanceActionError('Gagal memproses absensi sidik jari.');
    } finally {
      setIsAttendanceSubmitting(false);
      setIsFingerprintModalOpen(false);
    }
  };

  return {
    handleFingerprintSuccess,
  };
}
