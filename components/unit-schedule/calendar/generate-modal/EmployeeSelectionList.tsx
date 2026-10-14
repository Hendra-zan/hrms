import React from 'react';
import { Employee, EmployeeSchedule } from '../../../../types.ts';

interface EmployeeSelectionListProps {
    employees: Employee[];
    schedules: EmployeeSchedule[];
    selectedEmployeeIds: string[];
    setSelectedEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
    sundayLockEmpIds: string[];
    setSundayLockEmpIds: React.Dispatch<React.SetStateAction<string[]>>;
    genSearchQuery: string;
    setGenSearchQuery: (val: string) => void;
    genJabatanFilter: string;
    setGenJabatanFilter: (val: string) => void;
}

export const EmployeeSelectionList: React.FC<EmployeeSelectionListProps> = ({
    employees,
    schedules,
    selectedEmployeeIds,
    setSelectedEmployeeIds,
    sundayLockEmpIds,
    setSundayLockEmpIds,
    genSearchQuery,
    setGenSearchQuery,
    genJabatanFilter,
    setGenJabatanFilter,
}) => {
    const jabatanGroups = ['ALL', ...new Set(employees.map(e => e.jabatan).filter(Boolean) as string[])];
    const filteredGenEmployees = employees.filter(emp => {
        if (genJabatanFilter !== 'ALL' && emp.jabatan !== genJabatanFilter) return false;
        if (genSearchQuery.trim() && !emp.nama.toLowerCase().includes(genSearchQuery.toLowerCase())) return false;
        return true;
    });

    const grouped: Record<string, typeof employees> = {};
    filteredGenEmployees.forEach(emp => {
        const key = emp.jabatan || 'Staf';
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(emp);
    });

    const publishedEmpIds = new Set(schedules.filter(s => s.status === 'published').map(s => s.employee_id));
    const draftEmpIds = new Set(schedules.filter(s => s.status === 'draft').map(s => s.employee_id));

    return (
        <div>
            <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-bold text-gray-800">
                    👥 Pilih Karyawan & Kunci Minggu
                </label>
                <span className="text-xs font-semibold px-2.5 py-1 bg-teal-100 text-teal-700 rounded-full">
                    {selectedEmployeeIds.length}/{employees.length} dipilih ({sundayLockEmpIds.length} Minggu OFF)
                </span>
            </div>

            {/* Search + Jabatan filter */}
            <div className="flex gap-2 mb-2">
                <input
                    type="text"
                    placeholder="🔍 Cari nama..."
                    value={genSearchQuery}
                    onChange={e => setGenSearchQuery(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a] outline-none"
                />
                <select
                    value={genJabatanFilter}
                    onChange={e => setGenJabatanFilter(e.target.value)}
                    className="px-2 py-1.5 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a] outline-none font-medium"
                >
                    <option value="ALL">Semua Jabatan</option>
                    {jabatanGroups.filter(j => j !== 'ALL').map(j => (
                        <option key={j} value={j}>{j}</option>
                    ))}
                </select>
            </div>

            {/* Quick actions */}
            <div className="flex flex-wrap gap-2 mb-2">
                <button
                    type="button"
                    onClick={() => setSelectedEmployeeIds(employees.map(e => e.id))}
                    className="px-2.5 py-1.5 text-xs bg-teal-50 border border-teal-200 text-teal-700 rounded-lg hover:bg-teal-100 font-semibold transition-colors"
                >
                    ✓ Pilih Semua
                </button>
                <button
                    type="button"
                    onClick={() => { setSelectedEmployeeIds([]); setSundayLockEmpIds([]); }}
                    className="px-2.5 py-1.5 text-xs bg-gray-50 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-100 font-semibold transition-colors"
                >
                    ✗ Hapus Semua
                </button>
                <button
                    type="button"
                    onClick={() => setSelectedEmployeeIds(employees.filter(e => !publishedEmpIds.has(e.id)).map(e => e.id))}
                    className="px-2.5 py-1.5 text-xs bg-blue-50 border border-blue-200 text-blue-700 rounded-lg hover:bg-blue-100 font-semibold transition-colors"
                >
                    📋 Tanpa Published
                </button>
                <button
                    type="button"
                    onClick={() => {
                        const autoIds = employees.filter(e => {
                            const j = (e.jabatan || '').toLowerCase();
                            return j.includes('karu') || j.includes('kepala') || j.includes('admin') || j.includes('poli') || j.includes('staf');
                        }).map(e => e.id);
                        setSundayLockEmpIds(prev => [...new Set([...prev, ...autoIds])]);
                    }}
                    className="px-2.5 py-1.5 text-xs bg-amber-50 border border-amber-300 text-amber-800 rounded-lg hover:bg-amber-100 font-semibold transition-colors flex items-center gap-1 shadow-xs"
                    title="Otomatis kunci Hari Minggu = LIBUR untuk Staf Admin / Karu / Non-Shift"
                >
                    🛡️ Auto Minggu OFF Admin/Karu
                </button>
            </div>

            {/* Grouped Employee List */}
            <div className="border border-gray-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
                {Object.entries(grouped).map(([jabatan, emps]) => (
                    <div key={jabatan}>
                        <div className="px-3 py-1.5 bg-gray-100 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const groupIds = emps.map(e => e.id);
                                        const allSelected = groupIds.every(id => selectedEmployeeIds.includes(id));
                                        if (allSelected) {
                                            setSelectedEmployeeIds(prev => prev.filter(id => !groupIds.includes(id)));
                                            setSundayLockEmpIds(prev => prev.filter(id => !groupIds.includes(id)));
                                        } else {
                                            setSelectedEmployeeIds(prev => [...new Set([...prev, ...groupIds])]);
                                        }
                                    }}
                                    className="w-3.5 h-3.5 rounded border border-gray-400 flex items-center justify-center bg-white flex-shrink-0"
                                >
                                    {emps.every(e => selectedEmployeeIds.includes(e.id)) && (
                                        <div className="w-2 h-2 rounded-sm bg-[#06736a]" />
                                    )}
                                </button>
                                <span className="text-[10px] font-bold text-gray-600 uppercase tracking-wide">{jabatan}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => {
                                        const groupIds = emps.map(e => e.id);
                                        const allLocked = groupIds.every(id => sundayLockEmpIds.includes(id));
                                        if (allLocked) {
                                            setSundayLockEmpIds(prev => prev.filter(id => !groupIds.includes(id)));
                                        } else {
                                            setSundayLockEmpIds(prev => [...new Set([...prev, ...groupIds])]);
                                        }
                                    }}
                                    className="text-[9px] text-amber-700 hover:underline font-semibold"
                                    title="Toggle Kunci Minggu OFF untuk seluruh grup ini"
                                >
                                    🛡️ Minggu OFF Grup
                                </button>
                                <span className="text-[9px] text-gray-400 font-medium">
                                    {emps.filter(e => selectedEmployeeIds.includes(e.id)).length}/{emps.length}
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {emps.map(emp => {
                                const hasPublished = publishedEmpIds.has(emp.id);
                                const hasDraft = draftEmpIds.has(emp.id);
                                const isChecked = selectedEmployeeIds.includes(emp.id);
                                const isSundayLocked = sundayLockEmpIds.includes(emp.id);

                                return (
                                    <div
                                        key={emp.id}
                                        className={`flex items-center justify-between gap-2 px-3 py-2 transition-colors ${
                                            isChecked ? 'bg-teal-50/50' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <label className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={isChecked}
                                                onChange={e => {
                                                    if (e.target.checked) {
                                                        setSelectedEmployeeIds(prev => [...prev, emp.id]);
                                                    } else {
                                                        setSelectedEmployeeIds(prev => prev.filter(id => id !== emp.id));
                                                        setSundayLockEmpIds(prev => prev.filter(id => id !== emp.id));
                                                    }
                                                }}
                                                className="rounded border-gray-300 text-[#06736a] focus:ring-[#06736a] w-3.5 h-3.5 flex-shrink-0"
                                            />
                                            <img
                                                src={emp.foto || 'https://ui-avatars.com/api/?name=' + encodeURIComponent(emp.nama) + '&size=24&background=06736a&color=fff'}
                                                alt=""
                                                className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-medium text-gray-800 truncate">{emp.nama}</p>
                                            </div>
                                        </label>

                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (!isChecked) {
                                                    setSelectedEmployeeIds(prev => [...prev, emp.id]);
                                                }
                                                setSundayLockEmpIds(prev =>
                                                    prev.includes(emp.id)
                                                    ? prev.filter(id => id !== emp.id)
                                                    : [...prev, emp.id]
                                                );
                                            }}
                                            className={`px-2 py-0.5 rounded text-[9px] font-bold border transition-all flex items-center gap-1 flex-shrink-0 ${
                                                isSundayLocked
                                                    ? 'bg-amber-100 text-amber-800 border-amber-300 shadow-xs'
                                                    : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-amber-50 hover:text-amber-700'
                                            }`}
                                            title={isSundayLocked ? 'Klik untuk membatalkan Kunci Hari Minggu OFF' : 'Klik untuk mengunci Hari Minggu selalu LIBUR (OFF)'}
                                        >
                                            <span>🛡️</span>
                                            <span>{isSundayLocked ? 'Minggu OFF' : '+ Minggu OFF'}</span>
                                        </button>

                                        <div className="flex gap-1 flex-shrink-0 ml-1">
                                            {hasPublished && <span className="text-[8px] px-1 py-0.5 bg-green-100 text-green-700 rounded font-bold">✓ Pub</span>}
                                            {!hasPublished && hasDraft && <span className="text-[8px] px-1 py-0.5 bg-amber-100 text-amber-700 rounded font-bold">Draft</span>}
                                            {!hasPublished && !hasDraft && <span className="text-[8px] px-1 py-0.5 bg-gray-100 text-gray-500 rounded">Baru</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
                {filteredGenEmployees.length === 0 && (
                    <div className="py-6 text-center text-xs text-gray-400">Tidak ada karyawan sesuai filter</div>
                )}
            </div>
        </div>
    );
};
