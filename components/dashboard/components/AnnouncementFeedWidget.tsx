import React from 'react';
import { BellAlertIcon } from '../../icons.tsx';
import { AnnouncementItem } from '../types.ts';

interface AnnouncementFeedWidgetProps {
  announcements: AnnouncementItem[];
  announcementsLoading: boolean;
  onSelectAnnouncement: (item: AnnouncementItem) => void;
  onNavigate?: (view: any, tab?: 'overview' | 'attendance' | 'profile' | 'kinerja', action?: 'payslip' | 'leave' | 'reimbursement') => void;
}

export const AnnouncementFeedWidget: React.FC<AnnouncementFeedWidgetProps> = ({
  announcements,
  announcementsLoading,
  onSelectAnnouncement,
  onNavigate,
}) => {
  return (
    <div className="bg-white dark:bg-slate-850 p-6 rounded-2xl shadow-sm border border-slate-200/80 dark:border-slate-700/80">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <BellAlertIcon className="w-5 h-5 text-[#06736a] dark:text-teal-400" />
          <h2 className="text-base font-bold text-slate-800 dark:text-slate-100">Kebijakan & Pengumuman RS Terbaru</h2>
        </div>
        <button
          onClick={() => onNavigate?.('announcements')}
          className="text-xs font-semibold text-[#06736a] dark:text-teal-400 hover:underline"
        >
          Lihat Semua →
        </button>
      </div>

      {announcementsLoading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-teal-500 border-t-transparent" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl text-center text-xs text-slate-500">
          📭 Belum ada pengumuman atau kebijakan baru dari HRD.
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectAnnouncement(item)}
              className={`p-4 rounded-xl border transition-all cursor-pointer group ${
                item.is_pinned
                  ? 'bg-amber-50/30 dark:bg-amber-950/10 border-amber-300/80 dark:border-amber-700/60 hover:bg-amber-50/60'
                  : 'bg-slate-50/70 dark:bg-slate-800/40 border-slate-200/70 dark:border-slate-700/70 hover:bg-teal-50/40 dark:hover:bg-slate-800/80 hover:border-teal-300'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-1.5">
                  {item.is_pinned && (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300/60">
                      📌 Pinned
                    </span>
                  )}
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    item.type === 'kebijakan'
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                  }`}>
                    {item.type === 'kebijakan' ? '📜 Kebijakan RS' : '📢 Pengumuman'}
                  </span>
                </div>
                <span className="text-[10px] font-medium text-slate-400">
                  {new Date(item.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
              </div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-[#06736a] dark:group-hover:text-teal-400 transition-colors mb-1">
                {item.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed mb-2">
                {item.content}
              </p>
              <div className="flex justify-end">
                <span className="text-[11px] font-bold text-[#06736a] dark:text-teal-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                  Baca Selengkapnya &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
