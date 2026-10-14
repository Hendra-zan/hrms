import { supabase } from '../supabaseClient.ts';
import { EmployeeSchedule, RotationPattern, ShiftDefinition, DEFAULT_SHIFT_DEFINITIONS } from '../../types.ts';
import { ScheduleSummary } from './scheduleTypes.ts';

export async function getUnitShifts(unitId: string): Promise<ShiftDefinition[]> {
    if (!unitId || unitId === 'undefined' || unitId === 'null' || !unitId.trim()) return DEFAULT_SHIFT_DEFINITIONS;
    try {
        const str = unitId.trim();
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

        let { data, error } = uuidRegex.test(str)
            ? await supabase.from('units').select('shifts').eq('id', str).maybeSingle()
            : await supabase.from('units').select('shifts').or(`id.eq.${str},nama.eq.${str},kode.eq.${str}`).maybeSingle();

        if (error || !data || !(data as any).shifts) {
            const { data: nameData } = await supabase.from('units').select('shifts').ilike('nama', `%${str}%`).maybeSingle();
            if (nameData && (nameData as any).shifts) {
                data = nameData;
            }
        }

        if (data && (data as any).shifts && Array.isArray((data as any).shifts) && (data as any).shifts.length > 0) {
            return (data as any).shifts as ShiftDefinition[];
        }
    } catch { /* fallback to default */ }
    return DEFAULT_SHIFT_DEFINITIONS;
}

export async function getSchedulesByUnit(
    unitId: string,
    startDate: string,
    endDate: string
): Promise<EmployeeSchedule[]> {
    if (!unitId || unitId === 'undefined' || unitId === 'null') return [];
    const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('unit_id', unitId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .neq('status', 'cancelled')
        .order('schedule_date', { ascending: true });

    if (error) throw error;
    return (data || []) as unknown as EmployeeSchedule[];
}

export async function getSchedulesByEmployee(
    employeeId: string,
    startDate: string,
    endDate: string
): Promise<EmployeeSchedule[]> {
    const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .neq('status', 'cancelled')
        .order('schedule_date');

    if (error) throw error;
    return (data || []) as unknown as EmployeeSchedule[];
}

export async function getTodaySchedule(employeeId: string): Promise<EmployeeSchedule | null> {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
    const { data, error } = await supabase
        .from('employee_schedules')
        .select('*')
        .eq('employee_id', employeeId)
        .eq('schedule_date', today)
        .neq('status', 'cancelled')
        .maybeSingle();

    if (error) {
        return null;
    }
    return (data as unknown as EmployeeSchedule) || null;
}

export async function getRotationPatterns(unitId: string): Promise<RotationPattern[]> {
    if (!unitId || unitId === 'undefined' || unitId === 'null') return [];
    const { data, error } = await supabase
        .from('rotation_patterns')
        .select('*')
        .eq('unit_id', unitId)
        .neq('is_active', false)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return (data || []) as unknown as RotationPattern[];
}

export async function getScheduleSummary(
    unitId: string,
    startDate: string,
    endDate: string
): Promise<ScheduleSummary> {
    if (!unitId || unitId === 'undefined' || unitId === 'null') {
        return { totalDays: 0, filledDays: 0, draftDays: 0, publishedDays: 0, offDays: 0 };
    }
    const { data, error } = await supabase
        .from('employee_schedules')
        .select('status, is_off_day')
        .eq('unit_id', unitId)
        .gte('schedule_date', startDate)
        .lte('schedule_date', endDate)
        .neq('status', 'cancelled');

    if (error) throw error;

    const list = data || [];
    let draftDays = 0;
    let publishedDays = 0;
    let offDays = 0;

    list.forEach((item: any) => {
        if (item.is_off_day) offDays++;
        if (item.status === 'draft') draftDays++;
        if (item.status === 'published' || item.status === 'swapped' || item.status === 'override') publishedDays++;
    });

    return {
        totalDays: list.length,
        filledDays: list.length - offDays,
        draftDays,
        publishedDays,
        offDays,
    };
}
