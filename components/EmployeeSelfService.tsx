/**
 * EmployeeSelfService.tsx - REFACTORED
 * 
 * Employee Self-Service portal - now acts as a thin orchestrator.
 * All business logic extracted into custom hooks and sub-components.
 * 
 * Previous: ~736 lines, mixed concerns (attendance logic, data computation, UI)
 * Current:  ~180 lines, focused on composition and tab routing
 * 
 * Architecture:
 * EmployeeSelfService.tsx → Tab routing & composition
 * ├─ useESSAttendance.ts  → Check-in/out, verification, geofence
 * ├─ useESSData.ts        → Attendance filters, kinerja analytics, payslip
 * ├─ ESSOverviewTab.tsx   → Overview dashboard tab
 * ├─ ESSRiwayatAbsensiTab.tsx → Attendance history tab
 * ├─ ESSKinerjaTab.tsx    → Performance analytics tab
 * ├─ ESSProfileTab.tsx    → Profile management tab
 * └─ ESSRequestModal.tsx  → Leave/reimbursement request modal
 */
import React, { useEffect, useState, Suspense, lazy } from 'react';
import { Employee, LeaveRequest, ReimbursementRequest, AttendanceRecord, RequestType, Payslip, AllRequest, DEFAULT_SHIFT_DEFINITIONS, ShiftDefinition } from '../types.ts';
import { calculatePayslip, buildPayrollConfig } from '../services/payrollService.ts';
import { useAppData, useUIActions } from '../stores/appStore';
import PayslipDetail from './PayslipDetail.tsx';
const FaceEnrollmentModal = lazy(() => import('./FaceEnrollmentModal.tsx'));
const AttendanceVerificationFlow = lazy(() => import('./AttendanceVerificationFlow.tsx'));
import { UareUFingerprintModal } from './UareUFingerprintModal.tsx';

// Hooks
import { useESSAttendance } from '../hooks/useESSAttendance';
import { useESSData } from '../hooks/useESSData';

// Sub-components
import ESSOverviewTab from './employee-self-service/ESSOverviewTab';
import ESSRiwayatAbsensiTab from './employee-self-service/ESSRiwayatAbsensiTab';
import ESSKinerjaTab from './employee-self-service/ESSKinerjaTab';
import ESSProfileTab from './employee-self-service/ESSProfileTab';
import ESSRequestModal from './employee-self-service/ESSRequestModal';
import ESSShiftSwapTab from './employee-self-service/ESSShiftSwapTab';
import ESSCalendarTab from './employee-self-service/ESSCalendarTab';
import NotificationCenter from './NotificationCenter';
import { EmployeeNotesModal } from './employee-notes/EmployeeNotesModal.tsx';

interface EmployeeSelfServiceProps {
    user: Employee;
    attendanceRecords: AttendanceRecord[];
    leaveRequests: LeaveRequest[];
    reimbursementRequests: ReimbursementRequest[];
    onNewRequest: (request: Omit<AllRequest, 'id' | 'status' | 'requestedAt'>) => void;
    onSaveAttendance: (record: Omit<AttendanceRecord, 'id'>) => Promise<boolean> | boolean;
    defaultTab?: 'overview' | 'attendance' | 'profile' | 'kinerja' | 'shiftswap' | 'calendar' | 'chat';
    autoOpenAction?: 'payslip' | 'leave' | 'reimbursement' | null;
    onBackToDashboard?: () => void;
    onEditProfile?: () => void;
}

import { mergeShiftDefs } from '../utils/mergeShiftDefs';
import { getUnitShifts } from '../services/scheduleService';

