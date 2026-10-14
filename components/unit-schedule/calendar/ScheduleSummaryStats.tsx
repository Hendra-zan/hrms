import React from 'react';
import { ScheduleSummary } from '../../../services/scheduleService.ts';
import { ShiftDefinition } from '../../../types.ts';
import { COLOR_CLASSES } from './constants.ts';

interface ScheduleSummaryStatsProps {
    summary: ScheduleSummary | null;
    unitShifts: ShiftDefinition[];
}

export const ScheduleSummaryStats: React.FC<ScheduleSummaryStatsProps> = ({ summary, unitShifts }) => {
    if (!summary || summary.totalDays === 0) return null;

    const getShiftCellStyle = (shiftName?: string | null): string => {
        if (!shiftName) return 'bg-gray-100 text-gray-600';
        const sLower = String(shiftName).toLowerCase();
        if (sLower === 'libur' || sLower === 'off') return 'bg-gray-50 text-gray-400';
        if (sLower.includes('cuti') || sLower.includes('izin') || sLower.includes('sakit')) {
            return 'bg-sky-100 text-sky-800 border-sky-300 font-bold shadow-xs';
        }
        const def = unitShifts.find(s => s.name === shiftName);
        return def ? `${COLOR_CLASSES[def.color]} font-semibold` : 'bg-gray-100 text-gray-600';
    };

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap gap-2">
                <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium border border-blue-200">
                    Total: {summary.totalDays} slot
                </span>
                <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-lg font-medium border border-amber-200">
                    Draft: {summary.draftDays}
                </span>
                <span className="px-2.5 py-1 bg-green-50 text-green-700 rounded-lg font-medium border border-green-200">
                    Published: {summary.publishedDays}
                </span>
                <span className="px-2.5 py-1 bg-gray-50 text-gray-600 rounded-lg font-medium border border-gray-200">
                    Libur: {summary.offDays}
                </span>
            </div>

            {/* Shift Legend Bar */}
            <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="font-bold text-gray-600 text-[11px]">🏷️ Kode:</span>
                {unitShifts.map(s => {
                    const code = s.code || s.name.slice(0, 2).toUpperCase();
                    const style = getShiftCellStyle(s.name);
                    return (
                        <span
                            key={s.id}
                            className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] ${style}`}
                            title={`${s.name} (${s.startTime || '??'}-${s.endTime || '??'})`}
                        >
                            [{code}] {s.name}
                        </span>
                    );
                })}
                <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-gray-100 text-gray-500 border border-gray-200">
                    [LIB] Libur
                </span>
                <span className="px-1.5 py-0.5 rounded font-mono font-bold text-[10px] bg-sky-100 text-sky-800 border border-sky-300">
                    [CT] Cuti
                </span>
            </div>
        </div>
    );
};
