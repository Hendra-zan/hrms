import React, { useState } from 'react';
import { Employee, AllRequest, RequestType, RequestStatus } from '../types.ts';
import LoadingSpinner from './LoadingSpinner.tsx';
import { useKepalaRuanganDashboard } from '../hooks/useKepalaRuanganDashboard.ts';
import ShiftDistributionCard from './kepala-ruangan/ShiftDistributionCard.tsx';
import ScheduleSummaryCard from './kepala-ruangan/ScheduleSummaryCard.tsx';
import TodayScheduleCard from './kepala-ruangan/TodayScheduleCard.tsx';
import UnitStatusAlerts from './kepala-ruangan/UnitStatusAlerts.tsx';
import { SendNoteModal } from './employee-notes/SendNoteModal.tsx';
import { StaffReportInboxWidget } from './kepala-ruangan/StaffReportInboxWidget.tsx';

interface KepalaRuanganDashboardProps {
    kepalaRuangan: Employee;
    onNavigate?: (view: string) => void;
    allRequests?: AllRequest[];
    onUpdateRequestStatus?: (requestId: string, type: RequestType, newStatus: RequestStatus) => Promise<void>;
}

const StatCard: React.FC<{
    title: string;
    value: string | number;
    icon: string;
    gradient: string;
    subtitle?: string;
    trend?: { value: number; label: string };
}> = ({ title, value, icon, gradient, subtitle, trend }) => (
    <div className={`relative overflow-hidden rounded-2xl p-5 text-white shadow-lg ${gradient}`}>
        {/* Background decoration */}
        <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/10" />
        <div className="absolute -right-2 -bottom-6 h-16 w-16 rounded-full bg-white/10" />

        <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
                <span className="text-3xl">{icon}</span>
                {subtitle && (
                    <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                        {subtitle}
                    </span>
                )}
            </div>
            <p className="text-4xl font-bold tracking-tight">{value}</p>
            <p className="mt-1 text-sm font-medium text-white/80">{title}</p>
            {trend && (
                <p className="mt-2 text-xs text-white/70">{trend.label}</p>
            )}
        </div>
    </div>
);

const QuickActionCard: React.FC<{
    title: string;
    description: string;
    icon: string;
    onClick?: () => void;
    color: string;
    iconBg: string;
}> = ({ title, description, icon, onClick, color, iconBg }) => (
    <button
        onClick={onClick}
        className={`group relative overflow-hidden rounded-2xl bg-white p-5 text-left shadow-md transition-all duration-300 hover:-translate-y-1 hover:shadow-xl border border-gray-100`}
    >
        <div className={`absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity ${color}`} />
        <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-xl shadow-sm ${iconBg}`}>
                {icon}
            </div>
            <div>
                <h3 className={`font-bold text-gray-800 group-hover:${color} transition-colors`}>{title}</h3>
                <p className="mt-1 text-xs text-gray-500 leading-relaxed">{description}</p>
            </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full transition-all duration-300 ${color.replace('text-', 'bg-')}`} />
    </button>
);

