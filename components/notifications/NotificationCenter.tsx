/**
 * components/notifications/NotificationCenter.tsx
 * Komponen koordinator Notification Center (Bell button + NotificationPanel).
 */

import React from 'react';
import { NotificationCenterProps } from './types.ts';
import { useNotificationCenterState } from './useNotificationCenterState.ts';
import { NotificationPanel } from './NotificationPanel.tsx';

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  currentUser: propUser,
  onNoteClick,
  onAnnouncementClick,
}) => {
  const state = useNotificationCenterState(propUser, onNoteClick);

  return (
    <div className="relative inline-block">
      <button
        ref={state.bellRef}
        onClick={() => state.setIsOpen((prev) => !prev)}
        className="relative p-2 text-slate-600 hover:text-[#06736a] hover:bg-teal-50 rounded-xl transition-all active:scale-95 focus:outline-none"
        title="Pusat Notifikasi"
        aria-label="Buka notifikasi"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {state.unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-white animate-pulse">
            {state.unreadCount > 9 ? '9+' : state.unreadCount}
          </span>
        )}
      </button>

      <NotificationPanel
        isOpen={state.isOpen}
        notifications={state.notifications}
        unreadCount={state.unreadCount}
        loading={state.loading}
        expandedId={state.expandedId}
        fullContent={state.fullContent}
        panelPos={state.panelPos}
        onClose={() => state.setIsOpen(false)}
        onMarkAllRead={state.handleMarkAllRead}
        onItemClick={state.handleItemClick}
      />
    </div>
  );
};

export default NotificationCenter;
