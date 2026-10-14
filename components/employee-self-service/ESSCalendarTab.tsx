import React, { useState, useEffect, useMemo } from 'react';
import { Employee, AttendanceRecord, EmployeeSchedule } from '../../types.ts';
import { getSchedulesByEmployee } from '../../services/scheduleService.ts';

interface ESSCalendarTabProps {
    user: Employee;
    attendanceRecords: AttendanceRecord[];
}

const MONTH_NAMES = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

const ESSCalendarTab: React.FC<ESSCalendarTabProps> = ({ user, attendanceRecords }) => {
    const today = new Date();
    const [currentYear, setCurrentYear] = useState(today.getFullYear());
    const [currentMonth, setCurrentMonth] = useState(today.getMonth()); // 0-indexed
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
    const [monthSchedules, setMonthSchedules] = useState<EmployeeSchedule[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState<boolean>(true);

    // Generate days in month
    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sunday
    // Adjust firstDayOfWeek so 0 = Monday, 6 = Sunday
    const startOffset = (firstDayOfWeek + 6) % 7;

    // Fetch Published Schedules from Database for User
    useEffect(() => {
        let isMounted = true;
        const fetchSchedules = async () => {
            if (!user?.id) return;
            try {
                setLoadingSchedules(true);
                const mStr = String(currentMonth + 1).padStart(2, '0');
                const lastDStr = String(daysInMonth).padStart(2, '0');
                const startDate = `${currentYear}-${mStr}-01`;
                const endDate = `${currentYear}-${mStr}-${lastDStr}`;

                const data = await getSchedulesByEmployee(user.id, startDate, endDate);
                if (isMounted) {
                    setMonthSchedules(data || []);
                }
            } catch (err) {
                console.error('[ESSCalendarTab] Gagal memuat jadwal karyawan:', err);
            } finally {
                if (isMounted) setLoadingSchedules(false);
            }
        };

        fetchSchedules();
        return () => { isMounted = false; };
    }, [user.id, currentYear, currentMonth, daysInMonth]);

    const handlePrevMonth = () => {
        if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
        } else {
            setCurrentMonth(prev => prev - 1);
        }
        setSelectedDay(null);
    };

    const handleNextMonth = () => {
        if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
        } else {
            setCurrentMonth(prev => prev + 1);
        }
        setSelectedDay(null);
    };

    // Helper to format date string YYYY-MM-DD
    const getFormattedDateString = (day: number) => {
        const m = (currentMonth + 1).toString().padStart(2, '0');
        const d = day.toString().padStart(2, '0');
        return `${currentYear}-${m}-${d}`;
    };

    // Determine shift for a specific day based on published DB schedule or attendance
    const getDayShiftInfo = (day: number) => {
        const dateStr = getFormattedDateString(day);
        const record = attendanceRecords.find(r => r.tanggal === dateStr);
        const sched = monthSchedules.find(s => s.schedule_date === dateStr);

        let shiftName = 'Off';
        let shiftStatus: 'published' | 'draft' | 'none' = 'none';
        let startTime = '';
        let endTime = '';

        if (sched) {
            if (sched.status === 'published' || sched.status === 'swapped' || sched.status === 'override') {
                shiftStatus = 'published';
                if (sched.is_off_day || sched.shift_name.toLowerCase() === 'libur') {
                    shiftName = 'Off';
                } else {
                    shiftName = sched.shift_name;
                    startTime = sched.shift_start_time || '';
                    endTime = sched.shift_end_time || '';
                }
            } else if (sched.status === 'draft') {
                shiftStatus = 'draft';
                shiftName = 'Belum Terbit (Draft)';
            }
        } else {
            // Fallback default if no DB schedule created yet
            const baseShift = user.shift || 'Rotating';
            if (baseShift !== 'Rotating') {
                shiftName = baseShift;
            }
        }

        return {
            dateStr,
            record,
            sched,
            shiftName,
            shiftStatus,
            startTime,
            endTime,
            isToday: today.getFullYear() === currentYear && today.getMonth() === currentMonth && today.getDate() === day
        };
    };

    // Calculate month stats from DB schedules
    const monthStats = useMemo(() => {
        let totalShifts = 0;
        let totalHadir = 0;
        let totalLate = 0;
        let totalOvertime = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const info = getDayShiftInfo(d);
            if (info.shiftStatus === 'published' && info.shiftName !== 'Off') {
                totalShifts++;
            }
            if (info.record) {
                if (info.record.clockIn) totalHadir++;
                if (info.record.isLate) totalLate++;
                if (info.record.overtimeHours) totalOvertime += info.record.overtimeHours;
            }
        }

        return { totalShifts, totalHadir, totalLate, totalOvertime };
    }, [daysInMonth, monthSchedules, attendanceRecords, currentYear, currentMonth]);

    const dayHeaders = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'];

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-[#06736a] flex items-center gap-1.5">
                        <span>🏥 Roster Jadwal Dinas Terbit</span>
                        {loadingSchedules && <span className="animate-pulse text-amber-600">(Memuat...)</span>}
                    </span>
                    <h2 className="text-xl font-extrabold text-slate-800">
                        {MONTH_NAMES[currentMonth]} {currentYear}
                    </h2>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={handlePrevMonth}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-1"
                    >
                        ← Bulan Lalu
                    </button>
                    <button
                        onClick={() => {
                            setCurrentMonth(today.getMonth());
                            setCurrentYear(today.getFullYear());
                            setSelectedDay(today.getDate());
                        }}
                        className="px-3.5 py-2 bg-teal-50 hover:bg-teal-100 text-[#06736a] font-bold rounded-xl text-sm transition-colors"
                    >
                        Hari Ini
                    </button>
                    <button
                        onClick={handleNextMonth}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-sm transition-colors flex items-center gap-1"
                    >
                        Bulan Depan →
                    </button>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl">
                    <p className="text-xs font-bold text-amber-700 uppercase tracking-wide">Total Shift Jaga Terbit</p>
                    <p className="text-2xl font-black text-amber-900 mt-1">{monthStats.totalShifts} <span className="text-xs font-normal">Hari</span></p>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200/60 rounded-2xl">
                    <p className="text-xs font-bold text-emerald-700 uppercase tracking-wide">Kehadiran (Hadir)</p>
                    <p className="text-2xl font-black text-emerald-900 mt-1">{monthStats.totalHadir} <span className="text-xs font-normal">Hari</span></p>
                </div>
                <div className="p-4 bg-rose-50 border border-rose-200/60 rounded-2xl">
                    <p className="text-xs font-bold text-rose-700 uppercase tracking-wide">Keterlambatan</p>
                    <p className="text-2xl font-black text-rose-900 mt-1">{monthStats.totalLate} <span className="text-xs font-normal">Kali</span></p>
                </div>
                <div className="p-4 bg-blue-50 border border-blue-200/60 rounded-2xl">
                    <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">Total Jam Lembur</p>
                    <p className="text-2xl font-black text-blue-900 mt-1">{monthStats.totalOvertime} <span className="text-xs font-normal">Jam</span></p>
                </div>
            </div>

            {/* Shift Color Legend */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 flex flex-wrap items-center gap-4 text-xs font-semibold">
                <span className="text-slate-500 font-bold">Keterangan Shift:</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-400"></span> ☀️ Pagi</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500"></span> 🌇 Siang</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-600"></span> 🌙 Malam</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> 🟢 Off / Libur</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-sky-400"></span> 🌴 Cuti / Izin</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-slate-300"></span> ⚪ Draft (Belum Terbit)</span>
            </div>

            {/* Calendar Grid */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-100/70 text-center font-bold text-xs text-slate-600 py-3">
                    {dayHeaders.map((header, idx) => (
                        <div key={header} className={idx >= 5 ? 'text-rose-600' : ''}>
                            {header}
                        </div>
                    ))}
                </div>

                {/* Grid Cells */}
                <div className="grid grid-cols-7 auto-rows-fr gap-px bg-slate-200">
                    {/* Empty padding cells for start offset */}
                    {Array.from({ length: startOffset }).map((_, i) => (
                        <div key={`empty-${i}`} className="bg-slate-50/50 min-h-[90px] p-2" />
                    ))}

                    {/* Day Cells */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const info = getDayShiftInfo(day);
                        const isSelected = selectedDay === day;

                        const sLower = info.shiftName.toLowerCase();
                        let shiftBadgeBg = 'bg-slate-100 text-slate-600 border-slate-300';

                        if (info.shiftStatus === 'published') {
                            if (sLower.includes('pagi')) shiftBadgeBg = 'bg-amber-100 text-amber-900 border-amber-300 font-bold';
                            else if (sLower.includes('siang') || sLower.includes('sore')) shiftBadgeBg = 'bg-blue-100 text-blue-900 border-blue-300 font-bold';
                            else if (sLower.includes('malam')) shiftBadgeBg = 'bg-indigo-100 text-indigo-900 border-indigo-300 font-bold';
                            else if (sLower.includes('cuti') || sLower.includes('izin') || sLower.includes('sakit')) shiftBadgeBg = 'bg-sky-100 text-sky-900 border-sky-300 font-bold';
                            else if (info.shiftName === 'Off' || sLower.includes('libur')) shiftBadgeBg = 'bg-emerald-100 text-emerald-900 border-emerald-300 font-bold';
                            else shiftBadgeBg = 'bg-teal-100 text-teal-900 border-teal-300 font-bold';
                        } else if (info.shiftStatus === 'draft') {
                            shiftBadgeBg = 'bg-slate-100 text-slate-400 border-slate-200 italic';
                        }

                        return (
                            <div
                                key={day}
                                onClick={() => setSelectedDay(day)}
                                className={`bg-white p-2 min-h-[95px] flex flex-col justify-between cursor-pointer transition-all hover:bg-teal-50/40 relative ${
                                    info.isToday ? 'ring-2 ring-inset ring-[#06736a]' : ''
                                } ${isSelected ? 'bg-teal-50/70' : ''}`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className={`text-xs font-black rounded-lg px-2 py-0.5 ${
                                        info.isToday 
                                            ? 'bg-[#06736a] text-white shadow-sm' 
                                            : 'text-slate-700'
                                    }`}>
                                        {day}
                                    </span>

                                    {info.record?.clockIn && (
                                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                                            ✓ {info.record.clockIn}
                                        </span>
                                    )}
                                </div>

                                <div className="mt-1 space-y-0.5">
                                    <span className={`text-[10px] px-1.5 py-0.5 rounded-lg border block text-center truncate ${shiftBadgeBg}`}>
                                        {info.shiftName}
                                    </span>
                                    {info.startTime && info.endTime && (
                                        <span className="text-[8px] text-slate-400 font-mono block text-center">
                                            {info.startTime}-{info.endTime}
                                        </span>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Selected Day Detail Popover */}
            {selectedDay !== null && (
                <div className="bg-white p-5 rounded-2xl border border-teal-200 shadow-md flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    {(() => {
                        const info = getDayShiftInfo(selectedDay);
                        return (
                            <>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-bold text-slate-800">
                                            📆 Detail Jadwal Jaga: {selectedDay} {MONTH_NAMES[currentMonth]} {currentYear}
                                        </span>
                                        <span className={`text-xs px-2.5 py-0.5 font-bold rounded-full ${
                                            info.shiftStatus === 'published' ? 'bg-teal-100 text-[#06736a]' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {info.shiftName} {info.startTime ? `(${info.startTime} - ${info.endTime})` : ''}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {info.record 
                                            ? `Absen Masuk: ${info.record.clockIn || '-'} WIB | Absen Keluar: ${info.record.clockOut || '-'} WIB (${info.record.status || 'Hadir'})` 
                                            : 'Belum ada catatan absensi terdeteksi untuk tanggal ini.'}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-slate-500">Ada halangan dinas?</span>
                                    <button 
                                        onClick={() => alert(`Pengajuan tukar shift untuk tanggal ${selectedDay} ${MONTH_NAMES[currentMonth]} dapat dilakukan melalui Tab Tukar Shift.`)}
                                        className="px-3.5 py-2 bg-[#06736a] hover:bg-[#054f46] text-white font-bold rounded-xl text-xs transition-colors whitespace-nowrap shadow-sm"
                                    >
                                        🔀 Ajukan Tukar Shift
                                    </button>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};

export default ESSCalendarTab;
