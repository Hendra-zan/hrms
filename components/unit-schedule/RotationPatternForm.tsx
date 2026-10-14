import React from 'react';
import { ShiftDefinition, ShiftColor } from '../../types.ts';
import { PlusIcon, TrashIcon } from '../icons.tsx';

const COLOR_CLASSES: Record<ShiftColor, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    blue: 'bg-blue-100 text-blue-800 border-blue-300',
    indigo: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    green: 'bg-green-100 text-green-800 border-green-300',
    red: 'bg-red-100 text-red-800 border-red-300',
    purple: 'bg-purple-100 text-purple-800 border-purple-300',
    orange: 'bg-orange-100 text-orange-800 border-orange-300',
    pink: 'bg-pink-100 text-pink-800 border-pink-300',
    teal: 'bg-teal-100 text-teal-800 border-teal-300',
    gray: 'bg-gray-200 text-gray-800 border-gray-400',
};

interface RotationPatternFormProps {
    unitShifts: ShiftDefinition[];
    formName: string;
    setFormName: (val: string) => void;
    formDescription: string;
    setFormDescription: (val: string) => void;
    formPattern: string[];
    setFormPattern: (val: string[]) => void;
    editingId: string | null;
    saving: boolean;
    onSave: () => void;
    onCancel: () => void;
}

