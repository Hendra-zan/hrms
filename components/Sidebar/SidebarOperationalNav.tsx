import React from 'react';
import type { View } from '../../types.ts';
import { NavButton } from './NavButton.tsx';
import {
  UserGroupIcon,
  Squares2x2Icon,
  ClockIcon,
  BellAlertIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
} from '../icons.tsx';
import { isHrRole, isKepalaRuanganRole } from '../../utils/roleUtils.ts';

interface SidebarOperationalNavProps {
  isCollapsed: boolean;
  userRole?: string;
  effectiveView: View;
  pendingRequestsCount: number;
  handleNavigate: (view: View, notesTab?: 'two-way' | 'personal') => void;
}

export const SidebarOperationalNav: React.FC<SidebarOperationalNavProps> = ({
  isCollapsed,
  userRole,
  effectiveView,
  pendingRequestsCount,
  handleNavigate,
}) => {
  return (
    <>
      {!isCollapsed && (
        <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
          {isHrRole(userRole) ? 'HRD' : 'Kepala Ruangan'}
        </p>
      )}
      <NavButton
        viewName="dashboard"
        label="Dashboard"
        icon={<Squares2x2Icon className="h-5 w-5" />}
        isActive={effectiveView === 'dashboard'}
        onClick={() => handleNavigate('dashboard')}
      />
      {isHrRole(userRole) && (
        <NavButton
          viewName="employees"
          label="Karyawan"
          icon={<UserGroupIcon className="h-5 w-5" />}
          isActive={effectiveView === 'employees'}
          onClick={() => handleNavigate('employees')}
        />
      )}
      {isKepalaRuanganRole(userRole) && (
        <NavButton
          viewName="employees"
          label="Data Karyawan Unit"
          icon={<UserGroupIcon className="h-5 w-5" />}
          isActive={effectiveView === 'employees'}
          onClick={() => handleNavigate('employees')}
        />
      )}
      <NavButton
        viewName="attendance"
        label="Kehadiran (Live)"
        icon={<ClockIcon className="h-5 w-5" />}
        isActive={effectiveView === 'attendance'}
        onClick={() => handleNavigate('attendance')}
      />
      <div className={isCollapsed ? "" : "pl-4"}>
        <NavButton
          viewName="attendance-report"
          label="Laporan Kehadiran"
          icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
          isActive={effectiveView === 'attendance-report'}
          onClick={() => handleNavigate('attendance-report')}
        />
      </div>
      {isKepalaRuanganRole(userRole) && (
        <>
          <NavButton
            viewName="unit-schedule"
            label="Jadwal Unit"
            icon={<ClockIcon className="h-5 w-5" />}
            isActive={effectiveView === 'unit-schedule'}
            onClick={() => handleNavigate('unit-schedule')}
          />
          <NavButton
            viewName="requests"
            label="Pengajuan & Izin"
            icon={<BellAlertIcon className="h-5 w-5" />}
            badge={pendingRequestsCount}
            isActive={effectiveView === 'requests'}
            onClick={() => handleNavigate('requests')}
          />
          <NavButton
            viewName="guide"
            label="Panduan"
            icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
            isActive={effectiveView === 'guide'}
            onClick={() => handleNavigate('guide')}
          />
        </>
      )}
      {isHrRole(userRole) && (
        <>
          <NavButton
            viewName="guide"
            label="Panduan HRD"
            icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
            isActive={effectiveView === 'guide'}
            onClick={() => handleNavigate('guide')}
          />
          <NavButton
            viewName="requests"
            label="Permohonan"
            icon={<BellAlertIcon className="h-5 w-5" />}
            badge={pendingRequestsCount}
            isActive={effectiveView === 'requests'}
            onClick={() => handleNavigate('requests')}
          />
          <NavButton
            viewName="announcements"
            label="Pengumuman & Kebijakan RS"
            icon={<MegaphoneIcon className="h-5 w-5" />}
            isActive={effectiveView === 'announcements' || effectiveView === 'policies'}
            onClick={() => handleNavigate('announcements')}
          />
          <NavButton
            viewName="notes"
            label="Catatan & Logbook Kerja"
            icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
            isActive={effectiveView === 'notes'}
            onClick={() => handleNavigate('notes')}
          />
        </>
      )}
    </>
  );
};