const KepalaRuanganDashboard: React.FC<KepalaRuanganDashboardProps> = ({ kepalaRuangan, onNavigate, allRequests = [], onUpdateRequestStatus }) => {
    const kepalaAny = kepalaRuangan as any;

    // Sanitize: reject undefined/null JS values AND the literal strings "undefined"/"null"
    const sanitizeId = (v: unknown): string | undefined => {
        if (!v) return undefined;
        const s = String(v).trim();
        if (s === 'undefined' || s === 'null' || s === '') return undefined;
        return s;
    };

    const managedUnitId = sanitizeId(kepalaRuangan.unitKerjaId)
        ?? sanitizeId(kepalaAny.unit_kerja_id)
        ?? sanitizeId(kepalaRuangan.managedUnitId)
        ?? sanitizeId(kepalaAny.managed_unit_id);

    const { unitData, loading, isRefreshing, lastUpdated, refresh } = useKepalaRuanganDashboard(managedUnitId);

    const [processingId, setProcessingId] = useState<string | null>(null);
    const [isSendNoteOpen, setIsSendNoteOpen] = useState(false);

    const {
        workUnit,
        employees = [],
        attendanceStats = { totalEmployees: 0, presentToday: 0, absentToday: 0, onLeave: 0 },
        shiftStats = {},
        unitShifts = [],
        todayScheduleMap = {},
        scheduleInfo = { totalSchedules: 0, draftCount: 0, publishedCount: 0, offDayCount: 0, coveragePercent: 0, monthLabel: '' }
    } = unitData || {};

    const pendingRequests = React.useMemo(() => {
        if (!allRequests || !Array.isArray(allRequests) || !employees || !Array.isArray(employees)) {
            return [];
        }
        return allRequests.filter(req => 
            req && 
            req.status === 'Pending' && 
            req.employeeId && 
            employees.some(emp => emp && emp.id === req.employeeId)
        );
    }, [allRequests, employees]);

    const handleAction = async (requestId: string, type: RequestType, status: RequestStatus) => {
        if (!onUpdateRequestStatus) return;
        setProcessingId(requestId);
        try {
            await onUpdateRequestStatus(requestId, type, status);
        } catch (err) {
            console.error('Error updating request status:', err);
        } finally {
            setProcessingId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-64 gap-4">
                <LoadingSpinner size="large" />
                <p className="text-gray-500 text-sm animate-pulse">Memuat data unit...</p>
            </div>
        );
    }

    if (!managedUnitId || !unitData) {
        return (
            <div className="flex flex-col items-center justify-center min-h-64 rounded-2xl border-2 border-dashed border-amber-300 bg-amber-50 p-10 text-center">
                <span className="text-5xl mb-4">🏥</span>
                <h3 className="text-lg font-bold text-amber-800">Unit Belum Dikonfigurasi</h3>
                <p className="mt-2 text-sm text-amber-700">Anda belum ditugaskan sebagai kepala ruangan untuk unit tertentu.</p>
                <p className="mt-1 text-xs text-amber-600">Silakan hubungi HRD untuk pengaturan lebih lanjut.</p>
            </div>
        );
    }

    const attendancePercent = attendanceStats.totalEmployees > 0
        ? Math.round((attendanceStats.presentToday / attendanceStats.totalEmployees) * 100)
        : 0;

    return (
        <div className="space-y-6 pb-6">
            {/* ── Hero Header ─────────────────────────────────── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#06736a] via-[#078078] to-[#089c8e] p-6 sm:p-8 text-white shadow-xl">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
                <div className="absolute bottom-0 right-20 h-32 w-32 rounded-full bg-white/5" />
                <div className="absolute top-1/2 -translate-y-1/2 right-0 w-1 h-20 bg-white/20 rounded-l-full" />

                <div className="relative z-10 flex flex-wrap items-center gap-5">
                    {/* Avatar */}
                    <div className="relative">
                        {kepalaRuangan.foto ? (
                            <img
                                src={kepalaRuangan.foto}
                                alt={kepalaRuangan.nama}
                                className="h-20 w-20 rounded-2xl object-cover border-3 border-white/50 shadow-xl"
                            />
                        ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white/20 text-4xl font-bold shadow-xl border border-white/30">
                                {kepalaRuangan.nama?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-green-400 border-2 border-white shadow-sm">
                            <div className="h-2 w-2 rounded-full bg-white" />
                        </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="rounded-full bg-white/20 px-3 py-0.5 text-xs font-semibold backdrop-blur-sm">
                                👨‍💼 Kepala Ruangan
                            </span>
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-bold truncate">{kepalaRuangan.nama}</h1>
                        <p className="text-white/80 text-sm mt-0.5">{kepalaRuangan.jabatan}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-medium">
                                🏥 {workUnit?.nama || 'Unit tidak diketahui'}
                            </span>
                        </div>
                    </div>

                    {/* Right: Refresh + Kirim Catatan + time */}
                    <div className="ml-auto flex flex-col items-end gap-2">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setIsSendNoteOpen(true)}
                                className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/20 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/30 backdrop-blur-sm shadow-md active:scale-95"
                            >
                                <span>✉️</span> Kirim Catatan Staf
                            </button>
                            <button
                                type="button"
                                onClick={() => void refresh({ silent: true })}
                                disabled={loading || isRefreshing}
                                className="flex items-center gap-2 rounded-xl border border-white/30 bg-white/15 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/25 disabled:cursor-not-allowed disabled:opacity-60 backdrop-blur-sm"
                            >
                                <span className={isRefreshing ? 'animate-spin' : ''}>🔄</span>
                                {isRefreshing ? 'Memperbarui...' : 'Refresh'}
                            </button>
                        </div>
                        {lastUpdated && (
                            <p className="text-xs text-white/60">
                                Update: {lastUpdated.toLocaleTimeString('id-ID')}
                            </p>
                        )}
                    </div>
                </div>

                {/* Attendance mini-progress */}
                <div className="relative z-10 mt-6 rounded-xl bg-white/10 p-4 backdrop-blur-sm border border-white/20">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">Kehadiran Hari Ini</span>
                        <span className="text-lg font-bold">{attendancePercent}%</span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-white/20 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${
                                attendancePercent >= 90 ? 'bg-green-400' :
                                attendancePercent >= 70 ? 'bg-yellow-400' : 'bg-red-400'
                            }`}
                            style={{ width: `${attendancePercent}%` }}
                        />
                    </div>
                    <p className="mt-1.5 text-xs text-white/70">
                        {attendanceStats.presentToday} hadir dari {attendanceStats.totalEmployees} karyawan aktif
                    </p>
                </div>
            </div>

            {/* ── Stat Cards ──────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Karyawan"
                    value={attendanceStats.totalEmployees}
                    icon="👥"
                    gradient="bg-gradient-to-br from-blue-500 to-blue-700"
                    subtitle="Di unit ini"
                />
                <StatCard
                    title="Hadir Hari Ini"
                    value={attendanceStats.presentToday}
                    icon="✅"
                    gradient="bg-gradient-to-br from-emerald-500 to-emerald-700"
                    subtitle={`${attendancePercent}%`}
                />
                <StatCard
                    title="Tidak Hadir"
                    value={attendanceStats.absentToday}
                    icon="❌"
                    gradient="bg-gradient-to-br from-red-500 to-red-700"
                    subtitle="Absen"
                />
                <StatCard
                    title="Cuti / Izin"
                    value={attendanceStats.onLeave}
                    icon="🏖️"
                    gradient="bg-gradient-to-br from-amber-500 to-orange-600"
                    subtitle={`${Object.keys(shiftStats).length} shift`}
                />
            </div>

            {/* ── Distribution & Schedule Summary ─────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <ShiftDistributionCard shiftStats={shiftStats} unitShifts={unitShifts} />
                <ScheduleSummaryCard scheduleInfo={scheduleInfo} onNavigate={onNavigate} />
            </div>

            {/* ── Today's Schedule Table ───────────────────────── */}
            <TodayScheduleCard employees={employees} unitShifts={unitShifts} todayScheduleMap={todayScheduleMap} />

            {/* ── Inbox Laporan Staf Unit ───────────────────────── */}
            <StaffReportInboxWidget
                currentUserId={kepalaRuangan.id}
                userRole={kepalaRuangan.role}
                onOpenFullNotes={() => onNavigate?.('notes')}
            />

            {/* ── Unit Status Alerts ───────────────────────────── */}
            <UnitStatusAlerts attendanceStats={attendanceStats} />

            {/* ── Antrean Persetujuan Unit ────────────────────── */}
            <div className="bg-white rounded-3xl p-6 shadow-md border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="h-8 w-1 rounded-full bg-gradient-to-b from-amber-500 to-orange-500" />
                        <h2 className="text-xl font-bold text-gray-800">📥 Persetujuan Tertunda Unit ({pendingRequests.length})</h2>
                    </div>
                </div>

                {pendingRequests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                        <span className="text-4xl mb-3">🎉</span>
                        <p className="text-sm font-semibold text-gray-700">Semua Beres!</p>
                        <p className="text-xs text-gray-500 mt-1">Tidak ada permohonan tertunda yang perlu disetujui untuk unit ini.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {pendingRequests.map(req => {
                            const emp = employees.find(e => e.id === req.employeeId);
                            const name = emp ? emp.nama : 'Karyawan';
                            const role = emp ? emp.jabatan : '-';
                            const isCuti = req.type === 'Cuti';
                            
                            return (
                                <div key={req.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-200/60 hover:border-teal-500/30 hover:bg-[#06736a]/5 transition-all duration-300 gap-4">
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-teal-100 flex items-center justify-center text-xl shrink-0 text-[#06736a]">
                                            {isCuti ? '🏖️' : '💵'}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-bold text-gray-900 text-sm">{name}</h4>
                                                <span className="text-[10px] text-gray-500 font-medium px-2 py-0.5 bg-gray-200/60 rounded-full">{role}</span>
                                            </div>
                                            <p className="text-xs font-semibold text-[#06736a] mt-1">
                                                {isCuti ? 'Permohonan Cuti' : 'Reimbursement'} &middot; <span className="text-gray-500 font-normal">
                                                    {isCuti ? `${(req as any).startDate || '-'} s.d. ${(req as any).endDate || '-'}` : ((req as any).date || '-')}
                                                </span>
                                            </p>
                                            <p className="text-xs text-gray-600 mt-1 italic">
                                                "{isCuti ? ((req as any).reason || '') : `${(req as any).description || ''} (Rp ${((req as any).amount || 0).toLocaleString('id-ID')})`}"
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 sm:self-center self-end">
                                        <button
                                            disabled={processingId !== null}
                                            onClick={() => handleAction(req.id, req.type, 'Rejected' as any)}
                                            className="px-4 py-2 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-xl transition-all disabled:opacity-50"
                                        >
                                            {processingId === req.id ? 'Loading...' : 'Tolak'}
                                        </button>
                                        <button
                                            disabled={processingId !== null}
                                            onClick={() => handleAction(req.id, req.type, 'Approved' as any)}
                                            className="px-4 py-2 text-xs font-bold text-white bg-[#06736a] hover:bg-[#055f57] rounded-xl transition-all shadow-md hover:shadow-lg disabled:opacity-50"
                                        >
                                            {processingId === req.id ? 'Loading...' : 'Setujui'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ── Quick Actions ────────────────────────────────── */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="h-8 w-1 rounded-full bg-gradient-to-b from-[#06736a] to-[#089c8e]" />
                    <h2 className="text-xl font-bold text-gray-800">⚡ Aksi Cepat</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <QuickActionCard
                        title="Kelola Jadwal Shift"
                        description="Buat pola rotasi, generate jadwal bulanan, dan atur shift per karyawan"
                        icon="📅"
                        onClick={() => onNavigate?.('unit-schedule')}
                        color="text-blue-600"
                        iconBg="bg-blue-100"
                    />
                    <QuickActionCard
                        title="Pantau Kehadiran"
                        description="Lihat dan kelola presensi karyawan unit Anda secara real-time"
                        icon="⏱️"
                        onClick={() => onNavigate?.('attendance')}
                        color="text-emerald-600"
                        iconBg="bg-emerald-100"
                    />
                    <QuickActionCard
                        title="Daftar Karyawan"
                        description="Kelola data dan informasi lengkap karyawan di unit Anda"
                        icon="👤"
                        onClick={() => onNavigate?.('employees')}
                        color="text-purple-600"
                        iconBg="bg-purple-100"
                    />
                </div>

                {/* Send Note Modal for Kepala Ruangan */}
                <SendNoteModal
                    isOpen={isSendNoteOpen}
                    onClose={() => setIsSendNoteOpen(false)}
                    sender={kepalaRuangan}
                    allEmployees={employees}
                />
            </div>
        </div>
    );
};

export default KepalaRuanganDashboard;