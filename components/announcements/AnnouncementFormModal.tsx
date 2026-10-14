import React, { useState, useRef } from 'react';
import {
  Announcement,
  AnnouncementType,
  AnnouncementTargetType,
  AnnouncementAttachment,
  AnnouncementUpsertPayload,
} from '../../types/announcement.ts';
import { WorkUnit } from '../../types.ts';
import { announcementService } from '../../services/announcementService.ts';

interface AnnouncementFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (payload: AnnouncementUpsertPayload, editingId?: string) => Promise<void>;
  editingItem?: Announcement | null;
  workUnits?: WorkUnit[];
  departments?: string[];
  currentEmployeeId?: string | null;
}

export const AnnouncementFormModal: React.FC<AnnouncementFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingItem,
  workUnits = [],
  departments = [],
  currentEmployeeId,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(editingItem?.title || '');
  const [content, setContent] = useState(editingItem?.content || '');
  const [type, setType] = useState<AnnouncementType>(editingItem?.type || 'pengumuman');
  const [isPinned, setIsPinned] = useState(Boolean(editingItem?.is_pinned));
  const [targetType, setTargetType] = useState<AnnouncementTargetType>(editingItem?.target_type || 'all');
  const [targetIds, setTargetIds] = useState<string[]>(editingItem?.target_ids || []);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(editingItem?.attachments || []);
  const [requiresAck, setRequiresAck] = useState(Boolean(editingItem?.requires_acknowledgment));
  const [expiresAt, setExpiresAt] = useState(editingItem?.expires_at ? editingItem.expires_at.split('T')[0] : '');

  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      alert('Ukuran berkas maksimal 15MB.');
      return;
    }

    setUploading(true);
    try {
      const uploaded = await announcementService.uploadAttachment(file);
      setAttachments(prev => [...prev, uploaded]);
    } catch (err: any) {
      alert(`Gagal mengunggah berkas: ${err.message || 'Periksa koneksi storage'}`);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleToggleTargetId = (id: string) => {
    setTargetIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      alert('Harap isi judul dan isi pengumuman.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: AnnouncementUpsertPayload = {
        title: title.trim(),
        content: content.trim(),
        type,
        author_id: editingItem?.author_id || currentEmployeeId || null,
        is_pinned: isPinned,
        target_type: targetType,
        target_ids: targetType === 'all' ? [] : targetIds,
        attachments,
        requires_acknowledgment: requiresAck,
        status: 'published',
        expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
      };

      await onSave(payload, editingItem?.id);
      onClose();
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100vh-3.5rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
              {editingItem ? '✏️ Edit Kebijakan / Pengumuman' : '📢 Buat Kebijakan & Pengumuman Baru'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Siarkan regulasi atau memo penting ke aplikasi web dan mobile staf.
            </p>
          </div>
          <button onClick={onClose} aria-label="Tutup modal" className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg">✕</button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Type & Pin options */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Kategori</label>
              <select
                value={type}
                onChange={e => setType(e.target.value as AnnouncementType)}
                className="w-full px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl"
              >
                <option value="pengumuman">📢 Pengumuman Umum</option>
                <option value="kebijakan">📜 Kebijakan / SOP Resmi RS</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2 sm:pt-6">
              <input
                type="checkbox"
                id="isPinned"
                checked={isPinned}
                onChange={e => setIsPinned(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="isPinned" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                📌 Sematkan di Teratas (*Pin to Top*)
              </label>
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Judul Pengumuman / Kebijakan *</label>
            <input
              type="text"
              required
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Contoh: Kebijakan SPO Penanganan Pasien Darurat 2026"
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 font-medium"
            />
          </div>

          {/* Content */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">Isi Dokumen / Rincian Pengumuman *</label>
            <textarea
              required
              rows={5}
              value={content}
              onChange={e => setContent(e.target.value)}
              placeholder="Tuliskan isi lengkap kebijakan, poin-poin penting, atau arahan manajemen..."
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:border-teal-500 leading-relaxed font-sans"
            />
          </div>

          {/* Target Audience */}
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">🎯 Segmentasi Target Audiens</label>
            <div className="flex flex-wrap gap-2 text-xs">
              {(['all', 'units', 'departments'] as AnnouncementTargetType[]).map(t => (
                <button
                  type="button"
                  key={t}
                  onClick={() => setTargetType(t)}
                  className={`px-3 py-1 rounded-lg font-medium transition-colors ${
                    targetType === t
                      ? 'bg-[#06736a] text-white'
                      : 'bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                  }`}
                >
                  {t === 'all' ? '🌐 Semua Staf' : t === 'units' ? '🏥 Unit Tertentu' : '🏢 Departemen Tertentu'}
                </button>
              ))}
            </div>

            {targetType === 'units' && (
              <div className="flex flex-wrap gap-1.5 pt-2 max-h-28 overflow-y-auto">
                {workUnits.map(u => (
                  <button
                    type="button"
                    key={u.id}
                    onClick={() => handleToggleTargetId(u.id)}
                    className={`px-2 py-1 text-[11px] rounded-md font-medium border ${
                      targetIds.includes(u.id)
                        ? 'bg-teal-100 text-teal-800 border-teal-300'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {targetIds.includes(u.id) ? '✓ ' : '+ '}{u.nama}
                  </button>
                ))}
              </div>
            )}

            {targetType === 'departments' && (
              <div className="flex flex-wrap gap-1.5 pt-2 max-h-28 overflow-y-auto">
                {departments.map(d => (
                  <button
                    type="button"
                    key={d}
                    onClick={() => handleToggleTargetId(d)}
                    className={`px-2 py-1 text-[11px] rounded-md font-medium border ${
                      targetIds.includes(d)
                        ? 'bg-teal-100 text-teal-800 border-teal-300'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {targetIds.includes(d) ? '✓ ' : '+ '}{d}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Legal Acknowledgment & Expiry */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="requiresAck"
                checked={requiresAck}
                onChange={e => setRequiresAck(e.target.checked)}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <label htmlFor="requiresAck" className="text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                ✍️ Wajib Konfirmasi Baca (*Acknowledge*)
              </label>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Masa Berlaku (Opsional)</label>
              <input
                type="date"
                value={expiresAt}
                onChange={e => setExpiresAt(e.target.value)}
                className="w-full px-2.5 py-1 text-xs bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg"
              />
            </div>
          </div>

          {/* Attachments Section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-slate-800 dark:text-slate-200">📎 Lampiran Berkas Resmi (PDF / SK / Dokumen)</label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="text-xs font-semibold text-teal-600 dark:text-teal-400 hover:underline flex items-center gap-1"
              >
                <span>{uploading ? '⏳ Mengunggah...' : '+ Unggah Dokumen'}</span>
              </button>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.jpg,.png" onChange={handleFileUpload} className="hidden" />
            </div>

            {attachments.length > 0 && (
              <div className="space-y-1.5">
                {attachments.map(a => (
                  <div key={a.id} className="flex items-center justify-between p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                    <span className="truncate max-w-[80%] font-medium text-slate-800 dark:text-slate-200">📄 {a.name} ({(a.size / 1024).toFixed(0)} KB)</span>
                    <button type="button" onClick={() => handleRemoveAttachment(a.id)} className="text-rose-500 hover:text-rose-700 font-bold px-1.5">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer Actions */}
        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl">
            Batal
          </button>
          <button type="button" onClick={handleSubmit} disabled={submitting} className="px-5 py-2 text-xs font-semibold text-white bg-[#06736a] hover:bg-[#055f57] rounded-xl shadow-xs">
            {submitting ? 'Menyimpan...' : editingItem ? 'Simpan Perubahan' : 'Siarkan Sekarang'}
          </button>
        </div>
      </div>
    </div>
  );
};
