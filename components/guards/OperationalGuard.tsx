import React from 'react';

interface OperationalGuardProps {
  activePortal: 'personal' | 'operational' | null;
  /** Optional: pass canAccessOperational to show role-specific message */
  canAccessOperational?: boolean;
  children: React.ReactNode;
}

const OperationalGuard: React.FC<OperationalGuardProps> = ({
  activePortal,
  canAccessOperational = true,
  children,
}) => {
  if (activePortal !== 'operational') {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800 p-6 text-center animate-portal-enter">
        <div className="text-3xl mb-3">🔒</div>
        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">Akses Ditolak</p>
        <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
          {!canAccessOperational
            ? 'Anda tidak memiliki izin untuk mengakses Portal Operasional. Hanya HRD, Admin, atau Kepala Ruangan yang dapat mengaksesnya.'
            : 'Fitur ini hanya tersedia di Portal Operasional. Silakan beralih portal melalui sidebar.'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

export default OperationalGuard;
