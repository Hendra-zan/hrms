export type AttendanceTab =
  | 'dashboard'
  | 'attendance'
  | 'schedule'
  | 'history'
  | 'requests'
  | 'profile'
  | 'device'
  | 'face'
  | 'announcements'
  | 'chat'
  | 'payslips';

export type BiometricType = 'face' | 'fingerprint' | 'iris' | 'code' | 'totp' | 'manual';

export interface FaceVerificationResult {
  verified: boolean;
  score: number;
  details?: Record<string, any>;
}

export interface DeviceInfo {
  id?: string; // database UUID
  deviceId: string;
  deviceName: string;
  platform: 'Android' | 'iOS' | 'web' | 'unknown';
  deviceFingerprint: string;
  isPrimary: boolean;
}

export interface MobileUser {
  id: string;
  userId?: string;
  name: string;
  email: string;
  employeeId?: string;
  nik?: string;
  role: 'karyawan' | 'hrd' | 'admin' | 'kepala_ruangan';
  jabatan?: string;
  departemen?: string;
  unitName?: string;
  shift?: string;
  status?: string;
  sisaCuti?: number;
  telepon?: string;
  foto?: string;
  managedUnitId?: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  tanggal: string;
  clockIn: string;
  clockOut?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  isLate: boolean;
  overtimeHours: number;
  status: 'Hadir' | 'Terlambat' | 'Absen' | 'Cuti' | 'Sakit' | 'Pending' | 'Recorded';
  source?: 'mobile' | 'web-ess' | 'web-admin';
  notes?: string;
  deviceId?: string;
  biometricType?: BiometricType;
  biometricVerified?: boolean;
  faceMatchScoreCheckIn?: number;
  faceMatchScoreCheckOut?: number;
  faceVerificationCheckIn?: Record<string, any>;
  faceVerificationCheckOut?: Record<string, any>;
  checkOutLatitude?: number;
  checkOutLongitude?: number;
  checkOutLocation?: string;
  earlyLeaveReason?: string;
  dailyWorkLog?: string;
  shiftHandoverConfirmed?: boolean;
  extra_taps?: string | null;
}

export interface CheckInDraft {
  tanggal: string;
  clockIn: string;
  clockOut?: string;
  location: string;
  latitude?: number;
  longitude?: number;
}

export type ShiftSwapPeerStatus = 'pending' | 'approved' | 'rejected';
export type ShiftSwapUnitStatus = 'pending' | 'approved' | 'rejected';
export type ShiftSwapOverallStatus = 'pending_peer' | 'pending_unit' | 'approved' | 'rejected' | 'cancelled';

export interface ShiftSwapRequest {
  id: string;
  tenant_id?: string;
  requester_employee_id: string;
  requester_schedule_id: string;
  target_employee_id: string;
  target_schedule_id: string;
  reason: string;
  peer_status: ShiftSwapPeerStatus;
  peer_responded_at?: string;
  unit_approval_status: ShiftSwapUnitStatus;
  unit_approved_by?: string;
  unit_approved_at?: string;
  unit_approval_note?: string;
  overall_status: ShiftSwapOverallStatus;
  created_at: string;
  updated_at: string;
  requester_name?: string;
  target_name?: string;
  requester_shift?: string;
  target_shift?: string;
  requester_date?: string;
  target_date?: string;
  requester_employee?: { id: string; nama: string; foto?: string; jabatan?: string; departemen?: string };
  target_employee?: { id: string; nama: string; foto?: string; jabatan?: string; departemen?: string };
  unit_approver_employee?: { id: string; nama: string };
  requester_schedule?: { id: string; schedule_date: string; shift_name: string; shift_start_time?: string; shift_end_time?: string };
  target_schedule?: { id: string; schedule_date: string; shift_name: string; shift_start_time?: string; shift_end_time?: string };
}

export interface Payslip {
  id: string;
  employeeId: string;
  periode: string;
  gajiPokok: number;
  tunjanganProfesi: number;
  upahLembur: number;
  totalPendapatan: number;
  potonganPPh21: number;
  potonganBPJS: number;
  potonganBPJSKesehatan?: number;
  potonganBPJSKetenagakerjaan?: number;
  potonganJHT?: number;
  potonganJP?: number;
  totalPotongan: number;
  gajiBersih: number;
}

