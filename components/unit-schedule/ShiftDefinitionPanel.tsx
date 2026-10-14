import React, { useState } from 'react';
import { ShiftDefinition, ShiftColor, WEEK_DAYS, WEEK_DAY_LABELS } from '../../types.ts';
import { ClockIcon, PlusIcon, TrashIcon, PencilIcon } from '../icons.tsx';
import LoadingSpinner from '../LoadingSpinner.tsx';
import { SHIFT_COLORS, COLOR_CLASSES } from './constants.ts';

interface ShiftDefinitionPanelProps {
    unitShifts: ShiftDefinition[];
    onShiftsChange: (shifts: ShiftDefinition[]) => void;
    unitShiftsDirty: boolean;
    savingConfig: boolean;
    workUnitName: string;
    unitEmployees: { jabatan?: string }[];
    onSave: () => void;
    onReset: () => void;
    showNotification: (type: 'success' | 'error', text: string) => void;
}

const ShiftDefinitionPanel: React.FC<ShiftDefinitionPanelProps> = ({
    unitShifts, onShiftsChange, unitShiftsDirty, savingConfig,
    workUnitName, unitEmployees, onSave, onReset, showNotification,
}) => {
    const [showAddShiftForm, setShowAddShiftForm] = useState(false);
    const [editingShiftId, setEditingShiftId] = useState<string | null>(null);
    // Helper: hitung durasi shift dalam menit, benar untuk shift lintas tengah malam
    const calcShiftDuration = (start?: string, end?: string): number | null => {
        if (!start || !end) return null;
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff <= 0) diff += 24 * 60; // lintas tengah malam
        return diff;
    };

    const [newShiftForm, setNewShiftForm] = useState<Omit<ShiftDefinition, 'id'>>({
        name: '', code: '', type: 'rotating', startTime: '08:00', endTime: '16:00',
        color: 'green', lateToleranceMinutes: 15, positionGroup: '',
        breakDurationMinutes: 60, autoOvertimeThresholdMinutes: 30,
    });

    const resetForm = () => {
        setNewShiftForm({ name: '', code: '', type: 'rotating', startTime: '08:00', endTime: '16:00', color: 'green', lateToleranceMinutes: 15, positionGroup: '', breakDurationMinutes: 60, autoOvertimeThresholdMinutes: 30 });
        setEditingShiftId(null);
        setShowAddShiftForm(false);
    };


    const addShift = () => {
        if (!newShiftForm.name.trim()) return;
        if (unitShifts.some(s => String(s?.name || '').toLowerCase() === String(newShiftForm.name || '').trim().toLowerCase())) {
            showNotification('error', `Shift "${newShiftForm.name}" sudah ada.`);
            return;
        }
        const id = `custom_${Date.now()}`;
        onShiftsChange([...unitShifts, { id, ...newShiftForm, name: newShiftForm.name.trim() }]);
        resetForm();
    };

    const editShift = (shiftId: string) => {
        const shift = unitShifts.find(s => s.id === shiftId);
        if (!shift) return;
        const { id, ...rest } = shift;
        setNewShiftForm(rest);
        setEditingShiftId(shiftId);
        setShowAddShiftForm(true);
    };

    const saveEditShift = () => {
        if (!editingShiftId || !newShiftForm.name.trim()) return;
        onShiftsChange(unitShifts.map(s =>
            s.id === editingShiftId ? { ...s, ...newShiftForm, name: newShiftForm.name.trim() } : s
        ));
        resetForm();
    };

    const removeShift = (shiftId: string) => {
        if (unitShifts.length <= 1) {
            showNotification('error', 'Unit harus memiliki minimal 1 shift.');
            return;
        }
        onShiftsChange(unitShifts.filter(s => s.id !== shiftId));
    };

    const getShiftSummary = (shift: ShiftDefinition): string => {
        if (shift.type === 'rotating') {
            return `${shift.startTime || '08:00'} – ${shift.endTime || '16:00'} (setiap hari)`;
        }
        if (!shift.weeklySchedule) return 'Belum dikonfigurasi';
        const activeDays = WEEK_DAYS.filter(d => shift.weeklySchedule?.[d]);
        if (activeDays.length === 0) return 'Semua hari libur';
        const first = shift.weeklySchedule[activeDays[0]];
        const allSame = activeDays.every(d => {
            const ds = shift.weeklySchedule?.[d];
            return ds?.startTime === first?.startTime && ds?.endTime === first?.endTime;
        });
        if (allSame && first) {
            return `${first.startTime}–${first.endTime} (${activeDays.map(d => WEEK_DAY_LABELS[d].slice(0,3)).join(', ')})`;
        }
        return `${activeDays.length} hari kerja (bervariasi)`;
    };

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-semibold text-gray-800 flex items-center gap-2">
                        <ClockIcon className="w-5 h-5 text-primary" />
                        Konfigurasi Shift Unit
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Definisikan jenis shift yang berlaku di unit {workUnitName}
                        {unitShiftsDirty && (
                            <span className="ml-2 inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                                belum disimpan
                            </span>
                        )}
                    </p>
                </div>
                <div className="flex gap-2">
                    <button
                        type="button"
                        onClick={() => {
                            if (showAddShiftForm && !editingShiftId) {
                                resetForm();
                            } else {
                                resetForm();
                                setShowAddShiftForm(true);
                            }
                        }}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-teal-50 border border-teal-200 text-[#06736a] rounded-lg hover:bg-teal-100 font-semibold transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        <span>+ Tambah Shift</span>
                    </button>
                    {unitShiftsDirty && (
                        <button
                            onClick={onReset}
                            className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                        >
                            Reset
                        </button>
                    )}
                    <button
                        onClick={onSave}
                        disabled={!unitShiftsDirty || savingConfig}
                        className="flex items-center gap-1.5 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {savingConfig ? <LoadingSpinner size="small" color="white" /> : null}
                        Simpan Konfigurasi
                    </button>
                </div>
            </div>

            {/* Daftar shift yang sudah dikonfigurasi */}
            <div className="divide-y divide-gray-100">
                {unitShifts.map(shift => (
                    <div key={shift.id} className="px-5 py-3 flex items-center justify-between hover:bg-gray-50/80 transition-colors">
                        <div className="flex items-center gap-3 flex-wrap">
                            <span className={`w-3 h-3 rounded-full flex-shrink-0 ${COLOR_CLASSES[shift.color].dot}`} />
                            <span className="font-semibold text-gray-800 text-sm">{shift.name}</span>
                            <span className="px-2 py-0.5 text-xs font-mono font-bold bg-teal-100 text-[#06736a] border border-teal-300 rounded-md shadow-xs">
                                Kode: {shift.code || shift.name.slice(0, 2).toUpperCase()}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded ${
                                shift.type === 'fixed' ? 'bg-emerald-100 text-emerald-700' : 'bg-violet-100 text-violet-700'
                            }`}>
                                {shift.type === 'fixed' ? 'Tetap' : 'Bergilir'}
                            </span>
                            <span className="text-xs text-gray-500">{getShiftSummary(shift)}</span>
                            {(() => {
                                const dur = calcShiftDuration(shift.startTime, shift.endTime);
                                if (dur && dur > 0) {
                                    const h = Math.floor(dur / 60);
                                    const m = dur % 60;
                                    const breakMin = shift.breakDurationMinutes ?? 0;
                                    const netMin = dur - breakMin;
                                    const netH = Math.floor(netMin / 60);
                                    const netM = netMin % 60;
                                    return (
                                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium" title={`Durasi bruto: ${h}j ${m > 0 ? m + 'm' : ''} | Istirahat: ${breakMin}m | Neto: ${netH}j ${netM > 0 ? netM + 'm' : ''}`}>
                                            ⏱ {h}j{m > 0 ? m + 'm' : ''}{breakMin > 0 ? ` (neto ${netH}j${netM > 0 ? netM + 'm' : ''})` : ''}
                                        </span>
                                    );
                                }
                                return null;
                            })()}
                            <span className="text-[10px] text-gray-400">toleransi {shift.lateToleranceMinutes ?? 15} mnt</span>
                            {shift.positionGroup && (
                                <span className="px-2 py-0.5 text-[10px] rounded-full bg-sky-100 text-sky-700 border border-sky-200 font-medium">
                                    👤 {shift.positionGroup}
                                </span>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => editShift(shift.id)}
                                className="px-2.5 py-1 text-xs font-semibold rounded bg-teal-50 border border-teal-200 text-[#06736a] hover:bg-teal-100 transition-colors flex items-center gap-1"
                                title={`Edit shift ${shift.name}`}
                            >
                                <PencilIcon className="w-3.5 h-3.5" />
                                <span>Edit</span>
                            </button>
                            <button
                                onClick={() => removeShift(shift.id)}
                                className="p-1.5 rounded text-rose-500 hover:bg-rose-50 transition-colors"
                                title={`Hapus shift ${shift.name}`}
                            >
                                <TrashIcon className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>


            {/* Form tambah/edit shift - Inline Card Form */}
            {showAddShiftForm && (
                <div className="px-5 py-4 bg-gray-50 border-t border-gray-200 space-y-4 rounded-b-lg">
                    <p className="text-sm font-semibold text-gray-700">
                        {editingShiftId ? `Edit Shift: ${newShiftForm.name}` : 'Tambah Shift Baru'}
                    </p>

                    {/* Row 1: Nama, Kode, Tipe, Warna, Toleransi */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Nama Shift</label>
                            <input
                                type="text"
                                value={newShiftForm.name}
                                onChange={e => setNewShiftForm(p => ({ ...p, name: e.target.value }))}
                                placeholder="cth: Dinas Pagi"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-[#06736a] mb-1">Kode Shift <span className="text-[10px] text-gray-400 font-normal">(PA, SI, MA)</span></label>
                            <input
                                type="text"
                                maxLength={6}
                                value={newShiftForm.code || ''}
                                onChange={e => setNewShiftForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                                placeholder="cth: PA"
                                className="w-full px-3 py-2 text-sm font-mono uppercase font-bold border border-teal-300 rounded-lg focus:ring-2 focus:ring-[#06736a] bg-teal-50/50"
                            />
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Tipe Jadwal</label>
                            <select
                                value={newShiftForm.type}
                                onChange={e => setNewShiftForm(p => ({ ...p, type: e.target.value as 'fixed' | 'rotating' }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                            >
                                <option value="rotating">Bergilir (jam sama setiap hari)</option>
                                <option value="fixed">Tetap (jam berbeda per hari)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Warna Badge</label>
                            <select
                                value={newShiftForm.color}
                                onChange={e => setNewShiftForm(p => ({ ...p, color: e.target.value as ShiftColor }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                            >
                                {SHIFT_COLORS.map(c => (
                                    <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Toleransi Terlambat (mnt)</label>
                            <input
                                type="number"
                                min={0}
                                max={60}
                                value={newShiftForm.lateToleranceMinutes}
                                onChange={e => setNewShiftForm(p => ({ ...p, lateToleranceMinutes: Number(e.target.value) }))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Khusus Jabatan</label>
                            <input
                                type="text"
                                value={newShiftForm.positionGroup || ''}
                                onChange={e => setNewShiftForm(p => ({ ...p, positionGroup: e.target.value }))}
                                placeholder="cth: Cleaning Service"
                                list="jabatan-suggestions"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                            />
                            <datalist id="jabatan-suggestions">
                                {[...new Set(unitEmployees.map(e => e.jabatan).filter(Boolean))].map(j => (
                                    <option key={j} value={j} />
                                ))}
                            </datalist>
                            <p className="text-[10px] text-gray-400 mt-0.5">Kosongkan = berlaku semua jabatan</p>
                        </div>
                    </div>

                    {/* Konfigurasi Advanced */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 bg-blue-50/60 border border-blue-100 rounded-lg p-3">
                        <div>
                            <label className="block text-xs font-semibold text-blue-700 mb-1">⏸ Durasi Istirahat (mnt)</label>
                            <input
                                type="number"
                                min={0}
                                max={120}
                                value={newShiftForm.breakDurationMinutes ?? 60}
                                onChange={e => setNewShiftForm(p => ({ ...p, breakDurationMinutes: Number(e.target.value) }))}
                                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                            />
                            <p className="text-[10px] text-blue-500 mt-0.5">Waktu istirahat yang dikurangi dari total jam</p>
                        </div>
                        <div>
                            <label className="block text-xs font-semibold text-blue-700 mb-1">⏱ Batas OT Otomatis (mnt)</label>
                            <input
                                type="number"
                                min={0}
                                max={120}
                                value={newShiftForm.autoOvertimeThresholdMinutes ?? 30}
                                onChange={e => setNewShiftForm(p => ({ ...p, autoOvertimeThresholdMinutes: Number(e.target.value) }))}
                                className="w-full px-3 py-2 text-sm border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-400"
                            />
                            <p className="text-[10px] text-blue-500 mt-0.5">Menit melebihi jam selesai → otomatis lembur</p>
                        </div>
                        {newShiftForm.type === 'rotating' && newShiftForm.startTime && newShiftForm.endTime && (() => {
                            const dur = calcShiftDuration(newShiftForm.startTime, newShiftForm.endTime);
                            if (!dur || dur <= 0) return null;
                            const breakMin = newShiftForm.breakDurationMinutes ?? 0;
                            const netMin = dur - breakMin;
                            const h = Math.floor(dur / 60); const m = dur % 60;
                            const nh = Math.floor(netMin / 60); const nm = netMin % 60;
                            const isMidnight = (() => { const [sh] = (newShiftForm.startTime || '').split(':').map(Number); const [eh] = (newShiftForm.endTime || '').split(':').map(Number); return eh < sh; })();
                            return (
                                <div className="col-span-2 bg-white rounded-lg border border-blue-200 px-3 py-2 flex flex-wrap gap-4 text-xs text-blue-800">
                                    <span>⏱ <b>Durasi bruto:</b> {h}j {m > 0 ? m + 'm' : ''}</span>
                                    <span>⏸ <b>Istirahat:</b> {breakMin}m</span>
                                    <span>✅ <b>Jam kerja neto:</b> {nh}j {nm > 0 ? nm + 'm' : ''}</span>
                                    {isMidnight && <span className="text-amber-600 font-semibold">🌙 Shift lintas tengah malam</span>}
                                </div>
                            );
                        })()}
                    </div>

                    {/* Jam Shift */}
                    {newShiftForm.type === 'rotating' ? (
                        <div className="grid grid-cols-2 gap-3 max-w-sm">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Jam Mulai</label>
                                <input
                                    type="time"
                                    value={newShiftForm.startTime || '08:00'}
                                    onChange={e => setNewShiftForm(p => ({ ...p, startTime: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Jam Selesai</label>
                                <input
                                    type="time"
                                    value={newShiftForm.endTime || '16:00'}
                                    onChange={e => setNewShiftForm(p => ({ ...p, endTime: e.target.value }))}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#06736a]"
                                />
                            </div>
                        </div>
                    ) : (
                        <div>
                            <p className="text-xs text-gray-500 mb-2">Atur jam kerja per hari (kosongkan untuk hari libur):</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                                {WEEK_DAYS.map(day => {
                                    const daySched = newShiftForm.weeklySchedule?.[day];
                                    const isActive = !!daySched;
                                    return (
                                        <div key={day} className={`flex items-center gap-2 rounded-lg border p-2 text-sm ${
                                            isActive ? 'border-[#06736a]/30 bg-teal-50/30' : 'border-gray-200 bg-gray-50'
                                        }`}>
                                            <input
                                                type="checkbox"
                                                checked={isActive}
                                                onChange={e => {
                                                    setNewShiftForm(p => {
                                                        const ws = { ...(p.weeklySchedule || {}) };
                                                        if (e.target.checked) {
                                                            ws[day] = { startTime: '08:00', endTime: '16:00' };
                                                        } else {
                                                            ws[day] = null;
                                                        }
                                                        return { ...p, weeklySchedule: ws };
                                                    });
                                                }}
                                                className="rounded border-gray-300 text-[#06736a] focus:ring-[#06736a]"
                                            />
                                            <span className="font-medium text-xs w-10">{WEEK_DAY_LABELS[day].slice(0, 3)}</span>
                                            {isActive && (
                                                <>
                                                    <input
                                                        type="time"
                                                        value={daySched?.startTime || '08:00'}
                                                        onChange={e => setNewShiftForm(p => {
                                                            const ws = { ...(p.weeklySchedule || {}) };
                                                            ws[day] = { ...(ws[day] || { startTime: '08:00', endTime: '16:00' }), startTime: e.target.value };
                                                            return { ...p, weeklySchedule: ws };
                                                        })}
                                                        className="px-1.5 py-1 text-xs border border-gray-300 rounded w-[75px]"
                                                    />
                                                    <span className="text-gray-400 text-xs">–</span>
                                                    <input
                                                        type="time"
                                                        value={daySched?.endTime || '16:00'}
                                                        onChange={e => setNewShiftForm(p => {
                                                            const ws = { ...(p.weeklySchedule || {}) };
                                                            ws[day] = { ...(ws[day] || { startTime: '08:00', endTime: '16:00' }), endTime: e.target.value };
                                                            return { ...p, weeklySchedule: ws };
                                                        })}
                                                        className="px-1.5 py-1 text-xs border border-gray-300 rounded w-[75px]"
                                                    />
                                                </>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={editingShiftId ? saveEditShift : addShift}
                            disabled={!newShiftForm.name.trim()}
                            className="px-4 py-2 text-sm bg-[#06736a] text-white rounded-lg hover:bg-[#054f46] disabled:opacity-50 font-semibold transition-colors flex items-center gap-2"
                        >
                            💾 {editingShiftId ? 'Simpan Perubahan' : 'Tambah Shift'}
                        </button>
                        <button
                            type="button"
                            onClick={resetForm}
                            className="px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 font-medium transition-colors"
                        >
                            Batal
                        </button>
                    </div>
                </div>
            )}

            {!showAddShiftForm && (
                <div className="px-5 py-3 border-t border-gray-100">
                    <button
                        onClick={() => setShowAddShiftForm(true)}
                        className="flex items-center gap-1.5 text-sm text-[#06736a] hover:text-[#054f46] font-semibold transition-colors"
                    >
                        <PlusIcon className="w-4 h-4" />
                        Tambah Shift Baru
                    </button>
                </div>
            )}
        </div>
    );
};

export default ShiftDefinitionPanel;
