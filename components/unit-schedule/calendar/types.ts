import { Employee, EmployeeSchedule, RotationPattern, ShiftDefinition, ShiftColor } from '../../../types.ts';
import { ScheduleSummary } from '../../../services/scheduleService.ts';

export interface DayHeader {
    date: string;
    dayName: string;
    dayNum: number;
    isWeekend: boolean;
}

export interface WeeklyViolation {
    weekNum: number;
    totalHours: number;
}

export interface FatigueViolation {
    date: string;
    nextDate: string;
    restHours: number;
}

export interface DraggedCellState {
    employeeId: string;
    employeeNama: string;
    date: string;
    shiftName: string;
    isOffDay: boolean;
}

export interface DragOverTargetState {
    employeeId: string;
    date: string;
}

export interface OverrideCellState {
    scheduleId: string;
    employeeId: string;
    employeeNama: string;
    date: string;
    currentShiftName: string;
    isOffDay: boolean;
}

export interface ImportDataState {
    matchedEmpCount: number;
    parsedSchedules: {
        employeeId: string;
        employeeNama: string;
        date: string;
        shiftName: string;
        isOff: boolean;
    }[];
    errors: string[];
}

export interface ScheduleCalendarPanelProps {
    unitId: string;
    unitShifts: ShiftDefinition[];
    employees: Employee[];
    userId: string;
    onNotify: (type: 'success' | 'error', text: string) => void;
}
