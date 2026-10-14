import React from 'react';
import { Employee, EmployeeSchedule, ShiftDefinition } from '../../../types.ts';
import { DayHeader, WeeklyViolation, FatigueViolation, DraggedCellState, DragOverTargetState } from './types.ts';
import { COLOR_CLASSES } from './constants.ts';

interface CalendarGridTableProps {
    employees: Employee[];
    filteredEmployees: Employee[];
    dayHeaders: DayHeader[];
    daysInMonth: number;
    scheduleGrid: Record<string, Record<string, EmployeeSchedule>>;
    weeklyViolations: Record<string, WeeklyViolation[]>;
    fatigueViolations: Record<string, FatigueViolation[]>;
    unitShifts: ShiftDefinition[];
    draggedCell: DraggedCellState | null;
    dragOverTarget: DragOverTargetState | null;
    onResetEmployeeMonth: (emp: Employee) => void;
    onCellClick: (emp: Employee, dateStr: string, sched?: EmployeeSchedule) => void;
    onDragStart: (e: React.DragEvent, emp: Employee, dateStr: string, sched?: EmployeeSchedule) => void;
    onDragOver: (e: React.DragEvent, empId: string, dateStr: string) => void;
    onDrop: (e: React.DragEvent, emp: Employee, dateStr: string) => void;
    onDragEnd: () => void;
}

