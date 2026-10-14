/**
 * components/notifications/useNotificationCenterState.ts
 * Hook pengelolaan data notifikasi personal, catatan karyawan, dan pengumuman RS.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../../services/supabaseClient.ts';
import { useAuth, useAppData } from '../../stores/appStore.ts';
import { employeeNotesService } from '../../services/employeeNotesService.ts';
import { NotificationItem } from './types.ts';
import { Employee } from '../../types.ts';

export const useNotificationCenterState = (propUser?: Employee, onNoteClick?: () => void) => {
  const { authUser } = useAuth();
  const { allRequests } = useAppData();
  const activeUser = propUser || authUser?.profile;

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [fullContent, setFullContent] = useState<Record<string, string>>({});
  const [panelPos, setPanelPos] = useState<{ top: number; right: number }>({ top: 72, right: 16 });
  const bellRef = useRef<HTMLButtonElement>(null);

  const recalcPos = useCallback(() => {
    if (!bellRef.current) return;
    const rect = bellRef.current.getBoundingClientRect();
    const rightEdge = window.innerWidth - rect.right;
    setPanelPos({
      top: rect.bottom + 8,
      right: Math.max(8, rightEdge),
    });
  }, []);

  useEffect(() => {
    if (isOpen) {
      recalcPos();
      window.addEventListener('resize', recalcPos);
      return () => window.removeEventListener('resize', recalcPos);
    }
  }, [isOpen, recalcPos]);

  useEffect(() => {
    if (!activeUser?.id) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    let isMounted = true;

    const loadPersonalNotifications = async () => {
      try {
        setLoading(true);
        const readStorageKey = `hrms_read_notifs_${activeUser.id}`;
        const readIds: string[] = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
        const readSet = new Set(readIds);
        const items: NotificationItem[] = [];

        // 1. Personal Request Notifications
        const userReqs = allRequests.filter(
          (r: any) => (r.employeeId === activeUser.id || r.employee_id === activeUser.id)
        );

        userReqs.forEach((r: any) => {
          if (r.status === 'approved' || r.status === 'rejected') {
            const notifId = `req-${r.id}-${r.status}`;
            const isApproved = r.status === 'approved';
            const reqTypeLabel =
              r.type === 'leave' || r.type === 'cuti' ? 'Cuti' :
              r.type === 'reimbursement' ? 'Reimbursement' : 'Pengajuan';
            items.push({
              id: notifId,
              title: `Pengajuan ${reqTypeLabel} ${isApproved ? 'Disetujui ✅' : 'Ditolak ❌'}`,
              message: `Pengajuan ${reqTypeLabel} Anda (${r.reason || 'Keterangan'}) telah ${isApproved ? 'DISETUJUI' : 'DITOLAK'} oleh Atasan.`,
              time: r.requestedAt
                ? new Date(r.requestedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                : 'Baru saja',
              type: r.type === 'leave' || r.type === 'cuti' ? 'leave' : 'shift',
              isRead: readSet.has(notifId),
              refId: r.id,
            });
          }
        });

        // 2. Personal Employee Notes
        try {
          const userNotes = await employeeNotesService.fetchNotesForEmployee(activeUser.id);
          userNotes.forEach((note) => {
            const notifId = `note-${note.id}`;
            const isUnread = note.status === 'unread';
            items.push({
              id: notifId,
              title: note.title,
              message: `Dari ${note.senderNama}: "${note.content.substring(0, 90)}${note.content.length > 90 ? '...' : ''}"`,
              time: note.createdAt
                ? new Date(note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                : 'Terbaru',
              type: 'note',
              isRead: !isUnread && readSet.has(notifId),
              refId: note.id,
            });
          });
        } catch (noteErr) {
          console.warn('[NotificationCenter] Failed to fetch notes:', noteErr);
        }

        // 3. Global Announcements
        const { data: annData } = await supabase
          .from('announcements')
          .select('id, title, content, created_at')
          .order('created_at', { ascending: false })
          .limit(5);

        if (annData) {
          const fullMap: Record<string, string> = {};
          annData.forEach((ann: any) => {
            const notifId = `ann-${ann.id}`;
            fullMap[notifId] = ann.content;
            items.push({
              id: notifId,
              title: ann.title,
              message: ann.content.length > 80 ? `${ann.content.substring(0, 80)}…` : ann.content,
              time: ann.created_at
                ? new Date(ann.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'Terbaru',
              type: 'announcement',
              isRead: readSet.has(notifId),
              refId: ann.id,
              fullMessage: ann.content,
            });
          });
          if (isMounted) setFullContent(prev => ({ ...prev, ...fullMap }));
        }

        items.sort((a, b) => Number(a.isRead) - Number(b.isRead));
        if (isMounted) setNotifications(items);
      } catch (err) {
        console.warn('[NotificationCenter] Error loading notifications:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    loadPersonalNotifications();
    return () => { isMounted = false; };
  }, [activeUser?.id, allRequests]);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const markRead = (id: string) => {
    if (!activeUser?.id) return;
    const readStorageKey = `hrms_read_notifs_${activeUser.id}`;
    const currentRead: string[] = JSON.parse(localStorage.getItem(readStorageKey) || '[]');
    if (!currentRead.includes(id)) {
      currentRead.push(id);
      localStorage.setItem(readStorageKey, JSON.stringify(currentRead));
    }
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  };

  const handleMarkAllRead = () => {
    if (!activeUser?.id) return;
    const allIds = notifications.map(n => n.id);
    localStorage.setItem(`hrms_read_notifs_${activeUser.id}`, JSON.stringify(allIds));
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  };

  const handleItemClick = (n: NotificationItem) => {
    markRead(n.id);
    if (n.type === 'note' && onNoteClick) {
      setIsOpen(false);
      onNoteClick();
    } else if (n.type === 'announcement') {
      setExpandedId(prev => prev === n.id ? null : n.id);
    }
  };

  return {
    notifications,
    isOpen,
    setIsOpen,
    loading,
    expandedId,
    fullContent,
    panelPos,
    bellRef,
    unreadCount,
    handleMarkAllRead,
    handleItemClick,
  };
};
