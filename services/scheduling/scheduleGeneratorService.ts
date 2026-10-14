import { supabase } from '../supabaseClient.ts';
import { EmployeeSchedule } from '../../types.ts';
import { GenerateScheduleParams } from './scheduleTypes.ts';
import { toValidUuidOrNull } from './scheduleUtils.ts';
import { getUnitShifts, getSchedulesByUnit } from './scheduleQueryService.ts';

export async function generateScheduleFromPattern(params: GenerateScheduleParams): Promise<number> {
    if (!params.lockSundayOff) {
        try {
            const { data, error } = await supabase.rpc('generate_schedule_from_pattern', {
                p_employee_id: params.employeeId,
                p_unit_id: params.unitId,
                p_pattern_id: params.patternId,
                p_start_date: params.startDate,
                p_end_date: params.endDate,
                p_rotation_offset: params.rotationOffset,
                p_created_by: params.createdBy,
            });

            if (!error && data !== null && typeof data === 'number') {
                return data;
            }
        } catch (rpcErr) {
            console.warn('RPC generate_schedule_from_pattern error, falling back to JS generator:', rpcErr);
        }
    }

    // Fallback Client-side Generation if RPC fails or lockSundayOff is active
    const { data: pattern, error: patErr } = await supabase
        .from('rotation_patterns')
        .select('*')
        .eq('id', params.patternId)
        .single();

    if (patErr || !pattern) throw new Error('Pola rotasi tidak ditemukan.');

    const shifts = await getUnitShifts(params.unitId);
    const validCreatedBy = toValidUuidOrNull(params.createdBy);

    const shiftMap: Record<string, any> = {};
    (shifts || []).forEach((s: any) => {
        if (s.name) shiftMap[s.name.toLowerCase().trim()] = s;
        if (s.code) shiftMap[s.code.toUpperCase().trim()] = s;
        if (s.code) shiftMap[s.code.toLowerCase().trim()] = s;
    });

    const patArr = (pattern.pattern || []) as string[];
    const cycleLen = pattern.cycle_days || patArr.length || 1;

    const startDt = new Date(params.startDate);
    const endDt = new Date(params.endDate);
    const rowsToInsert: any[] = [];

    let dayIdx = 0;
    for (let dt = new Date(startDt); dt <= endDt; dt.setDate(dt.getDate() + 1)) {
        const dateStr = dt.toLocaleDateString('en-CA');
        const isSunday = dt.getDay() === 0;
        const patIdx = (dayIdx + params.rotationOffset) % cycleLen;
        const rawShiftName = patArr[patIdx] || 'Libur';

        const isOff = (params.lockSundayOff && isSunday) ? true : (!rawShiftName || rawShiftName.toLowerCase() === 'libur');
        const shiftName = (params.lockSundayOff && isSunday) ? 'Libur' : (isOff ? 'Libur' : rawShiftName);
        const shiftDef = shiftMap[shiftName.toLowerCase().trim()] || shiftMap[shiftName.toUpperCase().trim()] || shiftMap[shiftName];

        rowsToInsert.push({
            employee_id: params.employeeId,
            unit_id: params.unitId,
            schedule_date: dateStr,
            shift_name: isOff ? 'Libur' : (shiftDef?.name || shiftName),
            shift_start_time: isOff ? null : (shiftDef?.startTime || shiftDef?.start_time || '07:00'),
            shift_end_time: isOff ? null : (shiftDef?.endTime || shiftDef?.end_time || '14:00'),
            is_off_day: isOff,
            status: 'draft',
            created_by: validCreatedBy,
            late_tolerance_minutes: isOff ? 15 : (shiftDef?.lateToleranceMinutes ?? 15),
            break_duration_minutes: isOff ? 0 : (shiftDef?.breakDurationMinutes ?? 0),
            auto_ot_threshold_minutes: isOff ? 0 : (shiftDef?.autoOvertimeThresholdMinutes ?? 0),
        });

        dayIdx++;
    }

    if (rowsToInsert.length > 0) {
        const { error: insErr } = await supabase
            .from('employee_schedules')
            .upsert(rowsToInsert, { onConflict: 'employee_id,schedule_date' });

        if (insErr) {
            for (const r of rowsToInsert) {
                await supabase.from('employee_schedules').upsert(r, { onConflict: 'employee_id,schedule_date' });
            }
        }
    }

    return rowsToInsert.length;
}

