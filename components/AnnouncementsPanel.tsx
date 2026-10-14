import React, { useState, useEffect, useMemo } from 'react';
import type { AuthenticatedUser, WorkUnit } from '../types.ts';
import { Announcement, AnnouncementUpsertPayload } from '../types/announcement.ts';
import { announcementService } from '../services/announcementService.ts';
import { filterAnnouncementsForEmployee } from '../utils/announcementAudience.ts';
import { supabase } from '../services/supabaseClient.ts';
import {
  AnnouncementCard,
  AnnouncementFormModal,
  AnnouncementReaderModal,
  AnnouncementComplianceModal,
} from './announcements/index.ts';

interface AnnouncementsPanelProps {
  authUser: AuthenticatedUser;
  defaultTab?: string;
  titleOverride?: string;
}

const AnnouncementsPanel: React.FC<AnnouncementsPanelProps> = ({
  authUser,
  defaultTab = 'semua',
  titleOverride,
}) => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [workUnits, setWorkUnits] = useState<WorkUnit[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Announcement | null>(null);
  const [readingItem, setReadingItem] = useState<Announcement | null>(null);
  const [complianceItem, setComplianceItem] = useState<Announcement | null>(null);

  // Filter state
  const [activeTab, setActiveTab] = useState<'semua' | 'kebijakan' | 'pengumuman'>(
    defaultTab === 'kebijakan' || defaultTab === 'pengumuman' ? defaultTab : 'semua'
  );
  const [searchQuery, setSearchQuery] = useState('');

  const currentEmployeeId = authUser.profile?.id || null;
  const userRole = (authUser.profile?.role || '').toLowerCase();
  const isManager = userRole.includes('admin') || userRole.includes('hr') || userRole === 'superadmin';

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [items, unitsData, deptsData] = await Promise.all([
        announcementService.fetchAnnouncements(currentEmployeeId || undefined),
        supabase.from('units').select('*'),
        supabase.from('employees').select('departemen'),
      ]);

      setAnnouncements(items);
      setWorkUnits((unitsData.data as any) || []);

      const uniqueDepts = Array.from(
        new Set((deptsData.data || []).map((e: any) => e.departemen).filter(Boolean))
      ) as string[];
      setDepartments(uniqueDepts);
    } catch (err: any) {
      console.error('[AnnouncementsPanel] Error loading:', err);
      setError(err.message || 'Gagal memuat kebijakan & pengumuman');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [currentEmployeeId]);

  const handleSave = async (payload: AnnouncementUpsertPayload, editingId?: string) => {
    if (editingId) {
      const updated = await announcementService.updateAnnouncement(editingId, payload);
      setAnnouncements(prev => prev.map(a => (a.id === editingId ? updated : a)));
    } else {
      const created = await announcementService.createAnnouncement(payload);
      setAnnouncements(prev => [created, ...prev]);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus kebijakan/pengumuman ini?')) return;
    try {
      await announcementService.deleteAnnouncement(id);
      setAnnouncements(prev => prev.filter(a => a.id !== id));
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleRead = (item: Announcement) => {
    setReadingItem(item);
    if (currentEmployeeId) {
      void announcementService.markAsRead(item.id, currentEmployeeId);
      setAnnouncements(prev =>
        prev.map(a => (a.id === item.id ? { ...a, is_read: true } : a))
      );
    }
  };

  const handleAcknowledge = async (announcementId: string) => {
    if (!currentEmployeeId) return;
    await announcementService.acknowledgePolicy(announcementId, currentEmployeeId);
    const now = new Date().toISOString();
    setAnnouncements(prev =>
      prev.map(a => (a.id === announcementId ? { ...a, acknowledged_at: now, is_read: true } : a))
    );
    if (readingItem && readingItem.id === announcementId) {
      setReadingItem({ ...readingItem, acknowledged_at: now, is_read: true });
    }
  };

  const visibleList = useMemo(() => {
    const matched = filterAnnouncementsForEmployee(announcements, authUser.profile, userRole);
    return matched.filter(item => {
      const matchTab = activeTab === 'semua' || item.type === activeTab;
      const q = searchQuery.toLowerCase();
      const matchSearch =
        !searchQuery ||
        item.title.toLowerCase().includes(q) ||
        item.content.toLowerCase().includes(q);
      return matchTab && matchSearch;
    });
  }, [announcements, activeTab, searchQuery, authUser.profile, userRole]);

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 w-full flex flex-col min-h-[600px] overflow-hidden">
      {/* Header Toolbar */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-850/50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>{titleOverride || '📢 Kebijakan & Pengumuman Karyawan'}</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pusat siaran informasi, regulasi resmi rumah sakit, serta tanda terima baca kepatuhan staf.
          </p>
        </div>
        {isManager && (
          <button
            onClick={() => {
              setEditingItem(null);
              setIsFormOpen(true);
            }}
            className="self-start md:self-auto inline-flex items-center gap-1.5 rounded-xl bg-[#06736a] px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-[#055f57] transition-all"
          >
            <span className="text-sm">+</span>
            <span>Siarkan Pengumuman / Kebijakan Baru</span>
          </button>
        )}
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900">
        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-xl p-1 self-start">
          <button
            onClick={() => setActiveTab('semua')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'semua' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Semua ({announcements.length})
          </button>
          <button
            onClick={() => setActiveTab('pengumuman')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'pengumuman' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📢 Pengumuman ({announcements.filter(a => a.type === 'pengumuman').length})
          </button>
          <button
            onClick={() => setActiveTab('kebijakan')}
            className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
              activeTab === 'kebijakan' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-xs' : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            📜 Kebijakan RS ({announcements.filter(a => a.type === 'kebijakan').length})
          </button>
        </div>

        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="Cari pengumuman atau kebijakan..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full px-3.5 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none font-medium"
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="flex-1 p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-8 h-8 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-3" />
            <span className="text-xs text-slate-400 font-medium">Memuat data pengumuman & kebijakan...</span>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-50 text-rose-700 rounded-xl text-xs font-medium text-center">{error}</div>
        ) : visibleList.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 dark:bg-slate-850/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 mt-2">Tidak Ada Kebijakan / Pengumuman</p>
            <p className="text-xs text-slate-400 mt-1">Belum ada siaran yang sesuai dengan filter atau kata kunci Anda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {visibleList.map(item => (
              <AnnouncementCard
                key={item.id}
                item={item}
                isManager={isManager}
                onRead={handleRead}
                onEdit={isManager ? itm => { setEditingItem(itm); setIsFormOpen(true); } : undefined}
                onDelete={isManager ? handleDelete : undefined}
                onViewCompliance={isManager ? itm => setComplianceItem(itm) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <AnnouncementFormModal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSave={handleSave}
        editingItem={editingItem}
        workUnits={workUnits}
        departments={departments}
        currentEmployeeId={currentEmployeeId}
      />

      <AnnouncementReaderModal
        isOpen={Boolean(readingItem)}
        onClose={() => setReadingItem(null)}
        item={readingItem}
        currentEmployeeId={currentEmployeeId}
        onAcknowledge={handleAcknowledge}
      />

      <AnnouncementComplianceModal
        isOpen={Boolean(complianceItem)}
        onClose={() => setComplianceItem(null)}
        announcement={complianceItem}
      />
    </div>
  );
};

export default AnnouncementsPanel;
