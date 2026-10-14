/**
 * components/notifications/NotificationPanel.tsx
 * Panel popup notifikasi tetap dengan header, tombol tandai semua dibaca, dan list.
 */

import React from 'react';
import { NotificationItem } from './types.ts';
import { NotificationItemView } from './NotificationItemView.tsx';

interface NotificationPanelProps {
  isOpen: boolean;
  notifications: NotificationItem[];
  unreadCount: number;
  loading: boolean;
  expandedId: string | null;
  fullContent: Record<string, string>;
  panelPos: { top: number; right: number };
  onClose: () => void;
  onMarkAllRead: () => void;
  onItemClick: (n: NotificationItem) => void;
}

export const NotificationPanel: React.FC<NotificationPanelProps> = ({
  isOpen,
  notifications,
  unreadCount,
  loading,
  expandedId,
  fullContent,
  panelPos,
  onClose,
  onMarkAllRead,
  onItemClick,
}) => {
  if (!isOpen) return null;

  const panelWidth = typeof window !== 'undefined' && window.innerWidth < 480
    ? window.innerWidth - 16
    : 400;

  return (
    <>
      <div className="fixed inset-0 z-[9998]" onClick={onClose} />
      <div
        className="fixed z-[9999] rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden"
        style={{
          top: panelPos.top,
          right: panelPos.right,
          width: panelWidth,
          maxWidth: 'calc(100vw - 16px)',
          animation: 'notifSlideIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        }}
      >
        <div className="px-4 py-3 bg-gradient-to-r from-[#06736a] to-teal-600 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5}
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            <h3 className="font-bold text-sm text-white">Pusat Notifikasi</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-extrabold bg-rose-500 text-white px-2 py-0.5 rounded-full animate-pulse">
                {unreadCount} Baru
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={onMarkAllRead}
                className="text-[11px] font-medium text-teal-100 hover:text-white underline hover:no-underline transition-colors"
              >
                Tandai semua dibaca
              </button>
            )}
            <button
              onClick={onClose}
              className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
              title="Tutup"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100">
          {loading ? (
            <div className="p-8 text-center text-slate-400">
              <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs">Memuat notifikasi...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              <span className="text-3xl block mb-2">🎉</span>
              <p className="text-xs font-medium text-slate-600">Tidak ada notifikasi</p>
              <p className="text-[11px] text-slate-400 mt-1">Anda sudah melihat semua update terbaru.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <NotificationItemView
                key={n.id}
                notification={n}
                isExpanded={expandedId === n.id}
                fullText={fullContent[n.id]}
                onClick={onItemClick}
              />
            ))
          )}
        </div>
      </div>
    </>
  );
};