export async function generateBulkSchedules(
    employeeIds: string[],
    unitId: string,
    patternId: string,
    startDate: string,
    endDate: string,
    createdBy: string,
    staggerOffset: number = 0,
    sundayLockEmpIds: string[] = [],
    autoAlignDayOfWeek: boolean = true
): Promise<{ total: number; perEmployee: Record<string, number> }> {
    if (!employeeIds || employeeIds.length === 0) {
        return { total: 0, perEmployee: {} };
    }

    const sundayLockSet = new Set(sundayLockEmpIds);
    const results: Record<string, number> = {};

    // 1. Fetch Rotation Pattern ONCE
    const { data: pattern, error: patErr } = await supabase
        .from('rotation_patterns')
        .select('*')
        .eq('id', patternId)
        .single();

    if (patErr || !pattern) throw new Error('Pola rotasi tidak ditemukan.');

    // 2. Fetch Unit Shifts ONCE
    const shifts = await getUnitShifts(unitId);
    const validCreatedBy = toValidUuidOrNull(createdBy);

    const shiftMap: Record<string, any> = {};
    (shifts || []).forEach((s: any) => {
        if (s.code) {
            shiftMap[s.code.toUpperCase().trim()] = s;
            shiftMap[s.code.toLowerCase().trim()] = s;
        }
    });
    (shifts || []).forEach((s: any) => {
        if (s.name) {
            shiftMap[s.name.toLowerCase().trim()] = s;
            shiftMap[s.name.toUpperCase().trim()] = s;
            shiftMap[s.name.trim()] = s;
        }
    });

    const patArr = (pattern.pattern || []) as string[];
    const cycleLen = pattern.cycle_days || patArr.length || 1;

    const startDt = new Date(startDate);
    const endDt = new Date(endDate);
    const startDayOfWeek = (startDt.getDay() + 6) % 7;
    const allRowsToInsert: any[] = [];

    employeeIds.forEach((employeeId, i) => {
        const empOffset = staggerOffset > 0 ? (i * staggerOffset) : 0;
        const lockSunday = sundayLockSet.has(employeeId);
        let empCount = 0;

        let dayIdx = 0;
        for (let dt = new Date(startDt); dt <= endDt; dt.setDate(dt.getDate() + 1)) {
            const dateStr = dt.toLocaleDateString('en-CA');
            const isSunday = dt.getDay() === 0;

            let patIdx: number;
            if (autoAlignDayOfWeek) {
                patIdx = (startDayOfWeek + dayIdx + empOffset) % cycleLen;
            } else {
                patIdx = (dayIdx + empOffset) % cycleLen;
            }

            const rawShiftName = patArr[patIdx] || 'Libur';

            const isOff = (lockSunday && isSunday) ? true : (!rawShiftName || rawShiftName.toLowerCase() === 'libur');
            const shiftName = (lockSunday && isSunday) ? 'Libur' : (isOff ? 'Libur' : rawShiftName);

            const shiftDef = shiftMap[shiftName.toLowerCase().trim()] || shiftMap[shiftName.toUpperCase().trim()];

            allRowsToInsert.push({
                employee_id: employeeId,
                unit_id: unitId,
                schedule_date: dateStr,
                shift_name: isOff ? 'Libur' : (shiftDef?.name || shiftName),
                shift_start_time: isOff ? null : (shiftDef?.startTime || shiftDef?.start_time || '07:00'),
                shift_end_time: isOff ? null : (shiftDef?.endTime || shiftDef?.end_time || '14:00'),
                is_off_day: isOff,
                status: 'draft',
                created_by: validCreatedBy,
                late_tolerance_minutes: isOff ? 15 : (shiftDef?.lateToleranceMinutes ?? 15),
                break_duration_minutes: isOff ? 0 : (shiftDef?.breakDurationMinutes ?? 0),
                auto_ot_threshold_minutes: isOff ? 0 : (shiftDef?.autoOvertimeThresholdMinutes ?? 0),
            });

            dayIdx++;
            empCount++;
        }

        results[employeeId] = empCount;
    });

    // 3. Batch upsert in chunks of 200 rows
    const CHUNK_SIZE = 200;
    for (let i = 0; i < allRowsToInsert.length; i += CHUNK_SIZE) {
        const chunk = allRowsToInsert.slice(i, i + CHUNK_SIZE);
        const { error: batchErr } = await supabase
            .from('employee_schedules')
            .upsert(chunk, { onConflict: 'employee_id,schedule_date' });

        if (batchErr) {
            console.error('[generateBulkSchedules] Batch upsert chunk error:', batchErr);
            throw new Error(`Gagal menyimpan batch jadwal: ${batchErr.message}`);
        }
    }

    return { total: allRowsToInsert.length, perEmployee: results };
}

export async function applyNationalHolidays(
    unitId: string,
    holidayDates: string[],
    employeeIds: string[],
    createdBy: string
): Promise<number> {
    if (holidayDates.length === 0 || employeeIds.length === 0) return 0;

    const rowsToUpsert: any[] = [];
    employeeIds.forEach(empId => {
        holidayDates.forEach(date => {
            rowsToUpsert.push({
                employee_id: empId,
                unit_id: unitId,
                schedule_date: date,
                shift_name: 'Libur',
                shift_start_time: null,
                shift_end_time: null,
                is_off_day: true,
                status: 'draft',
                created_by: createdBy,
            });
        });
    });

    const { data, error } = await supabase
        .from('employee_schedules')
        .upsert(rowsToUpsert, { onConflict: 'employee_id,schedule_date' })
        .select('id');

    if (error) throw error;
    return (data || []).length;
}

