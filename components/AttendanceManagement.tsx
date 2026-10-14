import React, { useState, useMemo, useRef } from 'react';
import { Employee, AttendanceRecord, AttendanceChangeRequest, AttendanceRevisionHistory, ShiftDefinition, DEFAULT_SHIFT_DEFINITIONS, WEEK_DAYS, getScheduleForDay } from '../types.ts';
import { computeIsLate, computeOvertimeHours } from '../utils/shiftParamsResolver';
import { findShiftDef } from '../utils/mergeShiftDefs';
import RecalculateMetricsPanel from './attendance/RecalculateMetricsPanel';
import ApprovalDrawer from './attendance/ApprovalDrawer';
import LiveHistoryView from './attendance/LiveHistoryView';
import ReportModeOverview from './attendance/ReportModeOverview';

interface AttendanceManagementProps {
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    onSave: (record: Omit<AttendanceRecord, 'id'>) => Promise<boolean> | boolean;
    canManageAttendance?: boolean;
    canApproveAttendanceRequests?: boolean;
    currentUserId?: string;
    onLoadPendingRequests?: () => Promise<AttendanceChangeRequest[]>;
    onLoadRevisionHistory?: () => Promise<AttendanceRevisionHistory[]>;
    onApproveRequest?: (requestId: string, reviewNote?: string) => Promise<boolean> | boolean;
    onRejectRequest?: (requestId: string, reviewNote?: string) => Promise<boolean> | boolean;
    onOpenEmployeeHistory?: (employee: Employee) => void;
    isReportMode?: boolean;
    shiftDefinitions?: ShiftDefinition[];
}

const LIVE_REFRESH_INTERVAL_SECONDS = 30;

