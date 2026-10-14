import { useState, useMemo } from 'react';
import { Employee, AttendanceRecord, LeaveRequest, Payslip } from '../types.ts';
import { calculatePayslip, buildPayrollConfig } from '../services/payrollService.ts';
import { useAppData } from '../stores/appStore';

interface UseESSDataProps {
    user: Employee;
    attendanceRecords: AttendanceRecord[];
    systemSettings: any;
}

const MONTH_MAP: Record<string, number> = {
    'januari': 1, 'februari': 2, 'maret': 3, 'april': 4, 'mei': 5, 'juni': 6,
    'juli': 7, 'agustus': 8, 'september': 9, 'oktober': 10, 'november': 11, 'desember': 12
};

export function useESSData({ user, attendanceRecords, systemSettings }: UseESSDataProps) {
    const { payslips } = useAppData();
    // Attendance filter state
    const [attendanceMonthFilter, setAttendanceMonthFilter] = useState('all');
    const [attendanceDateFilter, setAttendanceDateFilter] = useState({ start: '', end: '' });

    // Available months from records
    const attendanceMonths = useMemo(() => {
        const values = new Set<string>();
        attendanceRecords.forEach((record) => {
            values.add(record.tanggal.slice(0, 7));
        });
        return [...values].sort((a, b) => b.localeCompare(a));
    }, [attendanceRecords]);

    // Filtered records based on month and date range
    const filteredAttendanceRecords = useMemo(() => {
        return [...attendanceRecords]
            .filter((record) => attendanceMonthFilter === 'all' || record.tanggal.startsWith(attendanceMonthFilter))
            .filter((record) => {
                if (attendanceDateFilter.start && record.tanggal < attendanceDateFilter.start) return false;
                if (attendanceDateFilter.end && record.tanggal > attendanceDateFilter.end) return false;
                return true;
            })
            .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());
    }, [attendanceRecords, attendanceDateFilter.end, attendanceDateFilter.start, attendanceMonthFilter]);

    // Attendance summary stats
    const attendanceSummary = useMemo(() => {
        const total = filteredAttendanceRecords.length;
        const lateCount = filteredAttendanceRecords.filter((record) => record.isLate).length;
        const onTimeCount = total - lateCount;
        const totalOvertime = Number(filteredAttendanceRecords.reduce((sum, record) => sum + (record.overtimeHours || 0), 0).toFixed(2));
        const lateRate = total ? Number(((lateCount / total) * 100).toFixed(0)) : 0;
        const onTimeRate = total ? Number(((onTimeCount / total) * 100).toFixed(0)) : 0;
        return { total, lateCount, onTimeCount, totalOvertime, lateRate, onTimeRate };
    }, [filteredAttendanceRecords]);

    // Kinerja trend data (last 90 days, weekly)
    const kinerjaTrendData = useMemo(() => {
        const now = new Date();
        const past90Days = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        
        // Group by week
        const weeklyData: Record<string, { weekNum: number; onTime: number; late: number; total: number; lembur: number }> = {};
        
        filteredAttendanceRecords
            .filter((record) => new Date(record.tanggal) >= past90Days)
            .forEach((record) => {
                const recordDate = new Date(record.tanggal);
                // Calculate week number of the year
                const startOfYear = new Date(recordDate.getFullYear(), 0, 1);
                const diff = recordDate.getTime() - startOfYear.getTime();
                const oneDay = 24 * 60 * 60 * 1000;
                const weekNum = Math.ceil((diff / oneDay + startOfYear.getDay() + 1) / 7);
                const weekKey = `${recordDate.getFullYear()}-W${String(weekNum).padStart(2, '0')}`;
                
                if (!weeklyData[weekKey]) {
                    weeklyData[weekKey] = { weekNum, onTime: 0, late: 0, total: 0, lembur: 0 };
                }
                
                weeklyData[weekKey].total++;
                weeklyData[weekKey].lembur += Number(record.overtimeHours || 0);
                if (record.isLate) {
                    weeklyData[weekKey].late++;
                } else {
                    weeklyData[weekKey].onTime++;
                }
            });
            
        return Object.keys(weeklyData)
            .sort((a, b) => a.localeCompare(b))
            .map((key) => {
                const item = weeklyData[key];
                return {
                    label: `Mgg ${item.weekNum}`,
                    hadir: item.total,
                    terlambat: item.late,
                    lembur: Number(item.lembur.toFixed(1)),
                };
            });
    }, [filteredAttendanceRecords]);

    // Monthly kinerja summary (last 6 months)
    const monthlyKinerjaSummary = useMemo(() => {
        const byMonth: Record<string, { bulan: string; hadir: number; terlambat: number; lembur: number; skor: number }> = {};

        attendanceRecords.forEach(rec => {
            const ym = rec.tanggal.slice(0, 7);
            if (!byMonth[ym]) {
                const [y, m] = ym.split('-').map(Number);
                byMonth[ym] = {
                    bulan: new Date(y, m - 1).toLocaleDateString('id-ID', { month: 'short', year: '2-digit' }),
                    hadir: 0, terlambat: 0, lembur: 0, skor: 0
                };
            }
            byMonth[ym].hadir += 1;
            if (rec.isLate) byMonth[ym].terlambat += 1;
            byMonth[ym].lembur += Number(rec.overtimeHours || 0);
        });

        return Object.keys(byMonth)
            .sort()
            .slice(-6)
            .map(k => {
                const d = byMonth[k];
                const skor = d.hadir > 0 ? Math.max(0, Math.round(100 - (d.terlambat / d.hadir) * 100)) : 0;
                return { ...d, lembur: Number(d.lembur.toFixed(1)), skor };
            });
    }, [attendanceRecords]);

    // Overall kinerja metrics
    const overallKinerja = useMemo(() => {
        const total = attendanceRecords.length;
        const lateCount = attendanceRecords.filter(r => r.isLate).length;
        const totalOvertime = attendanceRecords.reduce((s, r) => s + Number(r.overtimeHours || 0), 0);
        const punctualityScore = total > 0 ? Math.max(0, Math.round(100 - (lateCount / total) * 100)) : 0;
        const avgOvertimePerDay = total > 0 ? Number((totalOvertime / total).toFixed(1)) : 0;
        const grade = punctualityScore >= 90 ? { label: 'Sangat Baik', color: 'text-green-600', bg: 'bg-green-50 border-green-200' }
            : punctualityScore >= 75 ? { label: 'Baik', color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' }
            : punctualityScore >= 60 ? { label: 'Cukup', color: 'text-yellow-600', bg: 'bg-yellow-50 border-yellow-200' }
            : { label: 'Perlu Perhatian', color: 'text-red-600', bg: 'bg-red-50 border-red-200' };
        return { total, lateCount, totalOvertime: Number(totalOvertime.toFixed(1)), punctualityScore, avgOvertimePerDay, grade };
    }, [attendanceRecords]);

    // Payslip history (loaded from database payslips table)
    const payslipHistory = useMemo(() => {
        const getPeriodDate = (periodStr: string) => {
            const parts = periodStr.toLowerCase().split(' ');
            if (parts.length < 2) return 0;
            const month = MONTH_MAP[parts[0]] || 1;
            const year = parseInt(parts[1]) || 2024;
            return year * 100 + month;
        };

        return [...payslips]
            .map(payslip => ({ period: payslip.periode, payslip }))
            .sort((a, b) => getPeriodDate(b.period) - getPeriodDate(a.period));
    }, [payslips]);

    // Utility functions
    const formatDate = (dateStr: string, options?: Intl.DateTimeFormatOptions) => {
        return new Date(dateStr).toLocaleDateString('id-ID', options);
    };

    const formatMoney = (value: number) => new Intl.NumberFormat('id-ID').format(value);

    return {
        // Filter state
        attendanceMonthFilter,
        setAttendanceMonthFilter,
        attendanceDateFilter,
        setAttendanceDateFilter,
        // Computed data
        attendanceMonths,
        filteredAttendanceRecords,
        attendanceSummary,
        kinerjaTrendData,
        monthlyKinerjaSummary,
        overallKinerja,
        payslipHistory,
        // Utilities
        formatDate,
        formatMoney,
    };
}
