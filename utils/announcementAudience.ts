/**
 * @file announcementAudience.ts
 * @description Pure deterministic utility functions for filtering announcements based on audience segmentation,
 * active lifecycle status, and calculating compliance rates.
 */

import { Announcement, AnnouncementComplianceReport, AnnouncementReadReceipt } from '../types/announcement.ts';
import { Employee } from '../types.ts';

/**
 * Checks if an announcement is currently active (not archived and not expired).
 */
export function isAnnouncementActive(announcement: Announcement, referenceDate = new Date()): boolean {
  if (announcement.status === 'archived' || announcement.status === 'draft') {
    return false;
  }
  if (announcement.expires_at) {
    const expiry = new Date(announcement.expires_at);
    if (expiry.getTime() < referenceDate.getTime()) {
      return false;
    }
  }
  return true;
}

/**
 * Determines whether an announcement is visible to a given employee.
 * Admin and HRD roles can view all announcements.
 */
export function isAnnouncementVisibleToEmployee(
  announcement: Announcement,
  employee?: Employee | null,
  userRole?: string
): boolean {
  // Superadmin, Admin, and HR can view everything
  const role = (userRole || '').toLowerCase();
  if (role.includes('admin') || role.includes('hr') || role === 'superadmin') {
    return true;
  }

  // If announcement is draft or archived, only visible to admin/author
  if (announcement.status === 'draft' || announcement.status === 'archived') {
    return employee?.id === announcement.author_id;
  }

  // Check expiration
  if (!isAnnouncementActive(announcement)) {
    return false;
  }

  const targetType = announcement.target_type || 'all';
  const targetIds = announcement.target_ids || [];

  // Broadcast to all employees
  if (targetType === 'all' || targetIds.length === 0) {
    return true;
  }

  if (!employee) {
    return false;
  }

  const raw = employee as any;
  const unitId = employee.unitKerjaId || raw.unitKerjaId || '';
  const department = employee.departemen || raw.departemen || '';
  const employeeRole = (employee.role || raw.role || '').toLowerCase();

  switch (targetType) {
    case 'units':
      return Boolean(unitId && targetIds.includes(unitId));
    case 'departments':
      return Boolean(department && targetIds.includes(department));
    case 'roles':
      return Boolean(employeeRole && targetIds.some(t => t.toLowerCase() === employeeRole));
    default:
      return true;
  }
}

/**
 * Filters a list of announcements for a specific employee and sorts pinned items to the top.
 */
export function filterAnnouncementsForEmployee(
  announcements: Announcement[],
  employee?: Employee | null,
  userRole?: string
): Announcement[] {
  return announcements
    .filter(item => isAnnouncementVisibleToEmployee(item, employee, userRole))
    .sort((a, b) => {
      // 1. Pinned items first
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      // 2. Newest creation date first
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
}

/**
 * Computes compliance statistics from a list of read receipts.
 */
export function calculateComplianceStats(
  announcement: Announcement,
  totalTargetEmployees: number,
  receipts: AnnouncementReadReceipt[]
): AnnouncementComplianceReport {
  const safeTarget = Math.max(1, totalTargetEmployees);
  const totalRead = receipts.filter(r => Boolean(r.read_at)).length;
  const totalAcknowledged = receipts.filter(r => Boolean(r.acknowledged_at)).length;

  const readPercentage = Math.min(100, Math.round((totalRead / safeTarget) * 100));
  const acknowledgedPercentage = Math.min(100, Math.round((totalAcknowledged / safeTarget) * 100));

  return {
    announcement_id: announcement.id,
    title: announcement.title,
    type: announcement.type,
    requires_acknowledgment: Boolean(announcement.requires_acknowledgment),
    total_target_employees: totalTargetEmployees,
    total_read: totalRead,
    total_acknowledged: totalAcknowledged,
    read_percentage: readPercentage,
    acknowledged_percentage: acknowledgedPercentage,
    receipts,
  };
}
