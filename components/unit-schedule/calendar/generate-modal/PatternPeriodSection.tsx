import React from 'react';
import { RotationPattern, ShiftDefinition } from '../../../../types.ts';
import { COLOR_CLASSES } from '../constants.ts';

interface PatternPeriodSectionProps {
    viewMonth: string;
    startDate: string;
    endDate: string;
    patterns: RotationPattern[];
    unitShifts: ShiftDefinition[];
    selectedPatternId: string;
    setSelectedPatternId: (id: string) => void;
    staggerOffset: number;
    setStaggerOffset: (offset: number) => void;
    autoAlignDayOfWeek: boolean;
    setAutoAlignDayOfWeek: (val: boolean) => void;
    genPeriodMode: 'MONTH' | '1WEEK' | '2WEEKS' | 'CUSTOM';
    setGenPeriodMode: (mode: 'MONTH' | '1WEEK' | '2WEEKS' | 'CUSTOM') => void;
    genCustomStartDate: string;
    setGenCustomStartDate: (val: string) => void;
    genCustomEndDate: string;
    setGenCustomEndDate: (val: string) => void;
    genTargetMonth: string;
    setGenTargetMonth: (val: string) => void;
    targetGenStartDate: string;
    targetGenEndDate: string;
    genMonthLabel: string;
}

