/**
 * components/notifications/types.ts
 * Definisi tipe data untuk Notification Center.
 */

import { Employee } from '../../types.ts';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  time: string;
  type: 'leave' | 'announcement' | 'shift' | 'payroll' | 'note';
  isRead: boolean;
  refId?: string;
  fullMessage?: string;
}

export interface NotificationCenterProps {
  currentUser?: Employee;
  onNoteClick?: () => void;
  onAnnouncementClick?: () => void;
}
