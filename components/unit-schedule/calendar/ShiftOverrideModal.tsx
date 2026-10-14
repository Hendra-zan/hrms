import React from 'react';
import { createPortal } from 'react-dom';
import { ShiftDefinition } from '../../../types.ts';
import { OverrideCellState } from './types.ts';

interface ShiftOverrideModalProps {
    isOpen: boolean;
    onClose: () => void;
    overrideCell: OverrideCellState | null;
    unitShifts: ShiftDefinition[];
    overrideShiftName: string;
    setOverrideShiftName: (name: string) => void;
    overrideIsOffDay: boolean;
    setOverrideIsOffDay: (val: boolean) => void;
    overrideReason: string;
    setOverrideReason: (reason: string) => void;
    submittingOverride: boolean;
    onSaveOverride: () => void;
    onDeleteSchedule: () => void;
    getOverrideFatigueWarning: () => string | null;
}

export const ShiftOverrideModal: React.FC<ShiftOverrideModalProps> = ({
    isOpen,
    onClose,
    overrideCell,
    unitShifts,
    overrideShiftName,
    setOverrideShiftName,
    overrideIsOffDay,
    setOverrideIsOffDay,
    overrideReason,
    setOverrideReason,
    submittingOverride,
    onSaveOverride,
    onDeleteSchedule,
    getOverrideFatigueWarning,
}) => {
    if (!isOpen || !overrideCell) return null;

    const fatigueWarning = getOverrideFatigueWarning();

    return createPortal(
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            {/* Centered Modal Container */}
            <div className="relative bg-white rounded-3xl shadow-2xl border border-gray-200 max-w-lg w-full overflow-hidden flex flex-col max-h-[90vh] z-50 my-auto">
                {/* Modal Header */}
                <div className="px-6 py-5 bg-gradient-to-r from-[#06736a] to-teal-600 flex items-center justify-between flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            ✏️ Penyesuaian Shift Manual
                        </h2>
                        <p className="text-teal-100 text-xs mt-0.5 font-medium">
                            Ubah shift individual untuk karyawan pada tanggal tertentu
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={onClose}
                        className="text-white/70 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
                        title="Tutup"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Body */}
                <div className="flex-1 p-6 space-y-4 overflow-y-auto bg-gray-50/40">
                    {/* Employee Info Card */}
                    <div className="p-4 bg-white border border-teal-200/80 rounded-2xl text-xs space-y-1.5 text-gray-700 shadow-xs">
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Karyawan:</span>
                            <span className="font-bold text-gray-900 text-sm">{overrideCell.employeeNama}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Tanggal:</span>
                            <span className="font-bold text-gray-900">{overrideCell.date}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-gray-500">Jadwal saat ini:</span>
                            <span className="font-bold text-[#06736a] bg-teal-50 px-2.5 py-0.5 rounded-full border border-teal-200">
                                {overrideCell.currentShiftName || 'Belum diisi'}
                            </span>
                        </div>
                    </div>

                    {/* Quick Action: OFF / Cuti */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => {
                                setOverrideIsOffDay(true);
                                setOverrideShiftName('');
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                overrideIsOffDay && overrideShiftName !== 'Cuti'
                                    ? 'bg-slate-700 text-white border-slate-700 shadow-sm ring-2 ring-slate-400/30'
                                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            <span>⚪</span>
                            <span>Hari Libur (OFF)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setOverrideIsOffDay(true);
                                setOverrideShiftName('Cuti');
                                setOverrideReason('Pengajuan Cuti Tahunan / Izin Resmi');
                            }}
                            className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-all ${
                                overrideIsOffDay && overrideShiftName === 'Cuti'
                                    ? 'bg-sky-600 text-white border-sky-600 shadow-sm ring-2 ring-sky-300/30'
                                    : 'bg-white text-sky-800 border-sky-200 hover:bg-sky-50'
                            }`}
                        >
                            <span>🔷</span>
                            <span>Set Cuti / Izin</span>
                        </button>
                    </div>

                    {/* Shift Selector Grid */}
                    <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">Pilih Shift Kerja Baru</label>
                        <div className="grid grid-cols-2 gap-2 mb-3">
                            {unitShifts.map(s => {
                                const isSelected = !overrideIsOffDay && overrideShiftName === s.name;
                                return (
                                    <button
                                        key={s.id}
                                        type="button"
                                        onClick={() => {
                                            setOverrideIsOffDay(false);
                                            setOverrideShiftName(s.name);
                                        }}
                                        className={`p-3 rounded-xl border text-left transition-all ${
                                            isSelected
                                                ? 'bg-[#06736a] text-white border-[#06736a] shadow-md ring-2 ring-[#06736a]/30'
                                                : 'bg-white text-gray-800 border-gray-200 hover:border-teal-400 hover:bg-teal-50/50'
                                        }`}
                                    >
                                        <p className="font-bold text-xs">{s.name}</p>
                                        <p className={`text-[10px] mt-0.5 font-mono ${isSelected ? 'text-teal-100' : 'text-gray-500'}`}>
                                            ⏰ {s.startTime || '??'} - {s.endTime || '??'}
                                        </p>
                                    </button>
                                );
                            })}
                        </div>

                        {/* Dropdown Fallback */}
                        <select
                            value={overrideShiftName}
                            onChange={e => {
                                const val = e.target.value;
                                if (val === 'Libur') {
                                    setOverrideIsOffDay(true);
                                    setOverrideShiftName('');
                                } else if (val === 'Cuti') {
                                    setOverrideIsOffDay(true);
                                    setOverrideShiftName('Cuti');
                                    setOverrideReason('Pengajuan Cuti Tahunan / Izin Resmi');
                                } else {
                                    setOverrideIsOffDay(false);
                                    setOverrideShiftName(val);
                                }
                            }}
                            className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#06736a] bg-white"
                        >
                            <option value="">-- Pilihan Shift Lainnya --</option>
                            <option value="Libur">⚪ Hari Libur (OFF)</option>
                            <option value="Cuti">🔷 Cuti / Izin Resmi</option>
                            {unitShifts.map(s => (
                                <option key={s.id} value={s.name}>
                                    {s.name} ({s.startTime || '??'} - {s.endTime || '??'})
                                </option>
                            ))}
                        </select>

                        {fatigueWarning && (
                            <p className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 mt-2 font-medium flex items-start gap-2 shadow-xs">
                                <span>⚠️</span>
                                <span>{fatigueWarning}</span>
                            </p>
                        )}
                    </div>

                    {/* Quick Reason Chips */}
                    <div>
                        <div className="flex items-center justify-between mb-1.5">
                            <label className="block text-xs font-semibold text-gray-700">
                                Alasan Perubahan <span className="text-rose-500">*</span>
                            </label>
                            <span className="text-[10px] text-gray-400 font-medium">Klik alasan cepat di bawah:</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {[
                                '🔄 Tukar Shift Internal',
                                '🏥 Operasional Unit',
                                '🙋 Permintaan Staf',
                                '👥 Back-up Staffing',
                                '🌴 Ganti Hari Libur',
                            ].map(chip => (
                                <button
                                    key={chip}
                                    type="button"
                                    onClick={() => setOverrideReason(chip)}
                                    className="px-2.5 py-1 text-[11px] font-medium bg-white hover:bg-teal-50 hover:text-[#06736a] hover:border-teal-300 border border-slate-200 rounded-full transition-all cursor-pointer shadow-2xs"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>
                        <textarea
                            value={overrideReason}
                            onChange={e => setOverrideReason(e.target.value)}
                            placeholder="Tulis atau pilih alasan penyesuaian jadwal manual..."
                            className="w-full px-3.5 py-2.5 text-xs border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#06736a] h-20 bg-white"
                            required
                        />
                    </div>
                </div>

                {/* Modal Action Footer */}
                <div className="flex-shrink-0 border-t bg-white px-6 py-4 flex justify-between items-center shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
                    <button
                        onClick={onDeleteSchedule}
                        disabled={submittingOverride}
                        type="button"
                        className="px-4 py-2 border border-rose-300 text-rose-600 rounded-xl text-xs font-bold hover:bg-rose-50 disabled:opacity-50 transition-colors"
                    >
                        Hapus
                    </button>
                    <div className="flex gap-3 ml-auto">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-2.5 border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Batal
                        </button>
                        <button
                            type="button"
                            onClick={onSaveOverride}
                            disabled={submittingOverride || (!overrideIsOffDay && !overrideShiftName) || !overrideReason.trim()}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-colors ${
                                submittingOverride || (!overrideIsOffDay && !overrideShiftName) || !overrideReason.trim()
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : 'bg-[#06736a] hover:bg-[#054f46] shadow-sm'
                            }`}
                        >
                            {submittingOverride ? (
                                <>
                                    <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                    </svg>
                                    Menyimpan...
                                </>
                            ) : (
                                'Simpan Penyesuaian'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};
