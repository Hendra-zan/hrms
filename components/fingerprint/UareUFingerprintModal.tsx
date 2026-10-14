import React from 'react';
import { UareUFingerprintModalProps } from './types.ts';
import { useFingerprintScan } from './useFingerprintScan.ts';
import { FingerprintStatusView } from './FingerprintStatusView.tsx';

export const UareUFingerprintModal: React.FC<UareUFingerprintModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  employeeName,
  employee,
  actionType,
  mode,
}) => {
  const {
    phase,
    deviceStatus,
    scanResult,
    countdown,
    retryCount,
    checkBridge,
    handleStartScan,
  } = useFingerprintScan(isOpen, onSuccess);

  if (!isOpen) return null;

  const targetName = employeeName || employee?.nama || 'Karyawan';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-sm rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-700 flex items-center justify-between bg-teal-50/50 dark:bg-teal-950/20">
          <div className="flex items-center gap-2">
            <span className="text-base">👆</span>
            <div>
              <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                {mode === 'enroll' ? 'Pendaftaran Sidik Jari' : 'Verifikasi Presensi Sidik Jari'}
              </h3>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                {targetName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg text-sm"
          >
            ✕
          </button>
        </div>

        {/* Body View */}
        <div className="p-4">
          <FingerprintStatusView
            phase={phase}
            deviceStatus={deviceStatus}
            scanResult={scanResult}
            countdown={countdown}
            retryCount={retryCount}
            onRetryBridge={checkBridge}
            onStartScan={handleStartScan}
          />
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
