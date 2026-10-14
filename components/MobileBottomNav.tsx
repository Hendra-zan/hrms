/**
 * components/MobileBottomNav.tsx
 *
 * Bottom navigation bar for mobile (iPhone Safari PWA) - Personal Portal only.
 * Styled like native iOS tab bar with glassmorphism, safe area insets,
 * active state indicators, and micro-animations.
 *
 * Only renders on mobile (< 1024px) and only in personal portal.
 */

import React from 'react';
import type { View } from '../types';

interface MobileBottomNavProps {
  activePortal: 'personal' | 'operational' | null;
  effectiveView: View;
  essDefaultTab: 'overview' | 'attendance' | 'profile' | 'kinerja' | 'chat';
  onNavigate: (view: View) => void;
  onSetEssTab: (tab: 'overview' | 'attendance' | 'profile' | 'kinerja' | 'chat') => void;
}

interface NavTab {
  id: string;
  label: string;
  view: View;
  essTab?: 'overview' | 'attendance' | 'profile' | 'kinerja' | 'chat';
  icon: React.ReactNode;
}

const HomeIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M11.47 3.841a.75.75 0 0 1 1.06 0l8.69 8.69a.75.75 0 1 0 1.06-1.061l-8.689-8.69a2.25 2.25 0 0 0-3.182 0l-8.69 8.69a.75.75 0 1 0 1.061 1.06l8.69-8.689Z" />
    <path d="m12 5.432 8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 0-.75-.75h-3a.75.75 0 0 0-.75.75V21a.75.75 0 0 1-.75.75H5.625a1.875 1.875 0 0 1-1.875-1.875v-6.198a2.29 2.29 0 0 0 .091-.086L12 5.432Z" />
  </svg>
);

const CameraIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M12 9a3.75 3.75 0 1 0 0 7.5A3.75 3.75 0 0 0 12 9Z" />
    <path fillRule="evenodd" d="M9.344 3.071a49.52 49.52 0 0 1 5.312 0c.967.052 1.83.585 2.332 1.39l.821 1.317c.24.383.645.643 1.11.71.386.054.77.113 1.152.177 1.432.239 2.429 1.493 2.429 2.909V18a3 3 0 0 1-3 3h-15a3 3 0 0 1-3-3V9.574c0-1.416.997-2.67 2.429-2.909.382-.064.766-.123 1.151-.178a1.56 1.56 0 0 0 1.11-.71l.822-1.315a2.942 2.942 0 0 1 2.332-1.39ZM6.75 12.75a5.25 5.25 0 1 1 10.5 0 5.25 5.25 0 0 1-10.5 0Zm12-1.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Z" clipRule="evenodd" />
  </svg>
);

const ClipboardIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M7.502 6h7.128A3.375 3.375 0 0 1 18 9.375v9.375a3 3 0 0 0 3-3V6.108c0-1.505-1.125-2.811-2.664-2.94a48.972 48.972 0 0 0-.673-.05A3 3 0 0 0 15 1.5h-1.5a3 3 0 0 0-2.663 1.618c-.225.015-.45.032-.673.05C8.662 3.295 7.554 4.542 7.502 6ZM13.5 3A1.5 1.5 0 0 0 12 4.5h4.5A1.5 1.5 0 0 0 15 3h-1.5Z" clipRule="evenodd" />
    <path fillRule="evenodd" d="M3 9.375C3 8.339 3.84 7.5 4.875 7.5h9.75c1.036 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-9.75A1.875 1.875 0 0 1 3 20.625V9.375ZM6 12a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V12Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 15a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V15Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75ZM6 18a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H6.75a.75.75 0 0 1-.75-.75V18Zm2.25 0a.75.75 0 0 1 .75-.75h3.75a.75.75 0 0 1 0 1.5H9a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clipRule="evenodd" />
  </svg>
);

const ChatIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path fillRule="evenodd" d="M4.848 2.771A9.125 9.125 0 0 1 12 1.5c2.47 0 4.702.984 6.326 2.583A8.99 8.99 0 0 1 21 10.5c0 2.22-.803 4.254-2.146 5.828l.84 2.825a.75.75 0 0 1-.957.925l-3.08-1.077A9.09 9.09 0 0 1 12 19.5c-2.47 0-4.702-.984-6.326-2.583A8.99 8.99 0 0 1 3 10.5c0-2.22.803-4.254 2.146-5.828l-.84-2.825a.75.75 0 0 1 .957-.925l3.08 1.077Z" clipRule="evenodd" />
  </svg>
);

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activePortal,
  effectiveView,
  essDefaultTab,
  onNavigate,
  onSetEssTab,
}) => {
  // Only render for personal portal
  if (activePortal !== 'personal') return null;

  const tabs: NavTab[] = [
    {
      id: 'home',
      label: 'Beranda',
      view: 'personal-dashboard',
      icon: <HomeIcon />,
    },
    {
      id: 'absensi',
      label: 'Absensi',
      view: 'ess',
      essTab: 'attendance',
      icon: <CameraIcon />,
    },
    {
      id: 'permohonan',
      label: 'Permohonan',
      view: 'ess',
      essTab: 'overview',
      icon: <ClipboardIcon />,
    },
    {
      id: 'catatan',
      label: 'Catatan',
      view: 'notes',
      icon: <ChatIcon />,
    },
    {
      id: 'profil',
      label: 'Profil',
      view: 'ess',
      essTab: 'profile',
      icon: <UserIcon />,
    },
  ];

  const getIsActive = (tab: NavTab): boolean => {
    if (tab.view !== effectiveView) return false;
    // For non-ESS views (e.g. personal-dashboard), always active if views match
    if (tab.view !== 'ess') return true;
    // For ESS tabs: exact match on essTab only
    return tab.essTab === essDefaultTab;
  };

  const handleTabPress = (tab: NavTab) => {
    if (tab.essTab !== undefined) {
      onSetEssTab(tab.essTab);
    }
    onNavigate(tab.view);
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      aria-label="Navigasi mobile karyawan"
    >
      {/* Glassmorphism background */}
      <div className="relative border-t border-white/20 dark:border-slate-700/60 bg-white/90 dark:bg-[#0f1724]/95 backdrop-blur-xl shadow-2xl">
        <div className="flex items-stretch">
          {tabs.map((tab) => {
            const isActive = getIsActive(tab);
            return (
              <button
                key={tab.id}
                onClick={() => handleTabPress(tab)}
                aria-label={tab.label}
                aria-current={isActive ? 'page' : undefined}
                className={`
                  flex-1 flex flex-col items-center justify-center gap-0.5 py-2 px-1
                  min-h-[60px] transition-all duration-200 active:scale-90
                  focus:outline-none focus-visible:ring-2 focus-visible:ring-teal-500 focus-visible:ring-inset
                  ${isActive
                    ? 'text-teal-600 dark:text-teal-400'
                    : 'text-gray-400 dark:text-slate-500 hover:text-gray-600 dark:hover:text-slate-400'
                  }
                `}
              >
                {/* Icon with active indicator dot */}
                <div className="relative">
                  <div className={`transition-transform duration-200 ${isActive ? 'scale-110' : 'scale-100'}`}>
                    {tab.icon}
                  </div>
                  {isActive && (
                    <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-teal-500 dark:bg-teal-400" />
                  )}
                </div>

                {/* Label */}
                <span className={`text-[10px] font-medium leading-tight transition-all duration-200 ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {tab.label}
                </span>

                {/* Active underline bar */}
                <span className={`h-0.5 w-6 rounded-full transition-all duration-300 ${
                  isActive
                    ? 'bg-teal-500 dark:bg-teal-400 opacity-100 scale-x-100'
                    : 'bg-transparent opacity-0 scale-x-0'
                }`} />
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};

export default MobileBottomNav;
