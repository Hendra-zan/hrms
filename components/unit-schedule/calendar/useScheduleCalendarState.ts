import { useState, useEffect, useMemo, useCallback } from 'react';
import { Employee, EmployeeSchedule, RotationPattern, ShiftDefinition } from '../../../types.ts';
import {
    getSchedulesByUnit, getRotationPatterns, getScheduleSummary,
    type ScheduleSummary
} from '../../../services/scheduleService.ts';
import { DayHeader } from './types.ts';
import { INDONESIAN_DAYS, INDONESIAN_MONTHS } from './constants.ts';
import { useScheduleViolations } from './hooks/useScheduleViolations.ts';
import { useScheduleDragDrop } from './hooks/useScheduleDragDrop.ts';
import { useScheduleOverrides } from './hooks/useScheduleOverrides.ts';
import { useScheduleImport } from './hooks/useScheduleImport.ts';
import { useScheduleBatchActions } from './hooks/useScheduleBatchActions.ts';

interface UseScheduleCalendarStateProps {
    unitId: string;
    unitShifts: ShiftDefinition[];
    employees: Employee[];
    userId: string;
    onNotify: (type: 'success' | 'error', text: string) => void;
}

export const useScheduleCalendarState = ({
    unitId,
    unitShifts,
    employees,
    userId,
    onNotify,
}: UseScheduleCalendarStateProps) => {
    const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);
    const [patterns, setPatterns] = useState<RotationPattern[]>([]);
    const [loading, setLoading] = useState(true);
    const [summary, setSummary] = useState<ScheduleSummary | null>(null);

    // Current month view
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Filter & Search states
    const [selectedJabatanFilter, setSelectedJabatanFilter] = useState('ALL');
    const [warningOnlyFilter, setWarningOnlyFilter] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');

    const { startDate, endDate, daysInMonth } = useMemo(() => {
        const [year, month] = viewMonth.split('-').map(Number);
        const start = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        return { startDate: start, endDate: end, daysInMonth: lastDay };
    }, [viewMonth]);

    const dayHeaders = useMemo<DayHeader[]>(() => {
        const headers: DayHeader[] = [];
        const [year, month] = viewMonth.split('-').map(Number);
        for (let d = 1; d <= daysInMonth; d++) {
            const dt = new Date(year, month - 1, d);
            const dayOfWeek = dt.getDay();
            headers.push({
                date: `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
                dayName: INDONESIAN_DAYS[dayOfWeek],
                dayNum: d,
                isWeekend: dayOfWeek === 0 || dayOfWeek === 6,
            });
        }
        return headers;
    }, [viewMonth, daysInMonth]);

    const monthLabel = useMemo(() => {
        const [year, month] = viewMonth.split('-').map(Number);
        return `${INDONESIAN_MONTHS[month - 1]} ${year}`;
    }, [viewMonth]);

    const navigateMonth = useCallback((delta: number) => {
        const [year, month] = viewMonth.split('-').map(Number);
        const d = new Date(year, month - 1 + delta, 1);
        setViewMonth(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    }, [viewMonth]);

    const loadData = useCallback(async () => {
        if (!unitId) return;
        try {
            setLoading(true);
            const [schedData, patternData, summaryData] = await Promise.all([
                getSchedulesByUnit(unitId, startDate, endDate),
                getRotationPatterns(unitId),
                getScheduleSummary(unitId, startDate, endDate),
            ]);
            setSchedules(schedData);
            setPatterns(patternData);
            setSummary(summaryData);
        } catch (err: any) {
            onNotify('error', `Gagal memuat jadwal: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [unitId, startDate, endDate, onNotify]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const scheduleGrid = useMemo(() => {
        const grid: Record<string, Record<string, EmployeeSchedule>> = {};
        employees.forEach(emp => { grid[emp.id] = {}; });
        schedules.forEach(s => {
            if (!grid[s.employee_id]) grid[s.employee_id] = {};
            grid[s.employee_id][s.schedule_date] = s;
        });
        return grid;
    }, [employees, schedules]);

    // Sub-hooks integration
    const { weeklyViolations, fatigueViolations, getOverrideFatigueWarning: rawGetOverrideFatigueWarning } = useScheduleViolations({
        employees,
        schedules,
        viewMonth,
        dayHeaders,
        scheduleGrid,
        unitShifts,
    });

    const batchActions = useScheduleBatchActions({
        unitId,
        userId,
        employees,
        startDate,
        endDate,
        viewMonth,
        setViewMonth,
        monthLabel,
        summary,
        onNotify,
        loadData,
    });

    const dnd = useScheduleDragDrop({
        unitId,
        unitShifts,
        userId,
        scheduleGrid,
        schedules,
        setSchedules,
        onNotify,
        loadData,
        setGenerating: batchActions.setGenerating,
    });

    const overrides = useScheduleOverrides({
        unitId,
        userId,
        onNotify,
        loadData,
    });

    const excelImport = useScheduleImport({
        unitId,
        userId,
        unitShifts,
        employees,
        viewMonth,
        daysInMonth,
        onNotify,
        loadData,
    });

    const availableJabatans = useMemo(() => {
        return ['ALL', ...new Set(employees.map(e => e.jabatan).filter(Boolean) as string[])];
    }, [employees]);

    const filteredEmployees = useMemo(() => {
        return employees.filter(emp => {
            if (selectedJabatanFilter !== 'ALL' && emp.jabatan !== selectedJabatanFilter) return false;
            if (searchQuery.trim() && !emp.nama.toLowerCase().includes(searchQuery.toLowerCase()) && !((emp as any).nik || '').includes(searchQuery)) return false;
            if (warningOnlyFilter) {
                const hasFatigue = fatigueViolations[emp.id] && fatigueViolations[emp.id].length > 0;
                const hasWeekly = weeklyViolations[emp.id] && weeklyViolations[emp.id].length > 0;
                if (!hasFatigue && !hasWeekly) return false;
            }
            return true;
        });
    }, [employees, selectedJabatanFilter, searchQuery, warningOnlyFilter, fatigueViolations, weeklyViolations]);

    const getOverrideFatigueWarning = useCallback(() => {
        return rawGetOverrideFatigueWarning(overrides.overrideCell, overrides.overrideIsOffDay, overrides.overrideShiftName);
    }, [rawGetOverrideFatigueWarning, overrides.overrideCell, overrides.overrideIsOffDay, overrides.overrideShiftName]);

    return {
        // Core state
        schedules,
        patterns,
        loading,
        generating: batchActions.generating,
        publishing: batchActions.publishing,
        summary,
        viewMonth,
        setViewMonth,
        monthLabel,
        daysInMonth,
        dayHeaders,
        scheduleGrid,
        weeklyViolations,
        fatigueViolations,
        availableJabatans,
        filteredEmployees,
        loadData,
        navigateMonth,

        // Filters
        searchQuery,
        setSearchQuery,
        selectedJabatanFilter,
        setSelectedJabatanFilter,
        warningOnlyFilter,
        setWarningOnlyFilter,

        // DnD
        draggedCell: dnd.draggedCell,
        dragOverTarget: dnd.dragOverTarget,
        hasUnsavedDndChanges: dnd.hasUnsavedDndChanges,
        handleDragStart: dnd.handleDragStart,
        handleDragOver: dnd.handleDragOver,
        handleDrop: dnd.handleDrop,
        handleDragEnd: dnd.handleDragEnd,
        handleSaveDndChanges: dnd.handleSaveDndChanges,

        // Override Modal
        showOverrideModal: overrides.showOverrideModal,
        setShowOverrideModal: overrides.setShowOverrideModal,
        overrideCell: overrides.overrideCell,
        overrideShiftName: overrides.overrideShiftName,
        setOverrideShiftName: overrides.setOverrideShiftName,
        overrideIsOffDay: overrides.overrideIsOffDay,
        setOverrideIsOffDay: overrides.setOverrideIsOffDay,
        overrideReason: overrides.overrideReason,
        setOverrideReason: overrides.setOverrideReason,
        submittingOverride: overrides.submittingOverride,
        handleCellClick: overrides.handleCellClick,
        handleSaveOverride: overrides.handleSaveOverride,
        handleDeleteSchedule: overrides.handleDeleteSchedule,
        getOverrideFatigueWarning,

        // Month & Employee Reset
        handleResetMonth: batchActions.handleResetMonth,
        handleResetEmployeeMonth: batchActions.handleResetEmployeeMonth,

        // Generate Modal
        showGenerateModal: batchActions.showGenerateModal,
        setShowGenerateModal: batchActions.setShowGenerateModal,
        selectedPatternId: batchActions.selectedPatternId,
        setSelectedPatternId: batchActions.setSelectedPatternId,
        selectedEmployeeIds: batchActions.selectedEmployeeIds,
        setSelectedEmployeeIds: batchActions.setSelectedEmployeeIds,
        staggerOffset: batchActions.staggerOffset,
        setStaggerOffset: batchActions.setStaggerOffset,
        genSearchQuery: batchActions.genSearchQuery,
        setGenSearchQuery: batchActions.setGenSearchQuery,
        genJabatanFilter: batchActions.genJabatanFilter,
        setGenJabatanFilter: batchActions.setGenJabatanFilter,
        sundayLockEmpIds: batchActions.sundayLockEmpIds,
        setSundayLockEmpIds: batchActions.setSundayLockEmpIds,
        autoAlignDayOfWeek: batchActions.autoAlignDayOfWeek,
        setAutoAlignDayOfWeek: batchActions.setAutoAlignDayOfWeek,
        genPeriodMode: batchActions.genPeriodMode,
        setGenPeriodMode: batchActions.setGenPeriodMode,
        genCustomStartDate: batchActions.genCustomStartDate,
        setGenCustomStartDate: batchActions.setGenCustomStartDate,
        genCustomEndDate: batchActions.genCustomEndDate,
        setGenCustomEndDate: batchActions.setGenCustomEndDate,
        genTargetMonth: batchActions.genTargetMonth,
        setGenTargetMonth: batchActions.setGenTargetMonth,
        targetGenStartDate: batchActions.targetGenStartDate,
        targetGenEndDate: batchActions.targetGenEndDate,
        genMonthLabel: batchActions.genMonthLabel,
        handleGenerate: batchActions.handleGenerate,

        // Publish & Holiday
        handlePublish: batchActions.handlePublish,
        handleUnpublish: batchActions.handleUnpublish,
        handleCopyPreviousMonth: batchActions.handleCopyPreviousMonth,
        handleApplyHolidays: batchActions.handleApplyHolidays,

        // Import Excel
        showImportModal: excelImport.showImportModal,
        setShowImportModal: excelImport.setShowImportModal,
        importing: excelImport.importing,
        importData: excelImport.importData,
        setImportData: excelImport.setImportData,
        handleFileUpload: excelImport.handleFileUpload,
        handleSaveImportedSchedules: excelImport.handleSaveImportedSchedules,
    };
};
