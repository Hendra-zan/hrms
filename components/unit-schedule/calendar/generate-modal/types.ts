import React from 'react';
import { Employee, EmployeeSchedule, RotationPattern, ShiftDefinition } from '../../../../types.ts';
import { DayHeader } from '../types.ts';

export interface GenerateScheduleModalProps {
    isOpen: boolean;
    onClose: () => void;
    generating: boolean;
    onGenerate: () => void;
    monthLabel: string;
    viewMonth: string;
    startDate: string;
    endDate: string;
    employees: Employee[];
    schedules: EmployeeSchedule[];
    patterns: RotationPattern[];
    unitShifts: ShiftDefinition[];
    dayHeaders: DayHeader[];

    // State props
    selectedPatternId: string;
    setSelectedPatternId: (id: string) => void;
    selectedEmployeeIds: string[];
    setSelectedEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
    staggerOffset: number;
    setStaggerOffset: (offset: number) => void;
    sundayLockEmpIds: string[];
    setSundayLockEmpIds: React.Dispatch<React.SetStateAction<string[]>>;
    autoAlignDayOfWeek: boolean;
    setAutoAlignDayOfWeek: (val: boolean) => void;
    genPeriodMode: 'MONTH' | '1WEEK' | '2WEEKS' | 'CUSTOM';
    setGenPeriodMode: (mode: 'MONTH' | '1WEEK' | '2WEEKS' | 'CUSTOM') => void;
    genCustomStartDate: string;
    setGenCustomStartDate: (val: string) => void;
    genCustomEndDate: string;
    setGenCustomEndDate: (val: string) => void;
    genTargetMonth: string;
    setGenTargetMonth: (val: string) => void;
    genSearchQuery: string;
    setGenSearchQuery: (val: string) => void;
    genJabatanFilter: string;
    setGenJabatanFilter: (val: string) => void;
    targetGenStartDate: string;
    targetGenEndDate: string;
    genMonthLabel: string;
}
