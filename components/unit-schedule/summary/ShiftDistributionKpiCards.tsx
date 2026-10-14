import React from 'react';
import { EmployeeShiftStats } from './types.ts';

interface ShiftDistributionKpiCardsProps {
    unitFairnessScore: number;
    overallUnitAvg: {
        avgNight: number;
        avgHours: number;
        totalNightSum: number;
        totalHoursSum: number;
    };
    periodLabel: string;
    statsList: EmployeeShiftStats[];
}

export const ShiftDistributionKpiCards: React.FC<ShiftDistributionKpiCardsProps> = ({
    unitFairnessScore,
    overallUnitAvg,
    periodLabel,
    statsList,
}) => {
    const totalK3AlertsCount = statsList.reduce((acc, s) => acc + s.k3Warnings.length, 0);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Score Keadilan */}
            <div className="rounded-2xl border border-gray-100 bg-gradient-to-br from-teal-600 to-emerald-800 p-4 text-white shadow-md">
                <div className="flex items-center justify-between">
                    <span className="text-2xl">⚖️</span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        unitFairnessScore >= 85 ? 'bg-emerald-300 text-emerald-950' : unitFairnessScore >= 70 ? 'bg-amber-300 text-amber-950' : 'bg-rose-300 text-rose-950'
                    }`}>
                        {unitFairnessScore >= 85 ? '🟢 Sangat Seimbang' : unitFairnessScore >= 70 ? '🟡 Cukup Seimbang' : '🔴 Perlu Evaluasi'}
                    </span>
                </div>
                <div className="mt-3">
                    <h3 className="text-2xl font-extrabold">{unitFairnessScore}%</h3>
                    <p className="text-xs text-teal-100 mt-0.5">Indeks Keadilan Distribusi Shift Unit</p>
                </div>
            </div>

            {/* Rata-Rata Shift Malam */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xl">🌙</span>
                    <span className="text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Shift Malam</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{overallUnitAvg.avgNight.toFixed(1)} <span className="text-xs font-normal text-gray-500">shift / orang</span></p>
                <p className="text-[11px] text-gray-500">Rerata Shift Malam Unit ({periodLabel})</p>
            </div>

            {/* Rata-Rata Jam Kerja */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xl">⏱️</span>
                    <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">Jam Kerja</span>
                </div>
                <p className="text-xl font-bold text-gray-800">{overallUnitAvg.avgHours.toFixed(1)} <span className="text-xs font-normal text-gray-500">jam / orang</span></p>
                <p className="text-[11px] text-gray-500">Rerata Durasi Kerja Staf</p>
            </div>

            {/* Peringatan K3 & Ketimpangan */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm space-y-1">
                <div className="flex items-center justify-between">
                    <span className="text-xl">🚨</span>
                    <span className={`text-xs font-semibold px-2 py-0.5 rounded-md ${
                        totalK3AlertsCount > 0 ? 'bg-rose-100 text-rose-700 font-bold' : 'bg-emerald-50 text-emerald-700'
                    }`}>
                        {totalK3AlertsCount > 0 ? `${totalK3AlertsCount} Warning K3` : 'K3 Aman'}
                    </span>
                </div>
                <p className="text-xl font-bold text-rose-600">
                    {statsList.filter(s => s.fairnessStatus === 'unbalanced').length} <span className="text-xs font-normal text-gray-500">orang</span>
                </p>
                <p className="text-[11px] text-gray-500">Staf Memerlukan Penyesuaian Shift</p>
            </div>
        </div>
    );
};
