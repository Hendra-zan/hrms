import React from 'react';
import { ShiftDefinition } from '../../types.ts';

const SHIFT_GRADIENT_MAP: Record<string, string> = {
    yellow:  'from-yellow-400 to-amber-500',
    blue:    'from-blue-400 to-blue-600',
    indigo:  'from-indigo-400 to-indigo-600',
    green:   'from-emerald-400 to-green-600',
    red:     'from-red-400 to-rose-600',
    purple:  'from-purple-400 to-purple-600',
    orange:  'from-orange-400 to-orange-600',
    pink:    'from-pink-400 to-pink-600',
    teal:    'from-teal-400 to-teal-600',
    gray:    'from-gray-400 to-gray-500',
};

const SHIFT_SOFT_MAP: Record<string, { bg: string; text: string; border: string; dot: string }> = {
    yellow:  { bg: 'bg-amber-50',   text: 'text-amber-700',   border: 'border-amber-200',  dot: 'bg-amber-400' },
    blue:    { bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200',   dot: 'bg-blue-400' },
    indigo:  { bg: 'bg-indigo-50',  text: 'text-indigo-700',  border: 'border-indigo-200', dot: 'bg-indigo-400' },
    green:   { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200',dot: 'bg-emerald-400' },
    red:     { bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200',    dot: 'bg-red-400' },
    purple:  { bg: 'bg-purple-50',  text: 'text-purple-700',  border: 'border-purple-200', dot: 'bg-purple-400' },
    orange:  { bg: 'bg-orange-50',  text: 'text-orange-700',  border: 'border-orange-200', dot: 'bg-orange-400' },
    pink:    { bg: 'bg-pink-50',    text: 'text-pink-700',    border: 'border-pink-200',   dot: 'bg-pink-400' },
    teal:    { bg: 'bg-teal-50',    text: 'text-teal-700',    border: 'border-teal-200',   dot: 'bg-teal-400' },
    gray:    { bg: 'bg-gray-50',    text: 'text-gray-600',    border: 'border-gray-200',   dot: 'bg-gray-400' },
};

interface ShiftDistributionCardProps {
    shiftStats: Record<string, number>;
    unitShifts: ShiftDefinition[];
}

const ShiftDistributionCard: React.FC<ShiftDistributionCardProps> = ({ shiftStats = {}, unitShifts = [] }) => {
    const total = Object.values(shiftStats || {}).reduce((a, b) => a + b, 0);
    const entries = Object.entries(shiftStats || {});

    return (
        <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#06736a] to-[#089c8e] text-white shadow-sm">
                        <span className="text-lg">📊</span>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-800">Distribusi Shift</h2>
                        <p className="text-xs text-gray-500">Hari ini · {total} karyawan</p>
                    </div>
                </div>
            </div>

            {entries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                    <span className="text-4xl mb-2">📋</span>
                    <p className="text-sm">Belum ada data shift</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {entries.map(([name, count]) => {
                        const def = Array.isArray(unitShifts) ? unitShifts.find(s => s.name === name) : undefined;
                        const colorKey = def?.color || 'gray';
                        const soft = SHIFT_SOFT_MAP[colorKey] || SHIFT_SOFT_MAP['gray'];
                        const gradient = SHIFT_GRADIENT_MAP[colorKey] || SHIFT_GRADIENT_MAP['gray'];
                        const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                        const timeLabel = def?.type === 'rotating'
                            ? `${def.startTime || '?'} – ${def.endTime || '?'}`
                            : def?.type === 'fixed' ? 'Jadwal tetap' : '';

                        return (
                            <div key={name} className={`rounded-xl border p-3.5 ${soft.bg} ${soft.border}`}>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2.5">
                                        <div className={`h-3 w-3 rounded-full ${soft.dot} shadow-sm`} />
                                        <div>
                                            <span className={`text-sm font-semibold ${soft.text}`}>{name}</span>
                                            {timeLabel && (
                                                <span className="ml-2 text-xs text-gray-500">{timeLabel}</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-lg font-bold ${soft.text}`}>{count}</span>
                                        <span className="text-xs text-gray-400">({percent}%)</span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="h-1.5 w-full rounded-full bg-white/70 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full bg-gradient-to-r ${gradient} transition-all duration-500`}
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ShiftDistributionCard;
