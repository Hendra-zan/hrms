import React from 'react';
import { EmployeePayrollItem } from '../types.ts';

interface PayrollTableProps {
    filteredEmployeePayrollData: EmployeePayrollItem[];
    handleGeneratePayslip: (emp: EmployeePayrollItem) => void;
    hasActiveFilters: boolean;
    clearFilters: () => void;
}

const MagnifyingGlassIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

export const PayrollTable: React.FC<PayrollTableProps> = ({
    filteredEmployeePayrollData,
    handleGeneratePayslip,
    hasActiveFilters,
    clearFilters,
}) => {
    return (
        <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Karyawan</th>
                            <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Jabatan & Departemen</th>
                            <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status Slip</th>
                            <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Jam Kerja</th>
                            <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Lembur</th>
                            <th className="px-6 py-3.5 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Keterlambatan</th>
                            <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-600 uppercase tracking-wider">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredEmployeePayrollData.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="p-3 bg-slate-100 rounded-full mb-3 text-slate-400">
                                            <MagnifyingGlassIcon className="w-8 h-8" />
                                        </div>
                                        <p className="text-sm font-semibold text-slate-700">Tidak ada karyawan yang sesuai filter</p>
                                        <p className="text-xs text-slate-500 mt-1">Coba ubah atau hapus kata kunci pencarian / filter Anda.</p>
                                        {hasActiveFilters && (
                                            <button
                                                onClick={clearFilters}
                                                className="mt-3 px-3 py-1.5 bg-[#06736a] text-white text-xs font-semibold rounded-lg hover:bg-[#054f46] transition-colors"
                                            >
                                                Reset Semua Filter
                                            </button>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            filteredEmployeePayrollData.map(emp => (
                                <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-slate-900">{emp.nama}</div>
                                        <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                                            {(emp as any).nik && <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[11px] text-slate-600">NIK: {(emp as any).nik}</span>}
                                            <span>{emp.email}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-slate-800">{emp.jabatan || '-'}</div>
                                        <div className="text-xs text-[#06736a] font-semibold mt-0.5">{emp.departemen || '-'}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        {emp.isSaved ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                                                🔐 Terbit
                                            </span>
                                        ) : emp.compensation ? (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                                📄 Draft
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                                ⚠️ Kompensasi Kosong
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center font-medium">{emp.totalHours} jam</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 text-center font-medium">{emp.totalOvertime} jam</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                        <span className={`font-semibold px-2 py-0.5 rounded-md text-xs ${emp.totalLate > 0 ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                            {emp.totalLate} hari
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <button
                                            onClick={() => handleGeneratePayslip(emp)}
                                            className="px-3.5 py-1.5 bg-[#06736a] text-white text-xs font-semibold rounded-xl hover:bg-[#054f46] transition-all shadow-sm hover:shadow disabled:bg-slate-300 disabled:shadow-none disabled:cursor-not-allowed"
                                            disabled={!emp.compensation}
                                            title={!emp.compensation ? 'Data kompensasi tidak lengkap' : emp.isSaved ? 'Lihat Slip Gaji' : 'Buat Slip Gaji'}
                                        >
                                            {emp.isSaved ? '👁️ Lihat Slip Gaji' : '📝 Buat Slip Gaji'}
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
