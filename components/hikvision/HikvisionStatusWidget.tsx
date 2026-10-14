import React, { useState, useEffect } from 'react';
import { getHikvisionConfig, testHikvisionConnection, runHikvisionSync, type HikvisionConfig, type HikvisionSyncResult } from '../../services/hikvisionService';

export const HikvisionStatusWidget: React.FC = () => {
  const [config] = useState<HikvisionConfig>(getHikvisionConfig());
  const [status, setStatus] = useState<'checking' | 'connected' | 'error'>('checking');
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<HikvisionSyncResult | null>(null);

  useEffect(() => {
    if (!config.ip) {
      setStatus('error');
      return;
    }

    testHikvisionConnection(config)
      .then(res => setStatus(res.connected ? 'connected' : 'error'))
      .catch(() => setStatus('error'));
  }, [config]);

  const handleQuickSync = async () => {
    if (isSyncing || !config.ip) return;
    setIsSyncing(true);
    try {
      const res = await runHikvisionSync(config, 24);
      setLastSyncResult(res);
    } catch {
      // ignore
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 dark:bg-teal-900/30 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xl font-bold">
          📷
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-gray-900 dark:text-white text-sm">
              Mesin Absensi Hikvision
            </h4>
            <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
              status === 'connected'
                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
                : status === 'error'
                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${status === 'connected' ? 'bg-emerald-500 animate-pulse' : status === 'error' ? 'bg-red-500' : 'bg-gray-400'}`} />
              {status === 'connected' ? 'ONLINE' : status === 'error' ? 'OFFLINE / UNCHECKED' : 'CHECKING...'}
            </span>
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            IP: {config.ip || 'Belum dikonfigurasi'} · Sync Otomatis: {config.syncEnabled ? `Aktif (${config.syncIntervalMinutes}m)` : 'Nonaktif'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {lastSyncResult && (
          <span className="text-[11px] text-gray-500 dark:text-gray-400">
            {lastSyncResult.success ? `✅ Sync ${lastSyncResult.synced} record` : '❌ Gagal sync'}
          </span>
        )}
        <button
          onClick={handleQuickSync}
          disabled={isSyncing || status !== 'connected'}
          className="px-3.5 py-2 bg-[#06736a] hover:bg-[#055f57] text-white font-semibold text-xs rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5"
        >
          <span className={isSyncing ? 'animate-spin' : ''}>🔄</span>
          <span>{isSyncing ? 'Syncing...' : 'Sync Sekarang'}</span>
        </button>
      </div>
    </div>
  );
};
