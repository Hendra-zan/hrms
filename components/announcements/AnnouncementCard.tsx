import React from 'react';
import { Announcement } from '../../types/announcement.ts';

interface AnnouncementCardProps {
  item: Announcement;
  isManager: boolean;
  onRead: (item: Announcement) => void;
  onEdit?: (item: Announcement) => void;
  onDelete?: (id: string) => void;
  onViewCompliance?: (item: Announcement) => void;
}

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  item,
  isManager,
  onRead,
  onEdit,
  onDelete,
  onViewCompliance,
}) => {
  const isPolicy = item.type === 'kebijakan';
  const hasAttachments = item.attachments && item.attachments.length > 0;
  const isAcknowledged = Boolean(item.acknowledged_at);
  const formattedDate = new Date(item.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`relative flex flex-col justify-between rounded-2xl border bg-white dark:bg-slate-850 p-5 transition-all duration-200 hover:shadow-md ${
        item.is_pinned
          ? 'border-amber-300 dark:border-amber-600/50 bg-amber-50/20 dark:bg-amber-950/10 shadow-xs'
          : 'border-slate-200 dark:border-slate-700/80 shadow-xs'
      }`}
    >
      <div>
        {/* Header badges */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex flex-wrap items-center gap-1.5">
            {item.is_pinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 dark:text-amber-300 border border-amber-300/60">
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
              {isPolicy ? '📜 Kebijakan RS' : '📢 Pengumuman'}
            </span>
            {item.requires_acknowledgment && (
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  isAcknowledged
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                    : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 animate-pulse'
                }`}
              >
                {isAcknowledged ? '✓ Telah Dikonfirmasi' : '⚠️ Wajib Konfirmasi'}
              </span>
            )}
          </div>
          <span className="text-xs font-medium text-slate-400 dark:text-slate-400 font-mono">
            {formattedDate}
          </span>
        </div>

        {/* Title */}
        <h3
          onClick={() => onRead(item)}
          className="text-base font-bold text-slate-900 dark:text-slate-100 hover:text-[#06736a] dark:hover:text-teal-400 transition-colors cursor-pointer line-clamp-2 mb-2"
        >
          {item.title}
        </h3>

        {/* Excerpt */}
        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
          {item.content}
        </p>

        {/* Metadata badges (target audience & attachments) */}
        <div className="flex flex-wrap items-center gap-2 mb-4 text-[11px] text-slate-500 dark:text-slate-400">
          {item.target_type && item.target_type !== 'all' ? (
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
              🎯 Target: {item.target_type.toUpperCase()} ({item.target_ids?.length || 0})
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md font-medium">
              🌐 Semua Staf
            </span>
          )}

          {hasAttachments && (
            <span className="inline-flex items-center gap-1 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md font-medium border border-indigo-200 dark:border-indigo-900/40">
              📎 {item.attachments?.length} Dokumen
            </span>
          )}

          {item.employees?.nama && (
            <span className="italic">
              Oleh: <span className="font-semibold text-slate-700 dark:text-slate-200">{item.employees.nama}</span>
            </span>
          )}
        </div>
      </div>

      {/* Footer action buttons */}
      <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
        <button
          onClick={() => onRead(item)}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-[#06736a] dark:text-teal-400 hover:underline cursor-pointer"
        >
          <span>Buka & Baca Selengkapnya</span>
          <span>&rarr;</span>
        </button>

        {isManager && (
          <div className="flex items-center gap-1">
            {item.requires_acknowledgment && onViewCompliance && (
              <button
                onClick={() => onViewCompliance(item)}
                title="Lihat Kepatuhan & Tanda Terima Staf"
                className="px-2 py-1 text-xs font-medium text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200 dark:border-emerald-800"
              >
                📊 Tanda Terima
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(item)}
                title="Edit Pengumuman"
                className="p-1.5 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors rounded-md hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(item.id)}
                title="Hapus Pengumuman"
                className="p-1.5 text-slate-500 hover:text-rose-600 dark:text-slate-400 dark:hover:text-rose-400 transition-colors rounded-md hover:bg-rose-50 dark:hover:bg-rose-950/40"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
