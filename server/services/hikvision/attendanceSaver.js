/**
 * server/services/hikvision/attendanceSaver.js
 * Evaluator jadwal SSOT & penyimpanan absensi mesin ke Supabase.
 */

import loggingService from '../loggingService.js';

export function getMinuteDiff(clockInStr, newTimeStr) {
  if (!clockInStr || !newTimeStr) return 0;
  const [h1, m1] = clockInStr.split(':').map(Number);
  const [h2, m2] = newTimeStr.split(':').map(Number);
  let diff = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function mapEventToAttendance(event, deviceLocation, deviceSerial) {
  const dt = new Date(event.time);
  const tanggal = dt.toISOString().split('T')[0];
  const hhmm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
  const matchScore = typeof event.matchScore === 'number' ? event.matchScore / 100 : null;
  const isCheckOut = event.type === 'checkOut';

  return {
    tanggal,
    clockIn: isCheckOut ? null : hhmm,
    clockOut: isCheckOut ? hhmm : null,
    location: deviceLocation,
    isLate: false,
    overtimeHours: 0,
    status: 'Recorded',
    source: 'web-admin',
    deviceId: null,
    biometric_type: 'face',
    biometricVerified: true,
    face_match_score_check_in: !isCheckOut && matchScore !== null ? matchScore : null,
    face_match_score_check_out: isCheckOut && matchScore !== null ? matchScore : null,
    notes: `Absensi dari device Hikvision (${event.verifyMode || 'face'})`,
  };
}

export async function resolveEmployeeId(supabaseClient, devicePin) {
  const { data: byPin, error: pinError } = await supabaseClient
    .from('employees')
    .select('id, nama')
    .eq('pin_mesin', devicePin)
    .maybeSingle();

  if (!pinError && byPin?.id) return byPin.id;

  const { data: byNik, error: nikError } = await supabaseClient
    .from('employees')
    .select('id, nama')
    .eq('nik', devicePin)
    .maybeSingle();

  if (!nikError && byNik?.id) return byNik.id;

  const { data: byId } = await supabaseClient
    .from('employees')
    .select('id')
    .eq('id', devicePin)
    .maybeSingle();

  if (byId?.id) return byId.id;

  return null;
}

export async function getShiftParamsForEmployee(supabaseClient, employeeId, tanggal, clockInStr) {
  const DEFAULT_PARAMS = {
    shiftStart: '08:00',
    shiftEnd: '16:00',
    toleranceMinutes: 15,
    breakMinutes: 0,
    autoOTThresholdMinutes: 0,
  };

  try {
    let lookupTanggal = tanggal;
    if (clockInStr) {
      const [inH] = clockInStr.split(':').map(Number);
      if (Number.isFinite(inH) && inH >= 0 && inH <= 6) {
        const prevDate = new Date(tanggal + 'T00:00:00');
        prevDate.setDate(prevDate.getDate() - 1);
        const prevTanggal = prevDate.toISOString().split('T')[0];

        const { data: prevSched } = await supabaseClient
          .from('employee_schedules')
          .select('shift_start_time, shift_end_time, is_off_day, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
          .eq('employee_id', employeeId)
          .eq('schedule_date', prevTanggal)
          .in('status', ['published', 'swapped', 'override'])
          .maybeSingle();

        if (prevSched && !prevSched.is_off_day && prevSched.shift_start_time) {
          const [prevStartH] = String(prevSched.shift_start_time).split(':').map(Number);
          if (prevStartH >= 18) {
            lookupTanggal = prevTanggal;
          }
        }
      }
    }

    const { data: sched } = await supabaseClient
      .from('employee_schedules')
      .select('shift_start_time, shift_end_time, is_off_day, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
      .eq('employee_id', employeeId)
      .eq('schedule_date', lookupTanggal)
      .in('status', ['published', 'swapped', 'override'])
      .maybeSingle();

    if (!sched || sched.is_off_day) return DEFAULT_PARAMS;

    return {
      shiftStart: String(sched.shift_start_time || '08:00').substring(0, 5),
      shiftEnd: String(sched.shift_end_time || '16:00').substring(0, 5),
      toleranceMinutes: sched.late_tolerance_minutes ?? 15,
      breakMinutes: sched.break_duration_minutes ?? 0,
      autoOTThresholdMinutes: sched.auto_ot_threshold_minutes ?? 0,
    };
  } catch {
    return DEFAULT_PARAMS;
  }
}

export async function computeLateStatusForEmployee(supabaseClient, employeeId, tanggal, clockInStr) {
  if (!clockInStr) return { isLate: false, status: 'Recorded' };
  try {
    const params = await getShiftParamsForEmployee(supabaseClient, employeeId, tanggal, clockInStr);
    const [startH, startM] = params.shiftStart.split(':').map(Number);
    const [inH, inM] = clockInStr.split(':').map(Number);

    let adjustedInH = inH;
    if (startH >= 18 && inH <= 12) adjustedInH += 24;

    const isLate = (adjustedInH * 60 + inM) > (startH * 60 + startM + params.toleranceMinutes);
    return { isLate, status: isLate ? 'Terlambat' : 'Hadir' };
  } catch {
    return { isLate: false, status: 'Recorded' };
  }
}

export async function processEventRecord(supabaseClient, item, deviceLocation, ip) {
  const pin = String(item.employeeNoString || item.cardNo || '').trim();
  if (!pin) return { success: false, reason: 'no_pin' };

  const employeeId = await resolveEmployeeId(supabaseClient, pin);
  if (!employeeId) {
    loggingService.warn(`[Hikvision Sync] Employee with PIN/NIK ${pin} not found in database.`);
    return { success: false, reason: 'not_found' };
  }

  const verifyMode = item.currentVerifyMode || (Number(item.minor) === 38 ? 'fp' : Number(item.minor) === 50 ? 'card' : 'face');
  let isCheckOut = Number(item.minor) === 76;
  const state = String(item.attendanceState || '').toLowerCase();
  if (state.includes('checkout') || state.includes('out')) {
    isCheckOut = true;
  } else if (state.includes('checkin') || state.includes('in')) {
    isCheckOut = false;
  }

  const record = mapEventToAttendance(
    {
      time: item.time,
      matchScore: item.faceMatchScore,
      verifyMode,
      type: isCheckOut ? 'checkOut' : 'checkIn',
    },
    deviceLocation,
    item.deviceSerial || ip
  );
  record.employeeId = employeeId;

  const { data: existing } = await supabaseClient
    .from('attendance')
    .select('id, clockIn, clockOut, extra_taps, isLate, is_late')
    .eq('employeeId', employeeId)
    .eq('tanggal', record.tanggal)
    .maybeSingle();

  const dt = new Date(item.time);
  const eventHhmm = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;

  if (existing && existing.clockIn && existing.clockOut) {
    const direction = isCheckOut ? 'Out' : 'In';
    const tapInfo = `${eventHhmm} (${direction})`;
    let newExtraTaps = existing.extra_taps || '';
    if (!newExtraTaps.includes(tapInfo)) {
      newExtraTaps = newExtraTaps ? `${newExtraTaps}, ${tapInfo}` : tapInfo;
      await supabaseClient
        .from('attendance')
        .update({ extra_taps: newExtraTaps })
        .eq('id', existing.id);
    }
    return { success: true };
  }

  if (existing && existing.clockIn && !existing.clockOut) {
    const gapMinutes = getMinuteDiff(existing.clockIn, eventHhmm);
    if (gapMinutes < 30) {
      const tapInfo = `${eventHhmm} (Tap Ulang Masuk)`;
      let newExtraTaps = existing.extra_taps || '';
      if (!newExtraTaps.includes(tapInfo)) {
        newExtraTaps = newExtraTaps ? `${newExtraTaps}, ${tapInfo}` : tapInfo;
        await supabaseClient
          .from('attendance')
          .update({ extra_taps: newExtraTaps })
          .eq('id', existing.id);
      }
      return { success: true };
    }

    const shiftParams = await getShiftParamsForEmployee(supabaseClient, employeeId, record.tanggal, existing.clockIn);
    const [sH, sM] = shiftParams.shiftStart.split(':').map(Number);
    const [eH, eM] = shiftParams.shiftEnd.split(':').map(Number);
    const [inH, inM] = (existing.clockIn || '').split(':').map(Number);
    let [outH, outM] = eventHhmm.split(':').map(Number);

    let outTotal = outH * 60 + outM;
    const inTotal = inH * 60 + inM;
    if (outTotal < inTotal) outTotal += 24 * 60;

    let endTotal = eH * 60 + eM;
    let startTotal = sH * 60 + sM;
    if (endTotal <= startTotal) endTotal += 24 * 60;

    const shiftDurationMin = endTotal - startTotal;
    const netPresenceMin = (outTotal - inTotal) - shiftParams.breakMinutes;
    const rawOTMin = Math.max(0, netPresenceMin - shiftDurationMin);
    const overtimeHours = (shiftParams.autoOTThresholdMinutes > 0 && rawOTMin < shiftParams.autoOTThresholdMinutes)
      ? 0
      : parseFloat((rawOTMin / 60).toFixed(2));

    const earlyLeaveMin = endTotal > outTotal ? (endTotal - outTotal) : null;

    let adjustedInH = inH;
    if (sH >= 18 && inH <= 12) adjustedInH += 24;
    const isLate = existing.isLate ?? existing.is_late ?? ((adjustedInH * 60 + inM) > (sH * 60 + sM + shiftParams.toleranceMinutes));

    const { error } = await supabaseClient
      .from('attendance')
      .update({
        clockOut: eventHhmm,
        is_late: isLate,
        overtime_hours: overtimeHours,
        status: isLate ? 'Terlambat' : 'Hadir',
        early_leave_minutes: earlyLeaveMin,
        face_match_score_check_out: record.face_match_score_check_out,
      })
      .eq('id', existing.id);

    return { success: !error, error };
  }

  // Record belum ada hari ini
  const isEarlyMorningTap = dt.getHours() < 8;
  let resolvedByPrevDay = false;

  if (isEarlyMorningTap || isCheckOut) {
    const prevDate = new Date(dt);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevTanggal = prevDate.toISOString().slice(0, 10);

    const { data: prevExisting } = await supabaseClient
      .from('attendance')
      .select('id, clockIn, clockOut, extra_taps')
      .eq('employeeId', employeeId)
      .eq('tanggal', prevTanggal)
      .maybeSingle();

    if (prevExisting && prevExisting.clockIn && !prevExisting.clockOut) {
      const gapFromPrevIn = getMinuteDiff(prevExisting.clockIn, eventHhmm);
      if (gapFromPrevIn >= 30) {
        const { error } = await supabaseClient
          .from('attendance')
          .update({
            clockOut: eventHhmm,
            face_match_score_check_out: record.face_match_score_check_out,
          })
          .eq('id', prevExisting.id);
        resolvedByPrevDay = !error;
      }
    }
  }

  if (!resolvedByPrevDay) {
    if (isCheckOut) {
      const { error } = await supabaseClient
        .from('attendance')
        .update({
          clockOut: record.clockOut,
          face_match_score_check_out: record.face_match_score_check_out,
        })
        .eq('employeeId', employeeId)
        .eq('tanggal', record.tanggal);
      return { success: !error, error };
    }

    if (record.clockIn) {
      const lateCalc = await computeLateStatusForEmployee(supabaseClient, employeeId, record.tanggal, record.clockIn);
      record.isLate = lateCalc.isLate;
      record.status = lateCalc.status;
    }

    const { error } = await supabaseClient
      .from('attendance')
      .upsert(record, { onConflict: 'employeeId,tanggal' });

    return { success: !error, error };
  }

  return { success: true };
}
