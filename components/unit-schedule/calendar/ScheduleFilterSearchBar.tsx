import React from 'react';

interface ScheduleFilterSearchBarProps {
    searchQuery: string;
    setSearchQuery: (val: string) => void;
    selectedJabatanFilter: string;
    setSelectedJabatanFilter: (val: string) => void;
    availableJabatans: string[];
    warningOnlyFilter: boolean;
    setWarningOnlyFilter: (val: boolean) => void;
    totalEmployees: number;
    filteredCount: number;
}

export const ScheduleFilterSearchBar: React.FC<ScheduleFilterSearchBarProps> = ({
    searchQuery,
    setSearchQuery,
    selectedJabatanFilter,
    setSelectedJabatanFilter,
    availableJabatans,
    warningOnlyFilter,
    setWarningOnlyFilter,
    totalEmployees,
    filteredCount,
}) => {
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
                <input
                    type="text"
                    placeholder="🔍 Cari nama / NIK..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#06736a] outline-none min-w-[180px]"
                />
                <select
                    value={selectedJabatanFilter}
                    onChange={e => setSelectedJabatanFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#06736a] outline-none font-medium"
                >
                    <option value="ALL">Semua Jabatan ({totalEmployees})</option>
                    {availableJabatans.filter(j => j !== 'ALL').map(j => (
                        <option key={j} value={j}>{j}</option>
                    ))}
                </select>
                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700 cursor-pointer hover:bg-gray-50">
                    <input
                        type="checkbox"
                        checked={warningOnlyFilter}
                        onChange={e => setWarningOnlyFilter(e.target.checked)}
                        className="rounded border-gray-300 text-rose-600 focus:ring-rose-500"
                    />
                    <span>⚠️ Hanya Karyawan dengan Warning</span>
                </label>
            </div>
            <div className="text-xs font-semibold text-gray-500">
                Menampilkan <b className="text-[#06736a]">{filteredCount}</b> dari {totalEmployees} karyawan
            </div>
        </div>
    );
};
