import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchGlobalNotifications,
  GlobalNotificationItem,
} from '../../services/globalNotificationService.ts';

interface GlobalNotificationCenterProps {
  userRole?: string | null;
  currentEmployeeId?: string | null;
  managedUnitId?: string | null;
  onNavigate: (viewName: string, tabName?: string) => void;
}

export const GlobalNotificationCenter: React.FC<GlobalNotificationCenterProps> = ({
  userRole,
  currentEmployeeId,
  managedUnitId,
  onNavigate,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notifications, setNotifications] = useState<GlobalNotificationItem[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'notes' | 'all'>('pending');
  const panelRef = useRef<HTMLDivElement>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchGlobalNotifications({
        userRole,
        employeeId: currentEmployeeId,
        unitId: managedUnitId,
      });
      setNotifications(data);
    } catch (err) {
      console.warn('Failed to load global notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [userRole, currentEmployeeId, managedUnitId]);

  useEffect(() => {
    loadData();
    // Poll every 30 seconds for background updates
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Close panel on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const unreadCount = notifications.length;

  const filteredNotifications = notifications.filter((item) => {
    if (activeTab === 'pending') {
      return item.type === 'shift_swap' || item.type === 'leave_request';
    }
    if (activeTab === 'notes') {
      return item.type === 'note';
    }
    return true;
  });

  const handleItemClick = (item: GlobalNotificationItem) => {
    setIsOpen(false);
    // Trigger navigation to target view and tab
    onNavigate(item.targetView, item.targetTab);
  };

  const getIconForType = (type: GlobalNotificationItem['type']) => {
    switch (type) {
      case 'shift_swap':
        return (
          <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
          </svg>
        );
      case 'leave_request':
        return (
          <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        );
      case 'note':
        return (
          <svg className="h-5 w-5 text-emerald-600 dark:text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-.64-.025-1.277-.06-1.912-.105a30.5 30.5 0 0 1-5.838-.98m12.25-7.654A29.352 29.352 0 0 0 12 7.5c-3.14 0-6.158.497-8.988 1.411S1.5 10.428 1.5 11.5c0 1.072.84 2.086 2.512 3.089M20.25 8.511V6.75A2.25 2.25 0 0 0 18 4.5H6A2.25 2.25 0 0 0 3.75 6.75v1.761" />
          </svg>
        );
      default:
        return (
          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
          </svg>
        );
    }
  };

  return (
    <div ref={panelRef} className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {/* Popover Panel */}
      {isOpen && (
        <div className="mb-3 w-80 sm:w-96 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl overflow-hidden transition-all duration-200 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex justify-between items-center">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
              </svg>
              <span className="font-bold text-sm tracking-wide">Pusat Notifikasi</span>
              {unreadCount > 0 && (
                <span className="bg-red-500 text-white text-xs font-black px-2 py-0.5 rounded-full shadow-sm">
                  {unreadCount}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={loadData}
                disabled={loading}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Muat ulang"
              >
                <svg className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-lg transition-colors text-white/80 hover:text-white"
                title="Tutup"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Sub-Tabs */}
          <div className="flex border-b border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-950/50 p-1 text-xs font-medium text-gray-600 dark:text-slate-400">
            <button
              onClick={() => setActiveTab('pending')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'pending'
                  ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 font-bold shadow-sm'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Menunggu Aksi
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'notes'
                  ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 font-bold shadow-sm'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Catatan
            </button>
            <button
              onClick={() => setActiveTab('all')}
              className={`flex-1 py-1.5 rounded-lg text-center transition-all ${
                activeTab === 'all'
                  ? 'bg-white dark:bg-slate-800 text-gray-900 dark:text-white font-bold shadow-sm'
                  : 'hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              Semua ({notifications.length})
            </button>
          </div>

          {/* Notification List Body */}
          <div className="max-h-80 overflow-y-auto divide-y divide-gray-100 dark:divide-slate-800">
            {loading && notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-xs flex flex-col items-center gap-2">
                <svg className="h-6 w-6 animate-spin text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                Memuat notifikasi...
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400 dark:text-slate-500 text-xs">
                <svg className="h-8 w-8 text-green-500/50 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
                Tidak ada notifikasi {activeTab === 'pending' ? 'menunggu aksi' : 'baru'} saat ini.
              </div>
            ) : (
              filteredNotifications.map((item) => (
                <div
                  key={item.id}
                  onClick={() => handleItemClick(item)}
                  className="p-3.5 hover:bg-blue-50/50 dark:hover:bg-slate-800/50 cursor-pointer transition-colors group flex items-start gap-3 relative"
                >
                  <div className="p-2 rounded-xl bg-gray-100 dark:bg-slate-800 group-hover:scale-105 transition-transform flex-shrink-0">
                    {getIconForType(item.type)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                        {item.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 dark:text-slate-500 flex-shrink-0">
                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-xs text-gray-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                      {item.content}
                    </p>

                    <div className="mt-2 flex items-center text-[10px] font-semibold text-blue-600 dark:text-blue-400 group-hover:translate-x-1 transition-transform">
                      <span>Buka Halaman Relevan</span>
                      <svg className="h-3.5 w-3.5 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12.75 15 15.75 12m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 bg-gray-50 dark:bg-slate-950 border-t border-gray-100 dark:border-slate-800 text-center">
            <span className="text-[10px] text-gray-400 dark:text-slate-500">
              Klik item untuk berpindah langsung ke menu relevan
            </span>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative p-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-full shadow-2xl hover:shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center justify-center border-2 border-white dark:border-slate-800"
        title="Pusat Notifikasi"
      >
        <svg className="h-6 w-6 text-white group-hover:rotate-12 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
        </svg>

        {unreadCount > 0 && (
          <>
            {/* Pulsing Outer Ring */}
            <span className="absolute -top-1 -right-1 flex h-5 w-5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] font-black items-center justify-center shadow-md">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            </span>
          </>
        )}
      </button>
    </div>
  );
};
