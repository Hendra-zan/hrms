import React from 'react';
import { CurrencyDollarIcon, UserGroupIcon, CheckCircleIcon, DocumentTextIcon, ExclamationTriangleIcon } from '../../icons.tsx';
import { PayrollStats } from '../types.ts';
import { MONTHS } from '../hooks/usePayrollManagementState.ts';

interface PayrollSummaryCardsProps {
    selectedMonth: number;
    selectedYear: number;
    setSelectedMonth: (month: number) => void;
    setSelectedYear: (year: number) => void;
    years: number[];
    stats: PayrollStats;
    selectedStatusFilter: 'all' | 'published' | 'draft' | 'incomplete';
    setSelectedStatusFilter: (status: 'all' | 'published' | 'draft' | 'incomplete') => void;
}

export const PayrollSummaryCards: React.FC<PayrollSummaryCardsProps> = ({
    selectedMonth,
    selectedYear,
    setSelectedMonth,
    setSelectedYear,
    years,
    stats,
    selectedStatusFilter,
    setSelectedStatusFilter,
}) => {
    return (
        <div className="bg-white p-6 rounded-2xl shadow-md border border-gray-100 mb-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-xl font-bold text-slate-900 flex items-center gap-2.5">
                        <div className="p-2 bg-[#e6f3f2] rounded-xl text-[#06736a]">
                            <CurrencyDollarIcon className="w-6 h-6" />
                        </div>
                        Manajemen Penggajian Karyawan
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">
                        Kelola, perhitungkan, dan terbitkan slip gaji karyawan RSU Meloy per periode bulanan.
                    </p>
                </div>

                {/* Periode Selector */}
                <div className="flex items-center gap-3 bg-slate-50 border border-slate-200/80 p-2.5 rounded-xl self-start md:self-auto">
                    <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 pl-1">Periode:</span>
                    <select
                        title="Pilih bulan periode gaji"
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/20 outline-none"
                    >
                        {MONTHS.map((month, index) => (
                            <option key={month} value={index}>{month}</option>
                        ))}
                    </select>
                    <select
                        title="Pilih tahun periode gaji"
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="border border-slate-200 bg-white rounded-lg px-3 py-1.5 text-sm font-semibold text-slate-800 shadow-sm focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/20 outline-none"
                    >
                        {years.map(year => <option key={year} value={year}>{year}</option>)}
                    </select>
                </div>
            </div>

            {/* Summary Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Total Karyawan */}
                <div
                    onClick={() => setSelectedStatusFilter('all')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatusFilter === 'all' ? 'border-[#06736a] bg-emerald-50/50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="flex items-center justify-between text-slate-500 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Total Karyawan</span>
                        <UserGroupIcon className="w-4 h-4 text-slate-400" />
                    </div>
                    <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                    <div className="text-xs text-slate-500 mt-1">Periode {MONTHS[selectedMonth]} {selectedYear}</div>
                </div>

                {/* Terbit / Dikunci */}
                <div
                    onClick={() => setSelectedStatusFilter('published')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatusFilter === 'published' ? 'border-green-600 bg-green-50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="flex items-center justify-between text-green-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Terbit & Dikunci</span>
                        <CheckCircleIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-green-800">{stats.published}</div>
                    <div className="text-xs text-green-600 mt-1">Slip Gaji Terbit</div>
                </div>

                {/* Draft */}
                <div
                    onClick={() => setSelectedStatusFilter('draft')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatusFilter === 'draft' ? 'border-amber-500 bg-amber-50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="flex items-center justify-between text-amber-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Siap Terbit (Draft)</span>
                        <DocumentTextIcon className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-bold text-amber-800">{stats.draft}</div>
                    <div className="text-xs text-amber-600 mt-1">Belum Dikunci</div>
                </div>

                {/* Kompensasi Belum Lengkap */}
                <div
                    onClick={() => setSelectedStatusFilter('incomplete')}
                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStatusFilter === 'incomplete' ? 'border-rose-500 bg-rose-50 shadow-sm' : 'border-slate-200/80 bg-slate-50/50 hover:bg-slate-100/50'}`}
                >
                    <div className="flex items-center justify-between text-rose-700 mb-1">
                        <span className="text-xs font-semibold uppercase tracking-wider">Belum Lengkap</span>
                        <ExclamationTriangleIcon className="w-4 h-4 text-rose-600" />
                    </div>
                    <div className="text-2xl font-bold text-rose-800">{stats.incomplete}</div>
                    <div className="text-xs text-rose-600 mt-1">Data Gaji Belum Diset</div>
                </div>
            </div>
        </div>
    );
};
