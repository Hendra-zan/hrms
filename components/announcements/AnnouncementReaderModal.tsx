import React, { useState } from 'react';
import { Announcement } from '../../types/announcement.ts';

interface AnnouncementReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: Announcement | null;
  currentEmployeeId?: string | null;
  onAcknowledge?: (announcementId: string) => Promise<void>;
}

export const AnnouncementReaderModal: React.FC<AnnouncementReaderModalProps> = ({
  isOpen,
  onClose,
  item,
  currentEmployeeId,
  onAcknowledge,
}) => {
  if (!isOpen || !item) return null;

  const [acknowledging, setAcknowledging] = useState(false);
  const isPolicy = item.type === 'kebijakan';
  const isAcknowledged = Boolean(item.acknowledged_at);
  const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleAcknowledge = async () => {
    if (!onAcknowledge || isAcknowledged) return;
    setAcknowledging(true);
    try {
      await onAcknowledge(item.id);
    } catch (err: any) {
      alert(`Gagal mengonfirmasi: ${err.message}`);
    } finally {
      setAcknowledging(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100vh-3.5rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header - fixed at top of modal */}
        <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {item.is_pinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 px-2.5 py-0.5 text-[11px] font-bold border border-amber-300/60">
                  📌 Disematkan
                </span>
              )}
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                  isPolicy
                    ? 'bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300 border border-teal-200 dark:border-teal-800'
                    : 'bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                }`}
              >
                {isPolicy ? '📜 Kebijakan Resmi RS' : '📢 Pengumuman'}
              </span>
              <span className="text-xs text-slate-400 dark:text-slate-400 font-mono">{formattedDate}</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 leading-snug break-words">
              {item.title}
            </h2>
            {item.employees?.nama && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Diterbitkan oleh: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.employees.nama}</span>
                {item.employees.jabatan && ` (${item.employees.jabatan})`}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body - scrollable area */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-5">
          <div className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-line font-normal break-words">
            {item.content}
          </div>

          {/* Attachments Section */}
          {item.attachments && item.attachments.length > 0 && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2.5">
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <span>📎 Berkas Lampiran Resmi ({item.attachments.length})</span>
              </h4>
              <div className="space-y-1.5">
                {item.attachments.map(att => (
                  <a
                    key={att.id}
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-teal-500 transition-colors group"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="text-lg">📄</span>
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 group-hover:text-teal-600 dark:group-hover:text-teal-400 truncate">
                        {att.name}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-[#06736a] dark:text-teal-400 shrink-0">
                      Unduh Berkas ⬇
                    </span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Legal Acknowledgment Section */}
          {item.requires_acknowledgment && currentEmployeeId && (
            <div className={`p-4 rounded-xl border ${
              isAcknowledged
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                : 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
            }`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{isAcknowledged ? '✅' : '✍️'}</span>
                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    {isAcknowledged ? 'Konfirmasi Kepatuhan Tercatat' : 'Kewajiban Membaca & Memahami Regulasi'}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                    {isAcknowledged
                      ? `Anda telah mengonfirmasi pemahaman kebijakan ini pada ${new Date(item.acknowledged_at!).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}.`
                      : 'Kebijakan ini mewajibkan setiap staf medis & non-medis terkait untuk memberikan tanda terima baca resmi.'}
                  </p>
                  {!isAcknowledged && onAcknowledge && (
                    <button
                      type="button"
                      onClick={handleAcknowledge}
                      disabled={acknowledging}
                      className="mt-3 px-4 py-2 text-xs font-bold text-white bg-[#06736a] hover:bg-[#055f57] rounded-xl shadow-xs transition-colors"
                    >
                      {acknowledging ? 'Menyimpan...' : '✓ Saya Telah Membaca & Memahami Kebijakan Ini'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer - fixed at bottom of modal */}
        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
