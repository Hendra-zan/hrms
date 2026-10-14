import type { MobileUser, ShiftSwapRequest } from '../../../types';
import type { LeaveRequest } from '../../../services/requestService';

export interface KaruDashboardScreenProps {
  user: MobileUser;
  onGoAttendance?: () => void;
  onGoHistory?: () => void;
}

export interface UnitEmployee {
  id: string;
  nama: string;
  jabatan?: string;
  foto?: string;
  status?: string;
}

export interface TodayAttendanceInfo {
  employeeId: string;
  status: string;
  clockIn?: string;
  clockOut?: string;
}

export interface TodayScheduleInfo {
  employeeId: string;
  shiftName: string;
  isOffDay: boolean;
}

export type PendingRequestWithProfile = LeaveRequest & {
  employeeName: string;
  employeeJabatan?: string;
  employeeFoto?: string;
};
