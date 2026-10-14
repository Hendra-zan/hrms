import React from 'react';
import type { View } from '../../types.ts';
import { NavButton } from './NavButton.tsx';
import {
  Squares2x2Icon,
  ClipboardDocumentListIcon,
  MegaphoneIcon,
  UserCircleIcon,
} from '../icons.tsx';

interface SidebarPersonalNavProps {
  isCollapsed: boolean;
  effectiveView: View;
  pendingRequestsCount: number;
  handleNavigate: (view: View, notesTab?: 'two-way' | 'personal') => void;
}

export const SidebarPersonalNav: React.FC<SidebarPersonalNavProps> = ({
  isCollapsed,
  effectiveView,
  pendingRequestsCount,
  handleNavigate,
}) => {
  return (
    <>
      {!isCollapsed && (
        <div className="text-xs font-semibold text-gray-400 dark:text-slate-500 uppercase tracking-wider mb-3 px-2 mt-4">
          Layanan Mandiri (ESS)
        </div>
      )}
      <NavButton
        viewName="personal-dashboard"
        label="Dashboard Saya"
        icon={<Squares2x2Icon className="h-5 w-5" />}
        isActive={effectiveView === 'personal-dashboard'}
        onClick={() => handleNavigate('personal-dashboard')}
      />
      <NavButton
        viewName="ess"
        label="Employee Self Service"
        icon={<UserCircleIcon className="h-5 w-5" />}
        badge={pendingRequestsCount}
        isActive={effectiveView === 'ess'}
        onClick={() => handleNavigate('ess')}
      />
      <NavButton
        viewName="notes"
        label="Logbook & Catatan Staf"
        icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        isActive={effectiveView === 'notes'}
        onClick={() => handleNavigate('notes', 'two-way')}
      />
      <NavButton
        viewName="announcements"
        label="Pengumuman RS"
        icon={<MegaphoneIcon className="h-5 w-5" />}
        isActive={effectiveView === 'announcements'}
        onClick={() => handleNavigate('announcements')}
      />
      <NavButton
        viewName="policies"
        label="Kebijakan RS"
        icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        isActive={effectiveView === 'policies'}
        onClick={() => handleNavigate('policies')}
      />
      <NavButton
        viewName="guide"
        label="Panduan Pengguna"
        icon={<ClipboardDocumentListIcon className="h-5 w-5" />}
        isActive={effectiveView === 'guide'}
        onClick={() => handleNavigate('guide')}
      />
    </>
  );
};