const RotationPatternForm: React.FC<RotationPatternFormProps> = ({
    unitShifts, formName, setFormName, formDescription, setFormDescription,
    formPattern, setFormPattern, editingId, saving, onSave, onCancel
}) => {
    const shiftOptions = [...unitShifts.map(s => s.name), 'Libur'];

    const getShiftColor = (shiftName?: string | null): string => {
        if (!shiftName) return 'bg-gray-100 text-gray-800 border-gray-300';
        if (String(shiftName).toLowerCase() === 'libur') return 'bg-gray-100 text-gray-500 border border-dashed border-gray-300';
        const def = unitShifts.find(s => s.name === shiftName);
        return def ? COLOR_CLASSES[def.color] : 'bg-gray-100 text-gray-800 border-gray-300';
    };

    const addDayToPattern = () => setFormPattern([...formPattern, shiftOptions[0]]);
    const removeDayFromPattern = (index: number) => setFormPattern(formPattern.filter((_, i) => i !== index));
    const updateDayInPattern = (index: number, value: string) => setFormPattern(formPattern.map((v, i) => i === index ? value : v));

    return (
        <div className="bg-white rounded-xl border border-teal-200 shadow-sm p-6 space-y-5 animate-fadeIn">
            {/* Header Form Inline */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                <div className="flex items-center gap-3">
                    <span className="text-2xl p-2 bg-teal-50 rounded-xl text-[#06736a]">🔄</span>
                    <div>
                        <h3 className="text-lg font-bold text-gray-900">
                            {editingId ? `Edit Pola Rotasi: ${formName}` : 'Buat Pola Rotasi Shift Baru'}
                        </h3>
                        <p className="text-xs text-gray-500">Atur urutan siklus kerja berulang untuk karyawan unit kerja secara nyaman</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onCancel}
                    className="text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium hover:bg-gray-50 transition-colors"
                >
                    ✕ Tutup Form
                </button>
            </div>

            {/* Nama & Deskripsi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Nama Pola Rotasi <span className="text-rose-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={formName}
                        onChange={e => setFormName(e.target.value)}
                        placeholder="cth: Rotasi Perawat 8 Hari (P-P-S-S-M-M-L-L)"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                        Deskripsi Pola (Opsional)
                    </label>
                    <input
                        type="text"
                        value={formDescription}
                        onChange={e => setFormDescription(e.target.value)}
                        placeholder="cth: Digunakan untuk staf perawat rawat inap 3 tim"
                        className="w-full px-3.5 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                    />
                </div>
            </div>

            {/* Templat Cepat (Quick Fill) */}
            <div className="bg-teal-50/50 border border-teal-100 rounded-xl p-4 space-y-2">
                <label className="block text-xs font-bold text-teal-800">
                    ⚡ Templat Cepat (Klik untuk langsung mengisi pola):
                </label>
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setFormPattern(['Pagi','Pagi','Siang','Siang','Malam','Malam','Libur','Libur'])}
                        className="px-3 py-1.5 text-xs font-semibold bg-white text-teal-700 border border-teal-300 rounded-lg hover:bg-teal-100 transition-colors shadow-sm"
                    >
                        P-P-S-S-M-M-L-L (8 Hari)
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormPattern(['Pagi','Siang','Malam','Libur'])}
                        className="px-3 py-1.5 text-xs font-semibold bg-white text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-100 transition-colors shadow-sm"
                    >
                        P-S-M-L (4 Hari)
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormPattern(['Pagi','Pagi','Pagi','Siang','Siang','Siang','Libur'])}
                        className="px-3 py-1.5 text-xs font-semibold bg-white text-indigo-700 border border-indigo-300 rounded-lg hover:bg-indigo-100 transition-colors shadow-sm"
                    >
                        PPP-SSS-L (7 Hari)
                    </button>
                    <button
                        type="button"
                        onClick={() => setFormPattern(Array(5).fill(unitShifts[0]?.name || 'Pagi').concat(['Libur','Libur']))}
                        className="px-3 py-1.5 text-xs font-semibold bg-white text-slate-700 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors shadow-sm"
                    >
                        5 Kerja + 2 Libur
                    </button>
                </div>
            </div>

            {/* Pattern Builder - Grid Lebar Nyaman */}
            <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-bold text-gray-800">
                            🔄 Urutan Shift dalam Siklus Rotasi
                        </label>
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-teal-100 text-[#06736a] rounded-full border border-teal-200">
                            Total: {formPattern.length} Hari
                        </span>
                    </div>
                    <button
                        type="button"
                        onClick={addDayToPattern}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-[#06736a] border border-[#06736a]/40 bg-teal-50 rounded-lg hover:bg-teal-100 transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" /> Tambah Hari Siklus
                    </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2.5">
                    {formPattern.map((shiftName, i) => (
                        <div key={i} className="bg-gray-50 border border-gray-200 rounded-xl p-2 flex flex-col gap-1.5 shadow-sm hover:border-teal-300 transition-all">
                            <div className="flex items-center justify-between text-[11px] font-bold text-gray-500">
                                <span>Hari {i + 1}</span>
                                <button
                                    type="button"
                                    onClick={() => removeDayFromPattern(i)}
                                    className="text-gray-400 hover:text-rose-600 transition-colors p-0.5"
                                    title="Hapus hari ini"
                                >
                                    <TrashIcon className="w-3.5 h-3.5" />
                                </button>
                            </div>
                            <select
                                value={shiftName}
                                onChange={e => updateDayInPattern(i, e.target.value)}
                                className={`w-full px-2 py-1.5 text-xs rounded-lg border font-bold ${getShiftColor(shiftName)} focus:ring-2 focus:ring-[#06736a]`}
                            >
                                {shiftOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                            </select>
                        </div>
                    ))}
                </div>
            </div>

            {/* Form Footer Action Buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                <div className="text-xs text-gray-500 font-medium truncate max-w-md">
                    {formPattern.length > 0 ? (
                        <span>Visual pola: <b className="text-[#06736a]">{formPattern.join(' ➔ ')}</b></span>
                    ) : (
                        <span>Tambahkan minimal 1 hari siklus</span>
                    )}
                </div>
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-5 py-2.5 border-2 border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Batal
                    </button>
                    <button
                        type="button"
                        onClick={onSave}
                        disabled={!formName.trim() || formPattern.length === 0 || saving}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold text-white transition-colors ${
                            !formName.trim() || formPattern.length === 0 || saving
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-[#06736a] hover:bg-[#054f46]'
                        }`}
                    >
                        {saving ? (
                            <>
                                <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                                </svg>
                                Menyimpan...
                            </>
                        ) : (
                            <>💾 {editingId ? 'Simpan Perubahan' : 'Buat Pola Rotasi'}</>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RotationPatternForm;