export const CalendarGridTable: React.FC<CalendarGridTableProps> = ({
    employees,
    filteredEmployees,
    dayHeaders,
    daysInMonth,
    scheduleGrid,
    weeklyViolations,
    fatigueViolations,
    unitShifts,
    draggedCell,
    dragOverTarget,
    onResetEmployeeMonth,
    onCellClick,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}) => {
    const getShiftCellStyle = (shiftName?: string | null): string => {
        if (!shiftName) return 'bg-gray-100 text-gray-600 text-[9px]';
        const sLower = String(shiftName).toLowerCase();
        if (sLower === 'libur' || sLower === 'off') return 'bg-gray-50 text-gray-400 text-[9px]';
        if (sLower.includes('cuti') || sLower.includes('izin') || sLower.includes('sakit')) {
            return 'bg-sky-100 text-sky-800 border-sky-300 font-bold text-[9px] shadow-xs';
        }
        const def = unitShifts.find(s => s.name === shiftName);
        return def ? `${COLOR_CLASSES[def.color]} text-[9px] font-semibold` : 'bg-gray-100 text-gray-600 text-[9px]';
    };

    const getShiftCode = (sched: EmployeeSchedule): string => {
        const sName = sched.shift_name || '';
        const sLower = sName.toLowerCase();
        if (sLower.includes('cuti') || sLower.includes('izin') || sLower.includes('sakit')) {
            return 'CT';
        }
        if (sched.is_off_day || sLower === 'libur' || sLower === 'off') {
            return 'LIB';
        }
        const shiftDef = unitShifts.find(s => s.name === sName);
        if (shiftDef && shiftDef.code) {
            return shiftDef.code;
        }
        return sName.slice(0, 2).toUpperCase();
    };

    return (
        <div className="space-y-3">
            {/* Helper Banner for Drag & Drop Shift */}
            <div className="bg-teal-50/80 border border-teal-200 rounded-xl px-3.5 py-2 text-xs text-teal-800 flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <span>
                        <b>Petunjuk Drag & Drop:</b> Klik & tahan (drag) kode shift karyawan pada suatu tanggal, lalu geser ke tanggal lain pada <u>baris karyawan yang sama</u> untuk menukar shift.
                    </span>
                </div>
                <span className="text-[10px] font-mono font-semibold text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-300">
                    Sync Tag: HRMS-PRO-DND-SHIFT-SYNC-20260803
                </span>
            </div>

            {/* Calendar grid */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-center text-xs">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="sticky left-0 bg-gray-50 z-10 px-3 py-2 text-left text-xs font-semibold text-gray-600 min-w-[140px]">
                                    Karyawan
                                </th>
                                {dayHeaders.map(h => (
                                    <th
                                        key={h.date}
                                        className={`px-0.5 py-1.5 min-w-[36px] ${h.isWeekend ? 'bg-red-50' : ''}`}
                                    >
                                        <div className="text-[9px] text-gray-400">{h.dayName}</div>
                                        <div className={`text-xs font-bold ${h.isWeekend ? 'text-red-500' : 'text-gray-700'}`}>
                                            {h.dayNum}
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredEmployees.length === 0 ? (
                                <tr>
                                    <td colSpan={daysInMonth + 1} className="py-8 text-gray-500 text-center">
                                        Tidak ada karyawan yang sesuai filter
                                    </td>
                                </tr>
                            ) : (
                                filteredEmployees.map(emp => (
                                    <tr key={emp.id} className="hover:bg-gray-50/50">
                                        <td className="sticky left-0 bg-white z-10 px-3 py-1.5 text-left border-r border-gray-100 group">
                                            <div className="flex flex-col gap-0.5">
                                                <div className="flex items-center justify-between gap-1">
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                        {emp.foto && emp.foto.startsWith('http') ? (
                                                            <img
                                                                src={emp.foto}
                                                                alt=""
                                                                className="w-5 h-5 rounded-full object-cover flex-shrink-0"
                                                            />
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-[#06736a]/10 text-[#06736a] font-bold flex items-center justify-center text-[10px] flex-shrink-0 border border-[#06736a]/20">
                                                                {emp.nama.charAt(0)}
                                                            </div>
                                                        )}
                                                        <span className="text-xs font-medium text-gray-800 truncate max-w-[85px]">
                                                            {emp.nama}
                                                        </span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => onResetEmployeeMonth(emp)}
                                                        className="text-[11px] p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                                                        title={`Reset draf/override jadwal ${emp.nama} bulan ini`}
                                                    >
                                                        🔄
                                                    </button>
                                                </div>

                                                {/* Weekly Warnings */}
                                                {weeklyViolations[emp.id] && weeklyViolations[emp.id].length > 0 && (
                                                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                        {weeklyViolations[emp.id].map(v => (
                                                            <span
                                                                key={v.weekNum}
                                                                className="text-[9px] font-bold bg-rose-100 text-rose-700 rounded px-1"
                                                                title={`Minggu ke-${v.weekNum} melebihi batas jam kerja: ${v.totalHours} jam`}
                                                            >
                                                                ⚠️ {v.totalHours}j (W{v.weekNum})
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Fatigue Warnings */}
                                                {fatigueViolations[emp.id] && fatigueViolations[emp.id].length > 0 && (
                                                    <div className="flex flex-wrap gap-0.5 mt-0.5">
                                                        {fatigueViolations[emp.id].map(v => (
                                                            <span
                                                                key={v.date}
                                                                className="text-[9px] font-bold bg-amber-100 text-amber-700 rounded px-1"
                                                                title={`Istirahat kurang (<11 jam) antara tanggal ${v.date} dan ${v.nextDate} (${v.restHours.toFixed(1)} jam)`}
                                                            >
                                                                ⚠️ Fatigue ({v.date.slice(8)})
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        {dayHeaders.map(h => {
                                            const sched = scheduleGrid[emp.id]?.[h.date];
                                            const isSameEmp = draggedCell ? draggedCell.employeeId === emp.id : true;
                                            const isOverThisCell = dragOverTarget?.employeeId === emp.id && dragOverTarget?.date === h.date;
                                            const cellStyle = getShiftCellStyle(sched?.shift_name);
                                            const statusDot = sched?.status === 'draft' ? 'border-b-2 border-amber-400' :
                                                sched?.status === 'published' ? '' :
                                                sched?.status === 'swapped' ? 'border-b-2 border-purple-400' :
                                                'border-b-2 border-orange-400';

                                            return (
                                                <td
                                                    key={h.date}
                                                    onDragOver={(e) => onDragOver(e, emp.id, h.date)}
                                                    onDrop={(e) => onDrop(e, emp, h.date)}
                                                    className={`px-0.5 py-1 transition-all ${h.isWeekend ? 'bg-red-50/30' : ''} ${
                                                        draggedCell && !isSameEmp ? 'opacity-25 select-none cursor-not-allowed pointer-events-none' : ''
                                                    } ${isOverThisCell ? 'bg-teal-100 ring-2 ring-teal-500 rounded' : ''}`}
                                                >
                                                    <span
                                                        draggable={true}
                                                        onDragStart={(e) => onDragStart(e, emp, h.date, sched)}
                                                        onDragEnd={onDragEnd}
                                                        onClick={() => onCellClick(emp, h.date, sched)}
                                                        className={`inline-block px-1 py-0.5 rounded ${cellStyle} ${statusDot} cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-teal-500 transition-all font-mono font-bold select-none ${
                                                            isOverThisCell ? 'scale-110 shadow-md ring-2 ring-teal-600' : ''
                                                        }`}
                                                        title={`💡 Klik & Geser ke tanggal lain pada baris ${emp.nama} ini untuk menukar shift\nAtau Klik untuk edit modal\n${sched ? sched.shift_name + ' (' + sched.status + ')' : 'Kosong'}`}
                                                    >
                                                        {sched ? getShiftCode(sched) : '–'}
                                                    </span>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
