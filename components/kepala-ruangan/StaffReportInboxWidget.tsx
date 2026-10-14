import React, { useState, useEffect, useMemo } from 'react';
import { EmployeeNote, NoteStatus } from '../../types.ts';
import { employeeNotesService } from '../../services/employeeNotesService.ts';

interface StaffReportInboxWidgetProps {
  currentUserId: string;
  userRole?: string;
  onOpenFullNotes?: () => void;
}

export const StaffReportInboxWidget: React.FC<StaffReportInboxWidgetProps> = ({
  currentUserId,
  userRole,
  onOpenFullNotes,
}) => {
  const [reports, setReports] = useState<EmployeeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<EmployeeNote | null>(null);
  const [responseText, setResponseText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadReports = async () => {
    if (!currentUserId) return;
    setLoading(true);
    try {
      // Notes where currentUserId is employee_id (received reports)
      const data = await employeeNotesService.fetchNotesForEmployee(currentUserId);
      setReports(data);
    } catch (err) {
      console.warn('Failed to load staff reports for widget:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [currentUserId]);

  const stats = useMemo(() => {
    const unread = reports.filter(r => r.status === 'unread').length;
    const inProgress = reports.filter(r => r.status === 'in_progress').length;
    const confirmed = reports.filter(r => r.status === 'confirmed').length;
    return { total: reports.length, unread, inProgress, confirmed };
  }, [reports]);

  const handleUpdateReportStatus = async (status: NoteStatus) => {
    if (!selectedReport) return;
    setIsSubmitting(true);
    try {
      const success = await employeeNotesService.replyAndConfirmNote(
        selectedReport.id,
        responseText || selectedReport.replyContent,
        status
      );
      if (success) {
        setReports(prev =>
          prev.map(r =>
            r.id === selectedReport.id
              ? {
                  ...r,
                  status,
                  replyContent: responseText || r.replyContent,
                  confirmedAt: new Date().toISOString(),
                }
              : r
          )
        );
        setSelectedReport(prev =>
          prev
            ? {
                ...prev,
                status,
                replyContent: responseText || prev.replyContent,
                confirmedAt: new Date().toISOString(),
              }
            : null
        );
        setResponseText('');
      }
    } catch (err) {
      console.error('Error updating report status:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm space-y-4">
      {/* Widget Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xl">📥</span>
            <h2 className="text-base font-bold text-slate-800 dark:text-white">
              Inbox Laporan Staf Unit
            </h2>
            {stats.unread > 0 && (
              <span className="bg-rose-500 text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full animate-pulse">
                {stats.unread} Baru
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Pantau dan tindak lanjuti laporan kendala operasional & kejadian dari perawat/staf unit.
          </p>
        </div>

        {onOpenFullNotes && (
          <button
            onClick={onOpenFullNotes}
            className="text-xs font-bold text-[#06736a] hover:text-teal-700 bg-teal-50 dark:bg-teal-950/50 px-3 py-1.5 rounded-xl transition-all"
          >
            Buka Semua ➔
          </button>
        )}
      </div>

      {/* Stats Summary Pills */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900 text-center">
          <span className="block text-xs font-bold text-rose-800 dark:text-rose-300">Belum Dibaca</span>
          <span className="text-lg font-extrabold text-rose-700 dark:text-rose-400">{stats.unread}</span>
        </div>

        <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900 text-center">
          <span className="block text-xs font-bold text-amber-800 dark:text-amber-300">Dalam Proses</span>
          <span className="text-lg font-extrabold text-amber-700 dark:text-amber-400">{stats.inProgress}</span>
        </div>

        <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900 text-center">
          <span className="block text-xs font-bold text-emerald-800 dark:text-emerald-300">Selesai</span>
          <span className="text-lg font-extrabold text-emerald-700 dark:text-emerald-400">{stats.confirmed}</span>
        </div>
      </div>

      {/* List Reports */}
      {loading ? (
        <div className="py-6 text-center text-xs text-slate-400">
          <div className="w-5 h-5 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-1" />
          Memuat laporan staf...
        </div>
      ) : reports.length === 0 ? (
        <div className="py-8 text-center bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
          <p className="text-2xl mb-1">✅</p>
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">Tidak ada laporan staf yang memerlukan tindakan</p>
          <p className="text-[11px] text-slate-400 mt-0.5">Semua laporan operasional staf unit telah ditindaklanjuti.</p>
        </div>
      ) : (
        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {reports.slice(0, 5).map(report => (
            <div
              key={report.id}
              onClick={() => {
                setSelectedReport(report);
                setResponseText(report.replyContent || '');
                if (report.status === 'unread') {
                  employeeNotesService.replyAndConfirmNote(report.id, undefined, 'read');
                  setReports(prev => prev.map(r => r.id === report.id ? { ...r, status: 'read' } : r));
                }
              }}
              className={`p-3.5 rounded-2xl border transition-all cursor-pointer hover:shadow-sm flex items-center justify-between gap-3 ${
                report.status === 'unread'
                  ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                  : report.status === 'in_progress'
                  ? 'bg-amber-50/40 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                  : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
              }`}
            >
              <div className="space-y-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    report.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                    report.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                    'bg-slate-100 text-slate-600'
                  }`}>
                    {report.priority === 'urgent' ? '🚨 Mendesak' : report.priority === 'high' ? '⚡ Penting' : 'Normal'}
                  </span>
                  <span className="text-[10px] font-semibold text-[#06736a] truncate">
                    Oleh: {report.senderNama || 'Staf'}
                  </span>
                </div>
                <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                  {report.title}
                </h4>
              </div>

              <div className="flex flex-col items-end gap-1 flex-shrink-0">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                  report.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                  report.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                  report.status === 'read' ? 'bg-blue-100 text-blue-700' :
                  'bg-rose-100 text-rose-700'
                }`}>
                  {report.status === 'confirmed' ? '✓ Selesai' : report.status === 'in_progress' ? 'Diproses' : report.status === 'read' ? 'Dibaca' : 'Baru'}
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(report.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* QUICK RESPONSE MODAL FOR KARU */}
      {selectedReport && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="px-6 py-4 bg-gradient-to-r from-[#06736a] to-teal-700 flex items-center justify-between text-white">
              <h3 className="font-bold text-sm">📋 Respon & Tindak Lanjut Karu</h3>
              <button onClick={() => setSelectedReport(null)} className="text-white/80 hover:text-white font-bold text-lg">
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#06736a]">
                  Pelapor: <strong>{selectedReport.senderNama}</strong>
                </span>
                <span className="text-[10px] text-slate-400">
                  {new Date(selectedReport.createdAt).toLocaleString('id-ID')}
                </span>
              </div>

              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {selectedReport.title}
              </h4>

              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900/60 border text-xs leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">
                {selectedReport.content}
              </div>

              {selectedReport.attachmentUrl && (
                <div>
                  <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    📷 Lampiran Foto Bukti Fisik:
                  </span>
                  <img
                    src={selectedReport.attachmentUrl}
                    alt="Foto Lampiran"
                    className="max-h-48 rounded-xl border object-cover"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  💬 Tanggapan / Arahan Tindak Lanjut Karu:
                </label>
                <textarea
                  rows={3}
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  placeholder="Ketik tanggapan atau instruksi perbaikan (contoh: Laporan kerusakan IPSRS telah dibuat)..."
                  className="w-full p-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-[#06736a] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700 gap-2">
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdateReportStatus('in_progress')}
                  className="px-4 py-2 text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  🟡 Tandai "Dalam Proses"
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleUpdateReportStatus('confirmed')}
                  className="px-4 py-2 text-xs font-bold bg-[#06736a] hover:bg-teal-700 text-white rounded-xl shadow-md disabled:opacity-50"
                >
                  🟢 Selesaikan & Konfirmasi
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
