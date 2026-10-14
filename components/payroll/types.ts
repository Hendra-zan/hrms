import { Employee, AttendanceRecord, Payslip } from '../../types.ts';

export interface EmployeePayrollItem extends Employee {
    totalHours: string;
    totalHoursNum: number;
    totalOvertime: string;
    totalOvertimeNum: number;
    totalLate: number;
    attendanceForPeriod: AttendanceRecord[];
    savedPayslip?: Payslip;
    isSaved: boolean;
}

export interface PayrollStats {
    total: number;
    published: number;
    draft: number;
    incomplete: number;
}

export interface PayrollManagementProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
}
