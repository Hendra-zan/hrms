import React from 'react';
import { Employee } from '../../../types.ts';

interface FloatingChatHeaderProps {
  selectedPartner: Employee | null;
  setSelectedPartner: (emp: Employee | null) => void;
  setIsOpen: (open: boolean) => void;
  showSettings: boolean;
  setShowSettings: React.Dispatch<React.SetStateAction<boolean>>;
  isSearchingChat: boolean;
  setIsSearchingChat: React.Dispatch<React.SetStateAction<boolean>>;
  setChatSearchQuery: (q: string) => void;
  isDeletingConversation: boolean;
  handleDeleteConversation: () => void;
  getOnlineStatus: (emp: Employee) => { isClockedIn: boolean | undefined; lastSeenText: string; isRecentlyActive: boolean };
}

export const FloatingChatHeader: React.FC<FloatingChatHeaderProps> = ({
  selectedPartner,
  setSelectedPartner,
  setIsOpen,
  showSettings,
  setShowSettings,
  isSearchingChat,
  setIsSearchingChat,
  setChatSearchQuery,
  isDeletingConversation,
  handleDeleteConversation,
  getOnlineStatus,
}) => {
  return (
    <div className="bg-[#06736a] text-white px-4 py-3 flex items-center justify-between shadow-md">
      {selectedPartner ? (
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <button
            onClick={() => { setSelectedPartner(null); setIsSearchingChat(false); setChatSearchQuery(''); }}
            className="p-1 -ml-1 hover:bg-[#055b54] rounded-full transition-colors"
            title="Kembali ke Kontak"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="relative flex-shrink-0">
            <img
              src={selectedPartner.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
              alt={selectedPartner.nama}
              className="w-8 h-8 rounded-full object-cover border border-white/20"
            />
            <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#06736a] ${getOnlineStatus(selectedPartner).isRecentlyActive ? 'bg-emerald-400' : 'bg-slate-400'}`} />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold truncate leading-tight">{selectedPartner.nama}</h4>
            <p className="text-[10px] text-teal-100/80 truncate">
              {getOnlineStatus(selectedPartner).lastSeenText || selectedPartner.jabatan || 'Rekan Kerja'}
            </p>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <div>
            <h4 className="text-xs font-bold leading-tight">Pesan Internal</h4>
            <p className="text-[10px] text-teal-100/80">RS Syuhada Haji</p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-1">
        {selectedPartner && (
          <>
            <button
              onClick={() => { setIsSearchingChat(prev => !prev); setChatSearchQuery(''); }}
              className={`p-1.5 rounded-lg transition-colors ${isSearchingChat ? 'bg-[#055b54] text-white' : 'hover:bg-[#055b54] text-teal-100'}`}
              title="Cari dalam pesan"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
            <button
              onClick={handleDeleteConversation}
              disabled={isDeletingConversation}
              className="p-1.5 hover:bg-rose-600/60 rounded-lg transition-colors text-teal-100 hover:text-white"
              title="Hapus riwayat percakapan"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </>
        )}

        <button
          onClick={() => setShowSettings(prev => !prev)}
          className={`p-1.5 rounded-lg transition-colors ${showSettings ? 'bg-[#055b54] text-white' : 'hover:bg-[#055b54] text-teal-100'}`}
          title="Pengaturan Tampilan Chat"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        <button
          onClick={() => setIsOpen(false)}
          className="p-1.5 hover:bg-[#055b54] rounded-lg transition-colors text-teal-100 hover:text-white"
          title="Tutup Widget"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    </div>
  );
};
