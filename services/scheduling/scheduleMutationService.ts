import { supabase } from '../supabaseClient.ts';
import { EmployeeSchedule, RotationPattern, ShiftDefinition } from '../../types.ts';
import { OverrideScheduleParams, RotationPatternInput } from './scheduleTypes.ts';
import { toValidUuidOrNull } from './scheduleUtils.ts';
import { getUnitShifts } from './scheduleQueryService.ts';

export async function publishSchedules(
    unitId: string,
    startDate: string,
    endDate: string,
    publishedBy: string
): Promise<number> {
    const { data, error } = await supabase
        .from('employee_schedules')
        .update({
            status: 'published',
            updated_at: new Date().toISOString(),
        })
        .eq('unit_id', unitId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .in('status', ['draft', 'override', 'swapped'])
        .select('id');

    if (error) throw error;
    const count = (data || []).length;

    if (count > 0 && publishedBy) {
        try {
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (uuidRegex.test(publishedBy)) {
                await supabase
                    .from('schedule_publish_logs')
                    .insert({
                        unit_id: unitId,
                        period_start: startDate,
                        period_end: endDate,
                        total_schedules: count,
                        published_by: publishedBy,
                        published_at: new Date().toISOString(),
                    } as any);
            }
        } catch (logErr) {
            console.warn('[publishSchedules] Non-critical log creation skipped:', logErr);
        }
    }

    return count;
}

export async function unpublishSchedules(
    unitId: string,
    startDate: string,
    endDate: string
): Promise<number> {
    const { data, error } = await supabase
        .from('employee_schedules')
        .update({
            status: 'draft',
            updated_at: new Date().toISOString(),
        })
        .eq('unit_id', unitId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .in('status', ['published', 'override'])
        .select('id');

    if (error) throw error;
    return (data || []).length;
}

export async function overrideSchedule(
    paramsOrId: OverrideScheduleParams | string,
    shiftNamePositional?: string,
    isOffDayPositional?: boolean,
    reasonPositional?: string,
    createdByPositional?: string
): Promise<EmployeeSchedule> {
    let params: OverrideScheduleParams;

    if (typeof paramsOrId === 'string') {
        params = {
            scheduleId: paramsOrId,
            employeeId: '',
            unitId: '',
            date: '',
            shiftName: shiftNamePositional || 'Libur',
            isOffDay: isOffDayPositional,
            reason: reasonPositional || 'Penyesuaian manual',
            createdBy: createdByPositional || '',
        };
    } else {
        params = paramsOrId || {} as OverrideScheduleParams;
    }

    const safeShiftName = String(params.shiftName || '').trim();
    const isOffDay = Boolean(params.isOffDay || !safeShiftName || safeShiftName.toLowerCase() === 'libur');

    const unitShifts = await getUnitShifts(params.unitId);
    const shiftDef = (unitShifts || []).find((s: any) =>
        s.name?.toLowerCase().trim() === safeShiftName.toLowerCase().trim() ||
        (s.code && s.code.toUpperCase().trim() === safeShiftName.toUpperCase().trim())
    );
    const canonicalShiftName = isOffDay ? 'Libur' : (shiftDef?.name || safeShiftName);
    const validCreatedBy = toValidUuidOrNull(params.createdBy);

    let targetStatus = 'draft';
    if (params.scheduleId) {
        const { data: existing } = await supabase
            .from('employee_schedules')
            .select('status')
            .eq('id', params.scheduleId)
            .maybeSingle();
        if (existing?.status === 'published') {
            targetStatus = 'published';
        }
    } else if (params.employeeId && params.date) {
        const { data: existing } = await supabase
            .from('employee_schedules')
            .select('status')
            .eq('employee_id', params.employeeId)
            .eq('schedule_date', params.date)
            .maybeSingle();
        if (existing?.status === 'published') {
            targetStatus = 'published';
        }
    }

    let resultData: EmployeeSchedule;

    if (params.scheduleId) {
        const updatePayload: Record<string, any> = {
            shift_name: canonicalShiftName,
            shift_start_time: isOffDay ? null : (shiftDef?.startTime || (shiftDef as any)?.start_time || '07:00'),
            shift_end_time: isOffDay ? null : (shiftDef?.endTime || (shiftDef as any)?.end_time || '14:00'),
            is_off_day: isOffDay,
            status: targetStatus,
            override_reason: params.reason || null,
        };
        if (validCreatedBy) {
            updatePayload.override_by = validCreatedBy;
        }

        const { data, error } = await supabase
            .from('employee_schedules')
            .update(updatePayload)
            .eq('id', params.scheduleId)
            .select()
            .single();

        if (error) throw error;
        resultData = data as unknown as EmployeeSchedule;
    } else {
        const upsertPayload: Record<string, any> = {
            employee_id: params.employeeId,
            unit_id: params.unitId,
            schedule_date: params.date,
            shift_name: canonicalShiftName,
            shift_start_time: isOffDay ? null : (shiftDef?.startTime || (shiftDef as any)?.start_time || '07:00'),
            shift_end_time: isOffDay ? null : (shiftDef?.endTime || (shiftDef as any)?.end_time || '14:00'),
            is_off_day: isOffDay,
            status: targetStatus,
            override_reason: params.reason || null,
        };
        if (validCreatedBy) {
            upsertPayload.override_by = validCreatedBy;
            upsertPayload.created_by = validCreatedBy;
        }

        const { data, error } = await supabase
            .from('employee_schedules')
            .upsert(upsertPayload as any, { onConflict: 'employee_id,schedule_date' })
            .select()
            .single();

        if (error) throw error;
        resultData = data as unknown as EmployeeSchedule;
    }

    // Send automatic notification note to employee
    if (params.employeeId && params.createdBy) {
        try {
            const { data: empSender } = await supabase
                .from('employees')
                .select('id')
                .or(`id.eq.${params.createdBy},user_id.eq.${params.createdBy}`)
                .limit(1)
                .maybeSingle();

            const actualSenderId = empSender?.id;
            if (actualSenderId) {
                await (supabase as any).from('employee_notes').insert({
                    employee_id: params.employeeId,
                    sender_id: actualSenderId,
                    category: 'schedule_coordination',
                    priority: 'normal',
                    title: `🗓️ Penyesuaian Jadwal Shift (${params.date})`,
                    content: `Shift Anda pada tanggal ${params.date} telah disesuaikan oleh Kepala Ruangan menjadi: ${isOffDay ? 'Libur' : safeShiftName}. Alasan: ${params.reason}`,
                    status: 'unread',
                    direction: 'top_down',
                });
            }
        } catch { /* ignore optional notification error */ }
    }

    return resultData;
}

export async function requestSwapShift(
    scheduleId1: string,
    scheduleId2: string,
    reason: string,
    approvedBy: string
): Promise<void> {
    const { data: schedules, error: loadErr } = await supabase
        .from('employee_schedules')
        .select('*')
        .in('id', [scheduleId1, scheduleId2]);

    if (loadErr) throw loadErr;
    if (!schedules || schedules.length !== 2) throw new Error('Jadwal tidak ditemukan');

    const s1 = schedules.find((s: any) => s.id === scheduleId1) as any;
    const s2 = schedules.find((s: any) => s.id === scheduleId2) as any;
    const now = new Date().toISOString();

    await supabase
        .from('employee_schedules')
        .update({
            shift_name: s2.shift_name,
            shift_start_time: s2.shift_start_time,
            shift_end_time: s2.shift_end_time,
            is_off_day: s2.is_off_day,
            status: 'swapped',
            swapped_with_employee_id: s2.employee_id,
            swapped_at: now,
            swapped_by: approvedBy
        } as any)
        .eq('id', scheduleId1);

    await supabase
        .from('employee_schedules')
        .update({
            shift_name: s1.shift_name,
            shift_start_time: s1.shift_start_time,
            shift_end_time: s1.shift_end_time,
            is_off_day: s1.is_off_day,
            status: 'swapped',
            swapped_with_employee_id: s1.employee_id,
            swapped_at: now,
            swapped_by: approvedBy
        } as any)
        .eq('id', scheduleId2);
}

export async function cancelSchedule(scheduleId: string, createdBy?: string): Promise<void> {
    const { error } = await supabase
        .from('employee_schedules')
        .update({ status: 'cancelled' } as any)
        .eq('id', scheduleId);

    if (error) throw error;
}

export async function cancelMonthSchedules(unitId: string, startDate: string, endDate?: string, createdBy?: string): Promise<number> {
    let sDate = startDate;
    let eDate = endDate;

    if (sDate && sDate.length === 7) {
        const [year, month] = sDate.split('-').map(Number);
        sDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        eDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    if (!eDate && sDate) {
        const [year, month] = sDate.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        eDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    const { data, error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('unit_id', unitId)
        .gte('schedule_date', sDate)
        .lte('schedule_date', eDate)
        .neq('status', 'cancelled')
        .select('id');

    if (error) throw error;
    return (data || []).length;
}

export async function cancelEmployeeMonthSchedules(
    unitId: string,
    employeeId: string,
    startDate: string,
    endDate?: string,
    createdBy?: string
): Promise<number> {
    let sDate = startDate;
    let eDate = endDate;

    if (sDate && sDate.length === 7) {
        const [year, month] = sDate.split('-').map(Number);
        sDate = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        eDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    if (!eDate && sDate) {
        const [year, month] = sDate.split('-').map(Number);
        const lastDay = new Date(year, month, 0).getDate();
        eDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
    }

    const { data, error } = await supabase
        .from('employee_schedules')
        .delete()
        .eq('unit_id', unitId)
        .eq('employee_id', employeeId)
        .gte('schedule_date', sDate)
        .lte('schedule_date', eDate)
        .neq('status', 'cancelled')
        .select('id');

    if (error) throw error;
    return (data || []).length;
}

export async function saveRotationPattern(input: RotationPatternInput): Promise<RotationPattern> {
    if (input.id) {
        const { data, error } = await supabase
            .from('rotation_patterns')
            .update({
                name: input.name,
                cycle_days: input.cycle_days,
                pattern: input.pattern,
                is_active: true,
            } as any)
            .eq('id', input.id)
            .select()
            .single();

        if (error) throw error;
        return data as unknown as RotationPattern;
    }

    const { data, error } = await supabase
        .from('rotation_patterns')
        .insert({
            unit_id: input.unit_id,
            name: input.name,
            cycle_days: input.cycle_days,
            pattern: input.pattern,
            created_by: input.created_by,
            is_active: true,
        } as any)
        .select()
        .single();

    if (error) throw error;
    return data as unknown as RotationPattern;
}

export async function createRotationPattern(input: RotationPatternInput): Promise<RotationPattern> {
    return saveRotationPattern(input);
}

export async function updateRotationPattern(id: string, input: Partial<RotationPatternInput>): Promise<RotationPattern> {
    return saveRotationPattern({ ...input, id } as RotationPatternInput);
}

export async function deleteRotationPattern(id: string): Promise<void> {
    try {
        await supabase
            .from('employee_schedules')
            .update({ generated_from_pattern_id: null } as any)
            .eq('generated_from_pattern_id', id);
    } catch (_) {}

    const { error } = await supabase
        .from('rotation_patterns')
        .delete()
        .eq('id', id);

    if (error) {
        console.warn('[deleteRotationPattern] Hard delete blocked by constraint, soft deleting (is_active = false):', error);
        const { error: softErr } = await supabase
            .from('rotation_patterns')
            .update({ is_active: false } as any)
            .eq('id', id);

        if (softErr) throw softErr;
    }
}

export async function syncUnitShiftTimes(unitId: string, unitShifts?: ShiftDefinition[]): Promise<number> {
    if (!unitId || unitId === 'undefined' || unitId === 'null') return 0;

    let shifts = unitShifts;
    if (!shifts || shifts.length === 0) {
        shifts = await getUnitShifts(unitId);
    }
    if (!shifts || shifts.length === 0) return 0;

    let updatedCount = 0;
    for (const shiftDef of shifts) {
        if (!shiftDef.name) continue;
        const startTime = shiftDef.startTime || (shiftDef as any).start_time || '07:00';
        const endTime = shiftDef.endTime || (shiftDef as any).end_time || '14:00';

        const namesToMatch = [shiftDef.name, shiftDef.name.toLowerCase(), shiftDef.name.toUpperCase()];
        if (shiftDef.code) {
            namesToMatch.push(shiftDef.code);
            namesToMatch.push(shiftDef.code.toLowerCase());
            namesToMatch.push(shiftDef.code.toUpperCase());
        }

        const { data } = await supabase
            .from('employee_schedules')
            .update({
                shift_start_time: startTime,
                shift_end_time: endTime,
                late_tolerance_minutes: shiftDef.lateToleranceMinutes ?? 15,
                break_duration_minutes: shiftDef.breakDurationMinutes ?? 0,
                auto_ot_threshold_minutes: shiftDef.autoOvertimeThresholdMinutes ?? 0,
                updated_at: new Date().toISOString()
            })
            .eq('unit_id', unitId)
            .in('shift_name', namesToMatch)
            .eq('is_off_day', false)
            .select('id');

        if (data) updatedCount += data.length;
    }
    return updatedCount;
}

export async function resyncAllUnitSchedules(): Promise<{ totalUnits: number; totalUpdated: number }> {
    try {
        const { data: units } = await supabase.from('units').select('id, nama, shifts');
        if (!units || units.length === 0) return { totalUnits: 0, totalUpdated: 0 };

        let grandTotal = 0;
        for (const unit of units) {
            const shifts = Array.isArray(unit.shifts) ? (unit.shifts as unknown as ShiftDefinition[]) : [];
            if (shifts.length > 0) {
                const count = await syncUnitShiftTimes(unit.id, shifts);
                grandTotal += count;
            }
        }
        return { totalUnits: units.length, totalUpdated: grandTotal };
    } catch (err) {
        console.error('Error in resyncAllUnitSchedules:', err);
        return { totalUnits: 0, totalUpdated: 0 };
    }
}
