/**
 * mobile-absensi/src/services/attendance/attendanceCheckOut.ts
 * Logika eksekusi check-out presensi mobile, kalkulasi summary, overtime, early leave & fallback.
 */

import type { AttendanceRecord, CheckInDraft, MobileUser } from '../../types';
import { supabase } from '../../config/supabase';
import { dbSchemaService } from '../dbSchemaService';
import {
  mapAttendanceRow,
  executeWithColumnFallback,
  isSchemaError,
  AttendancePayload,
} from './types';
import {
  findMatchingShift,
  computeAttendanceSummary,
  normalizeStr,
} from './shiftCalculations';
import { saveToOfflineQueue } from './offlineQueue';

export async function performCheckOut(
  user: MobileUser,
  draft: CheckInDraft,
  pendingRecord: AttendanceRecord | null,
  extra?: AttendancePayload
): Promise<AttendanceRecord> {
  const clockOut = new Date().toTimeString().slice(0, 5);
  const targetTanggal = pendingRecord?.tanggal || draft.tanggal;
  const effectiveClockIn = pendingRecord?.clockIn || draft.clockIn || '08:00';

  let shiftStart = '08:00';
  let shiftEnd = '16:00';
  let tolerance = 15;
  let breakMin = 0;
  let autoOTMin = 0;

  try {
    let { data: sched } = await supabase
      .from('employee_schedules')
      .select('shift_start_time, shift_end_time, is_off_day, shift_name, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
      .eq('employee_id', user.id)
      .eq('schedule_date', targetTanggal)
      .in('status', ['published', 'swapped', 'override'])
      .maybeSingle();

    if (!sched) {
      const { data: legacySched } = await supabase
        .from('employee_schedules')
        .select('shift_start_time, shift_end_time, is_off_day, shift_name, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
        .eq('employee_id', user.id)
        .eq('date', targetTanggal)
        .in('status', ['published', 'swapped', 'override'])
        .maybeSingle();
      sched = legacySched;
    }

    if (sched && !sched.is_off_day && sched.shift_start_time && sched.shift_end_time) {
      shiftStart = sched.shift_start_time as string;
      shiftEnd = sched.shift_end_time as string;
      tolerance = sched.late_tolerance_minutes ?? tolerance;
      breakMin = sched.break_duration_minutes ?? 0;
      autoOTMin = sched.auto_ot_threshold_minutes ?? 0;
    } else {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('default_shifts')
        .limit(1)
        .maybeSingle();

      if (settings?.default_shifts) {
        const shifts = settings.default_shifts as any[];
        const found = findMatchingShift(shifts, user.shift ?? '');
        if (found) {
          shiftStart = found.startTime || shiftStart;
          shiftEnd = found.endTime || shiftEnd;
          tolerance = found.lateToleranceMinutes ?? tolerance;
          breakMin = found.breakDurationMinutes ?? 0;
          autoOTMin = found.autoOvertimeThresholdMinutes ?? 0;
        }
      }
    }

    const effectiveShiftName = sched?.shift_name || user.shift;
    if (shiftStart === '08:00' && effectiveShiftName) {
      const lower = normalizeStr(effectiveShiftName);
      if (lower.includes('siang') || lower.includes('sore')) {
        shiftStart = '15:00';
        shiftEnd = '23:00';
      } else if (lower.includes('malam')) {
        shiftStart = '21:00';
        shiftEnd = '07:00';
      }
    }
  } catch {
    /* ignore */
  }

  const summary = computeAttendanceSummary(
    effectiveClockIn,
    clockOut,
    shiftStart,
    shiftEnd,
    tolerance,
    breakMin,
    autoOTMin
  );

  const [eH, eM] = shiftEnd.split(':').map(Number);
  const [oH, oM] = clockOut.split(':').map(Number);
  let endTotal = eH * 60 + eM;
  let outTotal = oH * 60 + oM;
  const [iH, iM] = effectiveClockIn.split(':').map(Number);
  const inTotal = iH * 60 + iM;
  if (outTotal < inTotal) outTotal += 24 * 60;
  if (endTotal <= inTotal) endTotal += 24 * 60;
  const earlyLeaveMinutes = endTotal > outTotal ? endTotal - outTotal : null;

  const payload = {
    clockOut,
    status: summary.status,
    isLate: summary.isLate,
    overtimeHours: summary.overtimeHours,
    earlyLeaveMinutes,
    ...extra,
  };

  const buildUpdateFields = (isSnakeCase: boolean): Record<string, any> => {
    const fields: Record<string, any> = isSnakeCase
      ? {
          check_out: payload.clockOut,
          status: payload.status,
          is_late: payload.isLate,
          overtime_hours: payload.overtimeHours,
        }
      : {
          clockOut: payload.clockOut,
          status: payload.status,
          isLate: payload.isLate,
          overtimeHours: payload.overtimeHours,
        };

    if (payload.earlyLeaveMinutes !== undefined && payload.earlyLeaveMinutes !== null) {
      fields[isSnakeCase ? 'early_leave_minutes' : 'earlyLeaveMinutes'] = payload.earlyLeaveMinutes;
    }
    if (payload.deviceId !== undefined) {
      fields[isSnakeCase ? 'device_id' : 'deviceId'] = payload.deviceId;
    }
    if (payload.biometricType !== undefined) {
      fields[isSnakeCase ? 'biometric_type' : 'biometricType'] = payload.biometricType;
    }
    if (payload.biometricVerified !== undefined) {
      fields[isSnakeCase ? 'biometric_verified' : 'biometricVerified'] = payload.biometricVerified;
    }
    if (payload.faceMatchScoreCheckOut !== undefined) {
      fields[isSnakeCase ? 'face_match_score_check_out' : 'faceMatchScoreCheckOut'] = payload.faceMatchScoreCheckOut;
    }
    if (payload.checkOutLatitude !== undefined) {
      fields[isSnakeCase ? 'check_out_latitude' : 'checkOutLatitude'] = payload.checkOutLatitude;
    }
    if (payload.checkOutLongitude !== undefined) {
      fields[isSnakeCase ? 'check_out_longitude' : 'checkOutLongitude'] = payload.checkOutLongitude;
    }
    if (payload.checkOutLocation !== undefined) {
      fields[isSnakeCase ? 'check_out_location' : 'checkOutLocation'] = payload.checkOutLocation;
    }
    if (payload.earlyLeaveReason !== undefined) {
      fields[isSnakeCase ? 'early_leave_reason' : 'earlyLeaveReason'] = payload.earlyLeaveReason;
    }
    if (payload.dailyWorkLog !== undefined) {
      fields[isSnakeCase ? 'daily_work_log' : 'dailyWorkLog'] = payload.dailyWorkLog;
    }
    if (payload.shiftHandoverConfirmed !== undefined) {
      fields[isSnakeCase ? 'shift_handover_confirmed' : 'shiftHandoverConfirmed'] = payload.shiftHandoverConfirmed;
    }
    if (payload.source !== undefined) {
      fields.source = payload.source;
    }
    if (payload.notes !== undefined) {
      fields.notes = payload.notes;
    }

    return fields;
  };

  const update = (isSnakeCase: boolean) => async (fields: Record<string, any>) => {
    let builder = supabase.from('attendance').update(fields);
    builder = builder.eq(isSnakeCase ? 'employee_id' : 'employeeId', user.id);
    builder = builder.eq(isSnakeCase ? 'date' : 'tanggal', targetTanggal);
    const { data, error } = await builder.select('*').single();
    return { data, error };
  };

  const snake = await dbSchemaService.useSnakeCase();
  const updateFields = buildUpdateFields(snake);

  try {
    let result = await executeWithColumnFallback<any>(updateFields, update(snake));
    if (result.error && isSchemaError(result.error.message)) {
      const altFields = buildUpdateFields(!snake);
      result = await executeWithColumnFallback<any>(altFields, update(!snake));
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }

    if (result.error || !result.data) {
      throw new Error(result.error?.message || 'Check-out gagal');
    }

    return mapAttendanceRow(result.data);
  } catch (netErr: any) {
    await saveToOfflineQueue({
      type: 'checkOut',
      userId: user.id,
      payload: { ...updateFields, employeeId: user.id, tanggal: targetTanggal },
    });
    throw netErr;
  }
}
