import React, { useState, useMemo, useEffect } from 'react';
import { Employee } from '../../types';
import { EyeIcon, ClipboardDocumentListIcon, XMarkIcon } from '../icons';

interface ReportModeOverviewProps {
    searchTerm: string;
    setSearchTerm: (val: string) => void;
    selectedEmployeeId: string | null;
    setSelectedEmployeeId: (id: string | null) => void;
    isSearchDropdownOpen: boolean;
    setIsSearchDropdownOpen: (val: boolean) => void;
    matchingEmployees: Employee[];
    selectedEmployee: Employee | null;
    attendanceSummaryByEmployee: Map<string, { total: number; late: number; latestDate: string | null }>;
    onOpenEmployeeHistory?: (employee: Employee) => void;
    detailSectionRef: React.RefObject<HTMLElement>;
    normalizedSearchTerm: string;
    employees: Employee[];
}

const ReportModeOverview: React.FC<ReportModeOverviewProps> = ({
    searchTerm,
    setSearchTerm,
    selectedEmployeeId,
    setSelectedEmployeeId,
    isSearchDropdownOpen,
    setIsSearchDropdownOpen,
    matchingEmployees,
    selectedEmployee,
    attendanceSummaryByEmployee,
    onOpenEmployeeHistory,
    detailSectionRef,
    normalizedSearchTerm,
    employees = [],
}) => {
    const [selectedUnit, setSelectedUnit] = useState<string>('');
    const [selectedPosition, setSelectedPosition] = useState<string>('');
    const [currentPage, setCurrentPage] = useState<number>(1);
    const ITEMS_PER_PAGE = 12;

    // Ambil daftar unik Unit Kerja (departemen) & Jabatan dari data karyawan
    const uniqueUnits = useMemo(() => {
        return Array.from(new Set(employees.map(e => e.departemen).filter(Boolean))).sort();
    }, [employees]);

    const uniquePositions = useMemo(() => {
        return Array.from(new Set(employees.map(e => e.jabatan).filter(Boolean))).sort();
    }, [employees]);

    const normalizeText = (value?: string | null) => {
        return String(value ?? '')
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, ' ')
            .trim();
    };

    // Filter karyawan secara lokal dan real-time
    const filteredEmployees = useMemo(() => {
        return employees.filter(employee => {
            if (selectedUnit && employee.departemen !== selectedUnit) {
                return false;
            }
            if (selectedPosition && employee.jabatan !== selectedPosition) {
                return false;
            }
            if (searchTerm) {
                const normSearch = normalizeText(searchTerm);
                const normNama = normalizeText(employee.nama);
                const normNIK = normalizeText(employee.nik || '');
                const normJabatan = normalizeText(employee.jabatan || '');
                const normUnit = normalizeText(employee.departemen || '');
                return normNama.includes(normSearch) || normNIK.includes(normSearch) || normJabatan.includes(normSearch) || normUnit.includes(normSearch);
            }
            return true;
        });
    }, [employees, selectedUnit, selectedPosition, searchTerm]);

    // Reset ke halaman 1 setiap kali filter/search berubah
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedUnit, selectedPosition, searchTerm]);

    const totalPages = Math.ceil(filteredEmployees.length / ITEMS_PER_PAGE);

    const paginatedEmployees = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredEmployees.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredEmployees, currentPage]);

    const handleClearFilters = () => {
        setSearchTerm('');
        setSelectedUnit('');
        setSelectedPosition('');
        setSelectedEmployeeId(null);
    };

    return (
        <>
            {/* Panel Pencarian dan Filter Tingkat Lanjut */}
            <section className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center gap-2 border-b border-gray-100 pb-3">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-[#06736a]">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.602 10.602Z" />
                    </svg>
                    <h3 className="text-sm font-bold text-gray-800">Pencarian & Filter Karyawan</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    {/* Input Nama/NIK */}
                    <div className="relative">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Nama atau NIK</label>
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cari nama atau NIK..."
                                value={searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value);
                                    setSelectedEmployeeId(null);
                                }}
                                className="w-full rounded-lg border-gray-300 pl-3 pr-10 text-sm shadow-sm focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/20"
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={() => setSearchTerm('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <XMarkIcon className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Unit Kerja */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Unit Kerja</label>
                        <select
                            value={selectedUnit}
                            onChange={(e) => setSelectedUnit(e.target.value)}
                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/20"
                        >
                            <option value="">Semua Unit Kerja</option>
                            {uniqueUnits.map(unit => (
                                <option key={unit} value={unit}>{unit}</option>
                            ))}
                        </select>
                    </div>

                    {/* Filter Jabatan */}
                    <div>
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">Jabatan</label>
                        <select
                            value={selectedPosition}
                            onChange={(e) => setSelectedPosition(e.target.value)}
                            className="w-full rounded-lg border-gray-300 text-sm shadow-sm focus:border-[#06736a] focus:ring-2 focus:ring-[#06736a]/20"
                        >
                            <option value="">Semua Jabatan</option>
                            {uniquePositions.map(pos => (
                                <option key={pos} value={pos}>{pos}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Filter Info / Reset Button */}
                {(searchTerm || selectedUnit || selectedPosition) && (
                    <div className="flex items-center justify-between bg-emerald-50/50 rounded-lg p-2 px-3 text-xs border border-emerald-100">
                        <span className="text-emerald-800">
                            Ditemukan <strong>{filteredEmployees.length}</strong> karyawan yang cocok dengan kriteria filter.
                        </span>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="font-semibold text-[#06736a] hover:text-[#055f57] hover:underline"
                        >
                            Bersihkan Filter
                        </button>
                    </div>
                )}
            </section>

            {/* Grid Detail Laporan Kehadiran Karyawan */}
            <section ref={detailSectionRef as React.RefObject<HTMLDivElement>} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-gray-100 pb-3">
                    <div className="flex items-center gap-2">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-[#06736a]" />
                        <div>
                            <h3 className="text-sm font-bold text-gray-800">Daftar Laporan Kehadiran Personal</h3>
                            <p className="text-xs text-gray-500">Pilih karyawan untuk melihat histori absensi lengkap.</p>
                        </div>
                    </div>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full font-medium">
                        Total: {filteredEmployees.length} Karyawan
                    </span>
                </div>

                {paginatedEmployees.length === 0 ? (
                    <div className="py-12 text-center">
                        <p className="text-sm text-gray-500">Tidak ada karyawan yang cocok dengan kriteria pencarian.</p>
                        <button
                            type="button"
                            onClick={handleClearFilters}
                            className="mt-3 text-xs font-semibold text-[#06736a] hover:underline"
                        >
                            Tampilkan Semua Karyawan
                        </button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
                            {paginatedEmployees.map((employee) => {
                                const summary = attendanceSummaryByEmployee.get(employee.id);
                                return (
                                    <div key={employee.id} className="flex flex-col justify-between rounded-xl border border-gray-100 bg-gray-50 p-4 hover:border-[#06736a]/30 hover:bg-white hover:shadow-md transition-all duration-200">
                                        <div>
                                            <div className="flex items-start gap-3">
                                                <img
                                                    src={employee.foto || `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.nama)}&background=random`}
                                                    alt={employee.nama}
                                                    className="h-12 w-12 rounded-lg object-cover border border-gray-200 shadow-sm"
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="truncate text-sm font-bold text-gray-900" title={employee.nama}>{employee.nama}</p>
                                                    <p className="truncate text-xs text-gray-500" title={`${employee.jabatan} · ${employee.departemen}`}>
                                                        {employee.jabatan}
                                                    </p>
                                                    <p className="truncate text-[11px] text-[#06736a] font-medium mt-0.5">
                                                        {employee.departemen}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-1">NIK: {employee.nik || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 grid grid-cols-3 gap-1.5 border-t border-b border-gray-100 py-3 my-3 text-[11px]">
                                                <div className="text-center">
                                                    <p className="text-gray-400 text-[10px] uppercase font-semibold">Hadir</p>
                                                    <p className="font-bold text-gray-800 mt-0.5">{summary?.total || 0}</p>
                                                </div>
                                                <div className="text-center border-l border-r border-gray-100">
                                                    <p className="text-gray-400 text-[10px] uppercase font-semibold">Telat</p>
                                                    <p className={`font-bold mt-0.5 ${(summary?.late || 0) > 0 ? 'text-rose-600' : 'text-gray-800'}`}>
                                                        {summary?.late || 0}
                                                    </p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-gray-400 text-[10px] uppercase font-semibold">Akhir</p>
                                                    <p className="font-bold text-gray-800 mt-0.5 truncate" title={summary?.latestDate || '-'}>
                                                        {summary?.latestDate ? summary.latestDate.split('-').slice(1).join('/') : '-'}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => onOpenEmployeeHistory?.(employee)}
                                            className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#06736a] px-3 py-2 text-xs font-semibold text-white hover:bg-[#055f57] active:scale-[0.98] transition-transform duration-150 shadow-sm"
                                        >
                                            <EyeIcon className="h-3.5 w-3.5" />
                                            Lihat Detail Laporan
                                        </button>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Pagination Kontrol */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-between border-t border-gray-100 pt-4 mt-6">
                                <p className="text-xs text-gray-500">
                                    Halaman <strong>{currentPage}</strong> dari <strong>{totalPages}</strong> (Total <strong>{filteredEmployees.length}</strong> karyawan)
                                </p>
                                <div className="inline-flex gap-1">
                                    <button
                                        type="button"
                                        disabled={currentPage === 1}
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Sebelumnya
                                    </button>
                                    <button
                                        type="button"
                                        disabled={currentPage === totalPages}
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Selanjutnya
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </section>
        </>
    );
};

export default ReportModeOverview;
