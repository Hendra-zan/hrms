/**

 * components/Sidebar/NavButton.tsx

 * Navigation button component with badge support

 * Extracted from App.tsx

 */



import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import type { View } from '../../types';
import { SidebarContext } from './Sidebar';

interface NavButtonProps {
  viewName: View;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  isActive: boolean;
  onClick: () => void;
}

export const NavButton: React.FC<NavButtonProps> = ({
  viewName,
  label,
  icon,
  badge,
  isActive,
  onClick,
}) => {
  const { isCollapsed } = useContext(SidebarContext);

  return (
    <Link
      to={`/${viewName}`}
      onClick={onClick}
      title={isCollapsed ? label : undefined}
      className={`w-full flex items-center rounded-lg text-sm font-medium transition-all duration-200 relative ${
        isCollapsed ? 'justify-center p-3' : 'gap-3 px-4 py-3'
      } ${
        isActive
          ? 'bg-primary text-white shadow-sm font-semibold'
          : 'text-gray-700 dark:text-slate-400 hover:bg-white/60 dark:hover:bg-slate-800/50 hover:text-primary dark:hover:text-primary-hover'
      }`}
    >
      {icon}
      {!isCollapsed && <span className="flex-1 text-left truncate">{label}</span>}
      {badge !== undefined && badge > 0 && (
        isCollapsed ? (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white dark:border-[#0f1724]" />
        ) : (
          <span
            className={`ml-auto min-w-[20px] h-5 px-1.5 flex items-center justify-center text-xs font-bold rounded-full ${
              isActive
                ? 'bg-white text-primary'
                : 'bg-red-500 text-white animate-pulse'
            }`}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )
      )}
    </Link>
  );
};

