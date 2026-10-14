import React from 'react';
import ChangePassword from './ChangePassword.tsx';
import { EmployeeNotesModal } from './employee-notes/EmployeeNotesModal.tsx';
import {
    DashboardProps,
    useDashboardState,
    DashboardHeroHeader,
    DashboardMetricCards,
    EmployeeProfileOverview,
    MyNotesBannerWidget,
    AnnouncementFeedWidget,
    QuickActionsWidget,
    AnnouncementReaderModal,
} from './dashboard/index.ts';

const Dashboard: React.FC<DashboardProps> = ({ currentUser, attendanceRecords, onNavigate }) => {
    const {
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        announcements,
        announcementsLoading,
        selectedAnnouncement,
        setSelectedAnnouncement,
        isNotesModalOpen,
        setIsNotesModalOpen,
        unreadNotesCount,
        todayAttendance,
        refreshUnreadNotes,
    } = useDashboardState(currentUser, attendanceRecords);

    if (!currentUser) {
        return (
            <div className="space-y-6 animate-pulse p-4">
                <div className="h-36 bg-slate-200 rounded-3xl w-full"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-24 bg-slate-200 rounded-2xl w-full"></div>
                    ))}
                </div>
                <div className="h-64 bg-slate-200 rounded-2xl w-full"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* ══ HERO HEADER: WELCOME + LIVE CLOCK & PRESENSI STATUS ══ */}
            <DashboardHeroHeader
                currentUser={currentUser}
                onNavigate={onNavigate}
            />

            {/* ══ METRICS CARDS ══ */}
            <DashboardMetricCards
                currentUser={currentUser}
                todayAttendance={todayAttendance}
            />

            {/* ══ MAIN 2-COLUMN LAYOUT: KONTEN KIRI vs PANEL KANAN ══ */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* 👈 KOLOM KIRI (2/3 Layar): Profil & Feed Pengumuman RS */}
                <div className="lg:col-span-2 space-y-6">
                    <EmployeeProfileOverview
                        currentUser={currentUser}
                        onNavigate={onNavigate}
                    />

                    <MyNotesBannerWidget
                        unreadNotesCount={unreadNotesCount}
                        onClick={() => onNavigate ? onNavigate('notes') : setIsNotesModalOpen(true)}
                    />

                    <AnnouncementFeedWidget
                        announcements={announcements}
                        announcementsLoading={announcementsLoading}
                        onSelectAnnouncement={setSelectedAnnouncement}
                        onNavigate={onNavigate}
                    />
                </div>

                {/* 👉 KOLOM KANAN (1/3 Layar): Papan Aksi Cepat */}
                <QuickActionsWidget
                    onNavigate={onNavigate}
                    onOpenChangePassword={() => setIsChangePasswordOpen(true)}
                />
            </div>

            {/* Announcement Reader Modal */}
            <AnnouncementReaderModal
                announcement={selectedAnnouncement}
                onClose={() => setSelectedAnnouncement(null)}
            />

            {/* Change Password Modal */}
            <ChangePassword
                isOpen={isChangePasswordOpen}
                onClose={() => setIsChangePasswordOpen(false)}
            />

            {/* 2-Way Employee Notes Modal */}
            <EmployeeNotesModal
                isOpen={isNotesModalOpen}
                onClose={() => {
                    setIsNotesModalOpen(false);
                    refreshUnreadNotes();
                }}
                employeeId={currentUser?.id || ''}
            />
        </div>
    );
};

export default Dashboard;