export const PatternPeriodSection: React.FC<PatternPeriodSectionProps> = ({
    viewMonth,
    startDate,
    endDate,
    patterns,
    unitShifts,
    selectedPatternId,
    setSelectedPatternId,
    staggerOffset,
    setStaggerOffset,
    autoAlignDayOfWeek,
    setAutoAlignDayOfWeek,
    genPeriodMode,
    setGenPeriodMode,
    genCustomStartDate,
    setGenCustomStartDate,
    genCustomEndDate,
    setGenCustomEndDate,
    genTargetMonth,
    setGenTargetMonth,
    targetGenStartDate,
    targetGenEndDate,
    genMonthLabel,
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

    return (
        <div className="space-y-5">
            {/* Target Month & Period Duration */}
            <div>
                <div className="mb-3 p-3 bg-gradient-to-r from-teal-50 to-emerald-50 border border-teal-200 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between">
                        <label className="block text-xs font-bold text-teal-900 flex items-center gap-1.5">
                            <span>📅</span> Pilih Bulan Target Jadwal <span className="text-red-500">*</span>
                        </label>
                        <span className="text-[11px] font-extrabold text-[#06736a] bg-white px-2 py-0.5 rounded-md border border-teal-200 shadow-2xs">
                            {genMonthLabel}
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="month"
                            value={genTargetMonth || viewMonth}
                            onChange={e => {
                                setGenTargetMonth(e.target.value);
                                setGenCustomStartDate('');
                                setGenCustomEndDate('');
                            }}
                            className="flex-1 px-3 py-1.5 border border-teal-300 rounded-lg text-xs font-bold text-gray-800 bg-white focus:ring-2 focus:ring-[#06736a] outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setGenTargetMonth(viewMonth);
                                setGenCustomStartDate('');
                                setGenCustomEndDate('');
                            }}
                            className={`px-2.5 py-1.5 text-[11px] font-bold rounded-lg border transition-all ${
                                (genTargetMonth || viewMonth) === viewMonth
                                    ? 'bg-[#06736a] text-white border-[#06736a]'
                                    : 'bg-white text-teal-800 border-teal-200 hover:bg-teal-100'
                            }`}
                        >
                            Bulan Ini
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                const [y, m] = (genTargetMonth || viewMonth).split('-').map(Number);
                                const nextDt = new Date(y, m, 1);
                                const nextMonthStr = `${nextDt.getFullYear()}-${String(nextDt.getMonth() + 1).padStart(2, '0')}`;
                                setGenTargetMonth(nextMonthStr);
                                setGenCustomStartDate('');
                                setGenCustomEndDate('');
                            }}
                            className="px-2.5 py-1.5 text-[11px] font-bold rounded-lg bg-white text-teal-800 border border-teal-200 hover:bg-teal-100 transition-all flex items-center gap-1"
                        >
                            +1 Bln ➔
                        </button>
                    </div>
                </div>

                <label className="block text-xs font-bold text-gray-800 mb-2">
                    ⏱️ Rentang Durasi Generate
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                    <button
                        type="button"
                        onClick={() => setGenPeriodMode('MONTH')}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 ${
                            genPeriodMode === 'MONTH'
                                ? 'border-[#06736a] bg-teal-50 text-[#06736a] shadow-xs'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'
                        }`}
                    >
                        <span>🗓️</span> 1 Bulan Full
                    </button>
                    <button
                        type="button"
                        onClick={() => setGenPeriodMode('1WEEK')}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 ${
                            genPeriodMode === '1WEEK'
                                ? 'border-[#06736a] bg-teal-50 text-[#06736a] shadow-xs'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'
                        }`}
                    >
                        <span>📅</span> 1 Minggu (7 Hari)
                    </button>
                    <button
                        type="button"
                        onClick={() => setGenPeriodMode('2WEEKS')}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 ${
                            genPeriodMode === '2WEEKS'
                                ? 'border-[#06736a] bg-teal-50 text-[#06736a] shadow-xs'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'
                        }`}
                    >
                        <span>📆</span> 2 Minggu (14 Hari)
                    </button>
                    <button
                        type="button"
                        onClick={() => setGenPeriodMode('CUSTOM')}
                        className={`px-3 py-2 text-xs font-bold rounded-xl border-2 transition-all flex items-center justify-center gap-1.5 ${
                            genPeriodMode === 'CUSTOM'
                                ? 'border-[#06736a] bg-teal-50 text-[#06736a] shadow-xs'
                                : 'border-gray-200 bg-white text-gray-700 hover:border-teal-200'
                        }`}
                    >
                        <span>🛠️</span> Kustom Tanggal
                    </button>
                </div>

                {genPeriodMode !== 'MONTH' && (
                    <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl space-y-2 text-xs mb-2">
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-[10px] font-bold text-gray-600 mb-1">Mulai Dari Tanggal:</label>
                                <input
                                    type="date"
                                    value={genCustomStartDate || startDate}
                                    onChange={e => setGenCustomStartDate(e.target.value)}
                                    className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#06736a]"
                                />
                            </div>
                            {genPeriodMode === 'CUSTOM' && (
                                <div>
                                    <label className="block text-[10px] font-bold text-gray-600 mb-1">Sampai Tanggal:</label>
                                    <input
                                        type="date"
                                        value={genCustomEndDate || endDate}
                                        onChange={e => setGenCustomEndDate(e.target.value)}
                                        className="w-full px-2 py-1 border border-gray-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-[#06736a]"
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                )}

                <div className="px-3 py-1.5 bg-teal-50/60 border border-teal-100 rounded-lg text-[11px] text-teal-800 font-semibold flex items-center justify-between">
                    <span>Target Periode: <b>{targetGenStartDate}</b> s.d. <b>{targetGenEndDate}</b></span>
                    <span className="text-[10px] bg-teal-200/60 px-2 py-0.5 rounded font-bold text-teal-900">
                        {Math.round((new Date(targetGenEndDate).getTime() - new Date(targetGenStartDate).getTime()) / (1000 * 60 * 60 * 24)) + 1} Hari
                    </span>
                </div>
            </div>

            {/* Rotation Patterns List */}
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-3">
                    🔄 Pilih Pola Rotasi Shift <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                    {patterns.length === 0 ? (
                        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl text-center text-sm text-gray-500">
                            <p>Belum ada pola rotasi.</p>
                            <p className="text-xs mt-1 text-gray-400">Buat pola di tab "Pola Rotasi" terlebih dahulu.</p>
                        </div>
                    ) : (
                        patterns.map(p => {
                            const isSelected = selectedPatternId === p.id;
                            const offDays = p.pattern.filter(s => s === 'OFF' || s.toLowerCase() === 'libur').length;
                            const workDays = p.cycle_days - offDays;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSelectedPatternId(p.id)}
                                    className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                                        isSelected
                                            ? 'border-[#06736a] bg-teal-50 shadow-sm'
                                            : 'border-gray-200 bg-white hover:border-teal-300 hover:bg-teal-50/30'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2 mb-2">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${isSelected ? 'border-[#06736a] bg-[#06736a]' : 'border-gray-300'}`}>
                                                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                                            </div>
                                            <span className="font-bold text-sm text-gray-800">{p.name}</span>
                                        </div>
                                        <div className="flex gap-1.5 flex-shrink-0">
                                            <span className="text-[10px] px-1.5 py-0.5 bg-teal-100 text-teal-700 rounded-full font-semibold">{p.cycle_days} hari/siklus</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded-full font-semibold">{workDays} kerja</span>
                                            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full font-semibold">{offDays} libur</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap gap-1">
                                        {p.pattern.map((shift, idx) => (
                                            <span
                                                key={idx}
                                                className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${getShiftBadge(shift)}`}
                                            >
                                                H{idx + 1}:{shift}
                                            </span>
                                        ))}
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Stagger Offset & Align */}
            <div>
                <label className="block text-sm font-bold text-gray-800 mb-2">
                    🔀 Pengaturan Stagger / Distribusi Shift
                </label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                    {[
                        { val: 0, label: 'Serentak (Offset 0)', desc: 'Semua sama persis' },
                        { val: 1, label: 'Bergilir (Offset +1)', desc: 'Geser 1 hari per orang' },
                        { val: 2, label: 'Menyebar (Offset +2)', desc: 'Geser 2 hari per orang' },
                    ].map(opt => (
                        <button
                            key={opt.val}
                            type="button"
                            onClick={() => setStaggerOffset(opt.val)}
                            className={`p-2.5 rounded-xl border text-left transition-all ${
                                staggerOffset === opt.val
                                    ? 'border-[#06736a] bg-teal-50 shadow-xs'
                                    : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}
                        >
                            <p className="font-bold text-xs text-gray-800">{opt.label}</p>
                            <p className="text-[10px] text-gray-500 mt-0.5">{opt.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="p-3 bg-teal-50/50 border border-teal-200 rounded-xl space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer">
                        <input
                            type="checkbox"
                            checked={autoAlignDayOfWeek}
                            onChange={e => setAutoAlignDayOfWeek(e.target.checked)}
                            className="rounded border-gray-300 text-[#06736a] focus:ring-[#06736a] w-4 h-4"
                        />
                        <span className="text-xs font-bold text-teal-900">
                            🗓️ Sesuaikan Hari Siklus dengan Hari Kalender
                        </span>
                    </label>
                    <p className="text-[10px] text-teal-700 pl-6">
                        Memastikan hari Senin selalu jatuh pada H1 siklus rotasi untuk sinkronisasi shift yang rapi.
                    </p>
                </div>
            </div>
        </div>
    );
};
