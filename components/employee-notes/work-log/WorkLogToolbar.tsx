import React from 'react';
import { WorkLogCategory, WorkLogShift, WorkLogStatus } from '../../../types.ts';
import { CATEGORY_LABEL_MAP, SHIFT_LABEL_MAP } from './types.ts';

interface WorkLogToolbarProps {
  isKaruOrAbove: boolean;
  subTab: 'my_logs' | 'unit_logs';
  setSubTab: (tab: 'my_logs' | 'unit_logs') => void;
  metrics: {
    totalHours: string;
    totalLogs: number;
    approvedCount: number;
    pendingCount: number;
    unitPendingCount: number;
  };
  shiftFilter: string;
  setShiftFilter: (val: string) => void;
  categoryFilter: string;
  setCategoryFilter: (val: string) => void;
  statusFilter: string;
  setStatusFilter: (val: string) => void;
  searchQuery: string;
  setSearchQuery: (val: string) => void;
  openCreateForm: () => void;
}

export const WorkLogToolbar: React.FC<WorkLogToolbarProps> = ({
  isKaruOrAbove,
  subTab,
  setSubTab,
  metrics,
  shiftFilter,
  setShiftFilter,
  categoryFilter,
  setCategoryFilter,
  statusFilter,
  setStatusFilter,
  searchQuery,
  setSearchQuery,
  openCreateForm,
}) => {
  return (
    <div className="space-y-6">
      {/* SUMMARY STATS BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Durasi Kerja</p>
          <p className="text-2xl font-extrabold text-[#06736a] dark:text-teal-400 mt-1">
            {metrics.totalHours} <span className="text-xs font-semibold text-slate-400">Jam</span>
          </p>
          <p className="text-[10px] text-slate-400 mt-1">Dari {metrics.totalLogs} aktivitas dicatat</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Disetujui Karu</p>
          <p className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
            {metrics.approvedCount} <span className="text-xs font-semibold text-slate-400">Tindakan</span>
          </p>
          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1">✓ Terverifikasi</p>
        </div>

        <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Menunggu Verifikasi</p>
          <p className="text-2xl font-extrabold text-amber-500 mt-1">
            {metrics.pendingCount} <span className="text-xs font-semibold text-slate-400">Pending</span>
          </p>
          <p className="text-[10px] text-amber-500/80 mt-1">Dalam antrean verifikasi</p>
        </div>

        {isKaruOrAbove ? (
          <div className="bg-gradient-to-br from-teal-500 to-[#06736a] text-white p-4 rounded-2xl shadow-sm flex flex-col justify-between">
            <div>
              <p className="text-[11px] font-bold text-teal-100 uppercase tracking-wider">Antrean Unit Anda</p>
              <p className="text-2xl font-black mt-1">
                {metrics.unitPendingCount} <span className="text-xs font-medium text-teal-100">Perlu Diperiksa</span>
              </p>
            </div>
            <p className="text-[10px] text-teal-100/90 mt-1">Log staf yang butuh approval</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-center items-center text-center p-3">
            <button
              onClick={openCreateForm}
              className="w-full py-2.5 px-4 bg-[#06736a] hover:bg-[#055b54] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <span>➕</span> Tambah Aktivitas
            </button>
          </div>
        )}
      </div>

      {/* SUB-TABS & ACTION HEADER */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {isKaruOrAbove && (
          <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setSubTab('my_logs')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
                subTab === 'my_logs'
                  ? 'bg-white dark:bg-slate-700 text-[#06736a] dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              📝 Logbook Saya
            </button>
            <button
              onClick={() => setSubTab('unit_logs')}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
                subTab === 'unit_logs'
                  ? 'bg-white dark:bg-slate-700 text-[#06736a] dark:text-teal-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              🏢 Logbook Staf Unit
              {metrics.unitPendingCount > 0 && (
                <span className="w-5 h-5 bg-amber-500 text-white rounded-full text-[10px] flex items-center justify-center font-black">
                  {metrics.unitPendingCount}
                </span>
              )}
            </button>
          </div>
        )}

        {isKaruOrAbove && subTab === 'my_logs' && (
          <button
            onClick={openCreateForm}
            className="py-2.5 px-4 bg-[#06736a] hover:bg-[#055b54] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 ml-auto"
          >
            <span>➕</span> Catat Log Kerja Baru
          </button>
        )}
      </div>

      {/* FILTERS TOOLBAR */}
      <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center gap-2.5">
        <div className="flex-1 min-w-[180px]">
          <input
            type="text"
            placeholder="🔍 Cari aktivitas, deskripsi, pasien..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-[#06736a] outline-none dark:text-slate-100"
          />
        </div>

        <select
          value={shiftFilter}
          onChange={e => setShiftFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">Semua Shift</option>
          {Object.entries(SHIFT_LABEL_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">Semua Kategori</option>
          {Object.entries(CATEGORY_LABEL_MAP).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-1.5 text-xs bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-xl font-medium text-slate-700 dark:text-slate-200 outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="submitted">⏳ Menunggu Verifikasi</option>
          <option value="approved">✅ Disetujui</option>
          <option value="rejected">❌ Ditolak / Perlu Revisi</option>
          <option value="draft">📝 Draft</option>
        </select>
      </div>
    </div>
  );
};
