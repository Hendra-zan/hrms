import React from 'react';

interface NotesHeaderNavProps {
  activeTab: 'two-way' | 'personal';
  onTabChange: (tab: 'two-way' | 'personal') => void;
  unreadCount: number;
  personalNotesCount: number;
  canSendNotes: boolean;
  onOpenSendReport: () => void;
  onOpenSendNote: () => void;
  onPrintReport: () => void;
}

export const NotesHeaderNav: React.FC<NotesHeaderNavProps> = ({
  activeTab,
  onTabChange,
  unreadCount,
  personalNotesCount,
  canSendNotes,
  onOpenSendReport,
  onOpenSendNote,
  onPrintReport,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#06736a] via-teal-700 to-teal-800 p-6 md:p-8 rounded-3xl text-white shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight flex items-center gap-2.5">
            💬 Catatan & Instruksi Kerja
          </h1>
          <p className="text-teal-100 text-xs md:text-sm mt-1 max-w-xl">
            Kelola pesan 2-arah dari Atasan / HRD serta simpan catatan kerja harian & pengingat pribadi Anda di satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={onPrintReport}
            className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white font-bold px-3.5 py-2.5 rounded-2xl shadow-md transition-all active:scale-95 text-xs border border-white/30"
            title="Cetak atau simpan sebagai PDF"
          >
            🖨️ Cetak / Ekspor PDF
          </button>

          <button
            onClick={onOpenSendReport}
            className="inline-flex items-center gap-2 bg-white text-[#06736a] hover:bg-teal-50 font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 text-xs"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Buat Laporan Ke Atasan
          </button>

          {canSendNotes && (
            <button
              onClick={onOpenSendNote}
              className="inline-flex items-center gap-2 bg-teal-800/80 hover:bg-teal-900 text-white font-bold px-4 py-2.5 rounded-2xl shadow-lg transition-all active:scale-95 text-xs border border-white/20"
            >
              + Kirim Catatan Ke Staf
            </button>
          )}
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/20 overflow-x-auto">
        <button
          onClick={() => onTabChange('two-way')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'two-way'
              ? 'bg-white text-[#06736a] shadow-md'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          💬 Instruksi & Catatan Atasan
          {unreadCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => onTabChange('personal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'personal'
              ? 'bg-white text-[#06736a] shadow-md'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          📝 Catatan Kerja & Mandiri
          <span className="bg-white/20 px-2 py-0.5 rounded-md text-[10px]">
            {personalNotesCount}
          </span>
        </button>
      </div>
    </div>
  );
};