const AttendanceManagement: React.FC<AttendanceManagementProps> = ({
    employees,
    attendanceRecords,
    onSave,
    canManageAttendance = true,
    canApproveAttendanceRequests = false,
    currentUserId,
    onLoadPendingRequests,
    onLoadRevisionHistory,
    onApproveRequest,
    onRejectRequest,
    onOpenEmployeeHistory,
    isReportMode = false,
    shiftDefinitions,
}) => {
    const activeShiftDefs = (shiftDefinitions && shiftDefinitions.length > 0) ? shiftDefinitions : DEFAULT_SHIFT_DEFINITIONS;
    const generatedAt = new Date();
    
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
    const [isSearchDropdownOpen, setIsSearchDropdownOpen] = useState(false);
    const [isApprovalDrawerOpen, setIsApprovalDrawerOpen] = useState(false);
    const [pendingRequests, setPendingRequests] = useState<AttendanceChangeRequest[]>([]);
    const [loadingPending, setLoadingPending] = useState(false);
    const [revisionHistory, setRevisionHistory] = useState<AttendanceRevisionHistory[]>([]);
    const [loadingRevision, setLoadingRevision] = useState(false);
    
    // Live history states
    const [liveHistoryMode, setLiveHistoryMode] = useState<'ALL' | 'LATE' | 'OVERTIME'>('ALL');
    const [liveHistoryLimit, setLiveHistoryLimit] = useState(50);
    const [liveHistorySyncedAt, setLiveHistorySyncedAt] = useState(new Date());
    const [isLiveAutoRefresh, setIsLiveAutoRefresh] = useState(true);
    const [nextLiveRefreshIn, setNextLiveRefreshIn] = useState(LIVE_REFRESH_INTERVAL_SECONDS);
    const detailSectionRef = useRef<HTMLElement | null>(null);

    const officeLat = Number(import.meta.env.VITE_ATTENDANCE_CENTER_LAT || '0');
    const officeLng = Number(import.meta.env.VITE_ATTENDANCE_CENTER_LNG || '0');
    const officeRadiusMeters = Number(import.meta.env.VITE_ATTENDANCE_RADIUS_METERS || '300');
    const isGeofenceConfigured = Number.isFinite(officeLat) && Number.isFinite(officeLng) && officeLat !== 0 && officeLng !== 0;

    const employeeMap = useMemo(() => 
        new Map(employees.map(emp => [emp.id, emp])), 
    [employees]);

    const normalizeSearchText = (value?: string | null) => {
        return String(value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    };

    const isSubsequenceMatch = (needle: string, haystack: string) => {
        if (!needle) return true;
        let idx = 0;
        for (const ch of haystack) {
            if (ch === needle[idx]) idx += 1;
            if (idx === needle.length) return true;
        }
        return false;
    };

    const normalizedSearchTerm = useMemo(() => normalizeSearchText(searchTerm), [searchTerm]);

    const matchesEmployeeSearch = (employee?: Employee) => {
        if (!employee) return false;
        if (selectedEmployeeId) {
            return employee.id === selectedEmployeeId;
        }
        if (!normalizedSearchTerm) return true;

        const normalizedFields = [employee.nama, employee.nik, employee.jabatan, employee.departemen]
            .map((field) => normalizeSearchText(String(field ?? '')))
            .filter(Boolean);

        const haystack = normalizedFields.join(' ');
        const compactHaystack = haystack.replace(/\s+/g, '');
        const initials = normalizedFields
            .map((field) => field.split(' ').filter(Boolean).map((word) => word[0]).join(''))
            .join(' ');
        const tokens = normalizedSearchTerm.split(' ').filter(Boolean);

        return tokens.every((token) => {
            if (haystack.includes(token) || initials.includes(token)) return true;
            if (token.length <= 2) return false;
            return isSubsequenceMatch(token, compactHaystack);
        });
    };

    const matchingEmployees = useMemo(() => {
        return [...employees]
            .filter((employee) => matchesEmployeeSearch(employee))
            .slice(0, 8);
    }, [employees, normalizedSearchTerm]);

    const selectedEmployee = useMemo(
        () => (selectedEmployeeId ? employees.find((employee) => employee.id === selectedEmployeeId) || null : null),
        [employees, selectedEmployeeId]
    );

    const attendanceSummaryByEmployee = useMemo(() => {
        const summary = new Map<string, { total: number; late: number; latestDate: string | null }>();
        attendanceRecords.forEach((record) => {
            const current = summary.get(record.employeeId) || { total: 0, late: 0, latestDate: null };
            current.total += 1;
            if (record.isLate) current.late += 1;
            if (!current.latestDate || record.tanggal > current.latestDate) {
                current.latestDate = record.tanggal;
            }
            summary.set(record.employeeId, current);
        });
        return summary;
    }, [attendanceRecords]);

    const calculateAttendanceDetails = (employeeId: string, clockIn: string, clockOut: string, recordDate?: string) => {
        const employee = employeeMap.get(employeeId);
        if (!employee) return { isLate: false, overtimeHours: 0 };

        const shiftDef = findShiftDef(employee.shift, activeShiftDefs);
        let shiftStartStr = '08:00';
        let shiftEndStr = '16:00';
        if (shiftDef) {
            const dateStr = recordDate || new Date().toISOString().split('T')[0];
            const dow = new Date(dateStr).getDay();
            const weekDayKey = WEEK_DAYS[dow === 0 ? 6 : dow - 1];
            const sched = getScheduleForDay(shiftDef, weekDayKey);
            if (sched) {
                shiftStartStr = sched.startTime;
                shiftEndStr   = sched.endTime;
            } else if (shiftDef.startTime && shiftDef.endTime) {
                shiftStartStr = shiftDef.startTime;
                shiftEndStr   = shiftDef.endTime;
            }
        }

        const tolerance = shiftDef?.lateToleranceMinutes ?? 15;
        const breakDuration = shiftDef?.breakDurationMinutes ?? 0;
        const autoOTThreshold = shiftDef?.autoOvertimeThresholdMinutes ?? 0;

        const isLate = clockIn && clockIn.trim() !== ''
            ? computeIsLate(clockIn, shiftStartStr, tolerance).isLate
            : false;

        const overtimeHours = (clockIn && clockIn.trim() !== '' && clockOut && clockOut.trim() !== '')
            ? computeOvertimeHours(clockIn, clockOut, shiftStartStr, shiftEndStr, breakDuration, autoOTThreshold)
            : 0;

        return { isLate, overtimeHours };
    };

    const loadPendingRequests = React.useCallback(async () => {
        if (!onLoadPendingRequests) return;
        setLoadingPending(true);
        try {
            const data = await onLoadPendingRequests();
            setPendingRequests(data || []);
        } finally {
            setLoadingPending(false);
        }
    }, [onLoadPendingRequests]);

    const loadRevisionHistory = React.useCallback(async () => {
        if (!onLoadRevisionHistory) return;
        setLoadingRevision(true);
        try {
            const data = await onLoadRevisionHistory();
            setRevisionHistory(data || []);
        } finally {
            setLoadingRevision(false);
        }
    }, [onLoadRevisionHistory]);

    React.useEffect(() => {
        if (!isApprovalDrawerOpen) return;
        void loadPendingRequests();
    }, [isApprovalDrawerOpen]);

    React.useEffect(() => {
        if (!selectedEmployeeId) {
            setRevisionHistory([]);
            return;
        }
        void loadRevisionHistory();
    }, [selectedEmployeeId]);

    const handleApproveRequest = async (requestId: string) => {
        if (!onApproveRequest) return;
        const note = window.prompt('Catatan approval (opsional):', '') || '';
        const approved = await onApproveRequest(requestId, note);
        if (approved) {
            void loadPendingRequests();
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        if (!onRejectRequest) return;
        const note = window.prompt('Alasan reject (wajib):', '') || '';
        if (!note.trim()) {
            alert('Alasan reject wajib diisi.');
            return;
        }
        const rejected = await onRejectRequest(requestId, note);
        if (rejected) {
            void loadPendingRequests();
        }
    };
    
    const filteredRecords = useMemo(() => {
        return attendanceRecords
            .map(record => ({
                ...record,
                employeeName: employeeMap.get(record.employeeId)?.nama || 'N/A',
                employeeMeta: employeeMap.get(record.employeeId),
            }))
            .filter(record => matchesEmployeeSearch(record.employeeMeta))
            .sort((a, b) => {
                // 1. Primary Sort: Tanggal terbaru di atas
                const dateDiff = new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime();
                if (dateDiff !== 0) return dateDiff;
                
                // 2. Secondary Sort: Jam Masuk/Pulang terbaru di paling atas (HH:MM:SS)
                const timeA = a.clockIn || a.clockOut || '00:00:00';
                const timeB = b.clockIn || b.clockOut || '00:00:00';
                return timeB.localeCompare(timeA);
            });
    }, [attendanceRecords, employeeMap, normalizedSearchTerm]);

    const personalAttendanceRecords = useMemo(() => {
        if (!selectedEmployeeId) return [];
        return filteredRecords.filter((record) => record.employeeId === selectedEmployeeId);
    }, [filteredRecords, selectedEmployeeId]);

    const liveHistorySourceRecords = useMemo(() => {
        return selectedEmployeeId ? personalAttendanceRecords : filteredRecords;
    }, [selectedEmployeeId, personalAttendanceRecords, filteredRecords]);

    const liveHistoryRecords = useMemo(() => {
        return liveHistorySourceRecords
            .filter((record) => {
                if (liveHistoryMode === 'LATE') return record.isLate;
                if (liveHistoryMode === 'OVERTIME') return (record.overtimeHours || 0) > 0;
                return true;
            })
            .slice(0, liveHistoryLimit);
    }, [liveHistoryLimit, liveHistoryMode, liveHistorySourceRecords]);

    React.useEffect(() => {
        setLiveHistorySyncedAt(new Date());
    }, [attendanceRecords]);

    React.useEffect(() => {
        if (!isLiveAutoRefresh) return;
        const timer = window.setInterval(() => {
            setNextLiveRefreshIn((prev) => {
                if (prev <= 1) {
                    setLiveHistorySyncedAt(new Date());
                    return LIVE_REFRESH_INTERVAL_SECONDS;
                }
                return prev - 1;
            });
        }, 1000);
        return () => window.clearInterval(timer);
    }, [isLiveAutoRefresh]);

    const refreshLiveHistory = () => {
        setLiveHistorySyncedAt(new Date());
        setNextLiveRefreshIn(LIVE_REFRESH_INTERVAL_SECONDS);
    };

    return (
        <div className="space-y-6">
            {/* Sticky Modern Header Container */}
            <section className="sticky top-0 z-20 rounded-2xl border border-slate-200/90 bg-white/95 backdrop-blur-md p-5 shadow-lg shadow-slate-200/50 relative overflow-hidden transition-all duration-200">
                {/* Top Gradient Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#06736a] via-[#089c8e] to-emerald-400" />
                
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between pt-1">
                    <div className="max-w-2xl">
                        <div className="flex items-center gap-2.5">
                            <h2 className="text-xl font-black text-slate-900 tracking-tight">
                                {isReportMode ? 'Laporan Kehadiran Karyawan' : 'Kehadiran Karyawan (Live)'}
                            </h2>
                            {!isReportMode && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                    </span>
                                    LIVE MONITORING
                                </span>
                            )}
                        </div>
                        <p className="mt-1 text-xs font-medium text-slate-500">
                            {isReportMode ? 'Ringkasan operasional absensi untuk pemantauan dan audit kehadiran karyawan RSU Meloy.' : 'Pantau aktivitas log absensi realtime seluruh karyawan RSU Meloy — absensi terbaru muncul paling atas.'}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-2 text-sm sm:grid-cols-3 xl:min-w-[480px]">
                        <button
                            type="button"
                            onClick={() => setIsApprovalDrawerOpen(true)}
                            className="group rounded-xl border border-[#06736a]/30 bg-emerald-50/60 hover:bg-emerald-100/80 px-3.5 py-2 text-left transition-all duration-200 shadow-sm"
                        >
                            <p className="text-[10px] font-bold uppercase tracking-wider text-[#06736a]">Approval Queue</p>
                            <p className="font-bold text-[#055f57] text-xs mt-0.5 group-hover:translate-x-0.5 transition-transform">{pendingRequests.length} pending request</p>
                        </button>
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Tanggal Operasional</p>
                            <p className="font-bold text-slate-800 text-xs mt-0.5">{generatedAt.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2">
                            <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Waktu Sistem</p>
                            <p className="font-bold text-[#06736a] text-xs mt-0.5">{generatedAt.toLocaleTimeString('id-ID')}</p>
                        </div>
                    </div>
                </div>
            </section>

            {isReportMode && (
                <ReportModeOverview 
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedEmployeeId={selectedEmployeeId}
                    setSelectedEmployeeId={setSelectedEmployeeId}
                    isSearchDropdownOpen={isSearchDropdownOpen}
                    setIsSearchDropdownOpen={setIsSearchDropdownOpen}
                    matchingEmployees={matchingEmployees}
                    selectedEmployee={selectedEmployee}
                    attendanceSummaryByEmployee={attendanceSummaryByEmployee}
                    onOpenEmployeeHistory={onOpenEmployeeHistory}
                    detailSectionRef={detailSectionRef}
                    normalizedSearchTerm={normalizedSearchTerm}
                    employees={employees}
                />
            )}

            {!isReportMode && (
                <LiveHistoryView 
                    selectedEmployee={selectedEmployee}
                    liveHistoryRecords={liveHistoryRecords}
                    liveHistorySyncedAt={liveHistorySyncedAt}
                    isLiveAutoRefresh={isLiveAutoRefresh}
                    nextLiveRefreshIn={nextLiveRefreshIn}
                    liveHistoryMode={liveHistoryMode}
                    setLiveHistoryMode={setLiveHistoryMode}
                    liveHistoryLimit={liveHistoryLimit}
                    setLiveHistoryLimit={setLiveHistoryLimit}
                    refreshLiveHistory={refreshLiveHistory}
                    setIsLiveAutoRefresh={setIsLiveAutoRefresh}
                    setNextLiveRefreshIn={setNextLiveRefreshIn}
                    employeeMap={employeeMap}
                />
            )}



            {isReportMode && (
                <section className="rounded-2xl border border-dashed border-gray-300 bg-white px-5 py-8 text-center shadow-sm">
                    <p className="text-sm font-semibold text-gray-700">Live History Absensi kini tersedia langsung di halaman Kehadiran.</p>
                    <p className="mt-1 text-xs text-gray-500">Gunakan tab Kehadiran (Live) di menu samping untuk memantau data secara realtime.</p>
                </section>
            )}

            {isApprovalDrawerOpen && (
                <ApprovalDrawer 
                    setIsApprovalDrawerOpen={setIsApprovalDrawerOpen}
                    employees={employees}
                    canManageAttendance={canManageAttendance}
                    onSave={onSave}
                    loadPendingRequests={loadPendingRequests}
                    calculateAttendanceDetails={calculateAttendanceDetails}
                    isGeofenceConfigured={isGeofenceConfigured}
                    officeLat={officeLat}
                    officeLng={officeLng}
                    officeRadiusMeters={officeRadiusMeters}
                    loadingPending={loadingPending}
                    pendingRequests={pendingRequests}
                    currentUserId={currentUserId}
                    canApproveAttendanceRequests={canApproveAttendanceRequests}
                    handleApproveRequest={handleApproveRequest}
                    handleRejectRequest={handleRejectRequest}
                />
            )}

            {isReportMode && canManageAttendance && (
                <RecalculateMetricsPanel activeShiftDefs={activeShiftDefs} />
            )}
        </div>
    );
};

export default AttendanceManagement;
