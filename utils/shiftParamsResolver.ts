/**
 * utils/shiftParamsResolver.ts
 *
 * Fungsi-fungsi pure utility untuk kalkulasi parameter shift:
 * - Resolusi tanggal absensi untuk shift malam lintas tengah malam
 * - Kalkulasi keterlambatan dengan dukungan lintas tengah malam
 * - Kalkulasi jam lembur
 * - Kalkulasi menit pulang cepat
 *
 * Semua fungsi ini adalah PURE FUNCTIONS (tidak ada side effect, tidak ada I/O).
 * Digunakan oleh:
 *   - server/services/hikvisionSyncService.js
 *   - mobile-absensi/src/services/attendanceService.ts
 *   - services/attendanceMetricsService.ts
 *   - hooks/useESSAttendance.ts
 */

// ── TIPE ─────────────────────────────────────────────────────────────────────

export interface ShiftParams {
  shiftStart: string;           // "HH:MM"
  shiftEnd: string;             // "HH:MM"
  toleranceMinutes: number;     // menit toleransi keterlambatan
  breakMinutes: number;         // menit istirahat resmi
  autoOTThresholdMinutes: number; // menit minimum ekstra agar terhitung lembur
}

export interface AttendanceSummary {
  isLate: boolean;
  status: 'Hadir' | 'Terlambat';
  overtimeHours: number;
  earlyLeaveMinutes: number | null;
  lateMinutes: number;          // berapa menit terlambat (0 jika tidak terlambat)
}

// ── HELPERS INTERNAL ─────────────────────────────────────────────────────────

