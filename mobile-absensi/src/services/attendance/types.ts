import type { AttendanceRecord, CheckInDraft, MobileUser } from '../../types';

export const safeNumber = (value: any): number | undefined => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? undefined : parsed;
};

export const mapAttendanceRow = (row: any): AttendanceRecord => ({
  id: String(row.id || ''),
  employeeId: String(row.employeeId || row.employee_id || ''),
  tanggal: String(row.tanggal || row.date || ''),
  clockIn: String(row.clockIn || row.check_in || ''),
  clockOut: String(row.clockOut || row.check_out || ''),
  location: String(row.location || ''),
  latitude: row.latitude ?? row.lat ?? undefined,
  longitude: row.longitude ?? row.lng ?? undefined,
  isLate: Boolean(row.isLate ?? row.is_late ?? false),
  overtimeHours: Number(row.overtimeHours ?? row.overtime_hours ?? 0),
  status: (row.status || 'Pending') as AttendanceRecord['status'],
  source: row.source ?? undefined,
  notes: row.notes ?? undefined,
  deviceId: String(row.deviceId || row.device_id || ''),
  biometricType: (row.biometricType || row.biometric_type) as AttendanceRecord['biometricType'],
  biometricVerified: Boolean(row.biometricVerified ?? row.biometric_verified ?? false),
  faceMatchScoreCheckIn: safeNumber(row.faceMatchScoreCheckIn ?? row.face_match_score_check_in),
  faceMatchScoreCheckOut: safeNumber(row.faceMatchScoreCheckOut ?? row.face_match_score_check_out),
  faceVerificationCheckIn: row.faceVerificationCheckIn || row.face_verification_check_in || undefined,
  faceVerificationCheckOut: row.faceVerificationCheckOut || row.face_verification_check_out || undefined,
});

export const extractMissingColumn = (message: string): string | null => {
  const msg = String(message || '');
  let m = msg.match(/Could not find the ['"]([^'"]+)['"] column/i);
  if (m) return m[1];

  m = msg.match(/column ['"]([^'"]+)['"] (?:of relation ['"][^'"]+['"] )?does not exist/i);
  if (m) return m[1];

  return null;
};

export async function executeWithColumnFallback<T>(
  payload: Record<string, any>,
  op: (p: Record<string, any>) => Promise<{ data: T | null; error: any }>,
  maxRetries = 8
): Promise<{ data: T | null; error: any }> {
  let p = { ...payload };
  for (let i = 0; i < maxRetries; i++) {
    const result = await op(p);
    if (!result.error) return result;
    const missing = extractMissingColumn(result.error.message);
    if (!missing || !(missing in p)) return result;
    delete p[missing];
  }
  return await op(p);
}

export const isSchemaError = (message: string) => {
  const normalized = String(message || '').toLowerCase();
  if (
    normalized.includes('jwt') ||
    normalized.includes('permission') ||
    normalized.includes('rls') ||
    normalized.includes('policy')
  ) {
    return false;
  }
  return (
    normalized.includes('could not find') ||
    normalized.includes('does not exist') ||
    (normalized.includes('column') && !normalized.includes('violates'))
  );
};

export type AttendancePayload = Partial<AttendanceRecord> & Record<string, any>;

export const flattenExtra = (isSnakeCase: boolean, extra?: AttendancePayload) => {
  if (!extra) return {};

  return isSnakeCase
    ? {
        device_id: extra.deviceId,
        biometric_type: extra.biometricType,
        biometric_verified: extra.biometricVerified,
        face_match_score_check_in: extra.faceMatchScoreCheckIn,
        face_match_score_check_out: extra.faceMatchScoreCheckOut,
        source: extra.source,
        notes: extra.notes,
      }
    : {
        deviceId: extra.deviceId,
        biometricType: extra.biometricType,
        biometricVerified: extra.biometricVerified,
        faceMatchScoreCheckIn: extra.faceMatchScoreCheckIn,
        faceMatchScoreCheckOut: extra.faceMatchScoreCheckOut,
        source: extra.source,
        notes: extra.notes,
      };
};

export const buildPayload = (
  user: MobileUser,
  draft: CheckInDraft,
  isSnakeCase: boolean,
  extra?: AttendancePayload,
  computedStatus: 'Hadir' | 'Terlambat' = 'Hadir',
  computedIsLate = false
) => {
  const base = {
    location: draft.location,
    latitude: draft.latitude,
    longitude: draft.longitude,
    isLate: computedIsLate,
    overtimeHours: 0,
    status: computedStatus,
    source: 'mobile' as const,
    notes: 'Check-in awal dari aplikasi mobile',
    ...flattenExtra(isSnakeCase, extra),
  };

  const clockOutValue = draft.clockOut && draft.clockOut.trim() !== '' ? draft.clockOut : null;

  return isSnakeCase
    ? {
        employee_id: user.id,
        date: draft.tanggal,
        check_in: draft.clockIn,
        check_out: clockOutValue,
        ...base,
      }
    : {
        employeeId: user.id,
        tanggal: draft.tanggal,
        clockIn: draft.clockIn,
        clockOut: clockOutValue,
        ...base,
      };
};
