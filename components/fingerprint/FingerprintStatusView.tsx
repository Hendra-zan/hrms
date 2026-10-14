import React from 'react';
import { ScanPhase } from './types.ts';
import { UareUDeviceStatus, UareUScanResult } from '../../services/uareuFingerprintService.ts';

interface FingerprintStatusViewProps {
  phase: ScanPhase;
  deviceStatus: UareUDeviceStatus | null;
  scanResult: UareUScanResult | null;
  countdown: number;
  retryCount: number;
  onRetryBridge: () => void;
  onStartScan: () => void;
}

export const FingerprintStatusView: React.FC<FingerprintStatusViewProps> = ({
  phase,
  deviceStatus,
  scanResult,
  countdown,
  retryCount,
  onRetryBridge,
  onStartScan,
}) => {
  if (phase === 'checking') {
    return (
      <div className="flex flex-col items-center justify-center p-8 space-y-3">
        <div className="w-10 h-10 border-4 border-[#06736a] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-500 font-medium">Memeriksa koneksi sensor U.are.U...</p>
      </div>
    );
  }

  if (phase === 'bridge_error') {
    return (
      <div className="text-center p-6 space-y-3">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">⚠️</div>
        <h4 className="text-sm font-bold text-slate-800">Bridge Agent Tidak Terdeteksi</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Pastikan HRMS Bridge Agent telah terpasang dan berjalan pada komputer ini (port 8765).
        </p>
        <button
          onClick={onRetryBridge}
          className="px-4 py-2 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          🔄 Coba Lagi
        </button>
      </div>
    );
  }

  if (phase === 'no_device') {
    return (
      <div className="text-center p-6 space-y-3">
        <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-xl mx-auto">🔌</div>
        <h4 className="text-sm font-bold text-slate-800">Perangkat Scanner Belum Terhubung</h4>
        <p className="text-xs text-slate-500 max-w-xs mx-auto">
          Sensor sidik jari DigitalPersona U.are.U 4500 belum terpasang pada port USB.
        </p>
        <button
          onClick={onRetryBridge}
          className="px-4 py-2 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          🔄 Periksa Ulang
        </button>
      </div>
    );
  }

  if (phase === 'scanning') {
    return (
      <div className="text-center p-6 space-y-4">
        <div className="relative w-20 h-20 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-teal-100 rounded-full animate-ping opacity-50"></div>
          <div className="w-16 h-16 bg-[#06736a] text-white rounded-full flex items-center justify-center text-2xl shadow-lg relative">
            👆
          </div>
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-800">Tempelkan Jari pada Scanner</h4>
          <p className="text-xs text-slate-500 mt-0.5">Waktu tersisa: <span className="font-bold text-[#06736a]">{countdown}s</span></p>
        </div>
      </div>
    );
  }

  if (phase === 'success') {
    return (
      <div className="text-center p-6 space-y-3 animate-fadeIn">
        <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-2xl mx-auto">✓</div>
        <h4 className="text-sm font-bold text-slate-800">Sidik Jari Berhasil Terbaca!</h4>
        <p className="text-xs text-slate-500">Kualitas sampel: {scanResult?.quality || 100}%</p>
      </div>
    );
  }

  if (phase === 'scan_failed') {
    return (
      <div className="text-center p-6 space-y-3">
        <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center text-xl mx-auto">❌</div>
        <h4 className="text-sm font-bold text-slate-800">Pemindaian Gagal / Waktu Habis</h4>
        <p className="text-xs text-slate-500">Pastikan jari bersih dan menempel rata pada kaca prisma scanner.</p>
        <button
          onClick={onStartScan}
          className="px-4 py-2 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-xs"
        >
          🔄 Pindai Ulang
        </button>
      </div>
    );
  }

  // Phase ready
  return (
    <div className="text-center p-6 space-y-4">
      <div className="w-16 h-16 bg-teal-50 text-[#06736a] border border-teal-200 rounded-full flex items-center justify-center text-2xl mx-auto shadow-xs">
        👆
      </div>
      <div>
        <h4 className="text-sm font-bold text-slate-800">Sensor U.are.U Siap</h4>
        <p className="text-xs text-slate-500 mt-0.5">Perangkat terhubung & driver aktif.</p>
      </div>
      <button
        onClick={onStartScan}
        className="px-6 py-2.5 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 mx-auto"
      >
        <span>⚡</span> Mulai Pindai Jari
      </button>
    </div>
  );
};
