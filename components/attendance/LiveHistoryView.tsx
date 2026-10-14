import React, { useState, useMemo } from 'react';
import { Employee } from '../../types';
import { ClockIcon, MapPinIcon } from '../icons';

interface LiveHistoryViewProps {
    selectedEmployee: Employee | null;
    liveHistoryRecords: any[];
    liveHistorySyncedAt: Date;
    isLiveAutoRefresh: boolean;
    nextLiveRefreshIn: number;
    liveHistoryMode: 'ALL' | 'LATE' | 'OVERTIME';
    setLiveHistoryMode: (mode: 'ALL' | 'LATE' | 'OVERTIME') => void;
    liveHistoryLimit: number;
    setLiveHistoryLimit: (limit: number) => void;
    refreshLiveHistory: () => void;
    setIsLiveAutoRefresh: (val: boolean) => void;
    setNextLiveRefreshIn: (val: number) => void;
    employeeMap: Map<string, Employee>;
}

const LIVE_REFRESH_INTERVAL_SECONDS = 30;

// Inline SVG Icon Helpers
const IconFingerprint = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 10a2 2 0 0 0-2 2c0 1.02-.1 2.51-.26 4" />
        <path d="M14 13a4 4 0 0 0-4-4 4 4 0 0 0-4 4c0 1.96-.34 4.54-.7 6" />
        <path d="M18 14a8 8 0 0 0-8-8 8 8 0 0 0-8 8c0 2.87-.57 6.45-1.04 8" />
        <path d="M22 15a12 12 0 0 0-12-12 12 12 0 0 0-12 12" />
    </svg>
);

const IconCamera = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
        <circle cx="12" cy="13" r="4" />
    </svg>
);

const IconPencil = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z" />
    </svg>
);

const IconSearch = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);

const IconRefresh = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <polyline points="23 4 23 10 17 10" />
        <polyline points="1 20 1 14 7 14" />
        <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
);

