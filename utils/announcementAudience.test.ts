import { describe, it, expect } from 'vitest';
import {
  isAnnouncementActive,
  isAnnouncementVisibleToEmployee,
  filterAnnouncementsForEmployee,
  calculateComplianceStats,
} from './announcementAudience.ts';
import { Announcement } from '../types/announcement.ts';
import { Employee } from '../types.ts';

describe('announcementAudience utility', () => {
  const baseAnnouncement: Announcement = {
    id: 'ann-1',
    title: 'Kebijakan SPO IGD',
    content: 'Konten kebijakan',
    type: 'kebijakan',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-09-01T08:00:00Z',
    author_id: 'emp-admin',
    is_pinned: false,
    target_type: 'all',
    target_ids: [],
    status: 'published',
  };

  const sampleEmployee = {
    id: 'emp-101',
    nama: 'Dr. Budi Santoso',
    nik: '20260101',
    email: 'budi@hospital.com',
    jabatan: 'Dokter Spesialis',
    departemen: 'Pelayanan Medis',
    unitKerjaId: 'unit-igd',
    status: 'Aktif',
    role: 'Doctor',
  } as unknown as Employee;

  describe('isAnnouncementActive', () => {
    it('returns true for active published announcement without expiry', () => {
      expect(isAnnouncementActive(baseAnnouncement)).toBe(true);
    });

    it('returns false for draft or archived announcement', () => {
      expect(isAnnouncementActive({ ...baseAnnouncement, status: 'draft' })).toBe(false);
      expect(isAnnouncementActive({ ...baseAnnouncement, status: 'archived' })).toBe(false);
    });

    it('handles expiration date accurately', () => {
      const pastDate = '2026-08-01T00:00:00Z';
      const futureDate = '2026-12-31T00:00:00Z';
      const now = new Date('2026-09-09T10:00:00Z');

      expect(isAnnouncementActive({ ...baseAnnouncement, expires_at: pastDate }, now)).toBe(false);
      expect(isAnnouncementActive({ ...baseAnnouncement, expires_at: futureDate }, now)).toBe(true);
    });
  });

  describe('isAnnouncementVisibleToEmployee', () => {
    it('always visible to Admin/Superadmin/HR', () => {
      const targeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'units',
        target_ids: ['unit-radiologi'],
      };
      expect(isAnnouncementVisibleToEmployee(targeted, sampleEmployee, 'superadmin')).toBe(true);
      expect(isAnnouncementVisibleToEmployee(targeted, sampleEmployee, 'HR')).toBe(true);
    });

    it('matches target_type: all for regular employee', () => {
      expect(isAnnouncementVisibleToEmployee(baseAnnouncement, sampleEmployee, 'Employee')).toBe(true);
    });

    it('matches target_type: units correctly', () => {
      const igdTargeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'units',
        target_ids: ['unit-igd', 'unit-icu'],
      };
      const farmasiTargeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'units',
        target_ids: ['unit-farmasi'],
      };

      expect(isAnnouncementVisibleToEmployee(igdTargeted, sampleEmployee, 'Employee')).toBe(true);
      expect(isAnnouncementVisibleToEmployee(farmasiTargeted, sampleEmployee, 'Employee')).toBe(false);
    });

    it('matches target_type: departments correctly', () => {
      const deptTargeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'departments',
        target_ids: ['Pelayanan Medis', 'Keperawatan'],
      };
      const nonDeptTargeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'departments',
        target_ids: ['Keuangan'],
      };

      expect(isAnnouncementVisibleToEmployee(deptTargeted, sampleEmployee, 'Employee')).toBe(true);
      expect(isAnnouncementVisibleToEmployee(nonDeptTargeted, sampleEmployee, 'Employee')).toBe(false);
    });

    it('matches target_type: roles correctly', () => {
      const roleTargeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'roles',
        target_ids: ['Doctor'],
      };
      const nurseTargeted: Announcement = {
        ...baseAnnouncement,
        target_type: 'roles',
        target_ids: ['Nurse'],
      };

      expect(isAnnouncementVisibleToEmployee(roleTargeted, sampleEmployee, 'Doctor')).toBe(true);
      expect(isAnnouncementVisibleToEmployee(nurseTargeted, sampleEmployee, 'Doctor')).toBe(false);
    });
  });

  describe('filterAnnouncementsForEmployee', () => {
    it('prioritizes pinned items to the top and sorts by created_at descending', () => {
      const list: Announcement[] = [
        { ...baseAnnouncement, id: 'a1', title: 'A1 Regular', created_at: '2026-09-01T00:00:00Z', is_pinned: false },
        { ...baseAnnouncement, id: 'a2', title: 'A2 Newer Regular', created_at: '2026-09-05T00:00:00Z', is_pinned: false },
        { ...baseAnnouncement, id: 'a3', title: 'A3 Older Pinned', created_at: '2026-08-01T00:00:00Z', is_pinned: true },
      ];

      const filtered = filterAnnouncementsForEmployee(list, sampleEmployee, 'Employee');
      expect(filtered.map(x => x.id)).toEqual(['a3', 'a2', 'a1']);
    });
  });

  describe('calculateComplianceStats', () => {
    it('computes compliance percentage correctly', () => {
      const report = calculateComplianceStats(baseAnnouncement, 10, [
        { id: 'r1', announcement_id: 'ann-1', employee_id: 'e1', read_at: '2026-09-01', acknowledged_at: '2026-09-01' },
        { id: 'r2', announcement_id: 'ann-1', employee_id: 'e2', read_at: '2026-09-01', acknowledged_at: null },
      ]);

      expect(report.total_target_employees).toBe(10);
      expect(report.total_read).toBe(2);
      expect(report.total_acknowledged).toBe(1);
      expect(report.read_percentage).toBe(20);
      expect(report.acknowledged_percentage).toBe(10);
    });
  });
});
