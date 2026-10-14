import React from 'react';

interface NotesFilterBarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  directionFilter: string;
  onDirectionChange: (d: string) => void;
  categoryFilter: string;
  onCategoryChange: (c: string) => void;
  statusFilter: string;
  onStatusChange: (s: string) => void;
}

export const NotesFilterBar: React.FC<NotesFilterBarProps> = ({
  searchQuery,
  onSearchChange,
  directionFilter,
  onDirectionChange,
  categoryFilter,
  onCategoryChange,
  statusFilter,
  onStatusChange,
}) => {
  return (
    <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
      <div className="relative flex-1">
        <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Cari kata kunci catatan atau nama atasan/staf..."
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#06736a]"
        />
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <select
          value={directionFilter}
          onChange={e => onDirectionChange(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
        >
          <option value="all">Semua Alur Catatan</option>
          <option value="top_down">📥 Dari Atasan (Top-Down)</option>
          <option value="bottom_up">📤 Laporan Ke Atasan (Bottom-Up)</option>
        </select>

        <select
          value={categoryFilter}
          onChange={e => onCategoryChange(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
        >
          <option value="all">Semua Kategori</option>
          <option value="task">📋 Instruksi Tugas</option>
          <option value="performance">⭐ Evaluasi Kinerja</option>
          <option value="shift_reminder">⏰ Pengingat Shift</option>
          <option value="shift_handover">🔄 Operan Shift Ruangan</option>
          <option value="facility_issue">🛠️ Kendala Alat & Fasilitas</option>
          <option value="incident_report">⚠️ Laporan Kejadian Shift</option>
          <option value="schedule_coordination">🔄 Koordinasi Shift</option>
          <option value="feedback">💡 Saran Operasional</option>
          <option value="general">💬 Catatan Umum</option>
        </select>

        <select
          value={statusFilter}
          onChange={e => onStatusChange(e.target.value)}
          className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
        >
          <option value="all">Semua Status</option>
          <option value="unread">Belum Dibaca</option>
          <option value="read">Dibaca Atasan/Staf</option>
          <option value="confirmed">✓ Selesai & Dikonfirmasi</option>
        </select>
      </div>
    </div>
  );
};
