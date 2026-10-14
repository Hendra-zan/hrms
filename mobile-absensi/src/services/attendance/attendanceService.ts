/**
 * mobile-absensi/src/services/attendance/attendanceService.ts
 * Facade utama layanan absensi mobile.
 */

import type { AttendanceRecord, CheckInDraft, MobileUser } from '../../types';
import { supabase } from '../../config/supabase';
import { dbSchemaService } from '../dbSchemaService';
import { mapAttendanceRow, isSchemaError, AttendancePayload } from './types';
import { performCheckIn } from './attendanceCheckIn';
import { performCheckOut } from './attendanceCheckOut';
import { getOfflineQueue, flushOfflineQueue } from './offlineQueue';

export const attendanceService = {
  async list(userId: string): Promise<AttendanceRecord[]> {
    const snake = await dbSchemaService.useSnakeCase();
    const query = async (isSnakeCase: boolean) => {
      let builder = supabase.from('attendance').select('*');
      builder = builder.eq(isSnakeCase ? 'employee_id' : 'employeeId', userId);
      builder = builder.order(isSnakeCase ? 'date' : 'tanggal', { ascending: false });
      return builder;
    };

    let { data, error } = await query(snake);
    if (error && isSchemaError(error.message)) {
      const fallback = await query(!snake);
      data = fallback.data;
      error = fallback.error;
      if (!error) {
        dbSchemaService.setUseSnakeCase(!snake);
      }
    }

    if (error) {
      throw new Error(error.message);
    }

    return (data || []).map(mapAttendanceRow);
  },

  async getPendingUnclosedRecord(userId: string): Promise<AttendanceRecord | null> {
    const records = await this.list(userId);
    const nowMs = Date.now();
    const thirtySixHoursMs = 36 * 60 * 60 * 1000;

    return (
      records.find((record) => {
        if (record.clockOut) return false;
        if (!record.tanggal) return false;

        const recTime = new Date(`${record.tanggal}T${record.clockIn || '00:00'}:00`).getTime();
        if (isNaN(recTime)) return false;

        const diff = nowMs - recTime;
        return diff >= 0 && diff <= thirtySixHoursMs;
      }) || null
    );
  },

  async checkIn(
    user: MobileUser,
    draft: CheckInDraft,
    extra?: AttendancePayload
  ): Promise<AttendanceRecord> {
    return performCheckIn(user, draft, extra);
  },

  async checkOut(
    user: MobileUser,
    draft: CheckInDraft,
    extra?: AttendancePayload
  ): Promise<AttendanceRecord> {
    const pendingRecord = await this.getPendingUnclosedRecord(user.id);
    return performCheckOut(user, draft, pendingRecord, extra);
  },

  async syncOvertimeToAttendance(
    employeeId: string,
    tanggal: string,
    clockIn: string,
    clockOut: string,
    overtimeHours: number,
    deviceId?: string
  ): Promise<void> {
    const snake = await dbSchemaService.useSnakeCase();
    const empCol = snake ? 'employee_id' : 'employeeId';
    const dateCol = snake ? 'date' : 'tanggal';

    let isLate = false;
    let status: 'Hadir' | 'Terlambat' = 'Hadir';
    try {
      const { data: sched } = await supabase
        .from('employee_schedules')
        .select('shift_start_time, late_tolerance_minutes, is_off_day')
        .eq('employee_id', employeeId)
        .eq('schedule_date', tanggal)
        .in('status', ['published', 'swapped', 'override'])
        .maybeSingle();

      if (sched && !sched.is_off_day && sched.shift_start_time) {
        const [startH, startM] = String(sched.shift_start_time).split(':').map(Number);
        const [inH, inM] = clockIn.split(':').map(Number);
        let adjustedInH = inH;
        if (startH >= 18 && inH <= 12) adjustedInH += 24;
        const tol = sched.late_tolerance_minutes ?? 15;
        isLate = adjustedInH * 60 + inM > startH * 60 + startM + tol;
        status = isLate ? 'Terlambat' : 'Hadir';
      }
    } catch {
      /* use default */
    }

    const { data: existing } = await supabase
      .from('attendance')
      .select('*')
      .eq(empCol, employeeId)
      .eq(dateCol, tanggal)
      .maybeSingle();

    if (existing) {
      const updatePayload: Record<string, any> = {};
      const otCol = snake ? 'overtime_hours' : 'overtimeHours';
      updatePayload[otCol] = overtimeHours;
      updatePayload['notes'] = `${existing.notes || ''} | Lembur: ${clockIn}-${clockOut}`.trim();
      await supabase.from('attendance').update(updatePayload).eq('id', existing.id);
    } else {
      const insertPayload: Record<string, any> = {
        [empCol]: employeeId,
        [dateCol]: tanggal,
        [snake ? 'clock_in' : 'clockIn']: clockIn,
        [snake ? 'clock_out' : 'clockOut']: clockOut,
        [snake ? 'overtime_hours' : 'overtimeHours']: overtimeHours,
        [snake ? 'is_late' : 'isLate']: isLate,
        status: status,
        source: 'mobile',
        notes: `Absensi Lembur: ${clockIn}-${clockOut}`,
        [snake ? 'biometric_verified' : 'biometricVerified']: true,
        [snake ? 'device_id' : 'deviceId']: deviceId || null,
      };
      await supabase.from('attendance').insert(insertPayload);
    }
  },

  getOfflineQueue,
  flushOfflineQueue,
};
