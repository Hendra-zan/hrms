/**
 * attendanceMetricsService.ts
 * Post-processing service untuk menghitung ulang is_late dan overtime_hours
 * pada rekaman absensi yang belum dikalkulasi (misal: data dari Hikvision).
 */

import { supabase } from './supabaseClient.ts';
import { ShiftDefinition, WEEK_DAYS, getScheduleForDay } from '../types.ts';

export interface RecalcResult {
    updated: number;
    skipped: number;
    errors: number;
}

/**
 * Hitung ulang is_late & overtime_hours untuk rekaman absensi dalam rentang tanggal.
 * Cocok untuk data Hikvision yang direkam dengan is_late=false & overtime=0.
 *
 * @param dateFrom  YYYY-MM-DD
 * @param dateTo    YYYY-MM-DD
 * @param allShiftDefs  Gabungan shift dari systemSettings + semua unit
 * @param source    Optional filter sumber data (misal 'hikvision')
 */
export async function recalculateAttendanceMetrics(
    dateFrom: string,
    dateTo: string,
    allShiftDefs: ShiftDefinition[],
    source?: string,
    targetEmployeeIds?: string[]
): Promise<RecalcResult> {
    const result: RecalcResult = { updated: 0, skipped: 0, errors: 0 };

    // Load rekaman yang ada clock_in dalam rentang tanggal
    let query = (supabase as any)
        .from('attendance')
        .select('id, employee_id, tanggal, clock_in, clock_out, is_late, overtime_hours')
        .gte('tanggal', dateFrom)
        .lte('tanggal', dateTo)
        .not('clock_in', 'is', null);

    if (source) query = query.eq('source', source);
    if (targetEmployeeIds && targetEmployeeIds.length > 0) {
        query = query.in('employee_id', targetEmployeeIds);
    }

    const { data: records, error } = await query;
    if (error) throw error;
    if (!records || records.length === 0) return result;

    // Load semua karyawan dalam batch untuk shift lookup
    const empIds = [...new Set((records as any[]).map((r: any) => r.employee_id))];
    const { data: employees } = await (supabase as any)
        .from('employees')
        .select('id, shift, unitKerjaId')
        .in('id', empIds);

    const empMap = new Map<string, { shift: string; unitKerjaId?: string }>();
    (employees || []).forEach((e: any) => empMap.set(e.id, { shift: e.shift, unitKerjaId: e.unitKerjaId }));

    // Load employee_schedules untuk lookup per-date shift (SSOT)
    // Filter hanya jadwal yang valid untuk absensi (published, swapped, override)
    const { data: schedules } = await (supabase as any)
        .from('employee_schedules')
        .select('employee_id, schedule_date, shift_name, shift_start_time, shift_end_time, is_off_day, late_tolerance_minutes, break_duration_minutes, auto_ot_threshold_minutes')
        .in('employee_id', empIds)
        .gte('schedule_date', dateFrom)
        .lte('schedule_date', dateTo)
        .in('status', ['published', 'swapped', 'override']); // Task 6.2: filter draft

    // Map: "employeeId_date" → schedule — use schedule_date as key
    const schedMap = new Map<string, any>();
    (schedules || []).forEach((s: any) => schedMap.set(`${s.employee_id}_${s.schedule_date}`, s));

    const updates: { id: string; is_late: boolean; overtime_hours: number; status?: string }[] = [];

    for (const rec of records as any[]) {
        try {
            const emp = empMap.get(rec.employee_id);
            if (!emp || !rec.clock_in) { result.skipped++; continue; }

            // Determine shift times: prefer employee_schedules, then shift definition
            const sched = schedMap.get(`${rec.employee_id}_${rec.tanggal}`);

            let shiftStartStr = '08:00';
            let shiftEndStr   = '16:00';
            let tolerance     = 15;
            let breakDuration = 0;
            let autoOTThreshold = 0;

            const shiftName = sched?.shift_name || emp.shift || '';
            const targetShiftName = String(shiftName).toLowerCase().trim();
            const shiftDef  = allShiftDefs.find(s => {
                const sName = String(s.name || '').toLowerCase().trim();
                return sName === targetShiftName || sName.includes(targetShiftName) || targetShiftName.includes(sName);
            });

            if (sched && !sched.is_off_day && sched.shift_start_time && sched.shift_end_time) {
                shiftStartStr = sched.shift_start_time;
                shiftEndStr   = sched.shift_end_time;
                tolerance = sched.late_tolerance_minutes ?? shiftDef?.lateToleranceMinutes ?? 15;
                breakDuration = sched.break_duration_minutes ?? shiftDef?.breakDurationMinutes ?? 0;
                autoOTThreshold = sched.auto_ot_threshold_minutes ?? shiftDef?.autoOvertimeThresholdMinutes ?? 0;
            } else {
                if (shiftDef) {
                    const dow     = new Date(rec.tanggal).getDay();
                    const dayKey  = WEEK_DAYS[dow === 0 ? 6 : dow - 1];
                    const daySchedule = getScheduleForDay(shiftDef, dayKey);
                    if (daySchedule) {
                        shiftStartStr = daySchedule.startTime;
                        shiftEndStr   = daySchedule.endTime;
                    }
                    tolerance = shiftDef.lateToleranceMinutes ?? 15;
                    breakDuration = shiftDef.breakDurationMinutes ?? 0;
                    autoOTThreshold = shiftDef.autoOvertimeThresholdMinutes ?? 0;
                }
            }

            // Fallback kata kunci jika shiftStartStr masih 08:00
            if (shiftStartStr === '08:00' && shiftName) {
                const lower = String(shiftName).toLowerCase();
                if (lower.includes('siang') || lower.includes('sore')) {
                    shiftStartStr = '15:00';
                    shiftEndStr   = '23:00';
                } else if (lower.includes('malam')) {
                    shiftStartStr = '21:00';
                    shiftEndStr   = '07:00';
                }
            }

            const [startH, startM] = shiftStartStr.split(':').map(Number);
            const [endH,   endM]   = shiftEndStr.split(':').map(Number);
            let shiftDuration = (endH + endM / 60) - (startH + startM / 60);
            if (shiftDuration <= 0) shiftDuration += 24;

            const [inH, inM] = rec.clock_in.split(':').map(Number);
            let adjustedInH = inH;
            // [SV-M1] Handle clock-in after midnight for night shifts
            if (startH >= 18 && inH <= 12) {
                adjustedInH += 24;
            }
            const isLate = (adjustedInH * 60 + inM) > (startH * 60 + startM + tolerance);

            let overtimeHours = 0;
            if (rec.clock_out) {
                const inVal  = inH + inM / 60;
                const startVal = startH + startM / 60;

                // Early Check-in Overtime Fix:
                // Cek apakah check-in lebih awal dari jam shift. Jika ya, gunakan startVal sebagai basis hitungan kerja normal.
                let effectiveInVal = inVal;
                if (startH < 18 || inH >= 12) {
                    if (inVal < startVal) {
                        effectiveInVal = startVal;
                    }
                }

                const [outH, outM] = rec.clock_out.split(':').map(Number);
                let outVal = outH + outM / 60;
                if (outVal < effectiveInVal) outVal += 24;
                
                const presenceDuration = outVal - effectiveInVal;
                const netPresence = presenceDuration - (breakDuration / 60);
                let rawOvertime = Math.max(0, netPresence - shiftDuration);

                overtimeHours = rawOvertime;
                if (autoOTThreshold > 0 && (rawOvertime * 60) < autoOTThreshold) {
                    overtimeHours = 0;
                }
                overtimeHours = parseFloat(overtimeHours.toFixed(2));
            }

            const statusText = isLate ? 'Terlambat' : 'Hadir';

            updates.push({ id: rec.id, is_late: isLate, overtime_hours: overtimeHours, status: statusText });
        } catch {
            result.errors++;
        }
    }

    // Batch update in chunks of 50
    const chunkSize = 50;
    for (let i = 0; i < updates.length; i += chunkSize) {
        const chunk = updates.slice(i, i + chunkSize);
        for (const upd of chunk) {
            const { error: updErr } = await (supabase as any)
                .from('attendance')
                .update({ is_late: upd.is_late, overtime_hours: upd.overtime_hours, status: upd.status })
                .eq('id', upd.id);
            if (updErr) result.errors++;
            else result.updated++;
        }
    }

    return result;
}