/** Konversi "HH:MM" ke total menit. Return NaN jika invalid. */
function toMinutes(hhmm: string | undefined | null): number {
  if (!hhmm) return NaN;
  const parts = String(hhmm).split(':');
  if (parts.length < 2) return NaN;
  const h = Number(parts[0]);
  const m = Number(parts[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return NaN;
  return h * 60 + m;
}

// ── RESOLUSI TANGGAL SHIFT MALAM ─────────────────────────────────────────────

/**
 * Tentukan apakah tap dini hari (00:00–06:59) kemungkinan adalah
 * lanjutan dari shift malam hari sebelumnya.
 *
 * Caller wajib melakukan verifikasi lanjutan ke database:
 * 1. Apakah ada jadwal shift malam (shift_start_time >= 18:00) di prevDate?
 * 2. Apakah belum ada record absensi di prevDate?
 * Jika kedua kondisi terpenuhi → gunakan prevDate sebagai tanggal absensi.
 *
 * @param rawDate      Tanggal aktual device (YYYY-MM-DD)
 * @param clockHHMM    Jam tap aktual (HH:MM)
 * @returns shouldCheckPrevDay & tanggal H-1
 */
export function resolveNightShiftDate(
  rawDate: string,
  clockHHMM: string,
): { shouldCheckPrevDay: boolean; prevDate: string } {
  const [inHour] = clockHHMM.split(':').map(Number);
  const isEarlyMorning = Number.isFinite(inHour) && inHour >= 0 && inHour <= 6;

  // Hitung H-1 (tanpa bergantung pada timezone lokal, pakai offset string)
  const [y, mo, d] = rawDate.split('-').map(Number);
  const prevDateObj = new Date(Date.UTC(y, mo - 1, d - 1));
  const prevDate = prevDateObj.toISOString().split('T')[0];

  return { shouldCheckPrevDay: isEarlyMorning, prevDate };
}

// ── KALKULASI KETERLAMBATAN ───────────────────────────────────────────────────

/**
 * Hitung apakah karyawan terlambat berdasarkan jam masuk vs jam shift.
 * Mendukung shift malam yang mulai >= 18:00 dan check-in dini hari (<= 12:00).
 *
 * @param clockInHHMM      Jam check-in aktual (HH:MM)
 * @param shiftStartHHMM   Jam mulai shift (HH:MM)
 * @param toleranceMinutes Toleransi keterlambatan dari employee_schedules
 * @returns { isLate, lateMinutes }
 */
export function computeIsLate(
  clockInHHMM: string,
  shiftStartHHMM: string,
  toleranceMinutes: number,
): { isLate: boolean; lateMinutes: number } {
  const inMin = toMinutes(clockInHHMM);
  const startMin = toMinutes(shiftStartHHMM);
  if (isNaN(inMin) || isNaN(startMin)) return { isLate: false, lateMinutes: 0 };

  // Jika shift malam (mulai >= 18:00) dan masuk dini hari (<= 12:00)
  // → masuk setelah tengah malam, tambah 24 jam agar perbandingan linear
  const [startH] = shiftStartHHMM.split(':').map(Number);
  const [inH] = clockInHHMM.split(':').map(Number);
  let adjustedIn = inMin;
  if (startH >= 18 && inH <= 12) {
    adjustedIn += 24 * 60;
  }

  const lateMinutes = Math.max(0, adjustedIn - (startMin + toleranceMinutes));
  return { isLate: lateMinutes > 0, lateMinutes };
}

// ── KALKULASI LEMBUR ──────────────────────────────────────────────────────────

/**
 * Hitung jam lembur berdasarkan jam masuk/keluar vs jam shift resmi.
 * Mendukung shift lintas tengah malam (mis. 21:00 – 05:00).
 *
 * @param clockInHHMM           Jam check-in aktual
 * @param clockOutHHMM          Jam check-out aktual
 * @param shiftStartHHMM        Jam mulai shift resmi
 * @param shiftEndHHMM          Jam selesai shift resmi
 * @param breakMinutes          Durasi istirahat resmi (dikurangi dari jam kerja)
 * @param autoOTThresholdMinutes Minimum ekstra menit agar terhitung lembur
 * @returns Jam lembur dalam desimal (misal 1.5 = 1 jam 30 menit)
 */
export function computeOvertimeHours(
  clockInHHMM: string,
  clockOutHHMM: string,
  shiftStartHHMM: string,
  shiftEndHHMM: string,
  breakMinutes: number,
  autoOTThresholdMinutes: number,
): number {
  const inMin   = toMinutes(clockInHHMM);
  let   outMin  = toMinutes(clockOutHHMM);
  const startMin = toMinutes(shiftStartHHMM);
  let   endMin  = toMinutes(shiftEndHHMM);

  if (isNaN(inMin) || isNaN(outMin) || isNaN(startMin) || isNaN(endMin)) return 0;

  // Normalize lintas tengah malam
  if (outMin < inMin)    outMin  += 24 * 60;
  if (endMin <= startMin) endMin += 24 * 60;

  const shiftDurationMin = endMin - startMin;
  const presenceMin      = outMin - inMin;
  const netPresenceMin   = presenceMin - breakMinutes;
  const rawOTMin         = Math.max(0, netPresenceMin - shiftDurationMin);

  // Jika kurang dari threshold → tidak dianggap lembur
  if (autoOTThresholdMinutes > 0 && rawOTMin < autoOTThresholdMinutes) return 0;

  return parseFloat((rawOTMin / 60).toFixed(2));
}

// ── KALKULASI PULANG CEPAT ────────────────────────────────────────────────────

/**
 * Hitung berapa menit karyawan pulang lebih awal dari shift_end_time.
 * Return null jika: belum checkout, checkout tepat waktu, atau lebih lama.
 *
 * @param clockOutHHMM   Jam checkout aktual
 * @param shiftEndHHMM   Jam selesai shift resmi
 * @param clockInHHMM    Jam masuk (untuk context lintas tengah malam)
 * @returns Menit pulang cepat, atau null jika tidak ada
 */
export function computeEarlyLeaveMinutes(
  clockOutHHMM: string | undefined | null,
  shiftEndHHMM: string | undefined | null,
  clockInHHMM: string,
): number | null {
  if (!clockOutHHMM || !shiftEndHHMM) return null;

  const inMin   = toMinutes(clockInHHMM);
  let   outMin  = toMinutes(clockOutHHMM);
  let   endMin  = toMinutes(shiftEndHHMM);

  if (isNaN(inMin) || isNaN(outMin) || isNaN(endMin)) return null;

  if (outMin < inMin)    outMin  += 24 * 60;
  if (endMin <= inMin)   endMin  += 24 * 60;

  const earlyMin = endMin - outMin;
  return earlyMin > 0 ? earlyMin : null;
}

// ── SUMMARY LENGKAP ───────────────────────────────────────────────────────────

/**
 * Hitung ringkasan absensi lengkap dalam satu panggilan.
 * Digunakan oleh Mobile checkOut() dan Hikvision sync saat tap keluar.
 */
export function computeFullAttendanceSummary(
  clockInHHMM: string,
  clockOutHHMM: string,
  params: ShiftParams,
): AttendanceSummary {
  const { isLate, lateMinutes } = computeIsLate(clockInHHMM, params.shiftStart, params.toleranceMinutes);
  const overtimeHours = computeOvertimeHours(
    clockInHHMM, clockOutHHMM,
    params.shiftStart, params.shiftEnd,
    params.breakMinutes, params.autoOTThresholdMinutes,
  );
  const earlyLeaveMinutes = computeEarlyLeaveMinutes(clockOutHHMM, params.shiftEnd, clockInHHMM);

  return {
    isLate,
    status: isLate ? 'Terlambat' : 'Hadir',
    overtimeHours,
    earlyLeaveMinutes,
    lateMinutes,
  };
}

// ── RESOLUSI SHIFT SSOT DARI DATABASE ─────────────────────────────────────────

/**
 * Mengambil parameter shift karyawan dengan hierarki prioritas baku:
 * 1. SSOT employee_schedules (Jadwal harian dari Karu)
 * 2. Fallback: system_settings.default_shifts (Pengaturan Shift Global)
 *
 * @param supabaseClient Instance Supabase client
 * @param employeeId     UUID / ID karyawan
 * @param tanggal        Tanggal absensi (YYYY-MM-DD)
 * @param clockInStr     Jam tap aktual (opsional, untuk deteksi shift malam lintas tanggal)
 * @returns ShiftParams terstandarisasi
 */
export async function fetchEmployeeShiftParams(
  supabaseClient: any,
  employeeId: string,
  tanggal: string,
  clockInStr?: string | null
): Promise<ShiftParams> {
  const DEFAULT_PARAMS: ShiftParams = {
    shiftStart: '08:00',
    shiftEnd: '16:00',
    toleranceMinutes: 15,
    breakMinutes: 0,
    autoOTThresholdMinutes: 0,
  };

  if (!employeeId || !tanggal) return DEFAULT_PARAMS;

  try {
    let lookupTanggal = tanggal;
    if (clockInStr) {
      const [inH] = clockInStr.split(':').map(Number);
      if (Number.isFinite(inH) && inH >= 0 && inH <= 6) {
        const { shouldCheckPrevDay, prevDate } = resolveNightShiftDate(tanggal, clockInStr);
        if (shouldCheckPrevDay) {
          const { data: prevSched } = await supabaseClient
            .from('employee_schedules')
            .select('shift_start_time, shift_end_time, is_off_day, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
            .eq('employee_id', employeeId)
            .eq('schedule_date', prevDate)
            .in('status', ['published', 'swapped', 'override'])
            .maybeSingle();

          if (prevSched && !prevSched.is_off_day && prevSched.shift_start_time) {
            const [prevStartH] = String(prevSched.shift_start_time).split(':').map(Number);
            if (prevStartH >= 18) {
              lookupTanggal = prevDate;
            }
          }
        }
      }
    }

    // 1. SSOT Prioritas 1: employee_schedules
    const { data: sched } = await supabaseClient
      .from('employee_schedules')
      .select('shift_name, shift_start_time, shift_end_time, is_off_day, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
      .eq('employee_id', employeeId)
      .eq('schedule_date', lookupTanggal)
      .in('status', ['published', 'swapped', 'override'])
      .maybeSingle();

    if (sched && !sched.is_off_day && sched.shift_start_time) {
      return {
        shiftStart: String(sched.shift_start_time || '08:00').substring(0, 5),
        shiftEnd: String(sched.shift_end_time || '16:00').substring(0, 5),
        toleranceMinutes: sched.late_tolerance_minutes ?? 15,
        breakMinutes: sched.break_duration_minutes ?? 0,
        autoOTThresholdMinutes: sched.auto_ot_threshold_minutes ?? 0,
      };
    }

    // 2. SSOT Prioritas 2 & 3: Fallback ke profil shift karyawan & system_settings
    const { data: emp } = await supabaseClient
      .from('employees')
      .select('shift')
      .eq('id', employeeId)
      .maybeSingle();

    const shiftName = sched?.shift_name || emp?.shift || '';

    const { data: settings } = await supabaseClient
      .from('system_settings')
      .select('default_shifts')
      .limit(1)
      .maybeSingle();

    let matchedShift: any = null;
    if (settings?.default_shifts && Array.isArray(settings.default_shifts)) {
      const needle = String(shiftName || '').toLowerCase().trim();
      matchedShift = settings.default_shifts.find((s: any) => String(s.name || '').toLowerCase().trim() === needle);
      if (!matchedShift && needle) {
        matchedShift = settings.default_shifts.find((s: any) => {
          const sn = String(s.name || '').toLowerCase().trim();
          return sn.includes(needle) || needle.includes(sn);
        });
      }
    }

    if (matchedShift) {
      return {
        shiftStart: matchedShift.startTime || '08:00',
        shiftEnd: matchedShift.endTime || '16:00',
        toleranceMinutes: matchedShift.lateToleranceMinutes ?? 15,
        breakMinutes: matchedShift.breakDurationMinutes ?? 0,
        autoOTThresholdMinutes: matchedShift.autoOvertimeThresholdMinutes ?? 0,
      };
    }

    // Fallback keyword nama shift
    if (shiftName) {
      const lower = String(shiftName).toLowerCase();
      if (lower.includes('siang') || lower.includes('sore')) {
        return { shiftStart: '15:00', shiftEnd: '23:00', toleranceMinutes: 15, breakMinutes: 0, autoOTThresholdMinutes: 0 };
      }
      if (lower.includes('malam')) {
        return { shiftStart: '21:00', shiftEnd: '07:00', toleranceMinutes: 15, breakMinutes: 0, autoOTThresholdMinutes: 0 };
      }
    }

    return DEFAULT_PARAMS;
  } catch {
    return DEFAULT_PARAMS;
  }
}
