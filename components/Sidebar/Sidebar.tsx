import React, { useState, useEffect, useCallback, createContext } from 'react';
import type { View } from '../../types.ts';
import { isAdminRole, isHrRole, isKepalaRuanganRole } from '../../utils/roleUtils.ts';
import { SidebarProps } from './types.ts';
import { SidebarBrand } from './SidebarBrand.tsx';
import { SidebarAdminNav } from './SidebarAdminNav.tsx';
import { SidebarOperationalNav } from './SidebarOperationalNav.tsx';
import { SidebarPersonalNav } from './SidebarPersonalNav.tsx';
import { SidebarUserProfile } from './SidebarUserProfile.tsx';

export const SidebarContext = createContext<{ isCollapsed: boolean }>({ isCollapsed: false });

export const Sidebar: React.FC<SidebarProps> = ({
  activePortal,
  effectiveView,
  systemSettings,
  authUser,
  canAccessOperationalPortal,
  pendingRequestsCount,
  isLoggingOut,
  isCollapsed = false,
  onToggleCollapse,
  hideHamburger = false,
  onNavigate,
  onPortalToggle,
  onChangePasswordClick,
  onLogout,
  onAuditLogClick,
}) => {
  const userRole = authUser?.profile?.role;
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close sidebar on route change (mobile)
  const handleNavigate = useCallback((view: View, notesTab?: 'two-way' | 'personal') => {
    onNavigate(view, notesTab);
    setMobileOpen(false);
  }, [onNavigate]);

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMobileOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  return (
    <SidebarContext.Provider value={{ isCollapsed }}>
      <>
        {/* Mobile hamburger button - hidden when using bottom nav */}
        {!hideHamburger && (
          <button
            onClick={() => setMobileOpen(true)}
            className="fixed top-4 left-4 z-50 lg:hidden flex items-center justify-center w-10 h-10 rounded-xl bg-white dark:bg-slate-800 shadow-lg border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-200 hover:bg-gray-50 dark:hover:bg-slate-700"
            aria-label="Buka menu navigasi"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}

        {/* Mobile overlay */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}

        <aside className={`
          ${isCollapsed ? 'w-20' : 'w-64'} bg-primary-light dark:bg-[#0f1724] dark:border-r dark:border-slate-800 shadow-md flex flex-col p-4 fixed h-full z-50
          transition-all duration-300 ease-in-out
          lg:translate-x-0
          ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          {/* Header & Logo */}
          <SidebarBrand
            systemSettings={systemSettings}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            setMobileOpen={setMobileOpen}
          />

          {/* Navigation Items */}
          <nav className="flex-grow space-y-2 overflow-y-auto overflow-x-hidden pr-1">
            {activePortal === 'operational' && isAdminRole(userRole) && (
              <SidebarAdminNav
                isCollapsed={isCollapsed}
                effectiveView={effectiveView}
                pendingRequestsCount={pendingRequestsCount}
                handleNavigate={handleNavigate}
              />
            )}

            {activePortal === 'operational' && (isHrRole(userRole) || isKepalaRuanganRole(userRole)) && (
              <SidebarOperationalNav
                isCollapsed={isCollapsed}
                userRole={userRole}
                effectiveView={effectiveView}
                pendingRequestsCount={pendingRequestsCount}
                handleNavigate={handleNavigate}
              />
            )}

            {activePortal === 'personal' && (
              <SidebarPersonalNav
                isCollapsed={isCollapsed}
                effectiveView={effectiveView}
                pendingRequestsCount={pendingRequestsCount}
                handleNavigate={handleNavigate}
              />
            )}
          </nav>

          {/* User Profile & Actions Footer */}
          <SidebarUserProfile
            isCollapsed={isCollapsed}
            activePortal={activePortal}
            canAccessOperationalPortal={canAccessOperationalPortal}
            authUser={authUser}
            isLoggingOut={isLoggingOut}
            onPortalToggle={onPortalToggle}
            onChangePasswordClick={onChangePasswordClick}
            onAuditLogClick={onAuditLogClick}
            onLogout={onLogout}
          />
        </aside>
      </>
    </SidebarContext.Provider>
  );
};
