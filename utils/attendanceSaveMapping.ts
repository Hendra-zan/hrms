import { AttendanceRecord } from '../types';

type AttendanceInput = Omit<AttendanceRecord, 'id'> & Record<string, any>;

export const normalizeAttendanceRecord = (record: AttendanceInput): AttendanceInput => {
  const resolvedClockIn = record.clockIn || record.check_in;
  const resolvedClockOut = record.clockOut || record.check_out;

  return {
    ...record,
    employeeId: record.employeeId || record.employee_id,
    tanggal: record.tanggal || record.date,
    clockIn: resolvedClockIn && String(resolvedClockIn).trim() !== '' ? resolvedClockIn : null,
    clockOut: resolvedClockOut && String(resolvedClockOut).trim() !== '' ? resolvedClockOut : null,
    location: record.location || record.lokasi || '',
    latitude: record.latitude ?? record.lat,
    longitude: record.longitude ?? record.lng,
    status:
      record.status ||
      (resolvedClockOut ? (record.isLate ? 'Terlambat' : 'Hadir') : 'Pending'),
    source: record.source || 'web-ess',
    notes: record.notes || record.note || '',
    photoUrl: record.photoUrl || record.photo_url || undefined,
    deviceId: record.deviceId || record.device_id || undefined,
    biometricType: record.biometricType || record.biometric_type || undefined,
    biometricVerified: record.biometricVerified ?? record.biometric_verified ?? undefined,
    faceMatchScoreCheckIn: record.faceMatchScoreCheckIn ?? record.face_match_score_check_in ?? undefined,
    faceMatchScoreCheckOut: record.faceMatchScoreCheckOut ?? record.face_match_score_check_out ?? undefined,
    checkOutLatitude: record.checkOutLatitude ?? record.check_out_latitude ?? undefined,
    checkOutLongitude: record.checkOutLongitude ?? record.check_out_longitude ?? undefined,
    checkOutLocation: record.checkOutLocation ?? record.check_out_location ?? undefined,
    earlyLeaveReason: record.earlyLeaveReason ?? record.early_leave_reason ?? undefined,
    dailyWorkLog: record.dailyWorkLog ?? record.daily_work_log ?? undefined,
    shiftHandoverConfirmed: record.shiftHandoverConfirmed ?? record.shift_handover_confirmed ?? false,
  };
};

export const mapAttendanceForDb = (
  normalizedRecord: AttendanceInput,
  isSnakeCase: boolean
): AttendanceInput => {
  if (!isSnakeCase) return normalizedRecord;

  return {
    ...normalizedRecord,
    employee_id: normalizedRecord.employeeId,
    date: normalizedRecord.tanggal,
    check_in: normalizedRecord.clockIn,
    check_out: normalizedRecord.clockOut,
    lokasi: normalizedRecord.location,
    latitude: normalizedRecord.latitude,
    longitude: normalizedRecord.longitude,
    status: normalizedRecord.status,
    source: normalizedRecord.source,
    notes: normalizedRecord.notes,
    photo_url: normalizedRecord.photoUrl,
    device_id: normalizedRecord.deviceId,
    biometric_type: normalizedRecord.biometricType,
    biometric_verified: normalizedRecord.biometricVerified,
    face_match_score_check_in: normalizedRecord.faceMatchScoreCheckIn,
    face_match_score_check_out: normalizedRecord.faceMatchScoreCheckOut,
    check_out_latitude: normalizedRecord.checkOutLatitude,
    check_out_longitude: normalizedRecord.checkOutLongitude,
    check_out_location: normalizedRecord.checkOutLocation,
    early_leave_reason: normalizedRecord.earlyLeaveReason,
    daily_work_log: normalizedRecord.dailyWorkLog,
    shift_handover_confirmed: normalizedRecord.shiftHandoverConfirmed,
  };
};

export const isSchemaErrorMessage = (message: string): boolean => {
  const normalized = String(message || '').toLowerCase();
  return normalized.includes('column') || normalized.includes('does not exist') || normalized.includes('relation');
};
