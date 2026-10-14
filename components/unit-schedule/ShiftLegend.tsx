import React from 'react';
import { ShiftDefinition, ShiftColor } from '../../types';

export const COLOR_CLASSES: Record<ShiftColor, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
    teal: 'bg-teal-100 text-teal-800 border-teal-300',
    gray: 'bg-gray-100 text-gray-700 border-gray-300',
};

interface ShiftLegendProps {
    unitShifts: ShiftDefinition[];
}

export const ShiftLegend: React.FC<ShiftLegendProps> = ({ unitShifts }) => {
    return (
        <div className="flex flex-wrap items-center gap-2 text-xs bg-gray-50 dark:bg-gray-800/40 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
            <span className="font-bold text-gray-700 dark:text-gray-300">Legenda Shift:</span>
            {unitShifts.map((shift) => (
                <span
                    key={shift.code}
                    className={`px-2 py-1 rounded-lg border text-[11px] font-semibold ${COLOR_CLASSES[shift.color] || COLOR_CLASSES.gray}`}
                >
                    {shift.code}: {shift.name} ({shift.startTime || (shift as any).start_time || '07:00'} - {shift.endTime || (shift as any).end_time || '14:00'})
                </span>
            ))}
            <span className="px-2 py-1 rounded-lg border text-[11px] font-semibold bg-gray-100 text-gray-600 border-gray-300">
                OFF: Libur
            </span>
            <span className="px-2 py-1 rounded-lg border text-[11px] font-semibold bg-red-100 text-red-700 border-red-300">
                🎉 Hari Libur Nasional
            </span>
        </div>
    );
};
