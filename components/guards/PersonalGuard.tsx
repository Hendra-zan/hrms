import React from 'react';

interface PersonalGuardProps {
  activePortal: 'personal' | 'operational' | null;
  children: React.ReactNode;
}

const PersonalGuard: React.FC<PersonalGuardProps> = ({ activePortal, children }) => {
  if (activePortal !== 'personal') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6 text-center animate-portal-enter">
        <div className="text-3xl mb-3">🔒</div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Akses Ditolak</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          Fitur ini hanya tersedia di <strong>Portal Personal</strong>.
          Silakan beralih portal melalui sidebar.
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default PersonalGuard;
