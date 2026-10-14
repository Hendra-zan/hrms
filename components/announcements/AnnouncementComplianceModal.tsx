import React, { useState, useEffect } from 'react';
import { Announcement, AnnouncementComplianceReport } from '../../types/announcement.ts';
import { announcementService } from '../../services/announcementService.ts';

interface AnnouncementComplianceModalProps {
  isOpen: boolean;
  onClose: () => void;
  announcement: Announcement | null;
}

export const AnnouncementComplianceModal: React.FC<AnnouncementComplianceModalProps> = ({
  isOpen,
  onClose,
  announcement,
}) => {
  if (!isOpen || !announcement) return null;

  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<AnnouncementComplianceReport | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    let isMounted = true;
    const loadReport = async () => {
      setLoading(true);
      try {
        const data = await announcementService.fetchComplianceReport(announcement);
        if (isMounted) setReport(data);
      } catch (err) {
        console.error('Failed to load compliance report:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    void loadReport();
    return () => {
      isMounted = false;
    };
  }, [announcement]);

  const receipts = report?.receipts || [];
  const filteredReceipts = receipts.filter(r => {
    const name = r.employees?.nama?.toLowerCase() || '';
    const nik = r.employees?.nik?.toLowerCase() || '';
    const unit = r.employees?.departemen?.toLowerCase() || '';
    const q = search.toLowerCase();
    return name.includes(q) || nik.includes(q) || unit.includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-xs p-4 sm:p-6 flex min-h-full items-center justify-center">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 my-auto flex flex-col max-h-[calc(100vh-3.5rem)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex-shrink-0 p-5 sm:p-6 pb-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-850/80 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <span>📊 Tanda Terima & Kepatuhan Baca Staf</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {announcement.title}
            </p>
          </div>
          <button onClick={onClose} aria-label="Tutup modal" className="flex-shrink-0 p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-800 rounded-lg">✕</button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6 space-y-4">
          {/* Compliance Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[11px] font-semibold text-slate-500">Target Audiens</span>
              <div className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">{report?.total_target_employees || 0} Staf</div>
            </div>
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200 dark:border-blue-900/40">
              <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-300">Telah Dibuka</span>
              <div className="text-lg font-bold text-blue-800 dark:text-blue-200 mt-0.5">{report?.total_read || 0} ({report?.read_percentage || 0}%)</div>
            </div>
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-900/40">
              <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Telah Konfirmasi</span>
              <div className="text-lg font-bold text-emerald-800 dark:text-emerald-200 mt-0.5">{report?.total_acknowledged || 0} ({report?.acknowledged_percentage || 0}%)</div>
            </div>
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 rounded-xl border border-amber-200 dark:border-amber-900/40">
              <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">Status Wajib</span>
              <div className="text-xs font-bold text-amber-800 dark:text-amber-200 mt-1">
                {announcement.requires_acknowledgment ? '✍️ Wajib Konfirmasi' : 'Info Bebas'}
              </div>
            </div>
          </div>

          {/* Search Filter */}
          <div>
            <input
              type="text"
              placeholder="Cari nama karyawan, NIK, atau unit..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg outline-none font-medium"
            />
          </div>

          {/* Table of receipts */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700 text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 font-semibold text-left">
                <tr>
                  <th className="px-4 py-2.5">Karyawan</th>
                  <th className="px-4 py-2.5">Departemen</th>
                  <th className="px-4 py-2.5">Waktu Baca</th>
                  <th className="px-4 py-2.5 text-right">Konfirmasi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                {loading ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400">Memuat data tanda terima...</td></tr>
                ) : filteredReceipts.length === 0 ? (
                  <tr><td colSpan={4} className="text-center py-8 text-slate-400">Belum ada catatan konfirmasi baca.</td></tr>
                ) : (
                  filteredReceipts.map(r => (
                    <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                      <td className="px-4 py-2.5 font-bold text-slate-900 dark:text-slate-100">
                        <div>{r.employees?.nama || r.employee_id}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NIK: {r.employees?.nik || '-'}</div>
                      </td>
                      <td className="px-4 py-2.5 text-slate-600 dark:text-slate-300">{r.employees?.departemen || '-'}</td>
                      <td className="px-4 py-2.5 text-slate-500 font-mono">
                        {new Date(r.read_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        {r.acknowledged_at ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                            ✓ Dikonfirmasi
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-medium">
                            Hanya Dibaca
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex justify-end">
          <button type="button" onClick={onClose} className="px-5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
