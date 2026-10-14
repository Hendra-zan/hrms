import { View } from '../types';

export interface RouteConfig {
  id: View;
  title: string;
  allowedPortals: ('personal' | 'operational')[];
  icon?: string;
  category?: 'personal' | 'operational' | 'shared';
}

export class RouteRegistry {
  public static readonly ROUTES: Record<View, RouteConfig> = {
    'personal-dashboard': {
      id: 'personal-dashboard',
      title: 'Dashboard Pribadi',
      allowedPortals: ['personal'],
      category: 'personal',
    },
    'notes': {
      id: 'notes',
      title: 'Catatan & Instruksi',
      allowedPortals: ['personal', 'operational'],
      category: 'shared',
    },
    'ess': {
      id: 'ess',
      title: 'Employee Self Service',
      allowedPortals: ['personal'],
      category: 'personal',
    },
    'announcements': {
      id: 'announcements',
      title: 'Pengumuman',
      allowedPortals: ['personal'],
      category: 'personal',
    },
    'policies': {
      id: 'policies',
      title: 'Kebijakan Perusahaan',
      allowedPortals: ['personal'],
      category: 'personal',
    },
    'guide': {
      id: 'guide',
      title: 'Panduan Pengguna',
      allowedPortals: ['personal'],
      category: 'personal',
    },
    'dashboard': {
      id: 'dashboard',
      title: 'Dashboard Operasional',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'employees': {
      id: 'employees',
      title: 'Manajemen Karyawan',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'attendance': {
      id: 'attendance',
      title: 'Manajemen Presensi',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'unit-schedule': {
      id: 'unit-schedule',
      title: 'Jadwal Kerja Unit',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'requests': {
      id: 'requests',
      title: 'Persetujuan Izin & Cuti',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'payroll': {
      id: 'payroll',
      title: 'Penggajian',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'attendance-report': {
      id: 'attendance-report',
      title: 'Laporan Kehadiran',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'employee-attendance-detail': {
      id: 'employee-attendance-detail',
      title: 'Detail Kehadiran Karyawan',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'organization': {
      id: 'organization',
      title: 'Struktur Organisasi',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'system': {
      id: 'system',
      title: 'Pengaturan Sistem',
      allowedPortals: ['operational'],
      category: 'operational',
    },
    'audit-log': {
      id: 'audit-log',
      title: 'Audit Log',
      allowedPortals: ['operational'],
      category: 'operational',
    },
  };

  /**
   * Check if a view is allowed within a specific portal
   */
  public static isAllowedInPortal(view: View, portal: 'personal' | 'operational'): boolean {
    const config = this.ROUTES[view];
    if (!config) return false;
    return config.allowedPortals.includes(portal);
  }

  /**
   * Get all views allowed for personal portal
   */
  public static getPersonalViews(): View[] {
    return (Object.keys(this.ROUTES) as View[]).filter(v => 
      this.ROUTES[v].allowedPortals.includes('personal')
    );
  }

  /**
   * Get default fallback view for a portal
   */
  public static getDefaultViewForPortal(portal: 'personal' | 'operational'): View {
    return portal === 'personal' ? 'personal-dashboard' : 'dashboard';
  }
}
