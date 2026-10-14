export enum Status {
    Aktif = 'Aktif',
    Cuti = 'Cuti',
    NonAktif = 'Non-Aktif',
}

export type ShiftColor = 'yellow' | 'blue' | 'indigo' | 'green' | 'red' | 'purple' | 'orange' | 'pink' | 'teal' | 'gray';

export interface DaySchedule {
    startTime: string;  // "HH:MM"
    endTime: string;    // "HH:MM"
}

export type WeekDay = 'senin' | 'selasa' | 'rabu' | 'kamis' | 'jumat' | 'sabtu' | 'minggu';
export const WEEK_DAYS: WeekDay[] = ['senin','selasa','rabu','kamis','jumat','sabtu','minggu'];
export const WEEK_DAY_LABELS: Record<WeekDay, string> = {
    senin: 'Senin', selasa: 'Selasa', rabu: 'Rabu', kamis: 'Kamis',
    jumat: 'Jumat', sabtu: 'Sabtu', minggu: 'Minggu',
};

export interface ShiftDefinition {
    id: string;
    name: string;                    // "Office Hour", "Dinas Pagi", dll.
    code?: string;                   // Kode singkat (contoh: "PA", "SI", "MA", "PA-G1")
    type: 'fixed' | 'rotating';     // fixed = jam tetap per hari; rotating = slot bergilir

    color: ShiftColor;
    lateToleranceMinutes: number;    // toleransi keterlambatan (menit)

    // Untuk type 'rotating': jam tunggal yang berlaku setiap hari karyawan di-assign
    startTime?: string;              // "HH:MM"
    endTime?: string;                // "HH:MM"

    // Untuk type 'fixed': jadwal berbeda per hari (null = libur)
    weeklySchedule?: Partial<Record<WeekDay, DaySchedule | null>>;

    // Opsional: batasi shift ini hanya tampil untuk jabatan tertentu
    // Kosong/undefined = berlaku untuk semua jabatan
    positionGroup?: string;

    // Advanced Shift Configurations
    breakDurationMinutes?: number;
    autoOvertimeThresholdMinutes?: number;
}

export const DEFAULT_SHIFT_DEFINITIONS: ShiftDefinition[] = [
    {
        id: 'pagi', name: 'Pagi', code: 'PA', type: 'rotating',
        startTime: '08:00', endTime: '16:00',
        color: 'yellow', lateToleranceMinutes: 15,
    },
    {
        id: 'siang', name: 'Siang', code: 'SI', type: 'rotating',
        startTime: '14:00', endTime: '22:00',
        color: 'blue', lateToleranceMinutes: 15,
    },
    {
        id: 'malam', name: 'Malam', code: 'MA', type: 'rotating',
        startTime: '21:00', endTime: '05:00',
        color: 'indigo', lateToleranceMinutes: 15,
    },
];


export type Shift = string;

/**
 * Helper: dapatkan jam masuk/keluar untuk hari tertentu berdasarkan shift definition.
 * Return null jika hari tersebut libur.
 */
export function getScheduleForDay(shift: ShiftDefinition, day: WeekDay): DaySchedule | null {
    if (shift.type === 'rotating') {
        // Check weekend override: weeklySchedule.sabtu / .minggu
        // undefined = same as weekday, null = libur, object = custom hours
        if ((day === 'sabtu' || day === 'minggu') && shift.weeklySchedule) {
            const override = shift.weeklySchedule[day];
            if (override === null) return null; // Libur
            if (override !== undefined) return override; // Custom hours
            // undefined = falls through to default rotating hours
        }
        return { startTime: shift.startTime || '08:00', endTime: shift.endTime || '16:00' };
    }
    // type === 'fixed'
    if (!shift.weeklySchedule) return null;
    const daySchedule = shift.weeklySchedule[day];
    return daySchedule ?? null;
}

/**
 * Helper: dapatkan jam masuk (number) untuk hari tertentu.
 * Berguna untuk kalkulasi keterlambatan.
 */
export function getShiftStartHour(shift: ShiftDefinition, day: WeekDay): number | null {
    const sched = getScheduleForDay(shift, day);
    if (!sched) return null; // libur
    return parseInt(sched.startTime.split(':')[0], 10);
}

export type DocumentType = 'Ijazah' | 'STR/SIP' | 'Sertifikat' | 'Lainnya';

export interface Document {
    id: string;
    employeeId: string;
    name: string;
    type: DocumentType;
    fileUrl: string;
    uploadedAt: string; // ISO string
}

export interface Compensation {
    gajiPokok: number;
    tunjanganProfesi: number;
}

