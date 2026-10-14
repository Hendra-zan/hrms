import React from 'react';

interface SidebarBrandProps {
  systemSettings: { institution_name?: string; logo_url?: string } | null;
  isCollapsed: boolean;
  onToggleCollapse?: () => void;
  setMobileOpen: (open: boolean) => void;
}

export const SidebarBrand: React.FC<SidebarBrandProps> = ({
  systemSettings,
  isCollapsed,
  onToggleCollapse,
  setMobileOpen,
}) => {
  return (
    <div className={`flex items-center mb-8 px-2 ${isCollapsed ? 'flex-col gap-2 justify-center' : 'gap-3'}`}>
      {systemSettings?.logo_url ? (
        <img src={systemSettings.logo_url} alt="Logo" className="w-8 h-8 rounded-lg object-contain" />
      ) : (
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {(systemSettings?.institution_name || 'H')[0].toUpperCase()}
        </div>
      )}
      {!isCollapsed ? (
        <>
          <div className="ml-3 overflow-hidden flex-1">
            <h1 className="font-bold text-lg text-gray-900 dark:text-slate-100 truncate">
              {systemSettings?.institution_name || 'HRMS Pro'}
            </h1>
            <p className="text-xs text-primary font-medium tracking-wide uppercase">
              Sistem Manajemen
            </p>
          </div>
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              title="Sembunyikan menu"
              className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300 transition-colors hidden lg:block"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
            </button>
          )}
        </>
      ) : (
        onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            title="Tampilkan menu"
            className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-300 transition-colors hidden lg:block mt-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>
        )
      )}
      {/* Close button (mobile) */}
      <button
        onClick={() => setMobileOpen(false)}
        className="ml-auto lg:hidden text-gray-400 hover:text-gray-700"
        aria-label="Tutup menu"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
};
