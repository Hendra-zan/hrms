import { Employee, AttendanceRecord } from '../../types.ts';

export interface AnnouncementItem {
  id: string;
  title: string;
  content: string;
  type: 'kebijakan' | 'pengumuman';
  created_at: string;
  is_pinned?: boolean;
  attachments?: any[];
  requires_acknowledgment?: boolean;
  employees?: { nama: string } | null;
}

export interface TodayAttendance {
  time_in?: string | null;
  time_out?: string | null;
  status?: string | null;
}

export interface DashboardProps {
  employees: Employee[];
  currentUser?: Employee;
  attendanceRecords?: AttendanceRecord[];
  onNavigate?: (view: any, tab?: 'overview' | 'attendance' | 'profile' | 'kinerja', action?: 'payslip' | 'leave' | 'reimbursement') => void;
}
