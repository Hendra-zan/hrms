import React from 'react';
import { EmployeeNote } from '../../../types.ts';
import { NoteReply } from '../../../services/employeeNotesService.ts';

interface TwoWayNotesSectionProps {
  userId: string;
  canSendNotes: boolean;
  twoWaySearch: string;
  setTwoWaySearch: (val: string) => void;
  twoWayDirectionFilter: string;
  setTwoWayDirectionFilter: (val: string) => void;
  twoWayCategoryFilter: string;
  setTwoWayCategoryFilter: (val: string) => void;
  twoWayStatusFilter: string;
  setTwoWayStatusFilter: (val: string) => void;
  loadingTwoWay: boolean;
  filteredTwoWayNotes: EmployeeNote[];
  selectedNote: EmployeeNote | null;
  setSelectedNote: (note: EmployeeNote | null) => void;
  noteReplies: NoteReply[];
  replyText: string;
  setReplyText: (val: string) => void;
  isSubmittingReply: boolean;
  isDeletingNote: string | null;
  onSelectNote: (note: EmployeeNote) => void;
  onConfirmAndReply: (noteId: string) => void;
  onChangeStatus: (noteId: string, newStatus: 'rejected' | 'escalated') => void;
  onDeleteNote: (noteId: string) => void;
}

