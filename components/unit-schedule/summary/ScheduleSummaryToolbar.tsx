import React from 'react';
import { PeriodFilterMode } from './types.ts';

interface ScheduleSummaryToolbarProps {
    viewMonth: string;
    setViewMonth: (month: string) => void;
    monthLabel: string;
    periodMode: PeriodFilterMode;
    setPeriodMode: (mode: PeriodFilterMode) => void;
    availableJabatanList: string[];
    selectedJabatan: string;
    setSelectedJabatan: (jabatan: string) => void;
    totalEmployees: number;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    onExportExcel: () => void;
}

export const ScheduleSummaryToolbar: React.FC<ScheduleSummaryToolbarProps> = ({
    viewMonth,
    setViewMonth,
    monthLabel,
    periodMode,
    setPeriodMode,
    availableJabatanList,
    selectedJabatan,
    setSelectedJabatan,
    totalEmployees,
    searchQuery,
    setSearchQuery,
    onExportExcel,
}) => {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 border border-gray-200 rounded-2xl shadow-sm">
            {/* Left Month & Period Filter */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 bg-gray-50 p-1 border border-gray-200 rounded-xl">
                    <button
                        onClick={() => {
                            const [y, m] = viewMonth.split('-').map(Number);
                            const prev = new Date(y, m - 2, 1);
                            setViewMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-200 font-bold"
                    >
                        ◀
                    </button>
                    <span className="text-sm font-bold text-gray-800 px-2 min-w-[120px] text-center">
                        {monthLabel}
                    </span>
                    <button
                        onClick={() => {
                            const [y, m] = viewMonth.split('-').map(Number);
                            const next = new Date(y, m, 1);
                            setViewMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
                        }}
                        className="px-2 py-1 text-xs border border-gray-300 rounded-lg hover:bg-gray-200 font-bold"
                    >
                        ▶
                    </button>
                </div>

                {/* Filter Rentang Waktu (Per Bulan vs Per Minggu) */}
                <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl text-xs font-semibold overflow-x-auto">
                    {[
                        { key: 'month', label: '📅 1 Bulan Penuh' },
                        { key: 'w1', label: 'W1 (Tgl 1-7)' },
                        { key: 'w2', label: 'W2 (Tgl 8-14)' },
                        { key: 'w3', label: 'W3 (Tgl 15-21)' },
                        { key: 'w4', label: 'W4 (Tgl 22-28)' },
                        { key: 'w5', label: 'W5 (Tgl 29+)' },
                    ].map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => setPeriodMode(tab.key as PeriodFilterMode)}
                            className={`px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0 ${
                                periodMode === tab.key
                                    ? 'bg-[#06736a] text-white shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Filter Jabatan */}
                {availableJabatanList.length > 0 && (
                    <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold">
                        <span className="text-gray-500">👤 Jabatan:</span>
                        <select
                            value={selectedJabatan}
                            onChange={e => setSelectedJabatan(e.target.value)}
                            className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
                        >
                            <option value="all">Semua Jabatan ({totalEmployees} staf)</option>
                            {availableJabatanList.map(j => (
                                <option key={j} value={j}>{j}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {/* Right Actions & Search */}
            <div className="flex items-center gap-2">
                <input
                    type="text"
                    placeholder="🔍 Cari nama staf / NIK..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-[#06736a] min-w-[180px]"
                />
                <button
                    onClick={onExportExcel}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 font-semibold shadow-sm transition-all whitespace-nowrap"
                >
                    📥 Export Excel
                </button>
            </div>
        </div>
    );
};
