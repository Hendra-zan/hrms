/**
 * @file announcement.ts
 * @description Domain types and data transfer objects for the Policies & Announcements module.
 */

export type AnnouncementType = 'kebijakan' | 'pengumuman';
export type AnnouncementTargetType = 'all' | 'units' | 'departments' | 'roles';
export type AnnouncementStatus = 'draft' | 'published' | 'archived';

/**
 * File attachment attached to an announcement or policy document.
 */
export interface AnnouncementAttachment {
  id: string;
  name: string;
  url: string;
  size: number;
  mimeType: string;
}

/**
 * Core Announcement / Policy Entity in database.
 */
export interface Announcement {
  id: string;
  title: string;
  content: string;
  type: AnnouncementType;
  created_at: string;
  updated_at: string;
  author_id: string | null;
  is_pinned?: boolean;
  target_type?: AnnouncementTargetType;
  target_ids?: string[];
  attachments?: AnnouncementAttachment[];
  requires_acknowledgment?: boolean;
  status?: AnnouncementStatus;
  expires_at?: string | null;
  // Joined relation: Author profile
  employees?: {
    nama: string;
    jabatan?: string;
  } | null;
  // Client-side computed flags
  is_read?: boolean;
  acknowledged_at?: string | null;
  read_count?: number;
  acknowledged_count?: number;
}

/**
 * Payload to create or update an announcement.
 */
export interface AnnouncementUpsertPayload {
  title: string;
  content: string;
  type: AnnouncementType;
  author_id?: string | null;
  is_pinned?: boolean;
  target_type?: AnnouncementTargetType;
  target_ids?: string[];
  attachments?: AnnouncementAttachment[];
  requires_acknowledgment?: boolean;
  status?: AnnouncementStatus;
  expires_at?: string | null;
}

/**
 * Read receipt and acknowledgment record.
 */
export interface AnnouncementReadReceipt {
  id: string;
  announcement_id: string;
  employee_id: string;
  read_at: string;
  acknowledged_at: string | null;
  employees?: {
    id: string;
    nama: string;
    nik?: string;
    jabatan?: string;
    unitKerjaId?: string;
    departemen?: string;
  } | null;
}

/**
 * Compliance summary report for HRD auditing.
 */
export interface AnnouncementComplianceReport {
  announcement_id: string;
  title: string;
  type: AnnouncementType;
  requires_acknowledgment: boolean;
  total_target_employees: number;
  total_read: number;
  total_acknowledged: number;
  read_percentage: number;
  acknowledged_percentage: number;
  receipts: AnnouncementReadReceipt[];
}
