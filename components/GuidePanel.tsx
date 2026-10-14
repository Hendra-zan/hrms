import React, { useState, useEffect } from 'react';
import GuideOverview from './guides/GuideOverview';
import GuideEmployee from './guides/GuideEmployee';
import GuideAttendance from './guides/GuideAttendance';
import GuidePayroll from './guides/GuidePayroll';
import GuideFaceRecognition from './guides/GuideFaceRecognition';
import GuideHikvision from './guides/GuideHikvision';
import GuideShift from './guides/GuideShift';
import GuideKepala from './guides/GuideKepala';
import GuideNik from './guides/GuideNik';
import GuideNotesAndLogbook from './guides/GuideNotesAndLogbook';
import GuideAnnouncementsPolicies from './guides/GuideAnnouncementsPolicies';
import GuideFAQ from './guides/GuideFAQ';

type Tab = 'overview' | 'notes' | 'announcements' | 'employee' | 'attendance' | 'shift' | 'kepala' | 'payroll' | 'face' | 'hikvision' | 'nik' | 'faq';

interface TabConfig {
    key: Tab;
    label: string;
    icon: string;
    title: string;
    desc: string;
    keywords: string[];
}

const TABS: TabConfig[] = [
    { key: 'overview', label: 'Ringkasan Sistem', icon: '🏠', title: 'Ringkasan Sistem HRMS Pro', desc: 'Gambaran umum modul, fitur, & hak akses pengguna', keywords: ['ringkasan', 'overview', 'sistem', 'modul', 'fitur', 'akses', 'role'] },
    { key: 'faq', label: 'FAQ (Tanya Jawab)', icon: '❓', title: 'FAQ — Pertanyaan Sering Diajukan', desc: 'Solusi cepat untuk masalah & pertanyaan umum', keywords: ['faq', 'tanya', 'jawab', 'masalah', 'error', 'bantuan', 'solusi'] },
    { key: 'employee', label: 'Manajemen Karyawan', icon: '👥', title: 'Manajemen Data Karyawan', desc: 'Pendaftaran, import Excel, verifikasi, & master data', keywords: ['karyawan', 'pegawai', 'staf', 'import', 'excel', 'nik', 'verifikasi', 'tambah'] },
    { key: 'attendance', label: 'Absensi & Kehadiran', icon: '⏰', title: 'Manajemen Absensi & Kehadiran', desc: 'Mobile ESS, Geotagging GPS, status hadir, & rekap', keywords: ['absensi', 'absen', 'kehadiran', 'gps', 'geotagging', 'geofencing', 'terlambat', 'dinas'] },
    { key: 'shift', label: 'Jadwal & Shift Rotasi', icon: '📅', title: 'Manajemen Jadwal & Shift Unit', desc: 'Pola rotasi, live preview, stagger, & keadilan shift', keywords: ['jadwal', 'shift', 'pola', 'rotasi', 'stagger', 'generate', 'publish', 'draft', 'keadilan', 'equitability'] },
    { key: 'kepala', label: 'Dashboard Kepala Ruangan', icon: '👨‍💼', title: 'Dashboard & Wewenang Kepala Ruangan', desc: 'Monitoring unit, verifikasi logbook, & approval', keywords: ['kepala', 'ruangan', 'karu', 'dashboard', 'unit', 'wewenang', 'approval', 'verifikasi'] },
    { key: 'notes', label: 'Logbook & Catatan', icon: '📋', title: 'Logbook & Catatan Kerja Harian', desc: 'Uraian tugas shift, verifikasi Karu, & instruksi', keywords: ['logbook', 'catatan', 'kerja', 'shift', 'tugas', 'uraian', 'instruksi'] },
    { key: 'announcements', label: 'Pengumuman & SOP', icon: '📢', title: 'Pengumuman & Kebijakan RS (SOP)', desc: 'Surat edaran, kebijakan, SOP, & dokumen PDF', keywords: ['pengumuman', 'sop', 'kebijakan', 'edaran', 'direksi', 'dokumen', 'pdf'] },
    { key: 'payroll', label: 'Penggajian & Slip Gaji', icon: '💰', title: 'Penggajian & Slip Gaji Karyawan', desc: 'Kalkulasi gaji, BPJS, PPh21, & cetak slip PDF', keywords: ['gaji', 'penggajian', 'payroll', 'slip', 'bpjs', 'pph21', 'lembur', 'potongan'] },
    { key: 'face', label: 'Face Recognition AI', icon: '👤', title: 'Absensi Biometrik Wajah AI', desc: 'AI liveness detection, enrollment, & anti-spoofing', keywords: ['face', 'recognition', 'wajah', 'biometrik', 'ai', 'liveness', 'enrollment', 'kamera'] },
    { key: 'hikvision', label: 'Mesin Absensi Hikvision', icon: '📡', title: 'Integrasi Mesin Absensi Hikvision', desc: 'ISAPI protocol, IP terminal, & sync Employee No', keywords: ['hikvision', 'mesin', 'hardware', 'isapi', 'ip', 'terminal', 'sync'] },
    { key: 'nik', label: 'Standardisasi NIK', icon: '🔢', title: 'Konfigurasi & Setup NIK Karyawan', desc: 'Format NIK tunggal & integrasi lintas modul', keywords: ['nik', 'nomor', 'induk', 'karyawan', 'format', 'standar'] },
];

