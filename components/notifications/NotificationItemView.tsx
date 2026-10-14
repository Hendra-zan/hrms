/**
 * components/notifications/NotificationItemView.tsx
 * Komponen kartu notifikasi tunggal dengan ikon, badge, dan dukungan expand/collapse.
 */

import React from 'react';
import { NotificationItem } from './types.ts';

interface NotificationItemViewProps {
  notification: NotificationItem;
  isExpanded: boolean;
  fullText?: string;
  onClick: (n: NotificationItem) => void;
}

const getNotifIcon = (type: NotificationItem['type']) => {
  switch (type) {
    case 'leave': return '🏖️';
    case 'payroll': return '💰';
    case 'note': return '📋';
    case 'announcement': return '📢';
    case 'shift': return '🔀';
    default: return '🔔';
  }
};

const getTypeBadgeClass = (type: NotificationItem['type']) => {
  switch (type) {
    case 'leave': return 'bg-orange-100 text-orange-700';
    case 'payroll': return 'bg-emerald-100 text-emerald-700';
    case 'note': return 'bg-teal-100 text-teal-700';
    case 'announcement': return 'bg-blue-100 text-blue-700';
    case 'shift': return 'bg-purple-100 text-purple-700';
    default: return 'bg-slate-100 text-slate-600';
  }
};

const getTypeBadgeLabel = (type: NotificationItem['type']) => {
  switch (type) {
    case 'leave': return 'CUTI';
    case 'payroll': return 'GAJI';
    case 'note': return 'CATATAN';
    case 'announcement': return 'INFO RS';
    case 'shift': return 'SHIFT';
    default: return 'INFO';
  }
};

const getIconBg = (type: NotificationItem['type']) => {
  switch (type) {
    case 'note': return 'bg-teal-100';
    case 'leave': return 'bg-orange-100';
    case 'payroll': return 'bg-emerald-100';
    case 'announcement': return 'bg-blue-100';
    default: return 'bg-slate-100';
  }
};

export const NotificationItemView: React.FC<NotificationItemViewProps> = ({
  notification: n,
  isExpanded,
  fullText,
  onClick,
}) => {
  const isClickable = n.type === 'note' || n.type === 'announcement';

  return (
    <div
      onClick={() => onClick(n)}
      className={`p-3.5 transition-colors border-b border-slate-100 last:border-0 ${
        !n.isRead ? 'bg-teal-50/40' : 'hover:bg-slate-50'
      } ${isClickable ? 'cursor-pointer' : ''}`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-0.5 ${getIconBg(n.type)}`}>
          {getNotifIcon(n.type)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1 mb-1">
            <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${getTypeBadgeClass(n.type)}`}>
              {getTypeBadgeLabel(n.type)}
            </span>
            <span className="text-[10px] text-slate-400 font-medium whitespace-nowrap">{n.time}</span>
          </div>
          <h4 className={`text-xs font-semibold leading-tight mb-0.5 ${!n.isRead ? 'text-slate-900 font-bold' : 'text-slate-700'}`}>
            {n.title}
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed break-words">
            {isExpanded && fullText ? fullText : n.message}
          </p>
          {n.type === 'announcement' && (
            <span className="inline-block mt-1 text-[10px] font-semibold text-teal-600 hover:text-teal-700">
              {isExpanded ? 'Tutup ▲' : 'Baca selengkapnya ▼'}
            </span>
          )}
          {n.type === 'note' && (
            <span className="inline-block mt-1 text-[10px] font-semibold text-teal-600 hover:text-teal-700">
              Buka Catatan ➔
            </span>
          )}
        </div>
        {!n.isRead && (
          <span className="w-2 h-2 rounded-full bg-teal-500 flex-shrink-0 mt-2" title="Belum dibaca" />
        )}
      </div>
    </div>
  );
};
