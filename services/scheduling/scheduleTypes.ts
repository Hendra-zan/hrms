import { ShiftDefinition, EmployeeSchedule, RotationPattern } from '../../types.ts';

export interface GenerateScheduleParams {
    employeeId: string;
    unitId: string;
    patternId: string;
    startDate: string;
    endDate: string;
    rotationOffset: number;
    createdBy: string;
    lockSundayOff?: boolean;
}

export interface OverrideScheduleParams {
    scheduleId?: string;
    employeeId: string;
    unitId: string;
    date: string;
    shiftName: string;
    isOffDay?: boolean;
    reason: string;
    createdBy: string;
}

export interface RotationPatternInput {
    id?: string;
    unit_id: string;
    name: string;
    description?: string | null;
    cycle_days: number;
    pattern: string[];
    is_active?: boolean;
    created_by?: string;
}

export interface ScheduleSummary {
    totalDays: number;
    filledDays: number;
    draftDays: number;
    publishedDays: number;
    offDays: number;
}
