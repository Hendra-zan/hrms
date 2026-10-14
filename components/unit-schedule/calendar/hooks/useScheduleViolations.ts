import { useMemo } from 'react';
import { Employee, EmployeeSchedule, ShiftDefinition } from '../../../../types.ts';
import { DayHeader, WeeklyViolation, FatigueViolation } from '../types.ts';
import { getShiftDurationHours } from '../scheduleExportHelpers.ts';

interface UseScheduleViolationsProps {
    employees: Employee[];
    schedules: EmployeeSchedule[];
    viewMonth: string;
    dayHeaders: DayHeader[];
    scheduleGrid: Record<string, Record<string, EmployeeSchedule>>;
    unitShifts: ShiftDefinition[];
}

export const useScheduleViolations = ({
    employees,
    schedules,
    viewMonth,
    dayHeaders,
    scheduleGrid,
    unitShifts,
}: UseScheduleViolationsProps) => {
    const weeklyViolations = useMemo(() => {
        const violations: Record<string, WeeklyViolation[]> = {};
        const [year, month] = viewMonth.split('-').map(Number);
        const mondays: Date[] = [];
        const firstDayOfMonth = new Date(year, month - 1, 1);
        const day = firstDayOfMonth.getDay();
        const diff = firstDayOfMonth.getDate() - day + (day === 0 ? -6 : 1);
        const firstMonday = new Date(new Date(firstDayOfMonth).setDate(diff));

        let currentMonday = new Date(firstMonday);
        const lastDayOfMonth = new Date(year, month, 0);

        while (currentMonday <= lastDayOfMonth) {
            mondays.push(new Date(currentMonday));
            currentMonday.setDate(currentMonday.getDate() + 7);
        }

        employees.forEach(emp => {
            violations[emp.id] = [];
            mondays.forEach((monday, weekIdx) => {
                let totalHours = 0;
                for (let d = 0; d < 7; d++) {
                    const checkDate = new Date(monday);
                    checkDate.setDate(monday.getDate() + d);
                    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, '0')}-${String(checkDate.getDate()).padStart(2, '0')}`;
                    const sched = scheduleGrid[emp.id]?.[dateStr];
                    if (sched && !sched.is_off_day) {
                        totalHours += getShiftDurationHours(sched.shift_name, unitShifts);
                    }
                }
                if (totalHours > 40) {
                    violations[emp.id].push({ weekNum: weekIdx + 1, totalHours });
                }
            });
        });
        return violations;
    }, [employees, schedules, viewMonth, scheduleGrid, unitShifts]);

    const fatigueViolations = useMemo(() => {
        const violations: Record<string, FatigueViolation[]> = {};

        employees.forEach(emp => {
            violations[emp.id] = [];
            for (let i = 0; i < dayHeaders.length - 1; i++) {
                const curDay = dayHeaders[i];
                const nextDay = dayHeaders[i + 1];

                const s1 = scheduleGrid[emp.id]?.[curDay.date];
                const s2 = scheduleGrid[emp.id]?.[nextDay.date];

                if (!s1 || !s2 || s1.is_off_day || s2.is_off_day) continue;
                if (s1.shift_name.toLowerCase() === 'libur' || s2.shift_name.toLowerCase() === 'libur') continue;
                if (!s1.shift_start_time || !s1.shift_end_time || !s2.shift_start_time) continue;

                try {
                    const [s1StartH, s1StartM] = s1.shift_start_time.split(':').map(Number);
                    const [s1EndH, s1EndM] = s1.shift_end_time.split(':').map(Number);
                    const [s2StartH, s2StartM] = s2.shift_start_time.split(':').map(Number);

                    const endDateTime = new Date(curDay.date);
                    if (s1EndH < s1StartH || (s1EndH === s1StartH && s1EndM < s1StartM)) {
                        endDateTime.setDate(endDateTime.getDate() + 1);
                    }
                    endDateTime.setHours(s1EndH, s1EndM, 0, 0);

                    const startDateTime = new Date(nextDay.date);
                    startDateTime.setHours(s2StartH, s2StartM, 0, 0);

                    const restMs = startDateTime.getTime() - endDateTime.getTime();
                    const restHours = restMs / (1000 * 60 * 60);

                    if (restHours < 11 && restHours >= 0) {
                        violations[emp.id].push({
                            date: curDay.date,
                            nextDate: nextDay.date,
                            restHours: restHours,
                        });
                    }
                } catch {
                    // ignore
                }
            }
        });

        return violations;
    }, [employees, scheduleGrid, dayHeaders]);

    const getOverrideFatigueWarning = (
        overrideCell: { employeeId: string; date: string } | null,
        overrideIsOffDay: boolean,
        overrideShiftName: string
    ) => {
        if (!overrideCell || overrideIsOffDay || !overrideShiftName) return null;
        const proposedShift = unitShifts.find(s => s.name === overrideShiftName);
        if (!proposedShift || !proposedShift.startTime || !proposedShift.endTime) return null;
        const curDateStr = overrideCell.date;

        const prevDateStr = (() => {
            const d = new Date(curDateStr);
            d.setDate(d.getDate() - 1);
            return d.toLocaleDateString('en-CA');
        })();
        const sPrev = scheduleGrid[overrideCell.employeeId]?.[prevDateStr];
        if (sPrev && !sPrev.is_off_day && sPrev.shift_name.toLowerCase() !== 'libur' && sPrev.shift_start_time && sPrev.shift_end_time) {
            try {
                const [s1StartH, s1StartM] = sPrev.shift_start_time.split(':').map(Number);
                const [s1EndH, s1EndM] = sPrev.shift_end_time.split(':').map(Number);
                const [s2StartH, s2StartM] = proposedShift.startTime.split(':').map(Number);

                const endDateTime = new Date(prevDateStr);
                if (s1EndH < s1StartH || (s1EndH === s1StartH && s1EndM < s1StartM)) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }
                endDateTime.setHours(s1EndH, s1EndM, 0, 0);

                const startDateTime = new Date(curDateStr);
                startDateTime.setHours(s2StartH, s2StartM, 0, 0);

                const restHours = (startDateTime.getTime() - endDateTime.getTime()) / (1000 * 60 * 60);
                if (restHours < 11 && restHours >= 0) {
                    return `⚠️ Peringatan Fatigue: Istirahat hanya ${restHours.toFixed(1)} jam setelah shift kemarin (${sPrev.shift_name} ${sPrev.shift_start_time}-${sPrev.shift_end_time}).`;
                }
            } catch {}
        }

        const nextDateStr = (() => {
            const d = new Date(curDateStr);
            d.setDate(d.getDate() + 1);
            return d.toLocaleDateString('en-CA');
        })();
        const sNext = scheduleGrid[overrideCell.employeeId]?.[nextDateStr];
        if (sNext && !sNext.is_off_day && sNext.shift_name.toLowerCase() !== 'libur' && sNext.shift_start_time && sNext.shift_end_time) {
            try {
                const [s1StartH, s1StartM] = proposedShift.startTime.split(':').map(Number);
                const [s1EndH, s1EndM] = proposedShift.endTime.split(':').map(Number);
                const [s2StartH, s2StartM] = sNext.shift_start_time.split(':').map(Number);

                const endDateTime = new Date(curDateStr);
                if (s1EndH < s1StartH || (s1EndH === s1StartH && s1EndM < s1StartM)) {
                    endDateTime.setDate(endDateTime.getDate() + 1);
                }
                endDateTime.setHours(s1EndH, s1EndM, 0, 0);

                const startDateTime = new Date(nextDateStr);
                startDateTime.setHours(s2StartH, s2StartM, 0, 0);

                const restHours = (startDateTime.getTime() - endDateTime.getTime()) / (1000 * 60 * 60);
                if (restHours < 11 && restHours >= 0) {
                    return `⚠️ Peringatan Fatigue: Istirahat hanya ${restHours.toFixed(1)} jam sebelum shift besok (${sNext.shift_name} ${sNext.shift_start_time}-${sNext.shift_end_time}).`;
                }
            } catch {}
        }

        return null;
    };

    return {
        weeklyViolations,
        fatigueViolations,
        getOverrideFatigueWarning,
    };
};
