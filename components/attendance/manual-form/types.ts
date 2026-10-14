import { Employee, AttendanceRecord, AttendanceReasonCode } from '../../../types.ts';

export const ATTENDANCE_REASON_CODE_OPTIONS: Array<{ code: AttendanceReasonCode; label: string }> = [
    { code: 'FORGOT_CHECK_IN', label: 'Lupa Check-in' },
    { code: 'FORGOT_CHECK_OUT', label: 'Lupa Check-out' },
    { code: 'DEVICE_FAILURE', label: 'Gangguan Perangkat' },
    { code: 'NETWORK_FAILURE', label: 'Gangguan Jaringan' },
    { code: 'SHIFT_ADJUSTMENT', label: 'Penyesuaian Shift' },
    { code: 'EMERGENCY_OVERRIDE', label: 'Emergency Override' },
    { code: 'BULK_IMPORT_FIX', label: 'Perbaikan Bulk Import' },
];

export interface ManualAttendanceFormProps {
    employees: Employee[];
    canManageAttendance: boolean;
    onSave: (record: Omit<AttendanceRecord, 'id'>) => Promise<boolean> | boolean;
    loadPendingRequests: () => Promise<void>;
    calculateAttendanceDetails: (employeeId: string, clockIn: string, clockOut: string, recordDate?: string) => { isLate: boolean; overtimeHours: number };
    isGeofenceConfigured: boolean;
    officeLat: number;
    officeLng: number;
    officeRadiusMeters: number;
}
