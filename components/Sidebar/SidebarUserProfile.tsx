import React from 'react';
import { ArrowLeftOnRectangleIcon } from '../icons.tsx';

interface SidebarUserProfileProps {
  isCollapsed: boolean;
  activePortal: 'personal' | 'operational' | null;
  canAccessOperationalPortal: boolean;
  authUser: { profile?: { role?: string; nama?: string }; email?: string };
  isLoggingOut: boolean;
  onPortalToggle: () => void;
  onChangePasswordClick: () => void;
  onAuditLogClick: () => void;
  onLogout: () => void;
}

export const SidebarUserProfile: React.FC<SidebarUserProfileProps> = ({
  isCollapsed,
  activePortal,
  canAccessOperationalPortal,
  authUser,
  isLoggingOut,
  onPortalToggle,
  onChangePasswordClick,
  onAuditLogClick,
  onLogout,
}) => {
  return (
    <div className="pt-4 border-t border-gray-200 dark:border-slate-800 flex-shrink-0 space-y-2">
      {/* Portal Switcher Button */}
      {canAccessOperationalPortal && (
        <button
          onClick={onPortalToggle}
          className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold border transition-all ${
            activePortal === 'operational'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/20'
              : 'bg-teal-500/10 border-teal-500/30 text-teal-700 dark:text-teal-400 hover:bg-teal-500/20'
          } ${isCollapsed ? 'justify-center' : ''}`}
          title={isCollapsed ? (activePortal === 'operational' ? 'Pindah ke Portal Pribadi' : 'Pindah ke Portal Manajemen') : undefined}
        >
          <div className="flex items-center gap-2">
            <span className="text-base">
              {activePortal === 'operational' ? '🏢' : '👤'}
            </span>
            {!isCollapsed && (
              <span>
                {activePortal === 'operational' ? 'Portal Manajemen' : 'Portal Pribadi (ESS)'}
              </span>
            )}
          </div>
          {!isCollapsed && (
            <span className="text-[10px] uppercase font-black tracking-wider px-1.5 py-0.5 rounded bg-white/50 dark:bg-black/20">
              Ganti
            </span>
          )}
        </button>
      )}

      {/* User Info Card */}
      <div className={`flex items-center p-2 rounded-xl bg-white/60 dark:bg-slate-800/60 border border-gray-200 dark:border-slate-700 ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
        <div className="w-8 h-8 rounded-full bg-primary/20 dark:bg-teal-900/40 text-primary dark:text-teal-400 font-bold flex items-center justify-center flex-shrink-0 text-sm">
          {(authUser.profile?.nama || authUser.email || 'U')[0].toUpperCase()}
        </div>
        {!isCollapsed && (
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-gray-900 dark:text-slate-100 truncate">
              {authUser.profile?.nama || authUser.email}
            </p>
            <p className="text-[10px] text-gray-500 dark:text-slate-400 capitalize truncate">
              {authUser.profile?.role || 'Staff'}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons: Password, Audit Log, Logout */}
      <div className={`grid ${isCollapsed ? 'grid-cols-1' : 'grid-cols-3'} gap-1.5`}>
        <button
          onClick={onChangePasswordClick}
          className={`flex items-center justify-center p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold transition-all ${isCollapsed ? 'p-2' : ''}`}
          title="Ubah Password"
        >
          <span>🔑</span>
          {!isCollapsed && <span className="ml-1 text-[11px]">Sandi</span>}
        </button>
        <button
          onClick={onAuditLogClick}
          className={`flex items-center justify-center p-2 rounded-xl text-gray-600 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-800 border border-gray-200 dark:border-slate-700 text-xs font-semibold transition-all ${isCollapsed ? 'p-2' : ''}`}
          title="Log Aktivitas"
        >
          <span>📜</span>
          {!isCollapsed && <span className="ml-1 text-[11px]">Log</span>}
        </button>
        <button
          onClick={onLogout}
          disabled={isLoggingOut}
          className={`flex items-center justify-center p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/20 text-xs font-bold transition-all ${isCollapsed ? 'p-2' : ''}`}
          title="Keluar / Logout"
        >
          <ArrowLeftOnRectangleIcon className="w-4 h-4 flex-shrink-0" />
          {!isCollapsed && <span className="ml-1 text-[11px]">Keluar</span>}
        </button>
      </div>
    </div>
  );
};
