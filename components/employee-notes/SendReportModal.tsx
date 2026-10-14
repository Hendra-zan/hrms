import React, { useState, useEffect, useMemo } from 'react';
import { Employee, NoteCategory, NotePriority } from '../../types.ts';
import { employeeNotesService } from '../../services/employeeNotesService.ts';
import { EmployeeSearchPicker } from '../common/EmployeeSearchPicker.tsx';

interface SendReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  senderEmployee: Employee;
  allEmployees?: Employee[];
}

export const SendReportModal: React.FC<SendReportModalProps> = ({
  isOpen,
  onClose,
  senderEmployee,
  allEmployees = [],
}) => {
  // ──────────────────────────────────────────────────────────────────────────
  // STATE: supervisor list (fetched dari DB secara mandiri)
  // ──────────────────────────────────────────────────────────────────────────
  const [fetchedSupervisors, setFetchedSupervisors] = useState<{
    id: string; nama: string; nik?: string; role?: string; jabatan?: string; work_unit_id?: string;
  }[]>([]);
  const [isFetchingSupervisors, setIsFetchingSupervisors] = useState(false);

  // Fetch supervisor dari DB saat modal pertama kali dibuka
  useEffect(() => {
    if (!isOpen) return;

    const senderUnitId = senderEmployee.unitKerjaId;

    setIsFetchingSupervisors(true);
    employeeNotesService
      .fetchSupervisors(senderEmployee.id, senderUnitId ?? undefined)
      .then((rows) => {
        setFetchedSupervisors(rows);
      })
      .catch(() => setFetchedSupervisors([]))
      .finally(() => setIsFetchingSupervisors(false));
  }, [isOpen, senderEmployee.id]);

  // Gabungkan: DB result (utama) + allEmployees dari store (fallback/tambahan)
  // De-duplicate berdasarkan id, exclude pengirim sendiri
  const supervisors = useMemo(() => {
    const map = new Map<string, any>();

    // Tambahkan dari DB fetch dulu (prioritas)
    for (const s of fetchedSupervisors) {
      if (s.id !== senderEmployee.id) map.set(s.id, s);
    }

    // Tambahkan dari prop allEmployees (jika ada yang tidak tercakup DB fetch)
    for (const e of allEmployees) {
      if (e.id !== senderEmployee.id && !map.has(e.id)) {
        map.set(e.id, {
          id: e.id,
          nama: e.nama,
          nik: e.nik,
          role: e.role,
          jabatan: e.jabatan,
          unitKerjaId: e.unitKerjaId,
        });
      }
    }

    return Array.from(map.values());
  }, [fetchedSupervisors, allEmployees, senderEmployee.id]);

  // Rekomendasi default: Karu unit sendiri, atau supervisor pertama yang ada
  const defaultSupervisor = useMemo(() => {
    const senderUnitId = senderEmployee.unitKerjaId;
    return (
      supervisors.find(
        (e) =>
          (e.role?.toLowerCase().includes('kepala') || e.role?.toLowerCase().includes('karu')) &&
          (e as any).unitKerjaId === senderUnitId
      ) || supervisors[0]
    );
  }, [supervisors, senderEmployee]);

  const [targetSupervisorId, setTargetSupervisorId] = useState<string>('');
  const [category, setCategory] = useState<NoteCategory>('facility_issue');
  const [priority, setPriority] = useState<NotePriority>('normal');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [attachmentUrl, setAttachmentUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMessage('Ukuran file maksimal 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setAttachmentUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reset target saat modal ditutup & buka kembali
  useEffect(() => {
    if (!isOpen) {
      setTargetSupervisorId('');
    }
  }, [isOpen]);

  const applyPresetTemplate = (preset: 'tool' | 'incident' | 'swap' | 'idea') => {
    if (preset === 'tool') {
      setCategory('facility_issue');
      setPriority('high');
      setTitle('Laporan Kendala Kerusakan Alat Medis / Fasilitas');
      setContent(`NAMA ALAT / FASILITAS: \nLOKASI RUANGAN: \nGEJALA KERUSAKAN: \nKRONOLOGI SINGKAT: \nTERJADI SEJAK: `);
    } else if (preset === 'incident') {
      setCategory('incident_report');
      setPriority('urgent');
      setTitle('Laporan Kejadian Khusus Shift');
      setContent(`TANGGAL & SHIFT: \nLOKASI KEJADIAN: \nKRONOLOGI KEJADIAN: \nPIHAK YANG TERLIBAT: \nTINDAKAN AWAL YANG DILAKUKAN: `);
    } else if (preset === 'swap') {
      setCategory('schedule_coordination');
      setPriority('normal');
      setTitle('Permohonan Koordinasi Tukar Shift');
      setContent(`TANGGAL SHIFT ASAL: \nTANGGAL SHIFT PENGGANTI: \nREKAN PENGGANTI: \nALASAN TUKAR SHIFT: `);
    } else if (preset === 'idea') {
      setCategory('feedback');
      setPriority('normal');
      setTitle('Saran & Masukan Operasional Unit');
      setContent(`TOPIK MASUKAN: \nKONDISI LAPANGAN SAAT INI: \nUSULAN PERBAIKAN: `);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!targetSupervisorId) {
      setErrorMessage('Silakan pilih Atasan atau Kepala Ruangan tujuan.');
      return;
    }
    if (!title.trim() || !content.trim()) {
      setErrorMessage('Judul dan isi laporan wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await employeeNotesService.createEmployeeNote({
        employeeId: targetSupervisorId, // Received by Supervisor
        senderId: senderEmployee.id,     // Sent by Employee
        category,
        priority,
        title: title.trim(),
        content: content.trim(),
        direction: 'bottom_up',
        attachmentUrl: attachmentUrl || undefined,
      });

      if (res.success) {
        // Reset
        setTitle('');
        setContent('');
        setAttachmentUrl(null);
        setCategory('facility_issue');
        setPriority('normal');
        onClose();
      } else {
        setErrorMessage(res.error || 'Gagal mengirimkan laporan.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-[#06736a] to-teal-700 flex items-center justify-between text-white">
          <div className="flex items-center gap-2">
            <span className="text-xl">📢</span>
            <div>
              <h3 className="font-bold text-sm">Buat Laporan Ke Atasan / Karu</h3>
              <p className="text-[10px] text-teal-100">Kirim laporan kendala, kejadian shift, atau masukan resmi</p>
            </div>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white font-bold text-lg">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              ⚠️ {errorMessage}
            </div>
          )}

          {/* Quick Preset Template Chips */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
              ⚡ Template Laporan Cepat (Klik Untuk Mengisi Otomatis)
            </label>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => applyPresetTemplate('tool')}
                className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-lg text-[11px] font-bold hover:bg-amber-100 transition-all active:scale-95"
              >
                🛠️ Alat Rusak
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('incident')}
                className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-lg text-[11px] font-bold hover:bg-rose-100 transition-all active:scale-95"
              >
                ⚠️ Kejadian Shift
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('swap')}
                className="px-2.5 py-1 bg-blue-50 dark:bg-blue-950/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg text-[11px] font-bold hover:bg-blue-100 transition-all active:scale-95"
              >
                🔄 Tukar Shift
              </button>
              <button
                type="button"
                onClick={() => applyPresetTemplate('idea')}
                className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-[11px] font-bold hover:bg-emerald-100 transition-all active:scale-95"
              >
                💡 Masukan Unit
              </button>
            </div>
          </div>

          {/* Target Supervisor Selection */}
          <div className="space-y-1.5">
            {isFetchingSupervisors ? (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  👤 Atasan / Kepala Ruangan Tujuan *
                </label>
                <div className="flex items-center gap-2 px-3.5 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                  <div className="w-4 h-4 border-2 border-teal-500 border-t-transparent rounded-full animate-spin flex-shrink-0" />
                  <span className="text-xs text-slate-400">Memuat daftar atasan...</span>
                </div>
              </div>
            ) : (
              <EmployeeSearchPicker
                employees={supervisors}
                selectedEmployeeId={targetSupervisorId}
                onSelectEmployee={setTargetSupervisorId}
                excludeEmployeeId={senderEmployee.id}
                label="👤 Atasan / Kepala Ruangan Tujuan *"
                placeholder="🔍 Ketik nama Karu, HRD, NIK, atau unit kerja..."
              />
            )}

            {!targetSupervisorId && !isFetchingSupervisors && defaultSupervisor && (
              <div className="flex items-center gap-1.5 text-[11px]">
                <span className="text-slate-400">💡 Rekomendasi:</span>
                <button
                  type="button"
                  onClick={() => setTargetSupervisorId(defaultSupervisor.id)}
                  className="font-bold text-[#06736a] dark:text-teal-400 hover:underline"
                >
                  {defaultSupervisor.nama} ({defaultSupervisor.role || 'Karu'})
                </button>
              </div>
            )}

            {!targetSupervisorId && !isFetchingSupervisors && supervisors.length === 0 && (
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                ⚠️ Tidak ada atasan ditemukan. Pastikan koneksi server aktif.
              </p>
            )}
          </div>


          <div className="grid grid-cols-2 gap-3">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Kategori Laporan
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value as NoteCategory)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:outline-none"
              >
                <option value="facility_issue">🛠️ Kendala Alat & Fasilitas</option>
                <option value="incident_report">⚠️ Laporan Kejadian Shift</option>
                <option value="schedule_coordination">🔄 Koordinasi Shift</option>
                <option value="feedback">💡 Saran Operasional</option>
                <option value="general">💬 Catatan Umum</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Tingkat Urgensi
              </label>
              <select
                value={priority}
                onChange={e => setPriority(e.target.value as NotePriority)}
                className="w-full px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:outline-none"
              >
                <option value="normal">Normal</option>
                <option value="high">⚡ Penting</option>
                <option value="urgent">🚨 Mendesak</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Judul Laporan *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Kendala Kerusakan Thermometer Infa-Red di Ruang ICU..."
              className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-[#06736a] focus:outline-none"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Rincian Permasalahan / Kronologi Laporan *
            </label>
            <textarea
              rows={4}
              required
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Jelaskan secara rinci permasalahan, kronologi kejadian, atau usulan solusi..."
              className="w-full p-3.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-[#06736a] focus:outline-none leading-relaxed"
            />
          </div>

          {/* Photo Attachment Picker */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              📷 Lampiran Foto Bukti Fisik (Opsional)
            </label>
            {attachmentUrl ? (
              <div className="relative inline-block border rounded-xl overflow-hidden max-h-32">
                <img src={attachmentUrl} alt="Lampiran Laporan" className="h-28 object-cover rounded-xl" />
                <button
                  type="button"
                  onClick={() => setAttachmentUrl(null)}
                  className="absolute top-1 right-1 bg-rose-600 text-white rounded-full p-1 text-[10px] font-bold shadow"
                  title="Hapus foto"
                >
                  ✕
                </button>
              </div>
            ) : (
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-teal-50 file:text-[#06736a] hover:file:bg-teal-100 cursor-pointer"
              />
            )}
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-bold bg-[#06736a] hover:bg-teal-700 text-white rounded-xl shadow-md disabled:opacity-50 inline-flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Mengirim...
                </>
              ) : (
                '🚀 Kirim Laporan Ke Atasan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
