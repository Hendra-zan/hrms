import React from 'react';

interface ScheduleInfo {
    totalSchedules: number;
    draftCount: number;
    publishedCount: number;
    offDayCount: number;
    coveragePercent: number;
    monthLabel: string;
}

interface ScheduleSummaryCardProps {
    scheduleInfo: ScheduleInfo;
    onNavigate?: (view: string) => void;
}

const ScheduleSummaryCard: React.FC<ScheduleSummaryCardProps> = ({ scheduleInfo, onNavigate }) => {
    const {
        totalSchedules = 0,
        draftCount = 0,
        publishedCount = 0,
        offDayCount = 0,
        coveragePercent = 0,
        monthLabel = ''
    } = scheduleInfo || {};

    const coverageColor =
        coveragePercent >= 90 ? 'from-emerald-400 to-green-600' :
        coveragePercent >= 50 ? 'from-amber-400 to-orange-500' : 'from-red-400 to-rose-600';

    const coverageTextColor =
        coveragePercent >= 90 ? 'text-emerald-600' :
        coveragePercent >= 50 ? 'text-amber-600' : 'text-red-600';

    return (
        <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100 flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-sm">
                        <span className="text-lg">📋</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Jadwal Shift</h2>
                        <p className="text-xs text-gray-500">{monthLabel}</p>
                    </div>
                </div>
                <button
                    onClick={() => onNavigate?.('unit-schedule')}
                    className="flex items-center gap-1.5 rounded-xl bg-[#06736a]/10 px-3 py-1.5 text-xs font-semibold text-[#06736a] transition hover:bg-[#06736a]/20"
                >
                    Kelola →
                </button>
            </div>

            {totalSchedules === 0 ? (
                /* ── Empty state ── */
                <div className="flex flex-col items-center justify-center flex-1 py-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-3xl mb-3">
                        ⚠️
                    </div>
                    <h3 className="font-bold text-amber-800 mb-1">Jadwal Belum Di-generate</h3>
                    <p className="text-xs text-amber-700 max-w-xs leading-relaxed mb-4">
                        Belum ada jadwal harian untuk bulan ini. Gunakan fitur Manajemen Jadwal untuk membuat jadwal otomatis.
                    </p>
                    <button
                        onClick={() => onNavigate?.('unit-schedule')}
                        className="rounded-xl bg-gradient-to-r from-[#06736a] to-[#089c8e] px-5 py-2 text-sm font-semibold text-white shadow-md transition hover:shadow-lg hover:-translate-y-0.5"
                    >
                        📅 Buat Jadwal Sekarang
                    </button>
                </div>
            ) : (
                <>
                    {/* ── Coverage ring ── */}
                    <div className="flex items-center gap-5 mb-5">
                        <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
                            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 80 80">
                                <circle cx="40" cy="40" r="34" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                                <circle
                                    cx="40" cy="40" r="34" fill="none"
                                    stroke="url(#cov-grad)" strokeWidth="8"
                                    strokeLinecap="round"
                                    strokeDasharray={`${Math.min(coveragePercent, 100) * 2.136} 213.6`}
                                    className="transition-all duration-700"
                                />
                                <defs>
                                    <linearGradient id="cov-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                                        <stop offset="0%" stopColor={coveragePercent >= 90 ? '#34d399' : coveragePercent >= 50 ? '#fbbf24' : '#f87171'} />
                                        <stop offset="100%" stopColor={coveragePercent >= 90 ? '#059669' : coveragePercent >= 50 ? '#f59e0b' : '#ef4444'} />
                                    </linearGradient>
                                </defs>
                            </svg>
                            <div className="text-center">
                                <span className={`text-lg font-bold ${coverageTextColor}`}>{coveragePercent}%</span>
                            </div>
                        </div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-gray-700">Coverage Jadwal</p>
                            <p className="text-xs text-gray-500 mt-0.5">Persentase karyawan yang sudah memiliki jadwal</p>
                            <div className="mt-2 h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                                <div
                                    className={`h-full rounded-full bg-gradient-to-r ${coverageColor} transition-all duration-700`}
                                    style={{ width: `${Math.min(coveragePercent, 100)}%` }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Stats grid ── */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                        <div className="rounded-xl bg-blue-50 border border-blue-100 p-3 text-center">
                            <p className="text-2xl font-bold text-blue-700">{totalSchedules}</p>
                            <p className="text-xs font-medium text-blue-600 mt-0.5">Total</p>
                        </div>
                        <div className="rounded-xl bg-amber-50 border border-amber-100 p-3 text-center">
                            <p className="text-2xl font-bold text-amber-700">{draftCount}</p>
                            <p className="text-xs font-medium text-amber-600 mt-0.5">Draft</p>
                        </div>
                        <div className="rounded-xl bg-emerald-50 border border-emerald-100 p-3 text-center">
                            <p className="text-2xl font-bold text-emerald-700">{publishedCount}</p>
                            <p className="text-xs font-medium text-emerald-600 mt-0.5">Published</p>
                        </div>
                    </div>

                    {/* ── Alerts ── */}
                    {draftCount > 0 && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
                            <span className="text-amber-500 text-base mt-0.5">⏳</span>
                            <div>
                                <p className="font-semibold text-amber-800">{draftCount} jadwal masih berstatus Draft</p>
                                <p className="text-amber-700 mt-0.5">Publish agar aktif untuk validasi absensi.</p>
                            </div>
                        </div>
                    )}
                    {coveragePercent < 100 && coveragePercent > 0 && (
                        <div className="flex items-start gap-2.5 rounded-xl bg-blue-50 border border-blue-200 p-3 text-xs mt-2">
                            <span className="text-blue-500 text-base mt-0.5">💡</span>
                            <div>
                                <p className="font-semibold text-blue-800">Jadwal belum lengkap ({coveragePercent}%)</p>
                                <p className="text-blue-700 mt-0.5">Beberapa karyawan belum memiliki jadwal lengkap bulan ini.</p>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default ScheduleSummaryCard;