const LiveHistoryView: React.FC<LiveHistoryViewProps> = ({
    selectedEmployee,
    liveHistoryRecords,
    liveHistorySyncedAt,
    isLiveAutoRefresh,
    nextLiveRefreshIn,
    liveHistoryMode,
    setLiveHistoryMode,
    liveHistoryLimit,
    setLiveHistoryLimit,
    refreshLiveHistory,
    setIsLiveAutoRefresh,
    setNextLiveRefreshIn,
    employeeMap,
}) => {
    const [searchQuery, setSearchQuery] = useState('');

    // Quick Stats Calculation
    const stats = useMemo(() => {
        const total = liveHistoryRecords.length;
        const late = liveHistoryRecords.filter(r => r.isLate).length;
        const overtime = liveHistoryRecords.filter(r => r.overtimeHours > 0).length;
        const onTime = total - late;
        return { total, late, overtime, onTime };
    }, [liveHistoryRecords]);

    // Filtered Records based on mode & local search
    const filteredRecords = useMemo(() => {
        return liveHistoryRecords.filter(record => {
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase().trim();
                const emp = employeeMap.get(record.employeeId);
                const empName = emp?.nama?.toLowerCase() || '';
                const empDept = emp?.departemen?.toLowerCase() || '';
                const empNik = emp?.nik?.toLowerCase() || '';
                const location = String(record.location || '').toLowerCase();
                const matches = empName.includes(q) || empDept.includes(q) || empNik.includes(q) || location.includes(q);
                if (!matches) return false;
            }
            return true;
        });
    }, [liveHistoryRecords, searchQuery, employeeMap]);

    return (
        <section className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-md space-y-4">
            {/* ── Top Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-[#e6f3f2] rounded-xl text-[#06736a]">
                        <ClockIcon className="h-6 w-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-slate-900">Live History Absensi</h3>
                            {isLiveAutoRefresh && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                    <span className="relative flex h-2 w-2">
                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                                    </span>
                                    LIVE Realtime
                                </span>
                            )}
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {selectedEmployee ? `Histori absensi realtime untuk ${selectedEmployee.nama}` : 'Pantau aktivitas log absensi realtime seluruh karyawan RSU Meloy.'}
                        </p>
                    </div>
                </div>

                {/* Status Badges */}
                <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 font-semibold text-slate-700">
                        Total: <strong className="text-slate-900">{stats.total}</strong>
                    </span>
                    <span className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 font-medium text-slate-600">
                        Terakhir Sync: <strong className="text-slate-800">{liveHistorySyncedAt.toLocaleTimeString('id-ID')}</strong>
                    </span>
                    <span className="rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-1.5 font-medium text-slate-600">
                        Refresh: <strong className="text-[#06736a]">{isLiveAutoRefresh ? `${nextLiveRefreshIn} dtk` : 'Manual'}</strong>
                    </span>
                </div>
            </div>

            {/* ── Summary Cards ── */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div 
                    onClick={() => setLiveHistoryMode('ALL')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${liveHistoryMode === 'ALL' ? 'border-[#06736a] bg-emerald-50/50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Semua Log</div>
                    <div className="text-xl font-bold text-slate-900 mt-0.5">{stats.total}</div>
                </div>

                <div 
                    onClick={() => setLiveHistoryMode('ALL')}
                    className="p-3 rounded-xl border border-slate-200/80 bg-slate-50/50"
                >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700">Tepat Waktu</div>
                    <div className="text-xl font-bold text-emerald-800 mt-0.5">{stats.onTime}</div>
                </div>

                <div 
                    onClick={() => setLiveHistoryMode('LATE')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${liveHistoryMode === 'LATE' ? 'border-rose-500 bg-rose-50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-rose-700">Terlambat</div>
                    <div className="text-xl font-bold text-rose-800 mt-0.5">{stats.late}</div>
                </div>

                <div 
                    onClick={() => setLiveHistoryMode('OVERTIME')}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${liveHistoryMode === 'OVERTIME' ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-indigo-700">Lembur</div>
                    <div className="text-xl font-bold text-indigo-800 mt-0.5">{stats.overtime}</div>
                </div>
            </div>

            {/* ── Toolbar & Control Filters ── */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex flex-wrap items-center gap-2 flex-1">
                    {/* Search Input (Flex sibling: zero overlap) */}
                    <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm transition focus-within:border-[#06736a] focus-within:ring-2 focus-within:ring-[#06736a]/10 flex-1 min-w-[200px]">
                        <span className="pl-3 pr-2 text-slate-400 flex-shrink-0" aria-hidden="true">
                            <IconSearch />
                        </span>
                        <input
                            type="text"
                            placeholder="Cari karyawan atau lokasi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full py-1.5 pr-3 text-xs text-slate-800 bg-transparent outline-none placeholder:text-slate-400"
                        />
                    </div>

                    {/* Mode Select */}
                    <select
                        value={liveHistoryMode}
                        onChange={(e) => setLiveHistoryMode(e.target.value as 'ALL' | 'LATE' | 'OVERTIME')}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-[#06736a]"
                        title="Filter mode live history"
                    >
                        <option value="ALL">📋 Semua Log Absensi</option>
                        <option value="LATE">⏰ Hanya Terlambat</option>
                        <option value="OVERTIME">⏳ Hanya Lembur</option>
                    </select>

                    {/* Limit Select */}
                    <select
                        value={liveHistoryLimit}
                        onChange={(e) => setLiveHistoryLimit(Number(e.target.value))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm outline-none focus:border-[#06736a]"
                        title="Jumlah data live history"
                    >
                        <option value={25}>25 data</option>
                        <option value={50}>50 data</option>
                        <option value={100}>100 data</option>
                        <option value={200}>200 data</option>
                    </select>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button 
                        type="button" 
                        onClick={refreshLiveHistory} 
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition-colors"
                    >
                        <IconRefresh />
                        <span>Refresh</span>
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            const nextValue = !isLiveAutoRefresh;
                            setIsLiveAutoRefresh(nextValue);
                            if (nextValue) setNextLiveRefreshIn(LIVE_REFRESH_INTERVAL_SECONDS);
                        }}
                        className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all shadow-sm ${
                            isLiveAutoRefresh 
                                ? 'border border-emerald-300 bg-emerald-600 text-white hover:bg-emerald-700' 
                                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        Auto-Sync: {isLiveAutoRefresh ? 'ON' : 'OFF'}
                    </button>
                </div>
            </div>

            {/* ── Table Data ── */}
            {filteredRecords.length > 0 ? (
                <div className="overflow-x-auto rounded-xl border border-slate-200/80 shadow-sm">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Tanggal & Jam</th>
                                {selectedEmployee ? null : (
                                    <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Karyawan</th>
                                )}
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Masuk</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Pulang</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Metode Verifikasi</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Status</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-600">Lembur</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-slate-600">Lokasi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                            {filteredRecords.map((record) => {
                                const emp = employeeMap.get(record.employeeId);

                                return (
                                    <tr key={record.id} className="hover:bg-slate-50/80 transition-colors">
                                        {/* Tanggal */}
                                        <td className="whitespace-nowrap px-4 py-3 text-xs font-medium text-slate-800">
                                            {new Date(record.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}
                                        </td>

                                        {/* Karyawan */}
                                        {selectedEmployee ? null : (
                                            <td className="px-4 py-3 text-xs">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="h-7 w-7 flex-shrink-0 rounded-full bg-[#06736a]/10 text-[#06736a] flex items-center justify-center font-bold text-xs border border-[#06736a]/20">
                                                        {(emp?.nama || record.employeeId || 'K')[0].toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <div className="font-semibold text-slate-900">{emp?.nama || record.employeeId || '-'}</div>
                                                        <div className="text-[11px] text-slate-400">{emp?.departemen || emp?.jabatan || '-'}</div>
                                                    </div>
                                                </div>
                                            </td>
                                        )}

                                        {/* Clock In */}
                                        <td className={`whitespace-nowrap px-4 py-3 text-xs text-center font-bold ${record.isLate ? 'text-rose-600' : 'text-slate-800'}`}>
                                            {record.clockIn || '--:--'}
                                        </td>

                                        {/* Clock Out */}
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-center font-medium text-slate-600">
                                            {record.clockOut || '--:--'}
                                        </td>

                                        {/* Metode Verifikasi */}
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-center">
                                            {(() => {
                                                const src = String(record.source || '').toLowerCase();
                                                const notes = String(record.notes || '').toLowerCase();
                                                const bio = String(record.biometricType || '').toLowerCase();
                                                const loc = String(record.location || '').toLowerCase();
                                                const hasGps = loc.includes('gps') || record.latitude != null || record.longitude != null;
                                                const isMobileSource = src.includes('mobile') || src.includes('web-ess') || src.includes('ess') || src.includes('app') || src.includes('phone') || src.includes('android') || src.includes('ios');
                                                const isFace = bio === 'face' || !!record.photoUrl || notes.includes('wajah') || notes.includes('face') || notes.includes('selfie');
                                                const isFinger = src.includes('fingerprint') || src.includes('hardware') || notes.includes('fingerprint') || notes.includes('sidik jari') || bio === 'fingerprint';
                                                const isHikvision = src.includes('hikvision') || notes.includes('hikvision') || notes.includes('face recognition');

                                                if (isFinger) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 px-2.5 py-0.5 text-[11px] font-semibold" title="Terverifikasi Sidik Jari USB">
                                                            <IconFingerprint /> Fingerprint USB
                                                        </span>
                                                    );
                                                }
                                                if (isHikvision) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 text-indigo-800 border border-indigo-200 px-2.5 py-0.5 text-[11px] font-semibold" title="Terverifikasi Mesin Hikvision">
                                                            <IconCamera /> Hikvision Terminal
                                                        </span>
                                                    );
                                                }
                                                if (isMobileSource || isFace || hasGps) {
                                                    return (
                                                        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 px-2.5 py-0.5 text-[11px] font-semibold" title="Terverifikasi Absensi HP Mobile (GPS / Kamera)">
                                                            <IconCamera /> HP Mobile (GPS)
                                                        </span>
                                                    );
                                                }
                                                return (
                                                    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 text-[11px] font-medium" title="Input / Koreksi Manual Admin">
                                                        <IconPencil /> Manual Admin
                                                    </span>
                                                );
                                            })()}
                                        </td>

                                        {/* Status */}
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-center">
                                            {record.isLate ? (
                                                <span className="inline-flex rounded-full bg-rose-100 px-2.5 py-0.5 text-[11px] font-bold text-rose-700 border border-rose-200">
                                                    Terlambat
                                                </span>
                                            ) : (
                                                <span className="inline-flex rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-bold text-emerald-800 border border-emerald-200">
                                                    Tepat Waktu
                                                </span>
                                            )}
                                        </td>

                                        {/* Lembur */}
                                        <td className="whitespace-nowrap px-4 py-3 text-xs text-center font-medium text-slate-700">
                                            {record.overtimeHours > 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold text-[11px] border border-indigo-100">
                                                    +{record.overtimeHours} jam
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </td>

                                        {/* Lokasi */}
                                        <td className="px-4 py-3 text-xs text-slate-600">
                                            <span className="inline-flex items-center gap-1">
                                                <MapPinIcon className="h-3.5 w-3.5 text-slate-400 flex-shrink-0" />
                                                <span className="truncate max-w-[150px]">{record.location || 'Kantor Pusat RSU Meloy'}</span>
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-12 text-center">
                    <div className="flex flex-col items-center justify-center text-slate-400">
                        <ClockIcon className="h-10 w-10 mb-2 text-slate-300" />
                        <p className="text-sm font-semibold text-slate-700">Tidak ada log absensi live</p>
                        <p className="text-xs text-slate-500 mt-1">Belum ada data absensi yang sesuai dengan filter pencarian Anda.</p>
                    </div>
                </div>
            )}
        </section>
    );
};

export default LiveHistoryView;
