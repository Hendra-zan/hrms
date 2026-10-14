import React from 'react';
import { PersonalNote } from '../types.ts';

interface PersonalNotesSectionProps {
  personalSearch: string;
  setPersonalSearch: (val: string) => void;
  personalCategoryFilter: string;
  setPersonalCategoryFilter: (val: string) => void;
  personalDateFilter: string;
  setPersonalDateFilter: (val: string) => void;
  filteredPersonalNotes: PersonalNote[];
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingPersonalNote: PersonalNote | null;
  formTitle: string;
  setFormTitle: (val: string) => void;
  formContent: string;
  setFormContent: (val: string) => void;
  formCategory: 'kerja' | 'pribadi' | 'tugas' | 'pengingat';
  setFormCategory: (val: 'kerja' | 'pribadi' | 'tugas' | 'pengingat') => void;
  formColor: 'teal' | 'blue' | 'purple' | 'amber' | 'rose';
  setFormColor: (val: 'teal' | 'blue' | 'purple' | 'amber' | 'rose') => void;
  formIsPinned: boolean;
  setFormIsPinned: (val: boolean) => void;
  formDueDate: string;
  setFormDueDate: (val: string) => void;
  onOpenCreateForm: () => void;
  onOpenEditForm: (note: PersonalNote) => void;
  onSavePersonalNote: (e: React.FormEvent) => void;
  onDeletePersonalNote: (id: string) => void;
  onTogglePinPersonalNote: (id: string) => void;
  onToggleCompletePersonalNote: (id: string) => void;
}

const colorMap = {
  teal: 'bg-teal-50 text-teal-800 border-teal-200 dark:bg-teal-950/40 dark:text-teal-300 dark:border-teal-800',
  blue: 'bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
  purple: 'bg-purple-50 text-purple-800 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800',
  amber: 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800',
  rose: 'bg-rose-50 text-rose-800 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800',
};

const badgeColorMap = {
  teal: 'bg-teal-600 text-white',
  blue: 'bg-blue-600 text-white',
  purple: 'bg-purple-600 text-white',
  amber: 'bg-amber-600 text-white',
  rose: 'bg-rose-600 text-white',
};

