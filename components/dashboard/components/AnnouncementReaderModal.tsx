import React from 'react';
import { AnnouncementItem } from '../types.ts';

interface AnnouncementReaderModalProps {
  announcement: AnnouncementItem | null;
  onClose: () => void;
}

export const AnnouncementReaderModal: React.FC<AnnouncementReaderModalProps> = ({
  announcement,
  onClose,
}) => {
  if (!announcement) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100vh-3.5rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex justify-between items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                announcement.type === 'kebijakan'
                  ? 'bg-amber-100 text-amber-800 border border-amber-200'
                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
              }`}>
                {announcement.type === 'kebijakan' ? '📜 Kebijakan RS' : '📢 Pengumuman RS'}
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {new Date(announcement.created_at).toLocaleDateString('id-ID', {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric'
                })}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base sm:text-lg leading-snug break-words">
              {announcement.title}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Penerbit / Penulis: <span className="font-semibold text-slate-700 dark:text-slate-200">{announcement.employees?.nama || 'HRD / Manajemen RS'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 bg-white dark:bg-slate-900">
          <div className="prose prose-sm max-w-none text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap break-words">
            {announcement.content}
          </div>
        </div>

        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-between items-center">
          <span className="text-[11px] text-slate-400 font-medium">
            RSU Meloy &copy; Dokumen Resmi Internal
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
            >
              🖨️ Cetak
            </button>
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-xs font-bold text-white bg-[#06736a] hover:bg-[#06736a]/90 rounded-xl transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