export const TwoWayNotesSection: React.FC<TwoWayNotesSectionProps> = ({
  userId,
  canSendNotes,
  twoWaySearch,
  setTwoWaySearch,
  twoWayDirectionFilter,
  setTwoWayDirectionFilter,
  twoWayCategoryFilter,
  setTwoWayCategoryFilter,
  twoWayStatusFilter,
  setTwoWayStatusFilter,
  loadingTwoWay,
  filteredTwoWayNotes,
  selectedNote,
  setSelectedNote,
  noteReplies,
  replyText,
  setReplyText,
  isSubmittingReply,
  isDeletingNote,
  onSelectNote,
  onConfirmAndReply,
  onChangeStatus,
  onDeleteNote,
}) => {
  return (
    <div className="space-y-6">
      {/* SEARCH & FILTERS BAR */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari kata kunci catatan atau nama atasan..."
            value={twoWaySearch}
            onChange={e => setTwoWaySearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#06736a]"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={twoWayDirectionFilter}
            onChange={e => setTwoWayDirectionFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">Semua Alur Catatan</option>
            <option value="top_down">📥 Dari Atasan (Top-Down)</option>
            <option value="bottom_up">📤 Laporan Ke Atasan (Bottom-Up)</option>
          </select>

          <select
            value={twoWayCategoryFilter}
            onChange={e => setTwoWayCategoryFilter(e.target.value)}
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
            value={twoWayStatusFilter}
            onChange={e => setTwoWayStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="unread">Belum Dibaca</option>
            <option value="read">Dibaca Atasan/Staf</option>
            <option value="confirmed">✓ Selesai & Dikonfirmasi</option>
          </select>
        </div>
      </div>

      {/* TWO WAY NOTES CONTENT GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LIST COLUMN (1/3) */}
        <div className="lg:col-span-1 space-y-3 max-h-[600px] overflow-y-auto pr-1">
          {loadingTwoWay ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <div className="w-7 h-7 border-2 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-slate-400">Memuat catatan 2-arah...</p>
            </div>
          ) : filteredTwoWayNotes.length === 0 ? (
            <div className="p-8 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
              <p className="text-3xl mb-2">📭</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Tidak ada catatan 2-arah</p>
              <p className="text-xs text-slate-400 mt-1">Belum ada catatan atau instruksi yang cocok dari Atasan.</p>
            </div>
          ) : (
            filteredTwoWayNotes.map(note => {
              const isSelected = selectedNote?.id === note.id;
              const isUnread = note.status === 'unread';

              return (
                <div
                  key={note.id}
                  onClick={() => onSelectNote(note)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer relative overflow-hidden ${
                    isSelected
                      ? 'bg-teal-50/90 dark:bg-teal-950/40 border-[#06736a] shadow-md ring-2 ring-[#06736a]/20'
                      : isUnread
                      ? 'bg-white dark:bg-slate-800 border-teal-400 dark:border-teal-600 shadow-sm'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                  }`}
                >
                  {isUnread && (
                    <div className="absolute top-0 left-0 bottom-0 w-1.5 bg-rose-500" />
                  )}

                  <div className="flex items-center justify-between gap-2 mb-1.5 pl-1 flex-wrap">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                        note.direction === 'bottom_up' ? 'bg-[#06736a]/15 text-[#06736a]' : 'bg-teal-100 text-teal-800'
                      }`}>
                        {note.direction === 'bottom_up' ? '📤 Laporan Saya' : '📥 Dari Atasan'}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase ${
                        note.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                        note.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {note.priority === 'urgent' ? '🚨 Mendesak' : note.priority === 'high' ? '⚡ Penting' : 'Normal'}
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400 font-medium">
                      {note.createdAt ? new Date(note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : ''}
                    </span>
                  </div>

                  <h3 className={`text-xs font-bold leading-snug pl-1 ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'}`}>
                    {note.title}
                  </h3>

                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 pl-1">
                    {note.content}
                  </p>

                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-100 dark:border-slate-700/60 pl-1">
                    <span className="text-[10px] font-semibold text-[#06736a] truncate max-w-[120px]">
                      {note.direction === 'bottom_up' ? `Ke: ${note.employeeNama || 'Atasan'}` : `Dari: ${note.senderNama}`}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        note.status === 'confirmed' ? 'bg-emerald-100 text-emerald-700' :
                        note.status === 'read' ? 'bg-blue-100 text-blue-700' :
                        note.status === 'in_progress' ? 'bg-amber-100 text-amber-700' :
                        note.status === 'rejected' ? 'bg-red-100 text-red-700' :
                        note.status === 'escalated' ? 'bg-purple-100 text-purple-700' :
                        'bg-rose-100 text-rose-700'
                      }`}>
                        {note.status === 'confirmed' ? '✓ Selesai' :
                         note.status === 'read' ? '👁 Dibaca' :
                         note.status === 'in_progress' ? '⏳ Proses' :
                         note.status === 'rejected' ? '✕ Ditolak' :
                         note.status === 'escalated' ? '🔺 Dieskalasi' : '● Baru'}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onDeleteNote(note.id); }}
                        disabled={isDeletingNote === note.id}
                        className="p-1 text-slate-300 hover:text-rose-500 transition-colors"
                        title="Hapus catatan"
                      >
                        {isDeletingNote === note.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* DETAIL & REPLY COLUMN (2/3) */}
        <div className="lg:col-span-2">
          {selectedNote ? (
            <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm space-y-6">
              {/* Note Header */}
              <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="bg-teal-100 text-teal-800 dark:bg-teal-900/60 dark:text-teal-300 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase">
                      {selectedNote.category === 'task' ? '📋 Instruksi Tugas' :
                       selectedNote.category === 'performance' ? '⭐ Evaluasi Kinerja' :
                       selectedNote.category === 'shift_reminder' ? '⏰ Pengingat Shift' :
                       selectedNote.category === 'shift_handover' ? '🔄 Operan Shift' :
                       selectedNote.category === 'facility_issue' ? '🛠️ Kendala Alat & Fasilitas' :
                       selectedNote.category === 'incident_report' ? '⚠️ Laporan Kejadian Shift' :
                       selectedNote.category === 'schedule_coordination' ? '🔄 Koordinasi Shift' :
                       selectedNote.category === 'feedback' ? '💡 Saran Operasional' : '💬 Catatan Umum'}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full uppercase ${
                      selectedNote.priority === 'urgent' ? 'bg-rose-100 text-rose-700' :
                      selectedNote.priority === 'high' ? 'bg-amber-100 text-amber-700' :
                      'bg-slate-100 text-slate-600'
                    }`}>
                      Prioritas: {selectedNote.priority}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                    {selectedNote.title}
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Dikirim oleh <strong>{selectedNote.senderNama}</strong> ({selectedNote.senderRole}) •{' '}
                    {selectedNote.createdAt ? new Date(selectedNote.createdAt).toLocaleString('id-ID') : '-'}
                  </p>
                </div>

                <button
                  onClick={() => setSelectedNote(null)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
                  title="Tutup detail"
                >
                  ✕
                </button>
              </div>

              {/* Note Content Body */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-100 dark:border-slate-700 text-xs sm:text-sm text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                {selectedNote.content}
              </div>

              {/* Photo Attachment Display */}
              {selectedNote.attachmentUrl && (
                <div className="p-4 rounded-2xl bg-teal-50/50 dark:bg-teal-950/20 border border-teal-200/60 dark:border-teal-800 space-y-2">
                  <span className="block text-xs font-bold text-[#06736a] dark:text-teal-300">
                    📷 Lampiran Foto Bukti Fisik:
                  </span>
                  <img
                    src={selectedNote.attachmentUrl}
                    alt="Lampiran Bukti Laporan"
                    className="max-h-64 rounded-xl border border-teal-200 object-cover shadow-sm"
                  />
                </div>
              )}

              {/* Multi-Thread Conversation Timeline */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                  <span>💬 Riwayat Percakapan & Tanggapan ({noteReplies.length + (selectedNote.replyContent ? 1 : 0)})</span>
                  <span className="text-[10px] text-slate-400 font-normal">Urutan Kronologis</span>
                </h4>

                {/* Single legacy reply fallback */}
                {selectedNote.replyContent && noteReplies.length === 0 && (
                  <div className="p-3.5 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/80 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-emerald-800 dark:text-emerald-300">
                      <span>Balasan Awal:</span>
                      <span className="text-[10px] text-emerald-600 font-normal">
                        {selectedNote.confirmedAt ? new Date(selectedNote.confirmedAt).toLocaleString('id-ID') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-emerald-900 dark:text-emerald-200">
                      {selectedNote.replyContent}
                    </p>
                  </div>
                )}

                {/* Thread Replies List */}
                {noteReplies.map((rep, idx) => {
                  const isMe = rep.senderId === userId;
                  return (
                    <div
                      key={rep.id || idx}
                      className={`p-3.5 rounded-2xl border text-xs space-y-1 ${
                        isMe
                          ? 'bg-teal-50/90 dark:bg-teal-950/40 border-teal-200/80 dark:border-teal-800 ml-4'
                          : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 mr-4'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className={isMe ? 'text-[#06736a] dark:text-teal-300' : 'text-slate-700 dark:text-slate-300'}>
                          {isMe ? 'Saya' : rep.senderNama} ({rep.senderRole || 'Atasan'})
                        </span>
                        <span className="text-[10px] text-slate-400 font-normal">
                          {new Date(rep.createdAt).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <p className="text-xs text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                        {rep.message}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* 2-Way Response Form */}
              <div className="pt-4 border-t border-slate-100 dark:border-slate-700 space-y-3">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  💬 Tulis Balasan & Konfirmasi Penerimaan
                </label>

                <textarea
                  rows={3}
                  value={replyText}
                  onChange={e => setReplyText(e.target.value)}
                  placeholder="Ketik tanggapan Anda untuk atasan (contoh: Baik, instruksi siap dilaksanakan...)..."
                  className="w-full p-3 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#06736a]"
                />

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {canSendNotes && selectedNote.direction === 'bottom_up' &&
                     selectedNote.status !== 'rejected' && selectedNote.status !== 'escalated' && (
                      <>
                        <button
                          onClick={() => onChangeStatus(selectedNote.id, 'rejected')}
                          className="inline-flex items-center gap-1.5 border border-red-300 text-red-600 hover:bg-red-50 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                        >
                          ✕ Tolak
                        </button>
                        <button
                          onClick={() => onChangeStatus(selectedNote.id, 'escalated')}
                          className="inline-flex items-center gap-1.5 border border-purple-300 text-purple-600 hover:bg-purple-50 font-bold text-xs px-3 py-2 rounded-xl transition-all"
                        >
                          🔺 Eskalasi
                        </button>
                      </>
                    )}
                    {(selectedNote.status === 'rejected' || selectedNote.status === 'escalated') && (
                      <span className={`text-xs font-bold px-3 py-1.5 rounded-xl ${
                        selectedNote.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {selectedNote.status === 'rejected' ? '✕ Laporan Ditolak' : '🔺 Diteruskan/Dieskalasi'}
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-slate-400">
                    *Konfirmasi akan memperbarui status menjadi <strong>Dikonfirmasi</strong>.
                  </span>
                  <button
                    onClick={() => onConfirmAndReply(selectedNote.id)}
                    disabled={isSubmittingReply || selectedNote.status === 'rejected'}
                    className="inline-flex items-center gap-2 bg-[#06736a] hover:bg-teal-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingReply ? (
                      <><div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />Menyimpan...</>
                    ) : (
                      <>✓ Konfirmasi &amp; Kirim Balasan</>
                    )}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 p-12 text-center text-slate-400">
              <p className="text-4xl mb-3">👈</p>
              <p className="text-sm font-bold text-slate-600 dark:text-slate-300">Pilih Catatan Dari Daftar</p>
              <p className="text-xs mt-1">Klik salah satu catatan di sebelah kiri untuk melihat isi lengkap dan memberikan tanggapan balik.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
