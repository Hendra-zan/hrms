import React from 'react';
import { EmployeeSchedule, ShiftDefinition } from '../../../types.ts';
import { DayHeader } from './types.ts';

interface ScheduleCoverageAlertProps {
    schedules: EmployeeSchedule[];
    dayHeaders: DayHeader[];
    unitShifts: ShiftDefinition[];
}

export const ScheduleCoverageAlert: React.FC<ScheduleCoverageAlertProps> = ({
    schedules,
    dayHeaders,
    unitShifts,
}) => {
    // Build coverage map: date -> shift_name -> count
    const cov: Record<string, Record<string, number>> = {};
    schedules.forEach(s => {
        if (s.is_off_day) return;
        const d = s.schedule_date;
        if (!cov[d]) cov[d] = {};
        cov[d][s.shift_name] = (cov[d][s.shift_name] || 0) + 1;
    });

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Makassar' });
    type Gap = { date: string; missing: string[] };
    const gaps: Gap[] = [];

    dayHeaders.forEach(h => {
        if (h.date < todayStr) return; // skip past dates
        const dayCov = cov[h.date] || {};
        const missing = unitShifts
            .filter(s => (dayCov[s.name] || 0) === 0)
            .map(s => s.name);
        if (missing.length > 0 && Object.keys(dayCov).length > 0) {
            gaps.push({ date: h.date, missing });
        }
    });

    if (gaps.length === 0) return null;

    return (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
            <p className="text-xs font-semibold text-amber-800 mb-2">
                ⚠️ Peringatan Coverage Shift — {gaps.length} hari memiliki shift yang kosong:
            </p>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {gaps.slice(0, 20).map(g => (
                    <span
                        key={g.date}
                        className="text-[10px] bg-white border border-amber-300 px-2 py-0.5 rounded font-medium text-amber-700"
                    >
                        {g.date.slice(8)} → tanpa: {g.missing.join(', ')}
                    </span>
                ))}
                {gaps.length > 20 && (
                    <span className="text-[10px] text-amber-600 italic px-2">
                        +{gaps.length - 20} hari lagi…
                    </span>
                )}
            </div>
        </div>
    );
};
