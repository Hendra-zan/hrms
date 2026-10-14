import React from 'react';
import { Employee, RotationPattern, ShiftDefinition } from '../../../../types.ts';
import { DayHeader } from '../types.ts';
import { COLOR_CLASSES } from '../constants.ts';

interface SchedulePreviewGridProps {
    selectedEmployeeIds: string[];
    selectedPattern: RotationPattern | undefined;
    employees: Employee[];
    dayHeaders: DayHeader[];
    startDate: string;
    sundayLockEmpIds: string[];
    staggerOffset: number;
    autoAlignDayOfWeek: boolean;
    unitShifts: ShiftDefinition[];
}

export const SchedulePreviewGrid: React.FC<SchedulePreviewGridProps> = ({
    selectedEmployeeIds,
    selectedPattern,
    employees,
    dayHeaders,
    startDate,
    sundayLockEmpIds,
    staggerOffset,
    autoAlignDayOfWeek,
    unitShifts,
}) => {
    const getShiftBadge = (shiftName: string) => {
        if (!shiftName || shiftName === 'OFF' || shiftName.toLowerCase() === 'libur') {
            return 'bg-gray-100 text-gray-600 border-gray-200';
        }
        const sDef = unitShifts.find(s => s.name.toLowerCase() === shiftName.toLowerCase());
        if (sDef) {
            return COLOR_CLASSES[sDef.color] || 'bg-teal-100 text-teal-800 border-teal-200';
        }
        return 'bg-teal-100 text-teal-800 border-teal-200';
    };

    const getPreviewShift = (empId: string, empIndex: number, dayHeader: DayHeader, dayIndex: number): string => {
        if (!selectedPattern) return '–';
        const dt = new Date(dayHeader.date);
        const isSunday = dt.getDay() === 0;
        if (sundayLockEmpIds.includes(empId) && isSunday) {
            return 'OFF';
        }
        const offset = empIndex * staggerOffset;
        let patternDay: number;
        if (autoAlignDayOfWeek) {
            const startDayOfWeek = (new Date(startDate).getDay() + 6) % 7;
            patternDay = (startDayOfWeek + dayIndex + offset) % selectedPattern.cycle_days;
        } else {
            patternDay = (dayIndex + offset) % selectedPattern.cycle_days;
        }
        return selectedPattern.pattern[patternDay] || '–';
    };

    return (
        <div>
            <label className="block text-sm font-bold text-gray-800 mb-2">
                👁️ Preview Rotasi Jadwal
            </label>
            {selectedEmployeeIds.length === 0 || !selectedPattern ? (
                <div className="p-6 border-2 border-dashed border-gray-200 rounded-xl text-center text-xs text-gray-400">
                    Pilih pola rotasi dan minimal 1 karyawan untuk melihat preview
                </div>
            ) : (
                <div className="border border-gray-200 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto max-h-44">
                        <table className="min-w-full text-xs text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-2 py-1.5 font-bold text-gray-700 sticky left-0 bg-gray-50 z-10 min-w-[90px]">
                                        Karyawan
                                    </th>
                                    {dayHeaders.slice(0, 14).map(h => (
                                        <th key={h.date} className={`px-1 py-1 text-center min-w-[28px] ${h.isWeekend ? 'bg-red-50 text-red-600' : 'text-gray-600'}`}>
                                            <div className="text-[8px]">{h.dayName}</div>
                                            <div className="font-bold text-[9px]">{h.dayNum}</div>
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {selectedEmployeeIds.slice(0, 5).map((empId, empIdx) => {
                                    const emp = employees.find(e => e.id === empId);
                                    if (!emp) return null;
                                    return (
                                        <tr key={empId} className="hover:bg-gray-50">
                                            <td className="px-2 py-1 font-medium text-gray-800 sticky left-0 bg-white z-10 truncate max-w-[90px]">
                                                {emp.nama}
                                            </td>
                                            {dayHeaders.slice(0, 14).map((h, dIdx) => {
                                                const shift = getPreviewShift(empId, empIdx, h, dIdx);
                                                const isOff = shift === 'OFF' || shift.toLowerCase() === 'libur';
                                                const badgeClass = getShiftBadge(shift);
                                                return (
                                                    <td key={h.date} className={`px-0.5 py-1 text-center ${h.isWeekend ? 'bg-red-50/30' : ''}`}>
                                                        <span className={`inline-block text-[8px] font-bold px-0.5 py-0.5 rounded border ${isOff ? 'bg-gray-50 text-gray-400 border-gray-200' : badgeClass}`}>
                                                            {isOff ? 'L' : shift.slice(0, 2).toUpperCase()}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {selectedEmployeeIds.length > 5 && (
                        <div className="text-[10px] text-center text-gray-400 py-1.5 border-t bg-gray-50">
                            +{selectedEmployeeIds.length - 5} karyawan lainnya tidak ditampilkan dalam preview
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
