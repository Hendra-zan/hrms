import { useState, useEffect, useCallback } from 'react';
import { Employee, AttendanceRecord } from '../../../types.ts';
import { supabase } from '../../../services/supabaseClient.ts';
import { employeeNotesService } from '../../../services/employeeNotesService.ts';
import { AnnouncementItem, TodayAttendance } from '../types.ts';

export const useDashboardState = (
    currentUser?: Employee,
    attendanceRecords?: AttendanceRecord[]
) => {
    const [isChangePasswordOpen, setIsChangePasswordOpen] = useState(false);
    const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
    const [announcementsLoading, setAnnouncementsLoading] = useState(true);
    const [selectedAnnouncement, setSelectedAnnouncement] = useState<AnnouncementItem | null>(null);
    const [isNotesModalOpen, setIsNotesModalOpen] = useState(false);
    const [unreadNotesCount, setUnreadNotesCount] = useState(0);
    const [todayAttendance, setTodayAttendance] = useState<TodayAttendance | null>(null);

    // Fetch announcements & today attendance for currentUser
    useEffect(() => {
        let isMounted = true;

        const fetchData = async () => {
            try {
                // 1. Fetch top 3 latest announcements
                const { data: annData } = await supabase
                    .from('announcements')
                    .select('id, title, content, type, created_at, employees:author_id(nama)')
                    .order('created_at', { ascending: false })
                    .limit(3);

                if (annData && isMounted) {
                    setAnnouncements(annData as any);
                }

                // 2. Resolve today's attendance status for current employee
                if (currentUser?.id) {
                    const todayStr = new Date().toISOString().split('T')[0];

                    // First check in-memory attendanceRecords prop
                    const memRecord = attendanceRecords?.find(r =>
                        (r.employeeId === currentUser.id || (r as any).employee_id === currentUser.id) &&
                        (r.tanggal === todayStr || (r as any).date === todayStr)
                    );

                    if (memRecord) {
                        setTodayAttendance({
                            time_in: memRecord.clockIn || (memRecord as any).time_in || (memRecord as any).check_in,
                            time_out: memRecord.clockOut || (memRecord as any).time_out || (memRecord as any).check_out,
                            status: memRecord.status,
                        });
                    } else {
                        // Fallback DB query using safe wildcard select to prevent schema 400 errors
                        const { data: attData } = await supabase
                            .from('attendance')
                            .select('*')
                            .limit(5);

                        if (attData && isMounted) {
                            const matched: any = attData.find((item: any) =>
                                (item.employeeId === currentUser.id || item.employee_id === currentUser.id) &&
                                (item.tanggal === todayStr || item.date === todayStr)
                            );
                            if (matched) {
                                setTodayAttendance({
                                    time_in: matched.clockIn || matched.check_in || matched.time_in,
                                    time_out: matched.clockOut || matched.check_out || matched.time_out,
                                    status: matched.status,
                                });
                            }
                        }
                    }
                }
            } catch {
                /* ignore error */
            } finally {
                if (isMounted) setAnnouncementsLoading(false);
            }
        };

        void fetchData();
        return () => { isMounted = false; };
    }, [currentUser?.id, attendanceRecords]);

    const refreshUnreadNotes = useCallback(() => {
        if (!currentUser?.id) return;
        employeeNotesService.fetchNotesForEmployee(currentUser.id).then(notes => {
            setUnreadNotesCount(notes.filter(n => n.status === 'unread').length);
        }).catch(() => {});
    }, [currentUser?.id]);

    // Load unread notes count on mount
    useEffect(() => {
        refreshUnreadNotes();
    }, [refreshUnreadNotes]);

    return {
        isChangePasswordOpen,
        setIsChangePasswordOpen,
        announcements,
        announcementsLoading,
        selectedAnnouncement,
        setSelectedAnnouncement,
        isNotesModalOpen,
        setIsNotesModalOpen,
        unreadNotesCount,
        setUnreadNotesCount,
        todayAttendance,
        refreshUnreadNotes,
    };
};
