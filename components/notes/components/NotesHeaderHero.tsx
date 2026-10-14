import React from 'react';

interface NotesHeaderHeroProps {
  activeTab: 'two-way' | 'personal' | 'work-log';
  setActiveTab: (tab: 'two-way' | 'personal' | 'work-log') => void;
  unreadTwoWayCount: number;
  canSendNotes: boolean;
  onOpenSendReport: () => void;
  onOpenSendNote: () => void;
}

export const NotesHeaderHero: React.FC<NotesHeaderHeroProps> = ({
  activeTab,
  setActiveTab,
  unreadTwoWayCount,
  canSendNotes,
  onOpenSendReport,
  onOpenSendNote,
}) => {
  return (
    <div className="bg-gradient-to-r from-[#06736a] to-teal-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
      <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-[radial-gradient(#ffffff20_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Modul Catatan & Note
            </span>
            {unreadTwoWayCount > 0 && (
              <span className="bg-rose-500 text-white text-xs font-extrabold px-2.5 py-0.5 rounded-full animate-pulse">
                {unreadTwoWayCount} Catatan Atasan Baru
              </span>
            )}
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            📋 Pusat Catatan & Instruksi Kerja
          </h1>
          <p className="text-teal-100 text-sm mt-1 max-w-xl">
            Kelola pesan 2-arah dari Atasan / HRD serta simpan catatan kerja harian & pengingat pribadi Anda di satu tempat.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
          <button
            onClick={() => window.print()}
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
          onClick={() => setActiveTab('two-way')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'two-way'
              ? 'bg-white text-[#06736a] shadow-md'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          💬 Instruksi & Catatan Atasan
          {unreadTwoWayCount > 0 && (
            <span className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('personal')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'personal'
              ? 'bg-white text-[#06736a] shadow-md'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          📝 Memo Mandiri & Checklist
        </button>

        <button
          onClick={() => setActiveTab('work-log')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs transition-all whitespace-nowrap ${
            activeTab === 'work-log'
              ? 'bg-white text-[#06736a] shadow-md'
              : 'bg-white/10 text-white hover:bg-white/20'
          }`}
        >
          📖 Logbook Kerja Harian
        </button>
      </div>
    </div>
  );
};