export const PersonalNotesSection: React.FC<PersonalNotesSectionProps> = ({
  personalSearch,
  setPersonalSearch,
  personalCategoryFilter,
  setPersonalCategoryFilter,
  personalDateFilter,
  setPersonalDateFilter,
  filteredPersonalNotes,
  isFormOpen,
  setIsFormOpen,
  editingPersonalNote,
  formTitle,
  setFormTitle,
  formContent,
  setFormContent,
  formCategory,
  setFormCategory,
  formColor,
  setFormColor,
  formIsPinned,
  setFormIsPinned,
  formDueDate,
  setFormDueDate,
  onOpenCreateForm,
  onOpenEditForm,
  onSavePersonalNote,
  onDeletePersonalNote,
  onTogglePinPersonalNote,
  onToggleCompletePersonalNote,
}) => {
  return (
    <div className="space-y-6">
      {/* BAR ACTION & FILTER */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-stretch md:items-center">
        <div className="relative flex-1">
          <svg className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Cari judul atau isi catatan pribadi..."
            value={personalSearch}
            onChange={e => setPersonalSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#06736a]"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={personalCategoryFilter}
            onChange={e => setPersonalCategoryFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            <option value="kerja">💼 Kerja / Dinas</option>
            <option value="tugas">📌 Tugas / To-Do</option>
            <option value="pengingat">⏰ Pengingat</option>
            <option value="pribadi">🔒 Catatan Pribadi</option>
          </select>

          <select
            value={personalDateFilter}
            onChange={e => setPersonalDateFilter(e.target.value)}
            className="px-3 py-2 text-xs font-semibold border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-900 dark:text-white focus:outline-none"
          >
            <option value="all">Semua Waktu</option>
            <option value="today">📅 Deadline Hari Ini</option>
            <option value="overdue">🔴 Sudah Lewat Deadline</option>
            <option value="week">📆 7 Hari Terakhir</option>
            <option value="month">🗓️ Bulan Ini</option>
          </select>

          <button
            onClick={onOpenCreateForm}
            className="inline-flex items-center gap-1.5 bg-[#06736a] hover:bg-teal-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md transition-all active:scale-95 whitespace-nowrap"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Buat Catatan Baru
          </button>
        </div>
      </div>

      {/* PERSONAL NOTES CARDS GRID */}
      {filteredPersonalNotes.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700">
          <p className="text-4xl mb-3">📝</p>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">Belum Ada Catatan Pribadi</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Simpan catatan kerja harian, daftar tugas, atau catatan pribadi Anda secara aman di sini.
          </p>
          <button
            onClick={onOpenCreateForm}
            className="mt-4 inline-flex items-center gap-1.5 bg-[#06736a] text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md"
          >
            + Buat Catatan Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredPersonalNotes.map(note => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = note.dueDate && !note.isCompleted && new Date(note.dueDate) < today;
            return (
              <div
                key={note.id}
                className={`p-5 rounded-3xl border shadow-sm transition-all duration-200 flex flex-col justify-between group hover:shadow-md relative ${
                  note.isCompleted
                    ? 'opacity-60 bg-slate-50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-700'
                    : isOverdue
                    ? 'ring-2 ring-rose-400 ' + (colorMap[note.colorTag] || colorMap.teal)
                    : colorMap[note.colorTag] || colorMap.teal
                }`}
              >
                <div>
                  {/* Header bar */}
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${note.isCompleted ? 'bg-slate-400 text-white' : badgeColorMap[note.colorTag]}`}>
                        {note.category === 'kerja' ? '💼 Kerja' :
                         note.category === 'tugas' ? '📌 Tugas' :
                         note.category === 'pengingat' ? '⏰ Pengingat' : '🔒 Pribadi'}
                      </span>
                      {note.isCompleted && <span className="text-[10px] font-bold text-emerald-600">✓ Selesai</span>}
                      {isOverdue && <span className="text-[10px] font-bold text-rose-600 animate-pulse">⚠️ Lewat</span>}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => onToggleCompletePersonalNote(note.id)}
                        className={`p-1 rounded-lg transition-colors text-sm ${
                          note.isCompleted ? 'text-emerald-500' : 'text-slate-300 hover:text-emerald-500'
                        }`}
                        title={note.isCompleted ? 'Tandai Belum Selesai' : 'Tandai Selesai'}
                      >
                        ✓
                      </button>
                      <button
                        onClick={() => onTogglePinPersonalNote(note.id)}
                        className={`p-1 rounded-lg transition-colors ${note.isPinned ? 'text-amber-500' : 'text-slate-400 hover:text-slate-600'}`}
                        title={note.isPinned ? 'Lepas Sematan' : 'Sematkan Ke Atas'}
                      >
                        📌
                      </button>
                      <button
                        onClick={() => onOpenEditForm(note)}
                        className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        title="Edit Catatan"
                      >
                        ✏️
                      </button>
                      <button
                        onClick={() => onDeletePersonalNote(note.id)}
                        className="p-1 text-slate-400 hover:text-rose-600"
                        title="Hapus Catatan"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>

                  <h3 className={`font-bold text-sm leading-snug mb-2 ${note.isCompleted ? 'line-through text-slate-400' : 'text-slate-900 dark:text-white'}`}>
                    {note.title}
                  </h3>

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed">
                    {note.content}
                  </p>
                </div>

                {/* Footer Metadata */}
                <div className="mt-4 pt-3 border-t border-slate-200/60 dark:border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                  <span>
                    {note.dueDate ? (
                      <span className={`font-semibold ${isOverdue ? 'text-rose-600' : 'text-[#06736a] dark:text-teal-400'}`}>
                        ⏰ Deadline: {new Date(note.dueDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                      </span>
                    ) : (
                      `Dibuat ${new Date(note.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`
                    )}
                  </span>
                  <span>{new Date(note.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL FORM PERSONAL NOTE */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-700 space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-3 dark:border-slate-700">
              <h3 className="font-bold text-base text-slate-800 dark:text-white">
                {editingPersonalNote ? '✏️ Edit Catatan Pribadi' : '📝 Buat Catatan Pribadi Baru'}
              </h3>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={onSavePersonalNote} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Catatan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Operan pasien shift malam, To-do SOP baru..."
                  value={formTitle}
                  onChange={e => setFormTitle(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-[#06736a] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Isi Catatan / Detail Tugas <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  placeholder="Tuliskan isi catatan atau poin-poin checklist Anda di sini..."
                  value={formContent}
                  onChange={e => setFormContent(e.target.value)}
                  className="w-full p-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white focus:ring-2 focus:ring-[#06736a] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Kategori
                  </label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as any)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                  >
                    <option value="kerja">💼 Kerja / Dinas</option>
                    <option value="tugas">📌 Tugas / To-Do</option>
                    <option value="pengingat">⏰ Pengingat</option>
                    <option value="pribadi">🔒 Catatan Pribadi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Deadline (Opsional)
                  </label>
                  <input
                    type="date"
                    value={formDueDate}
                    onChange={e => setFormDueDate(e.target.value)}
                    className="w-full p-2 text-xs border border-slate-200 dark:border-slate-700 rounded-xl dark:bg-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Warna Kartu
                </label>
                <div className="flex items-center gap-2">
                  {(['teal', 'blue', 'purple', 'amber', 'rose'] as const).map(color => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormColor(color)}
                      className={`w-7 h-7 rounded-full transition-all ${badgeColorMap[color]} ${
                        formColor === color ? 'ring-4 ring-slate-300 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="pinNote"
                  checked={formIsPinned}
                  onChange={e => setFormIsPinned(e.target.checked)}
                  className="rounded text-[#06736a] focus:ring-[#06736a] w-4 h-4"
                />
                <label htmlFor="pinNote" className="text-xs font-bold text-slate-700 dark:text-slate-300 cursor-pointer">
                  📌 Sematkan catatan ini di paling atas (Pin)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#06736a] text-white rounded-xl text-xs font-bold shadow-md hover:bg-teal-700 transition-all"
                >
                  {editingPersonalNote ? 'Simpan Perubahan' : '✓ Buat Catatan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