export interface WorkUnit {
    id: string;
    nama: string;
    kode?: string;
    shifts?: ShiftDefinition[];  // Konfigurasi shift khusus per unit; undefined = pakai DEFAULT_SHIFT_DEFINITIONS
}

export interface Department {
    id: string;
    nama: string;
    kode?: string;
}

export interface Position {
    id: string;
    nama: string;
    kode?: string;
}

export type View =
    | 'dashboard'
    | 'personal-dashboard'
    | 'employees'
    | 'organization'
    | 'system'
    | 'attendance'
    | 'attendance-report'
    | 'payroll'
    | 'requests'
    | 'ess'
    | 'unit-schedule'
    | 'audit-log'
    | 'employee-attendance-detail'
    | 'guide'
    | 'announcements'
    | 'policies'
    | 'notes';

export interface SystemSettings {
    id: string;
    institution_name: string;
    institution_type: 'Rumah Sakit' | 'Klinik' | 'Puskesmas';
    logo_url?: string;
    address?: string;
    phone?: string;
    default_shifts?: ShiftDefinition[];
    // UI theme preference for web admin ('light' | 'dark' | 'system' | 'indigo' | 'emerald' | 'turquoise')
    ui_theme?: 'light' | 'dark' | 'system' | 'indigo' | 'emerald' | 'turquoise';
    // Payroll configuration
    overtime_rate_per_hour?: number;        // Default: 30000
    bpjs_kesehatan_rate?: number;           // Default: 0.01 (1%)
    bpjs_kesehatan_max_wage?: number;       // Default: 12000000
    updated_at: string;
}

export type Role = 'admin' | 'hrd' | 'kepala_ruangan' | 'karyawan';
export type MaritalStatus = 'Single' | 'Married' | 'Divorced' | 'Widowed';
export type Religion = 'Islam' | 'Kristen Protestan' | 'Kristen Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';
export type EducationLevel = 'SD' | 'SMP' | 'SMA' | 'D3' | 'D4' | 'S1' | 'S2' | 'S3';

// Address Information
export interface Address {
    ktp: string;
    domisili: string;
    province: string;
    city: string;
    postalCode: string;
}

// Emergency Contact
export interface EmergencyContact {
    name: string;
    relationship: string;
    phone: string;
    address: string;
}

// Education History
export interface Education {
    id: string;
    level: EducationLevel;
    institution: string;
    major: string;
    graduationYear: number;
    gpa?: number;
}

// Work History
export interface WorkHistory {
    id: string;
    company: string;
    position: string;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
    reasonLeaving: string;
}

// Bank Account
export interface BankAccount {
    bankName: string;
    accountNumber: string;
    accountHolder: string;
}

export interface Employee {
    id: string;
    user_id: string; // Foreign key to supabase.auth.users.id
    nik?: string; // Nomor Induk Karyawan (untuk ID card)
    nama: string;
    foto: string;
    jabatan: string;
    departemen: string;
    email: string;
    telepon: string;
    hireDate: string; // "YYYY-MM-DD"
    birthDate: string; // "YYYY-MM-DD"
    status: Status;
    shift: Shift;
    sisaCuti: number;
    role: Role;
    spesialisasi?: string;
    kredensial?: string;
    nomorSTR?: string;
    tanggalKadaluarsaSTR?: string; // "YYYY-MM-DD"
    unitKerjaId?: string;
    sertifikasi: string[];
    kompetensi: string[];
    documents: Document[];
    compensation?: Compensation;
    
    // NEW FIELDS - Personal & Contact Info
    ktpNumber?: string;
    npwp?: string;
    bpjsKesehatan?: string;
    bpjsKetenagakerjaan?: string;
    agama?: Religion;
    maritalStatus?: MaritalStatus;
    dependents?: number; // Jumlah tanggungan
    address?: Address;
    emergencyContacts?: EmergencyContact[];
    
    // NEW FIELDS - Professional Info
    education?: Education[];
    workHistory?: WorkHistory[];
    bankAccount?: BankAccount;
    
    // VALIDATION & LOCKING FIELDS
    isProfileCompleted?: boolean;
    isVerified?: boolean;
    verifiedBy?: string; // ID of HRD who verified
    verifiedAt?: string; // ISO timestamp
    isLocked?: boolean; // If true, employee cannot edit
    
    // ROLE-SPECIFIC FIELDS
    managedUnitId?: string; // Unit kerja yang dikelola (untuk kepala_ruangan)

    // ATTENDANCE MACHINE INTEGRATION
    pin_mesin?: string | null; // PIN/ID karyawan di mesin absensi fisik (Hikvision, ZKTeco, dll)
    last_seen?: string | null;
    face_enrolled_at?: string | null;
    face_embedding?: string | null;
    face_descriptor?: number[] | null;
    fotoUrl?: string | null;
}

