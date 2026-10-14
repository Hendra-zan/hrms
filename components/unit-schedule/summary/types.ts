import { Employee, ShiftDefinition } from '../../../types.ts';

export interface ScheduleSummaryPanelProps {
    unitId: string;
    unitShifts: ShiftDefinition[];
    employees: Employee[];
    onNotify: (type: 'success' | 'error', text: string) => void;
}

export type PeriodFilterMode = 'month' | 'w1' | 'w2' | 'w3' | 'w4' | 'w5';

export interface EmployeeShiftStats {
    employeeId: string;
    nik: string;
    nama: string;
    jabatan: string;
    foto?: string;
    pagiCount: number;
    pagiHours: number;
    siangCount: number;
    siangHours: number;
    malamCount: number;
    malamHours: number;
    otherShiftCount: number;
    otherShiftHours: number;
    offCount: number;
    cutiCount: number;
    totalShifts: number;
    totalHours: number;
    targetHours: number;
    hoursDiff: number;
    k3Warnings: string[];
    fairnessStatus: 'balanced' | 'moderate' | 'unbalanced';
    fairnessNote: string;
}

export type SortField = 'nama' | 'malamCount' | 'totalHours' | 'fairnessStatus' | 'k3Warnings';
export type SortOrder = 'asc' | 'desc';
