import React from 'react';
import { WorkLogEntry } from '../../../types.ts';
import { CATEGORY_LABEL_MAP, SHIFT_LABEL_MAP } from './types.ts';

interface WorkLogCardListProps {
  subTab: 'my_logs' | 'unit_logs';
  loading: boolean;
  filteredLogs: WorkLogEntry[];
  openCreateForm: () => void;
  openEditForm: (log: WorkLogEntry) => void;
  handleDeleteLog: (id: string) => void;
  handleVerify: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
  setRejectLogId: (id: string | null) => void;
}

export const WorkLogCardList: React.FC<WorkLogCardListProps> = ({
  subTab,
  loading,
  filteredLogs,
  openCreateForm,
  openEditForm,
  handleDeleteLog,
  handleVerify,
  setRejectLogId,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">✓ Disetujui</span>;
      case 'rejected':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 rounded-full border border-rose-200 dark:border-rose-800 flex items-center gap-1">❌ Ditolak</span>;
      case 'draft':
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 rounded-full border border-slate-200 dark:border-slate-700">📝 Draft</span>;
      default:
        return <span className="px-2.5 py-1 text-[10px] font-extrabold bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 rounded-full border border-amber-200 dark:border-amber-800 flex items-center gap-1">⏳ Menunggu Verifikasi</span>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
        <div className="w-8 h-8 border-4 border-[#06736a] border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs text-slate-400 mt-3 font-medium">Memuat log aktivitas kerja...</p>
      </div>
    );
  }

  if (filteredLogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-800 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
        <div className="text-4xl mb-3">🩺</div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">Belum Ada Aktivitas Logbook</h3>
        <p className="text-xs text-slate-400 max-w-sm mt-1">
          {subTab === 'my_logs'
            ? 'Catat aktivitas kerja harian, tindakan medis, edukasi pasien, atau administrasi Anda untuk pelaporan kinerja.'
            : 'Belum ada staf unit yang mencatat aktivitas kerja pada kriteria filter ini.'}
        </p>
        {subTab === 'my_logs' && (
          <button
            onClick={openCreateForm}
            className="mt-4 px-4 py-2 bg-[#06736a] hover:bg-[#055b54] text-white text-xs font-bold rounded-xl shadow-sm transition-all"
          >
            ➕ Mulai Catat Logbook
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {filteredLogs.map(log => (
        <div
          key={log.id}
          className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
        >
          <div>
            <div className="flex items-start justify-between gap-3 mb-2.5">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#06736a] dark:text-teal-400 bg-teal-50 dark:bg-teal-950/50 px-2 py-0.5 rounded-md border border-teal-200 dark:border-teal-800">
                  {CATEGORY_LABEL_MAP[log.category] || log.category}
                </span>
                <h4 className="text-base font-bold text-slate-900 dark:text-slate-100 mt-1.5 line-clamp-1">
                  {log.title}
                </h4>
              </div>
              {getStatusBadge(log.status)}
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-4 line-clamp-3">
              {log.activityDescription}
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl text-[11px] text-slate-600 dark:text-slate-300 mb-3">
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold">TANGGAL & SHIFT</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {log.logDate} ({SHIFT_LABEL_MAP[log.shift]?.split(' ')[1] || log.shift})
                </span>
              </div>
              <div>
                <span className="text-[9px] text-slate-400 block font-semibold">JAM KERJA</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {log.startTime} - {log.endTime} ({((log.durationMinutes || 0) / 60).toFixed(1)}j)
                </span>
              </div>
              {log.patientCount !== undefined && log.patientCount > 0 && (
                <div>
                  <span className="text-[9px] text-slate-400 block font-semibold">PASIEN DITANGANI</span>
                  <span className="font-bold text-[#06736a] dark:text-teal-400">
                    {log.patientCount} Orang
                  </span>
                </div>
              )}
              {log.location && (
                <div className="col-span-2">
                  <span className="text-[9px] text-slate-400 block font-semibold">LOKASI / RUANGAN</span>
                  <span className="font-medium text-slate-700 dark:text-slate-300 truncate block">
                    📍 {log.location}
                  </span>
                </div>
              )}
            </div>

            {subTab === 'unit_logs' && (
              <div className="flex items-center gap-2 mb-3 px-2.5 py-1.5 bg-teal-50/50 dark:bg-teal-950/20 border border-teal-100 dark:border-teal-900/40 rounded-xl text-xs">
                <span className="text-sm">👤</span>
                <div>
                  <span className="text-[9px] text-slate-400 block">KARYAWAN</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{log.employeeNama}</span>
                </div>
              </div>
            )}

            {log.verifierNotes && (
              <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl text-[11px] text-rose-700 dark:text-rose-300 mb-3">
                <p className="font-bold text-[10px] uppercase">Catatan Verifikator ({log.verifiedBy}):</p>
                <p className="mt-0.5">{log.verifierNotes}</p>
              </div>
            )}
          </div>

          <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700/60 pt-3 mt-1">
            <span className="text-[10px] text-slate-400">
              {log.verifiedBy ? `Diverifikasi oleh ${log.verifiedBy}` : 'Belum diverifikasi'}
            </span>

            <div className="flex items-center gap-1.5">
              {subTab === 'my_logs' ? (
                <>
                  {log.status !== 'approved' && (
                    <>
                      <button
                        onClick={() => openEditForm(log)}
                        className="px-2.5 py-1 text-xs font-bold text-teal-700 dark:text-teal-300 bg-teal-50 dark:bg-teal-950/60 hover:bg-teal-100 rounded-lg transition-all"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeleteLog(log.id)}
                        className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all"
                      >
                        🗑️ Hapus
                      </button>
                    </>
                  )}
                </>
              ) : (
                <>
                  {log.status === 'submitted' && (
                    <>
                      <button
                        onClick={() => handleVerify(log.id, 'approved')}
                        className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-all flex items-center gap-1"
                      >
                        <span>✓</span> Setujui
                      </button>
                      <button
                        onClick={() => setRejectLogId(log.id)}
                        className="px-3 py-1.5 text-xs font-bold text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1"
                      >
                        <span>❌</span> Tolak / Revisi
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