export interface AuthenticatedUser {
    id: string;
    email?: string;
    profile: Employee;
}

export type SortKey = 'jabatan' | 'departemen' | 'status' | 'hireDate' | 'nama';
export type SortDirection = 'asc' | 'desc';

export interface AttendanceRecord {
    id: string;
    employeeId: string;
    tanggal: string; // "YYYY-MM-DD"
    clockIn: string; // "HH:mm"
    clockOut: string; // "HH:mm"
    location: string;
    latitude?: number;
    longitude?: number;
    isLate: boolean;
    overtimeHours: number;
    status?: 'Hadir' | 'Terlambat' | 'Absen' | 'Cuti' | 'Sakit' | 'Pending' | 'Recorded';
    source?: 'web-admin' | 'web-ess' | 'mobile' | 'hikvision';
    notes?: string;
    photoUrl?: string;
    // Biometric / face-verification fields
    deviceId?: string;
    biometricType?: 'face' | 'fingerprint' | 'iris' | 'code' | 'totp' | 'manual';
    biometricVerified?: boolean;
    faceMatchScoreCheckIn?: number;
    faceMatchScoreCheckOut?: number;
    checkOutLatitude?: number;
    checkOutLongitude?: number;
    checkOutLocation?: string;
    earlyLeaveReason?: string;
    dailyWorkLog?: string;
    shiftHandoverConfirmed?: boolean;
    extra_taps?: string | null;
}

export type AttendanceReasonCode =
    | 'FORGOT_CHECK_IN'
    | 'FORGOT_CHECK_OUT'
    | 'DEVICE_FAILURE'
    | 'NETWORK_FAILURE'
    | 'SHIFT_ADJUSTMENT'
    | 'EMERGENCY_OVERRIDE'
    | 'BULK_IMPORT_FIX';

export interface AttendanceChangeRequest {
    id: string;
    employee_id: string;
    attendance_date: string;
    request_type: 'single' | 'bulk_import';
    reason_code: AttendanceReasonCode;
    reason_detail?: string | null;
    proposed_data: Record<string, any>;
    current_data?: Record<string, any> | null;
    source_portal: 'personal' | 'operational';
    maker_user_id: string;
    maker_employee_id?: string | null;
    maker_device_fingerprint?: string | null;
    maker_ip_address?: string | null;
    maker_user_agent?: string | null;
    location_lat?: number | null;
    location_lng?: number | null;
    location_text?: string | null;
    location_distance_meters?: number | null;
    location_verified: boolean;
    status: 'pending' | 'approved' | 'rejected' | 'cancelled';
    checker_user_id?: string | null;
    review_note?: string | null;
    reviewed_at?: string | null;
    created_at: string;
    updated_at: string;
}

export interface AttendanceRevisionHistory {
    id: number;
    attendance_id?: string | null;
    request_id?: string | null;
    employee_id: string;
    attendance_date: string;
    action: 'APPROVE' | 'REJECT' | 'SYSTEM';
    before_data?: Record<string, any> | null;
    after_data?: Record<string, any> | null;
    reason_code?: string | null;
    reason_detail?: string | null;
    changed_by?: string | null;
    created_at: string;
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

export enum RequestStatus {
    Pending = 'Pending',
    Approved = 'Approved',
    Rejected = 'Rejected',
}

export enum RequestType {
    Cuti = 'Cuti',
    Izin = 'Izin',
    Overtime = 'Overtime',
    Reimburse = 'Reimburse',
    Reimbursement = 'Reimbursement',
}

export interface LeaveRequest {
    id: string;
    employeeId: string;
    type: RequestType.Cuti | RequestType.Izin;
    startDate: string; // "YYYY-MM-DD"
    endDate: string; // "YYYY-MM-DD"
    reason: string;
    status: RequestStatus;
    requestedAt: string; // ISO string
}

export interface OvertimeRequest {
    id: string;
    employeeId: string;
    type: RequestType.Overtime;
    startDate: string; // "YYYY-MM-DD"
    endDate?: string;
    reason: string;
    status: RequestStatus;
    requestedAt: string;
    overtimeMetadata?: any;
}

export interface ReimbursementRequest {
    id: string;
    employeeId: string;
    type: RequestType.Reimbursement | RequestType.Reimburse;
    date?: string; // "YYYY-MM-DD"
    startDate?: string;
    endDate?: string;
    description?: string;
    reason?: string;
    amount?: number;
    status: RequestStatus;
    requestedAt: string; // ISO string
}

export type AllRequest = LeaveRequest | OvertimeRequest | ReimbursementRequest;

// ============================================================
// Shift Scheduling Architecture (Full)
// ============================================================

export interface RotationPattern {
    id: string;
    unit_id: string;
    name: string;                   // "Rotasi 3 Shift 8 Hari"
    description?: string;
    pattern: string[];              // ["Pagi","Pagi","Siang","Siang","Malam","Malam","Libur","Libur"]
    cycle_days: number;             // Panjang siklus
    is_active: boolean;
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export type ScheduleStatus = 'draft' | 'published' | 'swapped' | 'override' | 'cancelled';

export interface EmployeeSchedule {
    id: string;
    employee_id: string;
    unit_id: string;
    schedule_date: string;          // "YYYY-MM-DD"
    shift_name: string;             // Nama shift (reference ke ShiftDefinition.name)
    shift_start_time?: string;      // "HH:MM" cached
    shift_end_time?: string;        // "HH:MM" cached
    is_off_day: boolean;
    status: ScheduleStatus;

