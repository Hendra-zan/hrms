import React from 'react';
import { Employee, AttendanceReasonCode } from '../../../types.ts';
import { ClockIcon } from '../../icons.tsx';
import { ATTENDANCE_REASON_CODE_OPTIONS } from './types.ts';

interface ManualAttendanceFormFieldsProps {
  employees: Employee[];
  newRecord: any;
  setNewRecord: React.Dispatch<React.SetStateAction<any>>;
  isLocating: boolean;
  fingerprintVerified: { clockIn: boolean; clockOut: boolean };
  setCurrentTime: (field: 'clockIn' | 'clockOut') => void;
  setFingerprintModal: React.Dispatch<React.SetStateAction<{ isOpen: boolean; targetField: 'clockIn' | 'clockOut' }>>;
  handleUseCurrentLocation: () => void;
  isSaving: boolean;
  handleSaveAttendance: (e: React.FormEvent) => Promise<void>;
}

export const ManualAttendanceFormFields: React.FC<ManualAttendanceFormFieldsProps> = ({
  employees,
  newRecord,
  setNewRecord,
  isLocating,
  fingerprintVerified,
  setCurrentTime,
  setFingerprintModal,
  handleUseCurrentLocation,
  isSaving,
  handleSaveAttendance,
}) => {
  return (
    <form onSubmit={handleSaveAttendance} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pilih Karyawan */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            Karyawan <span className="text-red-500">*</span>
          </label>
          <select
            value={newRecord.employeeId}
            onChange={e => setNewRecord((prev: any) => ({ ...prev, employeeId: e.target.value }))}
            required
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none"
          >
            <option value="">-- Pilih Karyawan --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>
                {emp.nama} ({emp.nik || emp.jabatan || 'Staf'})
              </option>
            ))}
          </select>
        </div>

        {/* Tanggal */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            Tanggal <span className="text-red-500">*</span>
          </label>
          <input
            type="date"
            value={newRecord.tanggal}
            onChange={e => setNewRecord((prev: any) => ({ ...prev, tanggal: e.target.value }))}
            required
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none"
          />
        </div>

        {/* Clock In */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            Jam Masuk (Clock In)
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={newRecord.clockIn}
              onChange={e => setNewRecord((prev: any) => ({ ...prev, clockIn: e.target.value }))}
              className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none"
            />
            <button
              type="button"
              onClick={() => setCurrentTime('clockIn')}
              className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-xs font-semibold rounded-xl text-gray-700 dark:text-slate-200 transition-colors"
              title="Isi jam sekarang"
            >
              Sekarang
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newRecord.employeeId) {
                  alert('Pilih karyawan terlebih dahulu.');
                  return;
                }
                setFingerprintModal({ isOpen: true, targetField: 'clockIn' });
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                fingerprintVerified.clockIn
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-teal-50 hover:bg-teal-100 text-[#06736a] border border-teal-200'
              }`}
              title="Verifikasi Fingerprint"
            >
              <span>👆</span>
              {fingerprintVerified.clockIn ? 'Verified' : 'Fingerprint'}
            </button>
          </div>
        </div>

        {/* Clock Out */}
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            Jam Pulang (Clock Out)
          </label>
          <div className="flex gap-2">
            <input
              type="time"
              value={newRecord.clockOut}
              onChange={e => setNewRecord((prev: any) => ({ ...prev, clockOut: e.target.value }))}
              className="flex-1 px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none"
            />
            <button
              type="button"
              onClick={() => setCurrentTime('clockOut')}
              className="px-2.5 py-1.5 bg-gray-100 dark:bg-slate-700 hover:bg-gray-200 text-xs font-semibold rounded-xl text-gray-700 dark:text-slate-200 transition-colors"
              title="Isi jam sekarang"
            >
              Sekarang
            </button>
            <button
              type="button"
              onClick={() => {
                if (!newRecord.employeeId) {
                  alert('Pilih karyawan terlebih dahulu.');
                  return;
                }
                setFingerprintModal({ isOpen: true, targetField: 'clockOut' });
              }}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1 transition-all ${
                fingerprintVerified.clockOut
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-teal-50 hover:bg-teal-100 text-[#06736a] border border-teal-200'
              }`}
              title="Verifikasi Fingerprint"
            >
              <span>👆</span>
              {fingerprintVerified.clockOut ? 'Verified' : 'Fingerprint'}
            </button>
          </div>
        </div>
      </div>

      {/* Alasan & Lokasi */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            Alasan Input Manual
          </label>
          <select
            value={newRecord.reasonCode}
            onChange={e => setNewRecord((prev: any) => ({ ...prev, reasonCode: e.target.value as AttendanceReasonCode }))}
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none"
          >
            <option value="">-- Pilih Alasan (Opsional) --</option>
            {ATTENDANCE_REASON_CODE_OPTIONS.map(opt => (
              <option key={opt.code} value={opt.code}>{opt.label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-700 dark:text-slate-300 mb-1">
            Label Lokasi
          </label>
          <input
            type="text"
            value={newRecord.location}
            onChange={e => setNewRecord((prev: any) => ({ ...prev, location: e.target.value }))}
            placeholder="Contoh: RS Utama (Manual)"
            className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none"
          />
        </div>
      </div>

      {/* GPS Button & Catatan */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all"
        >
          <span>📍</span>
          {isLocating ? 'Mengambil GPS...' : 'Gunakan Koordinat GPS Saat Ini'}
          {newRecord.latitude && <span className="text-emerald-600 font-bold ml-1">✓ OK</span>}
        </button>

        <button
          type="submit"
          disabled={isSaving}
          className="px-6 py-2 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
        >
          {isSaving ? 'Menyimpan...' : '💾 Simpan Data Presensi'}
        </button>
      </div>
    </form>
  );
};
