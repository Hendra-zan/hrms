import React from 'react';
import { Employee } from '../../../types.ts';

interface FloatingChatContactListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  loadingContacts: boolean;
  filteredEmployees: Employee[];
  unreadCounts: Record<string, number>;
  setSelectedPartner: (emp: Employee) => void;
  getOnlineStatus: (emp: Employee) => { isClockedIn: boolean | undefined; lastSeenText: string; isRecentlyActive: boolean };
}

export const FloatingChatContactList: React.FC<FloatingChatContactListProps> = ({
  searchTerm,
  setSearchTerm,
  loadingContacts,
  filteredEmployees,
  unreadCounts,
  setSelectedPartner,
  getOnlineStatus,
}) => {
  return (
    <div className="flex-1 flex flex-col min-h-0 bg-slate-50 dark:bg-slate-900">
      <div className="p-2.5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/60">
        <div className="relative">
          <input
            type="text"
            placeholder="🔍 Cari rekan kerja..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full px-3 py-1.5 pl-8 text-xs bg-slate-100 dark:bg-slate-700/60 border border-transparent focus:border-[#06736a] rounded-xl outline-none transition-all dark:text-slate-100"
          />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/50">
        {loadingContacts ? (
          <div className="flex flex-col items-center justify-center p-8">
            <div className="w-6 h-6 border-2 border-[#06736a] border-t-transparent rounded-full animate-spin"></div>
            <p className="text-[10px] text-slate-400 mt-2">Memuat kontak staf...</p>
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-xs text-slate-400">Tidak ada rekan kerja ditemukan</p>
          </div>
        ) : (
          filteredEmployees.map(emp => {
            const unread = emp.user_id ? unreadCounts[emp.user_id] || 0 : 0;
            const status = getOnlineStatus(emp);

            return (
              <button
                key={emp.id}
                onClick={() => setSelectedPartner(emp)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-slate-100 dark:hover:bg-slate-800/80 transition-colors text-left"
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <div className="relative flex-shrink-0">
                    <img
                      src={emp.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
                      alt={emp.nama}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                    <span className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-slate-800 ${status.isRecentlyActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'}`} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <h5 className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">{emp.nama}</h5>
                      {unread > 0 && (
                        <span className="px-1.5 py-0.5 bg-[#06736a] text-white text-[9px] font-black rounded-full min-w-[16px] text-center">
                          {unread}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between gap-1 mt-0.5">
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 truncate">
                        {emp.jabatan || emp.departemen || 'Staf'}
                      </p>
                      <span className="text-[9px] text-slate-400 dark:text-slate-500 whitespace-nowrap flex-shrink-0">
                        {status.lastSeenText}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
};
