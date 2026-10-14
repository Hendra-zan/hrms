/**
 * HRDashboard.tsx - REFACTORED
 * 
 * HR Manager Dashboard - now a thin composition layer.
 * 
 * Previous: ~478 lines, all data logic + chart + tables inline
 * Current:  ~120 lines, focused on layout composition
 * 
 * Architecture:
 * HRDashboard.tsx → Layout & composition
 * ├─ useHRDashboard.ts            → All data computation
 * ├─ AttendanceChart.tsx           → Recharts trend chart
 * └─ DashboardTables.tsx           → Late employees + recent requests
 */
import React from 'react';
import { AttendanceRecord, Employee, AllRequest } from '../types.ts';
import { useHRDashboard } from '../hooks/useHRDashboard';
import AttendanceChart from './hr-dashboard/AttendanceChart';
import { LateEmployeesTable, RecentRequestsList } from './hr-dashboard/DashboardTables';
import { StaffReportInboxWidget } from './kepala-ruangan/StaffReportInboxWidget.tsx';

interface HRDashboardProps {
    currentUser: Employee;
    employees: Employee[];
    attendanceRecords: AttendanceRecord[];
    allRequests: AllRequest[];
    onNavigate?: (view: 'employees' | 'attendance' | 'requests' | 'payroll') => void;
}

const InfoCard: React.FC<{ title: string; value: string | number; subtitle?: string; gradient: string }> = ({ title, value, subtitle, gradient }) => (
    <div className={`relative overflow-hidden rounded-2xl p-6 text-white shadow-md ${gradient} transition-all duration-300 hover:-translate-y-1 hover:shadow-lg`}>
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-20 w-20 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-6 h-14 w-14 rounded-full bg-white/10" />
        
        <div className="relative z-10">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white/85">{title}</h3>
            <p className="text-3xl font-black mt-2 tracking-tight">{value}</p>
            {subtitle && <p className="text-xs text-white/75 mt-1.5 font-medium">{subtitle}</p>}
        </div>
    </div>
);

const ActionCard: React.FC<{ title: string; description: string; onClick?: () => void }> = ({ title, description, onClick }) => (
    <button type="button" onClick={onClick} className="group relative overflow-hidden bg-white p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 text-left w-full border border-slate-100/50">
        <div className="absolute inset-0 bg-[#06736a]/5 opacity-0 group-hover:opacity-100 transition-opacity" />
        <h3 className="text-lg font-bold text-[#06736a] mb-1.5 group-hover:translate-x-1 transition-transform">{title}</h3>
        <p className="text-xs text-gray-500 leading-relaxed">{description}</p>
    </button>
);

const HRDashboard: React.FC<HRDashboardProps> = ({ currentUser, employees, attendanceRecords, allRequests, onNavigate }) => {
    const { selectedRange, setSelectedRange, isManualRefreshing, handleManualRefresh, getLastRefreshedLabel, metrics, trendData, recentRequests, frequentLateEmployees } = useHRDashboard({ employees, attendanceRecords, allRequests });

    return (
        <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-[#06736a] to-[#089c8e] p-6 sm:p-8 rounded-2xl shadow-lg text-white">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight mb-2">Dashboard HR Manager</h1>
                        <p className="text-white/95 font-medium">Monitoring kehadiran harian dan analitik SDM berbasis data aktual</p>
                        <p className="text-white/80 text-sm mt-1">{currentUser.nama} - {currentUser.jabatan}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                        <button onClick={handleManualRefresh} disabled={isManualRefreshing}
                            className="flex items-center gap-2 rounded-xl bg-white/20 hover:bg-white/30 disabled:opacity-60 px-3 py-2 text-sm font-semibold text-white transition-colors">
                            <svg className={`h-4 w-4 ${isManualRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            {isManualRefreshing ? 'Memperbarui...' : 'Refresh'}
                        </button>
                        <span className="text-xs text-white/70">Diperbarui: {getLastRefreshedLabel()} · Auto 60 dtk</span>
                    </div>
                </div>
            </div>

            {/* Metrics Cards - Row 1 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard title="Karyawan Aktif" value={metrics.activeEmployees} subtitle={`Non-Aktif: ${metrics.inactiveEmployees}`} gradient="bg-gradient-to-br from-violet-500 to-indigo-700 shadow-indigo-100" />
                <InfoCard title="Hadir Hari Ini" value={metrics.presentToday} subtitle={`Tingkat hadir: ${metrics.attendanceRateToday}%`} gradient="bg-gradient-to-br from-emerald-400 to-[#06736a] shadow-emerald-100" />
                <InfoCard title="Terlambat Hari Ini" value={metrics.lateToday} subtitle={`Late rate: ${metrics.lateRateToday}%`} gradient="bg-gradient-to-br from-amber-400 to-orange-600 shadow-orange-100" />
                <InfoCard title="Estimasi Tidak Hadir" value={metrics.absenceEstimateToday} subtitle={`Cuti aktif: ${metrics.approvedLeaveToday}`} gradient="bg-gradient-to-br from-rose-400 to-red-600 shadow-rose-100" />
            </div>

            {/* Metrics Cards - Row 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <InfoCard title={`Rata-rata Hadir (${selectedRange} hari)`} value={metrics.avgPresentPerDay} subtitle={`Total hadir: ${metrics.totalPresentRange}`} gradient="bg-gradient-to-br from-cyan-400 to-teal-600 shadow-cyan-100" />
                <InfoCard title={`Total Lembur (${selectedRange} hari)`} value={`${metrics.totalOvertimeRange} jam`} subtitle={`Hari ini: ${metrics.overtimeToday} jam`} gradient="bg-gradient-to-br from-sky-400 to-blue-600 shadow-sky-100" />
                <InfoCard title="Permohonan Pending" value={metrics.pendingRequests} subtitle={`Cuti: ${metrics.pendingLeave} | Reimburse: ${metrics.pendingReimburse}`} gradient="bg-gradient-to-br from-orange-400 to-rose-500 shadow-rose-50" />
                <InfoCard title="Skor Ketepatan" value={`${metrics.punctualityScore}%`} subtitle={`Rata-rata keterlambatan: ${metrics.avgLateRateRange}%`} gradient="bg-gradient-to-br from-teal-400 to-emerald-600 shadow-teal-100" />
            </div>

            {/* Chart */}
            <AttendanceChart trendData={trendData} selectedRange={selectedRange} onRangeChange={setSelectedRange} />

            {/* Tables */}
            <LateEmployeesTable frequentLateEmployees={frequentLateEmployees} />
            <RecentRequestsList recentRequests={recentRequests} />

            {/* Inbox Laporan Staf RS */}
            <StaffReportInboxWidget
                currentUserId={currentUser.id}
                userRole={currentUser.role}
                onOpenFullNotes={() => onNavigate?.('notes' as any)}
            />

            {/* Quick Actions */}
            <div className="bg-[#e6f3f2] p-6 rounded-xl">
                <h2 className="text-xl font-bold text-[#06736a] mb-4">Aksi Cepat HR</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <ActionCard title="Data Karyawan" description="Kelola data dan profil karyawan" onClick={() => onNavigate?.('employees')} />
                    <ActionCard title="Kehadiran" description="Audit absensi, keterlambatan, dan lembur" onClick={() => onNavigate?.('attendance')} />
                    <ActionCard title="Permohonan" description="Review cuti dan reimbursement" onClick={() => onNavigate?.('requests')} />
                    <ActionCard title="Payroll" description="Lihat ringkasan penggajian" onClick={() => onNavigate?.('payroll')} />
                </div>
            </div>
        </div>
    );
};

export default HRDashboard;