export async function copyScheduleFromPrevMonth(
    unitId: string,
    prevMonthStr: string,
    targetMonthStr: string,
    createdBy: string
): Promise<number> {
    const [pY, pM] = prevMonthStr.split('-').map(Number);
    const prevLastDay = new Date(pY, pM, 0).getDate();
    const prevStart = `${prevMonthStr}-01`;
    const prevEnd = `${prevMonthStr}-${String(prevLastDay).padStart(2, '0')}`;

    const { data: prevSchedules, error: prevErr } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('unit_id', unitId)
        .gte('schedule_date', prevStart)
        .lte('schedule_date', prevEnd)
        .neq('status', 'cancelled');

    if (prevErr) throw prevErr;
    if (!prevSchedules || prevSchedules.length === 0) return 0;

    const [tY, tM] = targetMonthStr.split('-').map(Number);
    const targetLastDay = new Date(tY, tM, 0).getDate();

    const rowsToInsert: any[] = [];
    prevSchedules.forEach((s: any) => {
        const dayNum = Number(s.schedule_date.slice(8));
        if (dayNum <= targetLastDay) {
            const targetDate = `${targetMonthStr}-${String(dayNum).padStart(2, '0')}`;
            rowsToInsert.push({
                employee_id: s.employee_id,
                unit_id: unitId,
                schedule_date: targetDate,
                shift_name: s.shift_name,
                shift_start_time: s.shift_start_time,
                shift_end_time: s.shift_end_time,
                is_off_day: s.is_off_day,
                status: 'draft',
                created_by: createdBy,
            });
        }
    });

    if (rowsToInsert.length === 0) return 0;

    const { data, error } = await supabase
        .from('employee_schedules')
        .upsert(rowsToInsert, { onConflict: 'employee_id,schedule_date' })
        .select('id');

    if (error) throw error;
    return (data || []).length;
}

export async function copyPreviousMonthSchedules(
    unitId: string,
    currentStartDate: string,
    currentEndDate: string,
    createdBy: string
): Promise<number> {
    const curStart = new Date(currentStartDate);
    const curEnd = new Date(currentEndDate);

    const prevStartDt = new Date(curStart.getFullYear(), curStart.getMonth() - 1, 1);
    const prevLastDay = new Date(curStart.getFullYear(), curStart.getMonth(), 0).getDate();
    const prevEndDt = new Date(curStart.getFullYear(), curStart.getMonth() - 1, prevLastDay);

    const prevStartStr = prevStartDt.toLocaleDateString('en-CA');
    const prevEndStr = prevEndDt.toLocaleDateString('en-CA');

    const prevSchedules = await getSchedulesByUnit(unitId, prevStartStr, prevEndStr);
    if (prevSchedules.length === 0) {
        throw new Error('Tidak ada jadwal pada bulan sebelumnya untuk disalin.');
    }

    const prevByDay: Record<string, Record<number, EmployeeSchedule>> = {};
    prevSchedules.forEach(s => {
        const dayNum = parseInt(s.schedule_date.split('-')[2], 10);
        if (!prevByDay[s.employee_id]) prevByDay[s.employee_id] = {};
        prevByDay[s.employee_id][dayNum] = s;
    });

    const rowsToInsert: any[] = [];
    for (let dt = new Date(curStart); dt <= curEnd; dt.setDate(dt.getDate() + 1)) {
        const dateStr = dt.toLocaleDateString('en-CA');
        const dayNum = dt.getDate();

        Object.keys(prevByDay).forEach(empId => {
            const prevSched = prevByDay[empId][dayNum] || prevByDay[empId][Math.min(dayNum, prevLastDay)];
            if (prevSched) {
                rowsToInsert.push({
                    employee_id: empId,
                    unit_id: unitId,
                    schedule_date: dateStr,
                    shift_name: prevSched.shift_name,
                    shift_start_time: prevSched.shift_start_time,
                    shift_end_time: prevSched.shift_end_time,
                    is_off_day: prevSched.is_off_day,
                    status: 'draft',
                    created_by: createdBy
                });
            }
        });
    }

    if (rowsToInsert.length > 0) {
        const { error } = await supabase
            .from('employee_schedules')
            .upsert(rowsToInsert, { onConflict: 'employee_id,schedule_date' });

        if (error) {
            for (const r of rowsToInsert) {
                await supabase.from('employee_schedules').upsert(r, { onConflict: 'employee_id,schedule_date' });
            }
        }
    }

    return rowsToInsert.length;
}
