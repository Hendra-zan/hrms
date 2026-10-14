import React from 'react';

interface PayrollFilterToolbarProps {
    searchQuery: string;
    setSearchQuery: (query: string) => void;
    selectedDepartment: string;
    setSelectedDepartment: (dept: string) => void;
    selectedStatusFilter: 'all' | 'published' | 'draft' | 'incomplete';
    setSelectedStatusFilter: (status: 'all' | 'published' | 'draft' | 'incomplete') => void;
    sortBy: 'name_asc' | 'name_desc' | 'late_desc' | 'overtime_desc';
    setSortBy: (sort: 'name_asc' | 'name_desc' | 'late_desc' | 'overtime_desc') => void;
    departmentsList: string[];
    totalEmployeesCount: number;
    filteredEmployeesCount: number;
    totalPayrollCount: number;
    publishedCount: number;
    draftCount: number;
    incompleteCount: number;
    hasActiveFilters: boolean;
    clearFilters: () => void;
}

const FunnelIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
    </svg>
);

const MagnifyingGlassIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const PayrollFilterToolbar: React.FC<PayrollFilterToolbarProps> = ({
    searchQuery,
    setSearchQuery,
    selectedDepartment,
    setSelectedDepartment,
    selectedStatusFilter,
    setSelectedStatusFilter,
    sortBy,
    setSortBy,
    departmentsList,
    totalEmployeesCount,
    filteredEmployeesCount,
    totalPayrollCount,
    publishedCount,
    draftCount,
    incompleteCount,
    hasActiveFilters,
    clearFilters,
}) => {
    return (
        <div className="bg-slate-50 border border-slate-200/80 p-4 rounded-xl space-y-3 mb-6">
            <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
                    <FunnelIcon className="w-4 h-4 text-[#06736a]" />
                    Filter & Pencarian Karyawan
                </span>
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="text-xs font-semibold text-rose-600 hover:text-rose-800 hover:underline transition-colors"
                    >
                        🔄 Reset Filter
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* Search Input */}
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <MagnifyingGlassIcon className="w-4 h-4" />
                    </div>
                    <input
                        type="text"
                        placeholder="Cari nama, NIK, email, jabatan..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 py-2 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/10"
                    />
                </div>

                {/* Departemen Filter */}
                <div>
                    <select
                        title="Filter berdasarkan Departemen"
                        value={selectedDepartment}
                        onChange={e => setSelectedDepartment(e.target.value)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/10"
                    >
                        <option value="all">🏢 Semua Departemen ({totalEmployeesCount})</option>
                        {departmentsList.map(dept => (
                            <option key={dept} value={dept}>
                                {dept}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Status Filter */}
                <div>
                    <select
                        title="Filter berdasarkan Status Slip Gaji"
                        value={selectedStatusFilter}
                        onChange={e => setSelectedStatusFilter(e.target.value as any)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/10"
                    >
                        <option value="all">📋 Semua Status ({totalPayrollCount})</option>
                        <option value="published">🔐 Slip Gaji Terbit ({publishedCount})</option>
                        <option value="draft">📄 Draft Siap Terbit ({draftCount})</option>
                        <option value="incomplete">⚠️ Belum Ada Kompensasi ({incompleteCount})</option>
                    </select>
                </div>

                {/* Sorting */}
                <div>
                    <select
                        title="Urutkan daftar karyawan"
                        value={sortBy}
                        onChange={e => setSortBy(e.target.value as any)}
                        className="block w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-800 shadow-sm outline-none transition focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/10"
                    >
                        <option value="name_asc">🔤 Urutkan: Nama (A - Z)</option>
                        <option value="name_desc">🔤 Urutkan: Nama (Z - A)</option>
                        <option value="late_desc">⏰ Urutkan: Keterlambatan Terbanyak</option>
                        <option value="overtime_desc">⏳ Urutkan: Lembur Terbanyak</option>
                    </select>
                </div>
            </div>

            {/* Filter Counter Badge */}
            <div className="pt-2 flex items-center justify-between text-xs text-slate-500 border-t border-slate-200/60">
                <span>
                    Menampilkan <strong className="text-slate-800">{filteredEmployeesCount}</strong> dari <strong className="text-slate-800">{totalPayrollCount}</strong> karyawan
                </span>
                {hasActiveFilters && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-100 text-emerald-800">
                        Filter Aktif
                    </span>
                )}
            </div>
        </div>
    );
};
