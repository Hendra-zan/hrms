import React from 'react';
import { EmployeeShiftStats, SortField, SortOrder } from './types.ts';

interface EmployeeWorkHoursTableProps {
    periodLabel: string;
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    sortField: SortField;
    sortOrder: SortOrder;
    onSort: (field: SortField) => void;
    processedList: EmployeeShiftStats[];
}

export const EmployeeWorkHoursTable: React.FC<EmployeeWorkHoursTableProps> = ({
    periodLabel,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    onSort,
    processedList,
}) => {
    return (
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h3 className="font-bold text-gray-800 text-sm flex items-center gap-2">
                        <span>📊</span> Detail Alokasi Shift & Analisis Keadilan Staf Unit
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Menampilkan rincian shift Pagi, Siang, Malam, Cuti, Libur, dan total jam kerja periode <strong>{periodLabel}</strong>.
                    </p>
                </div>

                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="🔍 Cari nama / jabatan / NIK..."
                        className="pl-3 pr-8 py-1.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent w-60"
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Table Grid */}
            <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                    <thead>
                        <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-semibold">
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => onSort('nama')}>
                                Nama Staf {sortField === 'nama' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="px-3 py-3 text-center">☀️ Pagi</th>
                            <th className="px-3 py-3 text-center">🌇 Siang</th>
                            <th className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => onSort('malamCount')}>
                                🌙 Malam {sortField === 'malamCount' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="px-3 py-3 text-center">🏖️ Libur</th>
                            <th className="px-3 py-3 text-center">🌴 Cuti/Izin</th>
                            <th className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => onSort('totalHours')}>
                                ⏱️ Jam Kerja {sortField === 'totalHours' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="px-3 py-3 text-center cursor-pointer hover:bg-gray-100" onClick={() => onSort('k3Warnings')}>
                                🚨 Risiko K3 {sortField === 'k3Warnings' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                            </th>
                            <th className="px-3 py-3 text-center">📊 Komposisi</th>
                            <th className="px-4 py-3 cursor-pointer hover:bg-gray-100" onClick={() => onSort('fairnessStatus')}>
                                ⚖️ Analisis Keadilan {sortField === 'fairnessStatus' ? (sortOrder === 'asc' ? '▲' : '▼') : ''}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-gray-700">
                        {processedList.length === 0 ? (
                            <tr>
                                <td colSpan={10} className="py-10 text-center text-gray-400">
                                    Tidak ada data rangkuman jadwal untuk periode dan kriteria ini.
                                </td>
                            </tr>
                        ) : (
                            processedList.map(item => {
                                const totalS = item.totalShifts || 1;
                                const pagiPct = Math.round((item.pagiCount / totalS) * 100);
                                const siangPct = Math.round((item.siangCount / totalS) * 100);
                                const malamPct = Math.round((item.malamCount / totalS) * 100);

                                return (
                                    <tr key={item.employeeId} className="hover:bg-gray-50/80 transition-colors">
                                        {/* Employee info */}
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2.5">
                                                {item.foto && item.foto.startsWith('http') ? (
                                                    <img src={item.foto} alt="" className="w-7 h-7 rounded-full object-cover border border-gray-200" />
                                                ) : (
                                                    <div className="w-7 h-7 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-xs">
                                                        {item.nama.charAt(0)}
                                                    </div>
                                                )}
                                                <div>
                                                    <p className="font-bold text-gray-800 text-xs">{item.nama}</p>
                                                    <p className="text-[10px] text-gray-400">{item.jabatan}</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Pagi */}
                                        <td className="px-3 py-3 text-center font-medium">
                                            <span className="px-2 py-0.5 bg-amber-50 text-amber-700 rounded-md font-bold text-xs">
                                                {item.pagiCount}x
                                            </span>
                                            <div className="text-[9px] text-gray-400 mt-0.5">{item.pagiHours}h</div>
                                        </td>

                                        {/* Siang */}
                                        <td className="px-3 py-3 text-center font-medium">
                                            <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-md font-bold text-xs">
                                                {item.siangCount}x
                                            </span>
                                            <div className="text-[9px] text-gray-400 mt-0.5">{item.siangHours}h</div>
                                        </td>

                                        {/* Malam */}
                                        <td className="px-3 py-3 text-center font-medium">
                                            <span className={`px-2 py-0.5 rounded-md font-bold text-xs ${
                                                item.malamCount >= 5 ? 'bg-rose-100 text-rose-800 border border-rose-300' : 'bg-indigo-50 text-indigo-700'
                                            }`}>
                                                {item.malamCount}x
                                            </span>
                                            <div className="text-[9px] text-gray-400 mt-0.5">{item.malamHours}h</div>
                                        </td>

                                        {/* Libur */}
                                        <td className="px-3 py-3 text-center font-semibold text-gray-600">
                                            <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-md text-xs">
                                                {item.offCount} hari
                                            </span>
                                        </td>

                                        {/* Cuti/Izin */}
                                        <td className="px-3 py-3 text-center font-semibold">
                                            <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${
                                                item.cutiCount > 0 ? 'bg-sky-100 text-sky-800 border border-sky-200' : 'bg-gray-50 text-gray-400'
                                            }`}>
                                                {item.cutiCount > 0 ? `${item.cutiCount} hari` : '-'}
                                            </span>
                                        </td>

                                        {/* Total Jam */}
                                        <td className="px-3 py-3 text-center">
                                            <span className="font-extrabold text-gray-800 text-xs">
                                                {item.totalHours} jam
                                            </span>
                                            <div className="text-[9px] text-gray-400">
                                                {item.totalShifts} shift ({item.hoursDiff >= 0 ? `+${item.hoursDiff}h` : `${item.hoursDiff}h`})
                                            </div>
                                        </td>

                                        {/* K3 Risk Warnings */}
                                        <td className="px-3 py-3 text-center">
                                            {item.k3Warnings.length > 0 ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    {item.k3Warnings.map((w, idx) => (
                                                        <span key={idx} className="px-2 py-0.5 text-[9px] font-bold rounded bg-rose-100 text-rose-800 border border-rose-200 whitespace-nowrap">
                                                            {w}
                                                        </span>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-[10px] text-emerald-600 font-medium">Aman</span>
                                            )}
                                        </td>

                                        {/* Visual Progress Mix */}
                                        <td className="px-3 py-3 text-center min-w-[110px]">
                                            <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden flex" title={`Pagi: ${pagiPct}%, Siang: ${siangPct}%, Malam: ${malamPct}%`}>
                                                <div style={{ width: `${pagiPct}%` }} className="bg-amber-400 h-full" />
                                                <div style={{ width: `${siangPct}%` }} className="bg-blue-500 h-full" />
                                                <div style={{ width: `${malamPct}%` }} className="bg-indigo-600 h-full" />
                                            </div>
                                            <div className="flex justify-between text-[8px] text-gray-400 mt-1">
                                                <span>☀️ {pagiPct}%</span>
                                                <span>🌇 {siangPct}%</span>
                                                <span>🌙 {malamPct}%</span>
                                            </div>
                                        </td>

                                        {/* Fairness Status Badge */}
                                        <td className="px-4 py-3">
                                            <div className="flex flex-col gap-1">
                                                {item.fairnessStatus === 'balanced' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md w-fit">
                                                        🟢 Seimbang
                                                    </span>
                                                )}
                                                {item.fairnessStatus === 'moderate' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md w-fit">
                                                        🟡 Toleransi
                                                    </span>
                                                )}
                                                {item.fairnessStatus === 'unbalanced' && (
                                                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md w-fit">
                                                        🔴 Perlu Disesuaikan
                                                    </span>
                                                )}
                                                <p className="text-[10px] text-gray-500 leading-tight">
                                                    {item.fairnessNote}
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
