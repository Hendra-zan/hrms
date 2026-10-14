import React from 'react';

interface IdleTimeoutModalProps {
  isOpen: boolean;
  secondsLeft: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const IdleTimeoutModal: React.FC<IdleTimeoutModalProps> = ({
  isOpen,
  secondsLeft,
  onExtendSession,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 dark:border-slate-700 overflow-hidden transform transition-all">
        {/* Top Accent Line */}
        <div className="h-2 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500" />

        <div className="p-6 text-center space-y-4">
          <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto text-3xl shadow-inner">
            ⏳
          </div>

          <h3 className="text-xl font-bold text-slate-800 dark:text-white">
            Peringatan Inaktivitas Sesi
          </h3>

          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            Tidak ada aktivitas terdeteksi pada layar PC ini selama 15 menit. Demi keamanan data Rumah Sakit, sesi Anda akan di-logout otomatis dalam:
          </p>

          <div className="py-2">
            <span className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-50 dark:bg-red-950/50 border-2 border-red-500 text-3xl font-extrabold text-red-600 dark:text-red-400 shadow-sm animate-pulse">
              {secondsLeft}s
            </span>
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Tekan <strong className="text-slate-700 dark:text-slate-200">"Tetap Login"</strong> untuk melanjutkan pekerjaan Anda.
          </p>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/80 px-6 py-4 flex flex-col sm:flex-row gap-3 border-t border-slate-100 dark:border-slate-700">
          <button
            onClick={onLogoutNow}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 font-semibold text-sm transition-colors"
          >
            🚪 Logout Sekarang
          </button>
          <button
            onClick={onExtendSession}
            className="w-full sm:w-1/2 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
          >
            <span>✅</span> Tetap Login
          </button>
        </div>
      </div>
    </div>
  );
};
