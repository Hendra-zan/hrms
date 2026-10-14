import React from 'react';
import { WorkLogCategory, WorkLogShift, WorkLogStatus, WorkLogEntry } from '../../../types.ts';
import { CATEGORY_LABEL_MAP, SHIFT_LABEL_MAP } from './types.ts';

interface WorkLogFormModalProps {
  isFormOpen: boolean;
  setIsFormOpen: (val: boolean) => void;
  editingLog: WorkLogEntry | null;
  formDate: string;
  setFormDate: (val: string) => void;
  formShift: WorkLogShift;
  setFormShift: (val: WorkLogShift) => void;
  formStartTime: string;
  setFormStartTime: (val: string) => void;
  formEndTime: string;
  setFormEndTime: (val: string) => void;
  formTitle: string;
  setFormTitle: (val: string) => void;
  formCategory: WorkLogCategory;
  setFormCategory: (val: WorkLogCategory) => void;
  formDescription: string;
  setFormDescription: (val: string) => void;
  formLocation: string;
  setFormLocation: (val: string) => void;
  formPatientCount: string;
  setFormPatientCount: (val: string) => void;
  formStatus: WorkLogStatus;
  setFormStatus: (val: WorkLogStatus) => void;
  isSaving: boolean;
  calculatedDuration: number;
  handleSaveLog: (e: React.FormEvent) => Promise<void>;
}

export const WorkLogFormModal: React.FC<WorkLogFormModalProps> = ({
  isFormOpen,
  setIsFormOpen,
  editingLog,
  formDate,
  setFormDate,
  formShift,
  setFormShift,
  formStartTime,
  setFormStartTime,
  formEndTime,
  setFormEndTime,
  formTitle,
  setFormTitle,
  formCategory,
  setFormCategory,
  formDescription,
  setFormDescription,
  formLocation,
  setFormLocation,
  formPatientCount,
  setFormPatientCount,
  formStatus,
  setFormStatus,
  isSaving,
  calculatedDuration,
  handleSaveLog,
}) => {
  if (!isFormOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-xl rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-gradient-to-r from-teal-500/10 to-transparent">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-[#06736a] text-white rounded-xl text-base">📝</span>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                {editingLog ? 'Edit Aktivitas Logbook' : 'Catat Aktivitas Logbook Baru'}
              </h3>
              <p className="text-xs text-slate-400">Isi detail aktivitas atau pelayanan yang telah Anda lakukan</p>
            </div>
          </div>
          <button
            onClick={() => setIsFormOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg text-lg"
          >
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSaveLog} className="p-6 overflow-y-auto space-y-4 flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Tanggal Kegiatan</label>
              <input
                type="date"
                required
                value={formDate}
                onChange={e => setFormDate(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Shift Kerja</label>
              <select
                value={formShift}
                onChange={e => setFormShift(e.target.value as WorkLogShift)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
              >
                {Object.entries(SHIFT_LABEL_MAP).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Mulai</label>
              <input
                type="time"
                required
                value={formStartTime}
                onChange={e => setFormStartTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jam Selesai</label>
              <input
                type="time"
                required
                value={formEndTime}
                onChange={e => setFormEndTime(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
              />
            </div>
          </div>

          <div className="p-2.5 bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900 rounded-xl text-xs text-teal-800 dark:text-teal-300 flex items-center justify-between">
            <span>⏱️ Estimasi Durasi:</span>
            <span className="font-bold">{(calculatedDuration / 60).toFixed(1)} Jam ({calculatedDuration} Menit)</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Kategori Aktivitas</label>
            <select
              value={formCategory}
              onChange={e => setFormCategory(e.target.value as WorkLogCategory)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
            >
              {Object.entries(CATEGORY_LABEL_MAP).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Judul / Ringkasan Tindakan</label>
            <input
              type="text"
              required
              placeholder="Contoh: Pemasangan Infus & Handover Pasien Ruang Melati"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Rincian Deskripsi Kegiatan</label>
            <textarea
              required
              rows={3}
              placeholder="Jelaskan secara rinci tindakan, prosedur medis, pasien yang dilayani, atau kendala di lapangan..."
              value={formDescription}
              onChange={e => setFormDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200 resize-none"
            ></textarea>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Lokasi / Ruangan (Opsional)</label>
              <input
                type="text"
                placeholder="Contoh: IGD / Rawat Inap Lt. 3"
                value={formLocation}
                onChange={e => setFormLocation(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Jumlah Pasien (Opsional)</label>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={formPatientCount}
                onChange={e => setFormPatientCount(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl font-medium focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-200"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Status Pengajuan</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="status"
                  value="submitted"
                  checked={formStatus === 'submitted'}
                  onChange={() => setFormStatus('submitted')}
                  className="text-[#06736a] focus:ring-[#06736a]"
                />
                Ajukan ke Karu (Menunggu Verifikasi)
              </label>
              <label className="flex items-center gap-1.5 text-xs font-medium cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="radio"
                  name="status"
                  value="draft"
                  checked={formStatus === 'draft'}
                  onChange={() => setFormStatus('draft')}
                  className="text-[#06736a] focus:ring-[#06736a]"
                />
                Simpan Sebagai Draft
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={() => setIsFormOpen(false)}
              className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              {isSaving ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Menyimpan...
                </>
              ) : (
                '💾 Simpan Logbook'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
