import React from 'react';

interface KaruRejectModalProps {
  rejectLogId: string | null;
  setRejectLogId: (id: string | null) => void;
  rejectNote: string;
  setRejectNote: (val: string) => void;
  handleVerify: (id: string, status: 'approved' | 'rejected', notes?: string) => void;
}

export const KaruRejectModal: React.FC<KaruRejectModalProps> = ({
  rejectLogId,
  setRejectLogId,
  rejectNote,
  setRejectNote,
  handleVerify,
}) => {
  if (!rejectLogId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400 font-bold text-base">
          <span>❌</span>
          <h4>Tolak / Minta Revisi Log Aktivitas</h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Berikan alasan atau catatan revisi agar staf yang bersangkutan dapat memperbaiki data logbook-nya.
        </p>
        <textarea
          rows={3}
          placeholder="Tuliskan catatan revisi (misal: mohon perjelas uraian tindakan atau sesuaikan jam tindakan)..."
          value={rejectNote}
          onChange={e => setRejectNote(e.target.value)}
          className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none dark:text-slate-200"
        ></textarea>
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => setRejectLogId(null)}
            className="px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleVerify(rejectLogId, 'rejected', rejectNote)}
            className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs"
          >
            Kirim Penolakan
          </button>
        </div>
      </div>
    </div>
  );
};