    // Swap
    swapped_with_employee_id?: string;
    swapped_with_schedule_id?: string;
    swap_reason?: string;
    swap_approved_by?: string;
    swap_approved_at?: string;

    // Generation
    generated_from_pattern_id?: string;
    rotation_day_index?: number;

    // Override
    override_reason?: string;
    override_by?: string;

    // Metadata
    created_by?: string;
    created_at: string;
    updated_at: string;
}

export interface SchedulePublishLog {
    id: string;
    unit_id: string;
    period_start: string;
    period_end: string;
    total_schedules: number;
    total_employees: number;
    published_by: string;
    published_at: string;
    notes?: string;
}

export interface WeeklyHoursValidation {
    total_scheduled_days: number;
    total_work_days: number;
    total_off_days: number;
    estimated_hours: number;
    exceeds_limit: boolean;
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

    // Tier 1: Peer
    peer_status: ShiftSwapPeerStatus;
    peer_responded_at?: string;

    // Tier 2: Unit Head
    unit_approval_status: ShiftSwapUnitStatus;
    unit_approved_by?: string;
    unit_approved_at?: string;
    unit_approval_note?: string;

    overall_status: ShiftSwapOverallStatus;
    created_at: string;
    updated_at: string;

    // Joined fields (optional UI enrichment)
    requester_employee?: Employee;
    target_employee?: Employee;
    unit_approver_employee?: Employee;
    requester_schedule?: EmployeeSchedule;
    target_schedule?: EmployeeSchedule;
}

// 2-Way Employee Notes & Task Instructions
export type NoteCategory =
  | 'task'
  | 'performance'
  | 'shift_reminder'
  | 'general'
  | 'facility_issue'
  | 'incident_report'
  | 'schedule_coordination'
  | 'feedback'
  | 'shift_handover';

export type NotePriority = 'normal' | 'high' | 'urgent';
export type NoteStatus = 'unread' | 'read' | 'in_progress' | 'confirmed' | 'rejected' | 'escalated' | 'completed' | 'resolved';
export type NoteDirection = 'top_down' | 'bottom_up';

export interface NoteReply {
    id: string;
    noteId: string;
    senderId: string;
    senderNama?: string;
    senderRole?: string;
    message: string;
    attachmentUrl?: string;
    createdAt: string;
}

export interface EmployeeNote {
    id: string;
    employeeId: string;
    senderId: string;
    senderNama?: string;
    senderRole?: string;
    category: NoteCategory;
    priority: NotePriority;
    title: string;
    content: string;
    replyContent?: string;
    status: NoteStatus;
    direction?: NoteDirection;
    dueDate?: string;
    workUnitId?: string;
    attachmentUrl?: string;
    replies?: NoteReply[];
    todos?: { id: string; text: string; done: boolean }[];
    tags?: string[];
    confirmedAt?: string;
    createdAt: string;
    employeeNama?: string;
}

export type WorkLogCategory =
  | 'pelayanan_pasien'
  | 'tindakan_medis'
  | 'administrasi'
  | 'rapat_koordinasi'
  | 'pemeliharaan_alat'
  | 'edukasi_pasien'
  | 'lainnya';

export type WorkLogStatus = 'draft' | 'submitted' | 'approved' | 'rejected';
export type WorkLogShift = 'pagi' | 'siang' | 'malam' | 'non_shift';

export interface WorkLogEntry {
  id: string;
  employeeId: string;
  employeeNama?: string;
  unitKerjaId?: string;
  logDate: string; // YYYY-MM-DD
  shift: WorkLogShift;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  durationMinutes: number;
  title: string;
  activityDescription: string;
  category: WorkLogCategory;
  patientCount?: number;
  location?: string;
  status: WorkLogStatus;
  verifiedBy?: string; // Nama/ID Karu
  verifiedAt?: string;
  verifierNotes?: string;
  createdAt: string;
  updatedAt: string;
}