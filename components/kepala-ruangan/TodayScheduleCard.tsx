import React from 'react';
import { Employee, ShiftDefinition } from '../../types.ts';

interface TodayScheduleCardProps {
    employees: Employee[];
    unitShifts: ShiftDefinition[];
    todayScheduleMap: Record<string, string>;
}

const SHIFT_BADGE_COLORS: Record<string, string> = {
    yellow:  'bg-amber-100 text-amber-800 ring-amber-300',
    blue:    'bg-blue-100 text-blue-800 ring-blue-300',
    indigo:  'bg-indigo-100 text-indigo-800 ring-indigo-300',
    green:   'bg-emerald-100 text-emerald-800 ring-emerald-300',
    red:     'bg-red-100 text-red-800 ring-red-300',
    purple:  'bg-purple-100 text-purple-800 ring-purple-300',
    orange:  'bg-orange-100 text-orange-800 ring-orange-300',
    pink:    'bg-pink-100 text-pink-800 ring-pink-300',
    teal:    'bg-teal-100 text-teal-800 ring-teal-300',
    gray:    'bg-gray-100 text-gray-700 ring-gray-300',
};

const TodayScheduleCard: React.FC<TodayScheduleCardProps> = ({ employees, unitShifts, todayScheduleMap }) => {
    const safeEmployees = employees || [];
    const safeUnitShifts = unitShifts || [];
    const safeTodayScheduleMap = todayScheduleMap || {};

    const today = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' });

    const getShiftBadgeClass = (shiftName: string) => {
        const def = Array.isArray(safeUnitShifts) ? safeUnitShifts.find(s => s.name === shiftName) : undefined;
        const colorKey = def?.color || 'gray';
        return SHIFT_BADGE_COLORS[colorKey] || SHIFT_BADGE_COLORS['gray'];
    };

    const getShiftTime = (shiftName: string) => {
        const def = Array.isArray(safeUnitShifts) ? safeUnitShifts.find(s => s.name === shiftName) : undefined;
        if (!def) return null;
        if (def.type === 'rotating' && def.startTime && def.endTime) {
            return `${def.startTime} – ${def.endTime}`;
        }
        return null;
    };

    return (
        <div className="rounded-2xl bg-white shadow-md border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#06736a] to-teal-500 text-white shadow-sm">
                        <span className="text-lg">📅</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Jadwal Hari Ini</h2>
                        <p className="text-xs text-gray-500 capitalize">{today}</p>
                    </div>
                </div>
                <span className="rounded-full bg-[#06736a]/10 px-3 py-1 text-xs font-semibold text-[#06736a]">
                    {safeEmployees.length} Karyawan
                </span>
            </div>

            {/* Body */}
            {safeEmployees.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
                    <span className="text-4xl mb-2">👥</span>
                    <p className="text-sm font-medium">Belum ada karyawan di unit ini</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 text-xs text-gray-500 uppercase tracking-wide">
                                <th className="px-5 py-3 text-left font-semibold">Karyawan</th>
                                <th className="px-5 py-3 text-left font-semibold">Jabatan</th>
                                <th className="px-5 py-3 text-left font-semibold">Shift</th>
                                <th className="px-5 py-3 text-left font-semibold">Jam</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {safeEmployees.filter(Boolean).map((emp, idx) => {
                                const shiftName = safeTodayScheduleMap[emp.id] || emp.shift || 'Tidak Diatur';
                                const badgeClass = getShiftBadgeClass(shiftName);
                                const shiftTime = getShiftTime(shiftName);

                                return (
                                    <tr
                                        key={emp.id}
                                        className={`transition-colors hover:bg-gray-50/80 ${idx % 2 === 0 ? '' : 'bg-gray-50/30'}`}
                                    >
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                {emp.foto ? (
                                                    <img
                                                        src={emp.foto}
                                                        alt={emp.nama}
                                                        className="h-8 w-8 rounded-full object-cover ring-2 ring-white shadow"
                                                    />
                                                ) : (
                                                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#06736a] to-teal-400 text-xs font-bold text-white shadow ring-2 ring-white">
                                                        {emp.nama?.charAt(0)?.toUpperCase() || '?'}
                                                    </div>
                                                )}
                                                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap">{emp.nama}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3.5 text-sm text-gray-500 whitespace-nowrap">
                                            {emp.jabatan || '-'}
                                        </td>
                                        <td className="px-5 py-3.5">
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${badgeClass}`}>
                                                {shiftName}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                                            {shiftTime || '—'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default TodayScheduleCard;