const GuidePanel: React.FC = () => {
    const [activeTab, setActiveTab] = useState<Tab>('overview');
    const [searchQuery, setSearchQuery] = useState('');
    const [bookmarks, setBookmarks] = useState<string[]>(() => {
        try {
            const saved = localStorage.getItem('hrms_guide_bookmarks');
            return saved ? JSON.parse(saved) : [];
        } catch {
            return [];
        }
    });

    const toggleBookmark = (key: string) => {
        setBookmarks(prev => {
            const next = prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key];
            try { localStorage.setItem('hrms_guide_bookmarks', JSON.stringify(next)); } catch {}
            return next;
        });
    };

    // Handle search filter across all tabs
    const filteredTabs = TABS.filter(tab => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            tab.label.toLowerCase().includes(q) ||
            tab.title.toLowerCase().includes(q) ||
            tab.desc.toLowerCase().includes(q) ||
            tab.keywords.some(k => k.toLowerCase().includes(q))
        );
    });

    const currentTabConfig = TABS.find(t => t.key === activeTab) || TABS[0];

    const handlePrint = () => {
        window.print();
    };

    const renderContent = () => {
        switch (activeTab) {
            case 'overview': return <GuideOverview onNavigate={(tabKey) => setActiveTab(tabKey as Tab)} />;
            case 'faq': return <GuideFAQ />;
            case 'employee': return <GuideEmployee />;
            case 'attendance': return <GuideAttendance />;
            case 'shift': return <GuideShift onNavigate={(tabKey) => setActiveTab(tabKey as Tab)} />;
            case 'kepala': return <GuideKepala />;
            case 'notes': return <GuideNotesAndLogbook />;
            case 'announcements': return <GuideAnnouncementsPolicies />;
            case 'payroll': return <GuidePayroll />;
            case 'face': return <GuideFaceRecognition />;
            case 'hikvision': return <GuideHikvision />;
            case 'nik': return <GuideNik />;
            default: return <GuideOverview />;
        }
    };

    return (
        <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="px-6 py-5 border-b border-gray-200 bg-gradient-to-r from-[#06736a] to-teal-700 text-white flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white text-2xl shadow-inner border border-white/30">
                        📚
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            Pusat Panduan HRMS Pro
                        </h2>
                        <p className="text-xs text-teal-100">
                            Petunjuk operasional lengkap untuk Admin, HRD, Kepala Ruangan, dan Karyawan RS
                        </p>
                    </div>
                </div>

                {/* Print Button */}
                <button
                    type="button"
                    onClick={handlePrint}
                    className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-semibold text-white transition-all shadow-sm"
                    title="Cetak Halaman Panduan Ini"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Cetak Panduan
                </button>
            </div>

            {/* Main Body */}
            <div className="flex flex-col lg:flex-row min-h-[650px]">

                {/* Sidebar Navigation */}
                <div className="w-full lg:w-64 border-r border-gray-200 bg-gray-50/70 p-3 flex flex-col flex-shrink-0">

                    {/* Search Bar */}
                    <div className="relative mb-3">
                        <input
                            type="text"
                            placeholder="🔍 Cari panduan / fitur..."
                            value={searchQuery}
                            onChange={e => setSearchQuery(e.target.value)}
                            className="w-full pl-3 pr-8 py-2 text-xs border border-gray-300 rounded-xl bg-white focus:ring-2 focus:ring-[#06736a] outline-none shadow-sm transition-all"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => setSearchQuery('')}
                                className="absolute right-2.5 top-2 text-gray-400 hover:text-gray-600 text-xs font-bold"
                            >
                                ✕
                            </button>
                        )}
                    </div>

                    {/* Tab Navigation List */}
                    <div className="space-y-1 overflow-y-auto max-h-[600px] pr-1">
                        {filteredTabs.length === 0 ? (
                            <div className="p-4 text-center text-xs text-gray-400">
                                Tidak ada panduan sesuai kata kunci "{searchQuery}"
                            </div>
                        ) : (
                            filteredTabs.map(tab => {
                                const isActive = activeTab === tab.key;
                                const isBookmarked = bookmarks.includes(tab.key);
                                return (
                                    <div key={tab.key} className="group relative flex items-center">
                                        <button
                                            type="button"
                                            onClick={() => setActiveTab(tab.key)}
                                            className={`w-full text-left flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                                                isActive
                                                    ? 'bg-[#06736a] text-white shadow-md'
                                                    : 'text-gray-700 hover:bg-white hover:shadow-sm'
                                            }`}
                                        >
                                            <span className="text-base flex-shrink-0">{tab.icon}</span>
                                            <span className="leading-tight flex-1 truncate">{tab.label}</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleBookmark(tab.key)}
                                            className={`absolute right-2 p-1 text-xs transition-opacity ${
                                                isBookmarked
                                                    ? 'text-amber-400 opacity-100'
                                                    : 'text-gray-300 opacity-0 group-hover:opacity-100 hover:text-amber-400'
                                            }`}
                                            title={isBookmarked ? 'Hapus Favorit' : 'Tandai Favorit'}
                                        >
                                            ★
                                        </button>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Bookmarks Summary */}
                    {bookmarks.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                                <span>★</span> Panduan Favorit Anda ({bookmarks.length})
                            </p>
                            <div className="flex flex-wrap gap-1">
                                {bookmarks.map(bKey => {
                                    const bTab = TABS.find(t => t.key === bKey);
                                    if (!bTab) return null;
                                    return (
                                        <button
                                            key={bKey}
                                            type="button"
                                            onClick={() => setActiveTab(bKey as Tab)}
                                            className="px-2 py-1 bg-amber-50 border border-amber-200 rounded-lg text-[10px] font-semibold text-amber-800 hover:bg-amber-100 flex items-center gap-1"
                                        >
                                            <span>{bTab.icon}</span>
                                            <span>{bTab.label}</span>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Panel */}
                <div className="flex-1 p-6 overflow-y-auto max-h-[750px] bg-white">
                    {/* Header Tab Aktiv */}
                    <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl p-2 bg-teal-50 rounded-xl border border-teal-100">{currentTabConfig.icon}</span>
                            <div>
                                <h3 className="text-lg font-bold text-gray-800 leading-tight">
                                    {currentTabConfig.title}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5">{currentTabConfig.desc}</p>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => toggleBookmark(currentTabConfig.key)}
                            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all ${
                                bookmarks.includes(currentTabConfig.key)
                                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                                    : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <span>{bookmarks.includes(currentTabConfig.key) ? '★' : '☆'}</span>
                            <span>{bookmarks.includes(currentTabConfig.key) ? 'Favorit' : 'Tandai Favorit'}</span>
                        </button>
                    </div>

                    {/* Component Render */}
                    <div className="prose max-w-none">
                        {renderContent()}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GuidePanel;
