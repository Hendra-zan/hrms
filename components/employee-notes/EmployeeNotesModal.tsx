import React, { useState, useEffect } from 'react';
import { EmployeeNote, NoteStatus } from '../../types.ts';
import { employeeNotesService } from '../../services/employeeNotesService.ts';

interface EmployeeNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeId: string;
  onNotesUpdated?: () => void;
}

export const EmployeeNotesModal: React.FC<EmployeeNotesModalProps> = ({
  isOpen,
  onClose,
  employeeId,
  onNotesUpdated,
}) => {
  const [notes, setNotes] = useState<EmployeeNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNote, setSelectedNote] = useState<EmployeeNote | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadNotes = async () => {
    if (!employeeId) return;
    setLoading(true);
    const data = await employeeNotesService.fetchNotesForEmployee(employeeId);
    setNotes(data);
    if (data.length > 0 && !selectedNote) {
      setSelectedNote(data[0]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isOpen && employeeId) {
      loadNotes();
    }
  }, [isOpen, employeeId]);

  useEffect(() => {
    if (selectedNote) {
      setReplyText(selectedNote.replyContent || '');
      // Mark as read if unread
      if (selectedNote.status === 'unread') {
        employeeNotesService.replyAndConfirmNote(selectedNote.id, undefined, 'read').then(() => {
          setNotes((prev) =>
            prev.map((n) => (n.id === selectedNote.id ? { ...n, status: 'read' } : n))
          );
          if (onNotesUpdated) onNotesUpdated();
        });
      }
    }
  }, [selectedNote]);

  if (!isOpen) return null;

  const handleConfirmAndReply = async (newStatus: NoteStatus) => {
    if (!selectedNote) return;
    setSubmitting(true);
    const success = await employeeNotesService.replyAndConfirmNote(
      selectedNote.id,
      replyText,
      newStatus
    );
    if (success) {
      setNotes((prev) =>
        prev.map((n) =>
          n.id === selectedNote.id
            ? { ...n, replyContent: replyText, status: newStatus, confirmedAt: new Date().toISOString() }
            : n
        )
      );
      setSelectedNote((prev) =>
        prev
          ? { ...prev, replyContent: replyText, status: newStatus, confirmedAt: new Date().toISOString() }
          : null
      );
      if (onNotesUpdated) onNotesUpdated();
    }
    setSubmitting(false);
  };

  const getCategoryBadge = (cat: string) => {
    switch (cat) {
      case 'task':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">📌 Tugas Khusus</span>;
      case 'coaching':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">💬 Pembinaan</span>;
      case 'reminder':
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300">📄 Pengingat</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300">📝 Catatan</span>;
    }
  };

  const getPriorityBadge = (prio: string) => {
    if (prio === 'urgent') return <span className="text-xs font-extrabold text-red-600 dark:text-red-400 animate-pulse">🔥 URGENT</span>;
    if (prio === 'important') return <span className="text-xs font-bold text-orange-600 dark:text-orange-400">⚡ PENTING</span>;
    return null;
  };

  const getStatusBadge = (status: NoteStatus) => {
    switch (status) {
      case 'completed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">✅ Selesai Dikerjakan</span>;
      case 'confirmed':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800 dark:bg-teal-950/60 dark:text-teal-300">👍 Dikonfirmasi</span>;
      case 'read':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">👀 Dibaca</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500 text-white animate-pulse">🔴 Baru</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fadeIn p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-6 bg-gradient-to-r from-[#06736a] to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-xl backdrop-blur-md">
              📋
            </div>
            <div>
              <h2 className="text-lg font-bold">Catatan & Instruksi Saya</h2>
              <p className="text-xs text-teal-100/90">Pesan privat & tugas langsung dari Kepala Ruangan / HRD</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl hover:bg-white/10 text-white transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left: Notes List */}
          <div className="w-full md:w-1/3 border-r border-slate-200 dark:border-slate-700 overflow-y-auto max-h-60 md:max-h-none divide-y divide-slate-100 dark:divide-slate-700">
            {loading ? (
              <div className="p-6 text-center text-xs text-slate-400">Memuat catatan...</div>
            ) : notes.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                Belum ada catatan dari Atasan.
              </div>
            ) : (
              notes.map((n) => (
                <div
                  key={n.id}
                  onClick={() => setSelectedNote(n)}
                  className={`p-3.5 cursor-pointer transition-colors ${
                    selectedNote?.id === n.id
                      ? 'bg-teal-50/80 dark:bg-teal-950/40 border-l-4 border-[#06736a]'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-700/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    {getCategoryBadge(n.category)}
                    {getStatusBadge(n.status)}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-white truncate">
                    {n.title}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {n.content}
                  </p>
                  <div className="flex items-center justify-between mt-2 text-[10px] text-slate-400">
                    <span>{n.senderNama}</span>
                    <span>{new Date(n.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}</span>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Right: Selected Note Detail & 2-Way Reply */}
          <div className="w-full md:w-2/3 p-4 sm:p-6 overflow-y-auto flex flex-col justify-between">
            {selectedNote ? (
              <div className="space-y-4">
                {/* Meta Header */}
                <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-700 pb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getCategoryBadge(selectedNote.category)}
                      {getPriorityBadge(selectedNote.priority)}
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-white">
                      {selectedNote.title}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      Dari: <strong>{selectedNote.senderNama}</strong> ({selectedNote.senderRole}) •{' '}
                      {new Date(selectedNote.createdAt).toLocaleString('id-ID')}
                    </p>
                  </div>
                  <div>{getStatusBadge(selectedNote.status)}</div>
                </div>

                {/* Instruction Content */}
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-700">
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 whitespace-pre-line leading-relaxed">
                    {selectedNote.content}
                  </p>
                </div>

                {/* Reply & Confirmation Area */}
                <div className="pt-2 space-y-3">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    ✍️ Tanggapan / Balasan Anda (Opsional):
                  </label>
                  <textarea
                    rows={3}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Tuliskan laporan singkat, kendala, atau tanggapan Anda di sini..."
                    className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs sm:text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-[#06736a] outline-none transition-all"
                  />

                  {selectedNote.confirmedAt && (
                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
                      ✓ Telah dikonfirmasi pada {new Date(selectedNote.confirmedAt).toLocaleString('id-ID')}
                    </p>
                  )}

                  {/* Action Buttons */}
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    {selectedNote.category === 'task' ? (
                      <button
                        onClick={() => handleConfirmAndReply('completed')}
                        disabled={submitting}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>✅</span> Tandai Selesai Dikerjakan
                      </button>
                    ) : (
                      <button
                        onClick={() => handleConfirmAndReply('confirmed')}
                        disabled={submitting}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-[#06736a] hover:bg-teal-700 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-2"
                      >
                        <span>👍</span> Konfirmasi & Simpan Tanggapan
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-400 text-xs">
                Pilih catatan di sebelah kiri untuk membaca rincian.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
