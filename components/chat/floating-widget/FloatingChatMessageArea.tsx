import React from 'react';
import { FontSize } from './types.ts';
import { getMessageFontClass, getTimestampFontClass } from './types.ts';

interface FloatingChatMessageAreaProps {
  messages: any[];
  loading: boolean;
  authUser: any;
  fontSize: FontSize;
  chatSearchQuery: string;
  isSearchingChat: boolean;
  setChatSearchQuery: (q: string) => void;
  inputText: string;
  setInputText: (t: string) => void;
  handleSend: (e: React.FormEvent) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  isUploading: boolean;
  fileInputRef: React.MutableRefObject<HTMLInputElement | null>;
  chatEndRef: React.MutableRefObject<HTMLDivElement | null>;
}

export const FloatingChatMessageArea: React.FC<FloatingChatMessageAreaProps> = ({
  messages,
  loading,
  authUser,
  fontSize,
  chatSearchQuery,
  isSearchingChat,
  setChatSearchQuery,
  inputText,
  setInputText,
  handleSend,
  handleFileUpload,
  isUploading,
  fileInputRef,
  chatEndRef,
}) => {
  const msgFontClass = getMessageFontClass(fontSize);
  const tsFontClass = getTimestampFontClass(fontSize);

  const displayedMessages = messages.filter(m => {
    if (!chatSearchQuery.trim()) return true;
    const txt = (m.message || m.message_text || '').toLowerCase();
    return txt.includes(chatSearchQuery.toLowerCase());
  });

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
      {isSearchingChat && (
        <div className="p-2 bg-teal-50 dark:bg-slate-800 border-b border-teal-100 dark:border-slate-700 flex items-center gap-2">
          <input
            type="text"
            placeholder="Cari dalam pesan..."
            value={chatSearchQuery}
            onChange={e => setChatSearchQuery(e.target.value)}
            className="flex-1 px-2.5 py-1 text-xs bg-white dark:bg-slate-700 border border-teal-200 dark:border-slate-600 rounded-lg outline-none dark:text-slate-100"
            autoFocus
          />
          {chatSearchQuery && (
            <button onClick={() => setChatSearchQuery('')} className="text-xs text-slate-400 hover:text-slate-600">✕</button>
          )}
        </div>
      )}

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-5 h-5 border-2 border-[#06736a] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : displayedMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-4">
            <div className="w-10 h-10 bg-teal-50 dark:bg-teal-950/40 rounded-full flex items-center justify-center text-lg mb-2">👋</div>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-200">Mulai Percakapan</p>
            <p className="text-[10px] text-slate-400 mt-0.5 max-w-[200px]">Kirim pesan atau bagikan file dengan rekan kerja Anda.</p>
          </div>
        ) : (
          displayedMessages.map(msg => {
            const isMe = msg.sender_id === authUser?.id;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 shadow-xs ${
                    isMe
                      ? 'bg-[#06736a] text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  {msg.file_url && (
                    <div className="mb-1.5">
                      {msg.file_type?.startsWith('image/') ? (
                        <a href={msg.file_url} target="_blank" rel="noopener noreferrer">
                          <img src={msg.file_url} alt="Attachment" className="rounded-xl max-h-40 object-cover w-full border border-black/10" />
                        </a>
                      ) : (
                        <a
                          href={msg.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 p-2 rounded-xl text-xs font-semibold underline ${
                            isMe ? 'bg-white/10 text-white' : 'bg-slate-100 dark:bg-slate-700 text-[#06736a] dark:text-teal-300'
                          }`}
                        >
                          <span>📎</span>
                          <span className="truncate max-w-[150px]">{msg.file_name || 'Lampiran File'}</span>
                        </a>
                      )}
                    </div>
                  )}

                  {(msg.message || msg.message_text) && (
                    <p className={`${msgFontClass} leading-relaxed break-words whitespace-pre-wrap`}>
                      {msg.message || msg.message_text}
                    </p>
                  )}

                  <div className={`flex items-center justify-end gap-1 mt-1 ${tsFontClass} ${isMe ? 'text-teal-100/80' : 'text-slate-400'}`}>
                    <span>{timeStr}</span>
                    {isMe && <span>{msg.is_read ? '✓✓' : '✓'}</span>}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Input bar */}
      <form onSubmit={handleSend} className="p-2.5 bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="p-1.5 text-slate-400 hover:text-[#06736a] hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors flex-shrink-0"
          title="Kirim File / Gambar"
        >
          {isUploading ? (
            <div className="w-4 h-4 border-2 border-[#06736a] border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          )}
        </button>

        <input
          type="text"
          placeholder="Tulis pesan..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          className="flex-1 px-3 py-1.5 text-xs bg-slate-100 dark:bg-slate-700/60 border border-transparent focus:border-[#06736a] rounded-xl outline-none dark:text-slate-100"
        />

        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-1.5 bg-[#06736a] disabled:bg-slate-300 dark:disabled:bg-slate-700 text-white rounded-xl shadow-xs hover:bg-[#055b54] transition-all flex-shrink-0"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
        </button>
      </form>
    </div>
  );
};
