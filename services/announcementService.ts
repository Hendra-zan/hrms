/**
 * @file announcementService.ts
 * @description Data access and business operations for Announcements and Hospital Policies.
 */

import { supabase } from './supabaseClient.ts';
import {
  Announcement,
  AnnouncementUpsertPayload,
  AnnouncementAttachment,
  AnnouncementReadReceipt,
  AnnouncementComplianceReport,
} from '../types/announcement.ts';
import { calculateComplianceStats } from '../utils/announcementAudience.ts';

export const announcementService = {
  /**
   * Fetches all announcements ordered by pinned status and creation date.
   * If currentEmployeeId is provided, attaches read status and acknowledgment timestamp.
   */
  async fetchAnnouncements(currentEmployeeId?: string): Promise<Announcement[]> {
    const { data, error } = await (supabase
      .from('announcements')
      .select('*, employees:author_id(nama, jabatan)')
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false }) as any);

    if (error) {
      console.error('[announcementService] fetchAnnouncements error:', error);
      throw error;
    }

    const announcements: Announcement[] = (data as any) || [];

    if (!currentEmployeeId || announcements.length === 0) {
      return announcements;
    }

    // Fetch read receipts for this employee
    try {
      const { data: readData } = await ((supabase.from('announcement_reads' as any) as any)
        .select('announcement_id, read_at, acknowledged_at')
        .eq('employee_id', currentEmployeeId));

      const readMap = new Map<string, { read_at: string; acknowledged_at: string | null }>();
      (readData || []).forEach((r: any) => {
        readMap.set(r.announcement_id, { read_at: r.read_at, acknowledged_at: r.acknowledged_at });
      });

      return announcements.map(item => {
        const userRead = readMap.get(item.id);
        return {
          ...item,
          is_read: Boolean(userRead),
          acknowledged_at: userRead?.acknowledged_at || null,
        };
      });
    } catch (err) {
      console.warn('[announcementService] Error fetching user reads:', err);
      return announcements;
    }
  },

  /**
   * Creates a new announcement and triggers async push notifications.
   */
  async createAnnouncement(payload: AnnouncementUpsertPayload): Promise<Announcement> {
    const { data, error } = await (supabase
      .from('announcements')
      .insert({
        title: payload.title,
        content: payload.content,
        type: payload.type,
        author_id: payload.author_id || null,
        is_pinned: Boolean(payload.is_pinned),
        target_type: payload.target_type || 'all',
        target_ids: payload.target_ids || [],
        attachments: payload.attachments || [],
        requires_acknowledgment: Boolean(payload.requires_acknowledgment),
        status: payload.status || 'published',
        expires_at: payload.expires_at || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select('*, employees:author_id(nama, jabatan)')
      .single() as any);

    if (error) {
      console.error('[announcementService] createAnnouncement error:', error);
      throw error;
    }

    // Async broadcast push notification via backend or Expo
    void this.broadcastPushNotification(data.id, data.title, data.content, data.type);

    return data as unknown as Announcement;
  },

  /**
   * Updates an existing announcement.
   */
  async updateAnnouncement(id: string, payload: Partial<AnnouncementUpsertPayload>): Promise<Announcement> {
    const { data, error } = await (supabase
      .from('announcements')
      .update({
        ...payload,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select('*, employees:author_id(nama, jabatan)')
      .single() as any);

    if (error) {
      console.error('[announcementService] updateAnnouncement error:', error);
      throw error;
    }

    return data as unknown as Announcement;
  },

  /**
   * Deletes an announcement by ID.
   */
  async deleteAnnouncement(id: string): Promise<void> {
    const { error } = await supabase
      .from('announcements')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[announcementService] deleteAnnouncement error:', error);
      throw error;
    }
  },

  /**
   * Records that an employee has opened / read an announcement.
   */
  async markAsRead(announcementId: string, employeeId: string): Promise<void> {
    if (!announcementId || !employeeId) return;

    try {
      await (supabase.from('announcement_reads' as any) as any)
        .upsert(
          {
            announcement_id: announcementId,
            employee_id: employeeId,
            read_at: new Date().toISOString(),
          },
          { onConflict: 'announcement_id, employee_id', ignoreDuplicates: true }
        );
    } catch (err) {
      console.warn('[announcementService] Failed to mark as read:', err);
    }
  },

  /**
   * Records legal acknowledgment ("Saya telah membaca dan memahami kebijakan ini").
   */
  async acknowledgePolicy(announcementId: string, employeeId: string): Promise<void> {
    if (!announcementId || !employeeId) return;

    const now = new Date().toISOString();
    const { error } = await (supabase.from('announcement_reads' as any) as any)
      .upsert(
        {
          announcement_id: announcementId,
          employee_id: employeeId,
          read_at: now,
          acknowledged_at: now,
        },
        { onConflict: 'announcement_id, employee_id' }
      );

    if (error) {
      console.error('[announcementService] acknowledgePolicy error:', error);
      throw error;
    }
  },

  /**
   * Fetches compliance statistics and list of read receipts for HRD auditing.
   */
  async fetchComplianceReport(announcement: Announcement): Promise<AnnouncementComplianceReport> {
    // 1. Fetch total employees count or targeted employees
    let totalTarget = 0;
    try {
      let query = supabase.from('employees').select('id, nama, nik, jabatan, departemen, unitKerjaId', { count: 'exact' }).eq('status', 'Aktif');

      if (announcement.target_type === 'units' && announcement.target_ids && announcement.target_ids.length > 0) {
        query = query.in('unitKerjaId', announcement.target_ids);
      } else if (announcement.target_type === 'departments' && announcement.target_ids && announcement.target_ids.length > 0) {
        query = query.in('departemen', announcement.target_ids);
      }

      const { data: targetEmployees, count } = await query;
      totalTarget = count || targetEmployees?.length || 0;
    } catch {
      totalTarget = 100;
    }

    // 2. Fetch read receipts for this announcement
    const { data: receiptsData, error: receiptsErr } = await ((supabase.from('announcement_reads' as any) as any)
      .select('id, announcement_id, employee_id, read_at, acknowledged_at, employees(id, nama, nik, jabatan, departemen, unitKerjaId)')
      .eq('announcement_id', announcement.id)
      .order('acknowledged_at', { ascending: false, nullsFirst: false }));

    if (receiptsErr) {
      console.error('[announcementService] fetchComplianceReport error:', receiptsErr);
      throw receiptsErr;
    }

    const receipts: AnnouncementReadReceipt[] = (receiptsData as any) || [];
    return calculateComplianceStats(announcement, totalTarget, receipts);
  },

  /**
   * Uploads an announcement attachment (PDF / Image) to Supabase Storage.
   */
  async uploadAttachment(file: File): Promise<AnnouncementAttachment> {
    const fileExt = file.name.split('.').pop();
    const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = `attachments/${Date.now()}_${cleanFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('announcements')
      .upload(filePath, file, { cacheControl: '3600', upsert: true });

    if (uploadError) {
      console.error('[announcementService] uploadAttachment error:', uploadError);
      throw uploadError;
    }

    const { data: urlData } = supabase.storage
      .from('announcements')
      .getPublicUrl(filePath);

    return {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      name: file.name,
      url: urlData.publicUrl,
      size: file.size,
      mimeType: file.type || (fileExt === 'pdf' ? 'application/pdf' : 'application/octet-stream'),
    };
  },

  /**
   * Broadcasts push notification safely to active mobile devices.
   */
  async broadcastPushNotification(
    announcementId: string,
    title: string,
    content: string,
    type: string
  ): Promise<void> {
    try {
      const { data: employees, error } = await supabase
        .from('employees')
        .select('expo_push_token')
        .eq('status', 'Aktif');

      if (error || !employees) return;

      const tokens = (employees as any[])
        .map(e => e.expo_push_token)
        .filter((t): t is string => typeof t === 'string' && t.trim().startsWith('ExponentPushToken'));

      if (tokens.length === 0) return;

      const snippet = content.length > 120 ? `${content.substring(0, 117)}...` : content;
      const notifTitle = type === 'kebijakan' ? `📜 Kebijakan Baru: ${title}` : `📢 Pengumuman Baru: ${title}`;

      const messages = tokens.map(token => ({
        to: token,
        sound: 'default',
        title: notifTitle,
        body: snippet,
        data: { tab: 'announcements', announcementId },
      }));

      const chunkSize = 100;
      for (let i = 0; i < messages.length; i += chunkSize) {
        const chunk = messages.slice(i, i + chunkSize);
        await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(chunk),
        });
      }
    } catch (err) {
      console.warn('[announcementService] Push broadcast warning:', err);
    }
  },
};