const EmployeeSelfService: React.FC<EmployeeSelfServiceProps> = ({ user, attendanceRecords, leaveRequests, reimbursementRequests, onNewRequest, onSaveAttendance, defaultTab = 'overview', autoOpenAction, onBackToDashboard, onEditProfile }) => {
    const { systemSettings } = useAppData();
    const { setEssAutoOpenAction } = useUIActions();
    const [unitShifts, setUnitShifts] = useState<ShiftDefinition[]>([]);

    useEffect(() => {
        const unitId = (user as any).unitKerjaId || (user as any).unit_kerja_id || user.managedUnitId;
        if (unitId) {
            getUnitShifts(unitId).then(setUnitShifts).catch(() => {});
        }
    }, [user]);

    const activeShiftDefs = mergeShiftDefs(systemSettings?.default_shifts, unitShifts);

    // Tab state
    const [activeTab, setActiveTab] = useState<'overview' | 'attendance' | 'profile' | 'kinerja' | 'shiftswap' | 'calendar' | 'chat'>(() => defaultTab ?? 'overview');
    useEffect(() => { if (defaultTab) setActiveTab(defaultTab); }, [defaultTab]);

    // Modal state
    const [isPayslipDetailOpen, setIsPayslipDetailOpen] = useState(false);
    const [selectedPayslip, setSelectedPayslip] = useState<Payslip | null>(null);
    const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
    const [requestType, setRequestType] = useState<RequestType>(RequestType.Cuti);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);

    // Hooks — all business logic
    const attendance = useESSAttendance({ user, attendanceRecords, onSaveAttendance, activeShiftDefs });
    const data = useESSData({ user, attendanceRecords, systemSettings });

    // Modal helpers
    const openPayslip = (payslip: Payslip) => { setSelectedPayslip(payslip); setIsPayslipDetailOpen(true); };
    const openRequestModal = (type: RequestType) => { setRequestType(type); setIsRequestModalOpen(true); };

    // Auto-open modal action triggered from Dashboard Aksi Cepat
    useEffect(() => {
        if (!autoOpenAction) return;
        if (autoOpenAction === 'payslip') {
            if (data.payslipHistory.length > 0) {
                openPayslip(data.payslipHistory[0].payslip);
            } else {
                const payrollConfig = buildPayrollConfig(systemSettings);
                const currentMonth = new Date().getMonth();
                const currentYear = new Date().getFullYear();
                const months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
                const period = `${months[currentMonth]} ${currentYear}`;
                const computed = calculatePayslip(user, attendanceRecords, period, payrollConfig);
                openPayslip(computed);
            }
        } else if (autoOpenAction === 'leave') {
            openRequestModal(RequestType.Cuti);
        } else if (autoOpenAction === 'reimbursement') {
            openRequestModal(RequestType.Reimbursement);
        }
        setEssAutoOpenAction(null);
    }, [autoOpenAction, data.payslipHistory, user, attendanceRecords, systemSettings, setEssAutoOpenAction]);

    // Tab config
    const tabs = [
        { key: 'overview' as const, label: '📋 Overview' },
        { key: 'kinerja' as const, label: '📊 Kinerja Saya' },
        { key: 'calendar' as const, label: '📆 Kalender Shift Jaga' },
        { key: 'profile' as const, label: '👤 Profil Saya' },
        { key: 'attendance' as const, label: '📅 Riwayat Absensi' },
        { key: 'shiftswap' as const, label: '🔀 Tukar Shift' },
    ];

    return (
        <div className="space-y-6">
            {/* Breadcrumb & Back Button */}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    {onBackToDashboard && (
                        <button onClick={onBackToDashboard} className="inline-flex items-center gap-2 text-[#06736a] hover:text-[#089c8e] font-medium transition-colors group self-start">
                            <svg className="w-5 h-5 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Kembali ke Dashboard
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
                    <nav className="text-xs sm:text-sm text-gray-500 overflow-x-auto">
                        <ol className="flex items-center gap-2 whitespace-nowrap">
                            <li>Dashboard</li><li>/</li>
                            <li className="text-[#06736a] font-medium">Self Service</li>
                            {activeTab === 'attendance' && (<><li>/</li><li className="text-[#06736a] font-medium">Riwayat Absensi</li></>)}
                        </ol>
                    </nav>
                    {/* Catatan Saya Button */}
                    <button
                        onClick={() => setIsNotesModalOpen(true)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-teal-50 text-[#06736a] border border-[#06736a]/20 hover:bg-teal-100 text-xs font-bold transition-all active:scale-95 shadow-sm"
                        title="Catatan & Instruksi Atasan"
                    >
                        <span>📋</span> Catatan Saya
                    </button>
                </div>
            </div>

            {/* Profile Card */}
            <div className="rounded-2xl bg-gradient-to-r from-teal-50/60 via-cyan-50/40 to-white p-6 shadow-md border border-[#06736a]/15 sm:p-8 transition-all duration-300 hover:shadow-lg">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-6">
                    {user.foto && user.foto.startsWith('http') ? (
                        <img 
                            className="h-20 w-20 rounded-2xl object-cover ring-4 ring-[#06736a]/15 sm:h-24 sm:w-24 sm:rounded-full shadow-md" 
                            src={user.foto} 
                            alt={user.nama} 
                            onError={(e) => {
                                // Fallback jika gambar gagal diload dari URL
                                (e.target as HTMLElement).style.display = 'none';
                                const fallbackEl = (e.target as HTMLElement).nextElementSibling as HTMLElement;
                                if (fallbackEl) fallbackEl.style.display = 'flex';
                             }}
                        />
                    ) : null}
                    {(!user.foto || !user.foto.startsWith('http')) ? (
                        <div className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-[#06736a] text-white font-bold text-xl flex items-center justify-center ring-4 ring-[#06736a]/15 sm:h-24 sm:w-24 sm:rounded-full flex-shrink-0 shadow-md">
                            {(user.nama || 'K').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                    ) : (
                        <div style={{ display: 'none' }} className="h-20 w-20 rounded-2xl bg-gradient-to-br from-teal-500 to-[#06736a] text-white font-bold text-xl flex items-center justify-center ring-4 ring-[#06736a]/15 sm:h-24 sm:w-24 sm:rounded-full flex-shrink-0 shadow-md">
                            {(user.nama || 'K').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#06736a]">Portal Karyawan</p>
                        <h2 className="mt-1.5 text-2xl font-black text-[#055f57] tracking-tight break-words sm:text-3xl">{user.nama}</h2>
                        <p className="mt-1 text-sm font-semibold text-slate-600 sm:text-base">{user.jabatan} &middot; {user.departemen}</p>
                        <p className="mt-1 text-xs font-medium text-slate-400 break-all">{user.email}</p>
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div className="rounded-2xl bg-white shadow-md p-2">
                <div className="border-b border-gray-100 pb-2">
                    <nav className="grid grid-cols-4 gap-2 sm:flex sm:min-w-max sm:gap-2">
                        {tabs.map(tab => (
                            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                                className={`rounded-xl px-4 py-3 text-xs font-bold transition-all active:scale-[0.97] whitespace-nowrap ${
                                    activeTab === tab.key
                                        ? 'bg-gradient-to-r from-[#06736a] to-[#089c8e] text-white shadow-md shadow-teal-100/50'
                                        : 'bg-slate-50 text-slate-500 hover:text-slate-700 hover:bg-slate-100'
                                }`}>
                                {tab.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {activeTab === 'kinerja' && (
                    <ESSKinerjaTab overallKinerja={data.overallKinerja} kinerjaTrendData={data.kinerjaTrendData} monthlyKinerjaSummary={data.monthlyKinerjaSummary} leaveRequests={leaveRequests} sisaCuti={user.sisaCuti} />
                )}

                <div className="p-4 sm:p-6">
                    {activeTab === 'overview' && (
                        <ESSOverviewTab user={user} todaysRecord={attendance.todaysRecord} pendingCheckIn={attendance.pendingCheckIn} todaySchedule={attendance.todaySchedule} activeShiftDefs={activeShiftDefs}
                            isGeofenceConfigured={attendance.isGeofenceConfigured} officeRadiusMeters={attendance.officeRadiusMeters} attendanceActionError={attendance.attendanceActionError}
                            handleCheckInClick={attendance.handleCheckInClick} handleCheckOutClick={attendance.handleCheckOutClick} handleFingerprintClick={attendance.handleFingerprintClick}
                            bridgeDetected={attendance.bridgeDetected} isAttendanceSubmitting={attendance.isAttendanceSubmitting}
                            setActiveTab={setActiveTab} attendanceSummary={data.attendanceSummary} openRequestModal={openRequestModal}
                            leaveRequests={leaveRequests} reimbursementRequests={reimbursementRequests} payslipHistory={data.payslipHistory}
                            openPayslip={openPayslip} formatDate={data.formatDate} formatMoney={data.formatMoney} />
                    )}
                    {activeTab === 'attendance' && (
                        <ESSRiwayatAbsensiTab attendanceMonthFilter={data.attendanceMonthFilter} setAttendanceMonthFilter={data.setAttendanceMonthFilter}
                            attendanceMonths={data.attendanceMonths} attendanceDateFilter={data.attendanceDateFilter} setAttendanceDateFilter={data.setAttendanceDateFilter}
                            attendanceSummary={data.attendanceSummary} todaysRecord={attendance.todaysRecord} pendingCheckIn={attendance.pendingCheckIn}
                            isLanMode={attendance.isLanMode} isGeofenceConfigured={attendance.isGeofenceConfigured} officeRadiusMeters={attendance.officeRadiusMeters}
                            handleCheckOutClick={attendance.handleCheckOutClick} isAttendanceSubmitting={attendance.isAttendanceSubmitting}
                            handleCheckInClick={attendance.handleCheckInClick} attendanceActionError={attendance.attendanceActionError}
                            filteredAttendanceRecords={data.filteredAttendanceRecords} formatDate={data.formatDate} />
                    )}
                    {activeTab === 'calendar' && (
                        <ESSCalendarTab user={user} attendanceRecords={attendanceRecords} />
                    )}
                    {activeTab === 'profile' && (
                        <ESSProfileTab user={user} onEditProfile={onEditProfile} setIsFaceEnrollmentOpen={attendance.setIsFaceEnrollmentOpen} />
                    )}
                    {activeTab === 'shiftswap' && (
                        <ESSShiftSwapTab user={user} />
                    )}
                </div>
            </div>

            {/* Modals */}
            <PayslipDetail isOpen={isPayslipDetailOpen} onClose={() => setIsPayslipDetailOpen(false)} payslip={selectedPayslip} employee={user} />
            <ESSRequestModal isOpen={isRequestModalOpen} requestType={requestType} onClose={() => setIsRequestModalOpen(false)} onSubmit={onNewRequest} employeeId={user.id} />

            <Suspense fallback={null}>
                {attendance.isVerificationFlowOpen && (
                    <AttendanceVerificationFlow isOpen={attendance.isVerificationFlowOpen} onClose={() => attendance.setIsVerificationFlowOpen(false)}
                        onSuccess={attendance.handleVerificationSuccess} employee={{ id: user.id, name: user.nama }} actionType={attendance.verificationActionType}
                        isGeofenceEnabled={attendance.isGeofenceConfigured} officeLocation={{ lat: attendance.officeLat, lng: attendance.officeLng }} officeRadius={attendance.officeRadiusMeters} />
                )}
                {attendance.isFaceEnrollmentOpen && (
                    <FaceEnrollmentModal isOpen={attendance.isFaceEnrollmentOpen} onClose={() => attendance.setIsFaceEnrollmentOpen(false)}
                        employeeId={user.id} employeeName={user.nama}
                        onEnrolled={() => { attendance.setFaceEnrolled(true); attendance.setAttendanceActionError(null); }} />
                )}
            </Suspense>

            {/* U.are.U 4500 USB Fingerprint Modal for Self-Service Desktop */}
            <UareUFingerprintModal
                isOpen={attendance.isFingerprintModalOpen}
                onClose={() => attendance.setIsFingerprintModalOpen(false)}
                onSuccess={attendance.handleFingerprintSuccess}
                employeeName={user.nama}
                actionType={attendance.verificationActionType}
            />

            {/* Employee 2-Way Notes Modal */}
            <EmployeeNotesModal
                isOpen={isNotesModalOpen}
                onClose={() => setIsNotesModalOpen(false)}
                employeeId={user.id}
            />
        </div>
    );
};

export default EmployeeSelfService;