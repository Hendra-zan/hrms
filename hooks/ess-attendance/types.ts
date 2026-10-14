/**
 * hooks/ess-attendance/types.ts
 * Definisi tipe data untuk hook useESSAttendance.
 */

import { Employee, AttendanceRecord, ShiftDefinition } from '../../types.ts';

export interface PendingCheckIn {
  tanggal: string;
  clockIn: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export interface UseESSAttendanceProps {
  user: Employee;
  attendanceRecords: AttendanceRecord[];
  onSaveAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<boolean> | boolean;
  activeShiftDefs: ShiftDefinition[];
}
