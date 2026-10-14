/**
 * mobile-absensi/src/services/attendance/attendanceCheckIn.ts
 * Logika eksekusi check-in presensi mobile dengan resolusi shift SSOT dan snake_case fallback.
 */

import type { AttendanceRecord, CheckInDraft, MobileUser } from '../../types';
import { supabase } from '../../config/supabase';
import { dbSchemaService } from '../dbSchemaService';
import {
  mapAttendanceRow,
  executeWithColumnFallback,
  isSchemaError,
  AttendancePayload,
  buildPayload,
} from './types';
import { findMatchingShift, normalizeStr } from './shiftCalculations';
import { saveToOfflineQueue } from './offlineQueue';

export async function performCheckIn(
  user: MobileUser,
  draft: CheckInDraft,
  extra?: AttendancePayload
): Promise<AttendanceRecord> {
  let resolvedTanggal = draft.tanggal;
  const [inHour, inMinute] = draft.clockIn.split(':').map(Number);

  if (inHour <= 6) {
    try {
      const prevDateObj = new Date(draft.tanggal + 'T00:00:00');
      prevDateObj.setDate(prevDateObj.getDate() - 1);
      const prevTanggal = prevDateObj.toISOString().split('T')[0];

      const { data: prevSched } = await supabase
        .from('employee_schedules')
        .select('shift_start_time, is_off_day')
        .eq('employee_id', user.id)
        .eq('schedule_date', prevTanggal)
        .in('status', ['published', 'swapped', 'override'])
        .maybeSingle();

      if (prevSched && !prevSched.is_off_day && prevSched.shift_start_time) {
        const [prevStartH] = String(prevSched.shift_start_time).split(':').map(Number);
        if (prevStartH >= 18) {
          const { data: existingPrevAtt } = await supabase
            .from('attendance')
            .select('id, clockIn, clock_in')
            .or(`employeeId.eq.${user.id},employee_id.eq.${user.id}`)
            .or(`tanggal.eq.${prevTanggal},date.eq.${prevTanggal}`)
            .maybeSingle();

          const hasClockIn = existingPrevAtt?.clockIn || existingPrevAtt?.clock_in;
          if (!hasClockIn) {
            resolvedTanggal = prevTanggal;
          }
        }
      }
    } catch (err) {
      console.warn('[attendance] Failed to resolve night shift date:', err);
    }
  }

  let shiftStart = '08:00';
  let tolerance = 15;
  try {
    let { data: sched } = await supabase
      .from('employee_schedules')
      .select('shift_start_time, is_off_day, shift_name, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
      .eq('employee_id', user.id)
      .eq('schedule_date', resolvedTanggal)
      .in('status', ['published', 'swapped', 'override'])
      .maybeSingle();

    if (!sched) {
      const { data: legacySched } = await supabase
        .from('employee_schedules')
        .select('shift_start_time, is_off_day, shift_name, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
        .eq('employee_id', user.id)
        .eq('date', resolvedTanggal)
        .in('status', ['published', 'swapped', 'override'])
        .maybeSingle();
      sched = legacySched;
    }

    const shiftName = sched && !sched.is_off_day && sched.shift_name ? sched.shift_name : user.shift;

    if (sched && !sched.is_off_day && sched.shift_start_time) {
      shiftStart = sched.shift_start_time as string;
    }

    if (sched && sched.late_tolerance_minutes !== undefined && sched.late_tolerance_minutes !== null) {
      tolerance = Number(sched.late_tolerance_minutes);
    } else {
      const { data: settings } = await supabase
        .from('system_settings')
        .select('default_shifts')
        .limit(1)
        .maybeSingle();
      if (settings?.default_shifts) {
        const shifts = settings.default_shifts as any[];
        const found = findMatchingShift(shifts, shiftName);
        if (found) {
          if (!sched || sched.is_off_day || !sched.shift_start_time) {
            shiftStart = found.startTime || shiftStart;
          }
          tolerance = found.lateToleranceMinutes ?? tolerance;
        }
      }
    }

    if (shiftStart === '08:00' && shiftName) {
      const lower = normalizeStr(shiftName);
      if (lower.includes('siang') || lower.includes('sore')) {
        shiftStart = '15:00';
      } else if (lower.includes('malam')) {
        shiftStart = '21:00';
      }
    }
  } catch {
    /* ignore */
  }

  const [startH, startM] = shiftStart.split(':').map(Number);
  let adjustedInH = inHour;
  if (startH >= 18 && inHour <= 12) {
    adjustedInH += 24;
  }

  const computedIsLate = adjustedInH * 60 + inMinute > startH * 60 + startM + tolerance;
  const computedStatus = computedIsLate ? 'Terlambat' : 'Hadir';

  const insert = (isSnakeCase: boolean) => async (p: Record<string, any>) => {
    const { data, error } = await supabase
      .from('attendance')
      .upsert(p, {
        onConflict: isSnakeCase ? 'employee_id,date' : 'employeeId,tanggal',
      })
      .select('*')
      .single();
    return { data, error };
  };

  const effectiveDraft = { ...draft, tanggal: resolvedTanggal };
  const snake = await dbSchemaService.useSnakeCase();
  const payload = buildPayload(user, effectiveDraft, snake, extra, computedStatus, computedIsLate);

  try {
    let result = await executeWithColumnFallback<any>(payload, insert(snake));
    if (result.error && isSchemaError(result.error.message)) {
      const altPayload = buildPayload(user, effectiveDraft, !snake, extra, computedStatus, computedIsLate);
      result = await executeWithColumnFallback<any>(altPayload, insert(!snake));
      if (!result.error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }

    if (result.error || !result.data) {
      throw new Error(result.error?.message || 'Check-in gagal');
    }

    return mapAttendanceRow(result.data);
  } catch (netErr: any) {
    await saveToOfflineQueue({
      type: 'checkIn',
      userId: user.id,
      payload,
    });
    throw netErr;
  }
}
