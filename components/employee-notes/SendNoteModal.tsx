import React, { useState } from 'react';
import { Employee, NoteCategory, NotePriority } from '../../types.ts';
import { employeeNotesService } from '../../services/employeeNotesService.ts';
import { EmployeeSearchPicker } from '../common/EmployeeSearchPicker.tsx';

interface SendNoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sender?: Employee;
  senderId?: string;
  targetEmployee?: Employee;
  allEmployees?: Employee[];
  employees?: Employee[];
  onNoteSent?: () => void;
}

const QUICK_TEMPLATES = [
  {
    label: '📋 Tugas Rekam Medis',
    category: 'task' as NoteCategory,
    priority: 'important' as NotePriority,
    title: 'Kelengkapan Dokumen Rekam Medis Pasien',
    content: 'Tolong periksa dan lengkapi asuhan keperawatan serta formulir integrasi rekam medis pasien sebelum serah terima shift.',
  },
  {
    label: '📄 Pengingat Berkas STR/SIP',
    category: 'reminder' as NoteCategory,
    priority: 'important' as NotePriority,
    title: 'Pengingat Masa Berlaku STR / SIP',
    content: 'Surat Tanda Registrasi (STR) / SIP Anda akan segera mendekati batas akhir. Harap serahkan berkas perpanjangan ke bagian HRD.',
  },
  {
    label: '💬 Pembinaan Privat Shift',
    category: 'coaching' as NoteCategory,
    priority: 'normal' as NotePriority,
    title: 'Evaluasi & Masukan Kinerja Pelayanan',
    content: 'Harap perhatikan kerapian penataan alat kesehatan dan koordinasi respon bel pasien saat bertugas di ruangan.',
  },
];

export const SendNoteModal: React.FC<SendNoteModalProps> = ({
  isOpen,
  onClose,
  sender,
  senderId,
  targetEmployee,
  allEmployees = [],
  employees = [],
  onNoteSent,
}) => {
  const [selectedEmpId, setSelectedEmpId] = useState<string>(targetEmployee?.id || '');
  const [category, setCategory] = useState<NoteCategory>('task');
  const [priority, setPriority] = useState<NotePriority>('normal');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const actualSenderId = sender?.id || senderId || '';
  const actualSenderNama = sender?.nama || 'Atasan / HRD';
  const effectiveEmployees = allEmployees.length > 0 ? allEmployees : employees;

  const handleApplyTemplate = (tpl: typeof QUICK_TEMPLATES[0]) => {
    setCategory(tpl.category);
    setPriority(tpl.priority);
    setTitle(tpl.title);
    setContent(tpl.content);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalEmpId = targetEmployee?.id || selectedEmpId;
    if (!finalEmpId) {
      setErrorMsg('Pilih karyawan penerima catatan terlebih dahulu.');
      return;
    }
    if (!actualSenderId) {
      setErrorMsg('Identitas pengirim tidak valid. Silakan muat ulang halaman.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMsg('Judul dan isi catatan wajib diisi.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    const res = await employeeNotesService.createEmployeeNote({
      employeeId: finalEmpId,
      senderId: actualSenderId,
      category,
      priority,
      title: title.trim(),
      content: content.trim(),
    });

    if (res.success) {
      setSuccessMsg('Catatan berhasil dikirimkan ke karyawan!');
      setTimeout(() => {
        setSuccessMsg('');
        if (onNoteSent) onNoteSent();
        onClose();
      }, 1000);
    } else {
      setErrorMsg(res.error || 'Gagal mengirim catatan.');
    }
    setSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#06736a] to-teal-700 text-white flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✉️</span>
            <div>
              <h3 className="text-base font-bold">Kirim Catatan & Tugas Staf</h3>
              <p className="text-xs text-teal-100/90">Instruksi langsung 2-arah dari {actualSenderNama}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 p-4 sm:p-6 space-y-4 overflow-y-auto">
            {/* Quick Template Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                ⚡ Templat Cepat (Quick Template):
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_TEMPLATES.map((tpl, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="px-2.5 py-1 rounded-lg border border-teal-200 dark:border-teal-800 bg-teal-50/60 dark:bg-teal-950/30 text-[11px] font-semibold text-[#06736a] dark:text-teal-300 hover:bg-teal-100 transition-colors"
                  >
                    {tpl.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Employee Selection */}
            {targetEmployee ? (
              <div className="p-3.5 rounded-2xl bg-teal-50 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-white">
                  Penerima: <strong>{targetEmployee.nama}</strong> ({targetEmployee.jabatan || 'Staf'})
                </span>
              </div>
            ) : (
              <EmployeeSearchPicker
                employees={effectiveEmployees}
                selectedEmployeeId={selectedEmpId}
                onSelectEmployee={setSelectedEmpId}
                excludeEmployeeId={actualSenderId}
                label="👤 Pilih Karyawan Penerima Catatan / Tugas:"
                placeholder="🔍 Ketik nama staf, NIK, atau jabatan penerima..."
              />
            )}

            {/* Category & Priority */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🏷️ Kategori:
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as NoteCategory)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#06736a]"
                >
                  <option value="task">📌 Tugas Khusus</option>
                  <option value="coaching">💬 Pembinaan / Feedback</option>
                  <option value="reminder">📄 Pengingat Administrasi</option>
                  <option value="general">📝 Catatan Umum</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  🚦 Prioritas:
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as NotePriority)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#06736a]"
                >
                  <option value="normal">Biasa</option>
                  <option value="important">⚡ Penting</option>
                  <option value="urgent">🔥 Urgent (Mendesak)</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                📌 Judul Catatan / Tugas:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Contoh: Perbaikan Dokumentasi Pasien Bed 3B"
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#06736a]"
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                📝 Rincian Instruksi / Catatan:
              </label>
              <textarea
                rows={4}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Tuliskan instruksi atau catatan secara jelas di sini..."
                className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-[#06736a]"
              />
            </div>

            {errorMsg && <p className="text-xs text-red-500 font-medium">{errorMsg}</p>}
            {successMsg && <p className="text-xs text-emerald-600 font-bold">{successMsg}</p>}
          </div>

          <div className="flex-shrink-0 p-4 border-t border-slate-100 dark:border-slate-700 bg-white dark:bg-slate-800 flex gap-2 z-10 shadow-md">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 py-2.5 rounded-xl border border-slate-300 text-slate-700 dark:text-slate-300 text-xs font-bold"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-1/2 py-2.5 rounded-xl bg-[#06736a] hover:bg-teal-700 text-white font-bold text-xs shadow-md"
            >
              {submitting ? 'Mengirim...' : '✉️ Kirim Catatan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
