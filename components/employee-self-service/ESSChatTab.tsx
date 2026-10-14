import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../hooks/useChat';
import { useAppData, useAuth } from '../../stores/appStore';
import { Employee } from '../../types';

export const ESSChatTab: React.FC = () => {
  const { authUser } = useAuth();
  const { employees, attendanceRecords } = useAppData();
  const [selectedPartner, setSelectedPartner] = useState<Employee | null>(null);
  const [inputText, setInputText] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const { messages, loading, unreadCounts, sendMessage } = useChat(selectedPartner?.user_id);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter out self and search filter
  const filteredEmployees = employees
    .filter(emp => emp.user_id !== authUser?.id && (String(emp.status).toLowerCase() === 'aktif' || emp.status === 'Aktif'))
    .filter(emp => 
      emp.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.departemen || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (emp.jabatan || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Get employee attendance status for today
  const getTodayStatus = (employeeId: string) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const record = attendanceRecords.find(
      r => (r.employeeId === employeeId || (r as any).karyawanId === employeeId) && (r.tanggal === todayStr || (r as any).date === todayStr)
    );

    if (record) {
      const st = String(record.status).toLowerCase();
      if (st === 'hadir') return { label: 'Hadir', color: 'bg-emerald-500', text: 'text-emerald-600' };
      if (st === 'cuti') return { label: 'Cuti', color: 'bg-amber-500', text: 'text-amber-600' };
      if (st === 'izin' || st === 'sakit') return { label: st.toUpperCase(), color: 'bg-orange-500', text: 'text-orange-600' };
      return { label: 'Absen', color: 'bg-slate-400', text: 'text-slate-500' };
    }
    return { label: 'Belum Hadir', color: 'bg-slate-350', text: 'text-slate-400' };
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    const sent = await sendMessage(inputText);
    if (sent) {
      setInputText('');
    }
  };

  return (
    <div className="flex h-[calc(100vh-320px)] min-h-[480px] bg-slate-50/50 rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* ── SIDEBAR: CONTACT LIST ── */}
      <div className="w-80 border-r border-slate-150/70 bg-white flex flex-col flex-shrink-0">
        <div className="p-4 border-b border-slate-100">
          <h3 className="text-sm font-bold text-[#06736a] uppercase tracking-wider mb-3">Rekan Kerja</h3>
          <div className="relative">
            <input
              type="text"
              placeholder="Cari rekan kerja..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full text-xs rounded-xl border-slate-200 bg-slate-50 pl-8 pr-3 py-2.5 focus:border-[#06736a] focus:bg-white focus:ring-[#06736a]/20"
            />
            <svg className="absolute left-3 top-3 h-3.5 w-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto divide-y divide-slate-50">
          {filteredEmployees.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              Tidak ada rekan kerja ditemukan
            </div>
          ) : (
            filteredEmployees.map(emp => {
              const status = getTodayStatus(emp.id);
              const unread = emp.user_id ? unreadCounts[emp.user_id] || 0 : 0;
              const isSelected = selectedPartner?.id === emp.id;

              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedPartner(emp)}
                  className={`w-full p-4 flex items-center gap-3 text-left transition-all relative ${
                    isSelected 
                      ? 'bg-gradient-to-r from-teal-50/70 to-cyan-50/30' 
                      : 'hover:bg-slate-50/80'
                  }`}
                >
                  {/* Avatar wrapper */}
                  <div className="relative flex-shrink-0">
                    {emp.foto && emp.foto.startsWith('http') ? (
                      <img src={emp.foto} alt={emp.nama} className="h-10 w-10 rounded-full object-cover ring-2 ring-slate-100 shadow-sm" />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gradient-to-br from-teal-400 to-[#06736a] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                        {emp.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                      </div>
                    )}
                    {/* Status dot */}
                    <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${status.color}`} title={status.label} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex justify-between items-baseline mb-0.5">
                      <p className={`text-xs font-bold truncate ${isSelected ? 'text-[#06736a]' : 'text-slate-800'}`}>{emp.nama}</p>
                      {unread > 0 && (
                        <span className="bg-red-500 text-white text-[9px] font-black rounded-full px-1.5 py-0.5 animate-bounce">
                          {unread}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-slate-500 truncate">{emp.jabatan || 'Karyawan'} &middot; {emp.departemen}</p>
                    <span className={`text-[9px] font-semibold ${status.text}`}>{status.label}</span>
                  </div>

                  {isSelected && (
                    <div className="absolute right-0 top-0 bottom-0 w-1 bg-[#06736a]" />
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* ── CHAT SCREEN: MESSAGE DISPLAY & INPUT ── */}
      <div className="flex-1 bg-white flex flex-col min-w-0">
        {selectedPartner ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
              <div className="flex items-center gap-3">
                {selectedPartner.foto && selectedPartner.foto.startsWith('http') ? (
                  <img src={selectedPartner.foto} alt={selectedPartner.nama} className="h-9 w-9 rounded-full object-cover shadow-sm" />
                ) : (
                  <div className="h-9 w-9 rounded-full bg-gradient-to-br from-teal-400 to-[#06736a] text-white font-bold text-xs flex items-center justify-center shadow-sm">
                    {selectedPartner.nama.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                  </div>
                )}
                <div>
                  <h4 className="text-xs font-bold text-slate-800 leading-tight">{selectedPartner.nama}</h4>
                  <p className="text-[10px] text-slate-500">{selectedPartner.jabatan} &middot; {selectedPartner.departemen}</p>
                </div>
              </div>
            </div>

            {/* Messages container */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]/50">
              {loading ? (
                <div className="flex items-center justify-center h-full">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#06736a]"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400">
                  <svg className="w-12 h-12 mb-2 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                  <p className="text-xs">Mulai obrolan baru yang aman di sini.</p>
                </div>
              ) : (
                messages.map(msg => {
                  const isMe = msg.sender_id === authUser?.id;
                  return (
                    <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[70%] rounded-2xl px-4 py-2.5 shadow-sm relative ${
                        isMe 
                          ? 'bg-gradient-to-r from-[#06736a] to-[#089c8e] text-white rounded-tr-none' 
                          : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
                      }`}>
                        <p className="text-xs leading-relaxed break-words">{msg.message_text}</p>
                        <div className="flex items-center justify-end gap-1.5 mt-1">
                          <span className={`text-[8px] ${isMe ? 'text-white/80' : 'text-slate-400'} font-medium`}>
                            {new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isMe && (
                            <svg className={`h-3 w-3 ${msg.is_read ? 'text-sky-300' : 'text-white/60'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input bar */}
            <form onSubmit={handleSend} className="p-3 border-t border-slate-100 flex gap-2 items-center bg-white">
              <input
                type="text"
                placeholder="Ketik pesan Anda..."
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                className="flex-1 text-xs rounded-xl border-slate-200 bg-slate-50 px-4 py-2.5 focus:border-[#06736a] focus:bg-white focus:ring-[#06736a]/20"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="flex items-center justify-center h-9 w-9 rounded-xl bg-gradient-to-r from-[#06736a] to-[#089c8e] text-white hover:shadow-md disabled:opacity-50 transition-all flex-shrink-0"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400 p-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-teal-50 to-cyan-50 flex items-center justify-center mb-4 border border-teal-100/30">
              <svg className="w-10 h-10 text-[#06736a]/60 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h4 className="text-sm font-bold text-slate-700 mb-1">Obrolan Internal Real-time</h4>
            <p className="text-xs text-slate-500 text-center max-w-sm">Pilih salah satu rekan kerja di panel sebelah kiri untuk memulai obrolan yang terenkripsi lokal.</p>
          </div>
        )}
      </div>
    </div>
  );
};
