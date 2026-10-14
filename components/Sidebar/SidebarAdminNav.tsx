import React from 'react';
import type { View } from '../../types.ts';
import { NavButton } from './NavButton.tsx';
import {
  UserGroupIcon,
  Squares2x2Icon,
  Cog6ToothIcon,
  ClockIcon,
  CurrencyDollarIcon,
  BellAlertIcon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
} from '../icons.tsx';

interface SidebarAdminNavProps {
  isCollapsed: boolean;
  effectiveView: View;
  pendingRequestsCount: number;
  handleNavigate: (view: View, notesTab?: 'two-way' | 'personal') => void;
}

export const SidebarAdminNav: React.FC<SidebarAdminNavProps> = ({
  isCollapsed,
  effectiveView,
  pendingRequestsCount,
  handleNavigate,
}) => {
  const mailpitUrl = '/mailpit/';

  return (
    <>
      {!isCollapsed && (
        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 mt-4">
          Admin
        </div>
      )}
      <NavButton
        viewName="dashboard"
        label="Dashboard"
        icon={<Squares2x2Icon className="h-5 w-5" />}
        isActive={effectiveView === 'dashboard'}
        onClick={() => handleNavigate('dashboard')}
      />
      <NavButton
        viewName="employees"
        label="Karyawan"
        icon={<UserGroupIcon className="h-5 w-5" />}
        isActive={effectiveView === 'employees'}
        onClick={() => handleNavigate('employees')}
      />
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
      <NavButton
        viewName="payroll"
        label="Penggajian"
        icon={<CurrencyDollarIcon className="h-5 w-5" />}
        isActive={effectiveView === 'payroll'}
        onClick={() => handleNavigate('payroll')}
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
      <NavButton
        viewName="organization"
        label="Pengaturan Organisasi"
        icon={<Cog6ToothIcon className="h-5 w-5" />}
        isActive={effectiveView === 'organization'}
        onClick={() => handleNavigate('organization')}
      />
      <NavButton
        viewName="system"
        label="Pengaturan Sistem"
        icon={<Cog6ToothIcon className="h-5 w-5" />}
        isActive={effectiveView === 'system'}
        onClick={() => handleNavigate('system')}
      />
      <NavButton
        viewName="guide"
        label="Panduan"
        icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        isActive={effectiveView === 'guide'}
        onClick={() => handleNavigate('guide')}
      />
      <a
        href={mailpitUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={`w-full flex items-center rounded-lg text-sm font-medium transition-colors text-gray-400 hover:bg-white/10 hover:text-white mt-2 ${
          isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
        }`}
        title="Simulator Email (Mailpit)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-5 w-5 text-gray-400 flex-shrink-0">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
        </svg>
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left">Simulator Email</span>
            <span className="text-[10px] bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold uppercase">Mailpit</span>
          </>
        )}
      </a>
    </>
  );
};
