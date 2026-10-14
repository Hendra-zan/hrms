import { useState, useEffect, useMemo } from 'react';
import * as XLSX from 'xlsx';
import { Employee, EmployeeSchedule, ShiftDefinition } from '../../../types.ts';
import { getSchedulesByUnit } from '../../../services/scheduleService.ts';
import { PeriodFilterMode, EmployeeShiftStats, SortField, SortOrder } from './types.ts';

export function useScheduleSummaryState(
    unitId: string,
    unitShifts: ShiftDefinition[],
    employees: Employee[],
    onNotify: (type: 'success' | 'error', text: string) => void
) {
    const [loading, setLoading] = useState(true);
    const [schedules, setSchedules] = useState<EmployeeSchedule[]>([]);

    // Selected Month
    const [viewMonth, setViewMonth] = useState(() => {
        const now = new Date();
        return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    });

    // Time Filter (Full Month vs Week 1-5)
    const [periodMode, setPeriodMode] = useState<PeriodFilterMode>('month');

    // Role / Jabatan Filter
    const [selectedJabatan, setSelectedJabatan] = useState<string>('all');

    // Search filter
    const [searchQuery, setSearchQuery] = useState('');

    // Sort column
    const [sortField, setSortField] = useState<SortField>('nama');
    const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

    // Available unique positions for filter
    const availableJabatanList = useMemo(() => {
        const setJ = new Set<string>();
        employees.forEach(e => {
            if (e.jabatan) setJ.add(e.jabatan.trim());
        });
        return Array.from(setJ).sort();
    }, [employees]);

    // Date range calculation
    const { startDate, endDate, monthLabel, periodLabel, daysInFilter, totalDaysInMonth } = useMemo(() => {
        const [y, m] = viewMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const mName = new Date(y, m - 1, 1).toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

        if (periodMode === 'w1') {
            return {
                startDate: `${viewMonth}-01`,
                endDate: `${viewMonth}-07`,
                monthLabel: mName,
                periodLabel: `Minggu 1 (1 - 7 ${mName})`,
                daysInFilter: 7,
                totalDaysInMonth: lastDay
            };
        } else if (periodMode === 'w2') {
            return {
                startDate: `${viewMonth}-08`,
                endDate: `${viewMonth}-14`,
                monthLabel: mName,
                periodLabel: `Minggu 2 (8 - 14 ${mName})`,
                daysInFilter: 7,
                totalDaysInMonth: lastDay
            };
        } else if (periodMode === 'w3') {
            return {
                startDate: `${viewMonth}-15`,
                endDate: `${viewMonth}-21`,
                monthLabel: mName,
                periodLabel: `Minggu 3 (15 - 21 ${mName})`,
                daysInFilter: 7,
                totalDaysInMonth: lastDay
            };
        } else if (periodMode === 'w4') {
            return {
                startDate: `${viewMonth}-22`,
                endDate: `${viewMonth}-28`,
                monthLabel: mName,
                periodLabel: `Minggu 4 (22 - 28 ${mName})`,
                daysInFilter: 7,
                totalDaysInMonth: lastDay
            };
        } else if (periodMode === 'w5') {
            return {
                startDate: `${viewMonth}-29`,
                endDate: `${viewMonth}-${String(lastDay).padStart(2, '0')}`,
                monthLabel: mName,
                periodLabel: `Minggu 5 (29 - ${lastDay} ${mName})`,
                daysInFilter: lastDay - 28,
                totalDaysInMonth: lastDay
            };
        }

        return {
            startDate: `${viewMonth}-01`,
            endDate: `${viewMonth}-${String(lastDay).padStart(2, '0')}`,
            monthLabel: mName,
            periodLabel: `1 Bulan Penuh (${mName})`,
            daysInFilter: lastDay,
            totalDaysInMonth: lastDay
        };
    }, [viewMonth, periodMode]);

    // Load schedule data
    useEffect(() => {
        let mounted = true;
        setLoading(true);

        const [y, m] = viewMonth.split('-').map(Number);
        const lastDay = new Date(y, m, 0).getDate();
        const fullMonthStart = `${viewMonth}-01`;
        const fullMonthEnd = `${viewMonth}-${String(lastDay).padStart(2, '0')}`;

        getSchedulesByUnit(unitId, fullMonthStart, fullMonthEnd)
            .then(data => {
                if (mounted) setSchedules(data || []);
            })
            .catch(err => {
                if (mounted) onNotify('error', `Gagal memuat rekap: ${err.message}`);
            })
            .finally(() => {
                if (mounted) setLoading(false);
            });

        return () => { mounted = false; };
    }, [unitId, viewMonth]);

    // Parse Shift hours and category
    const getShiftDetails = (shiftName: string, shiftCode?: string): { hours: number; category: 'pagi' | 'siang' | 'malam' | 'other' | 'off' | 'cuti' } => {
        const sNameLower = shiftName.toLowerCase().trim();
        const sCodeUpper = (shiftCode || '').toUpperCase().trim();

        if (sCodeUpper === 'L' || sNameLower.includes('libur') || sNameLower === 'off') {
            return { hours: 0, category: 'off' };
        }
        if (sCodeUpper === 'C' || sNameLower.includes('cuti')) {
            return { hours: 0, category: 'cuti' };
        }

        const def = unitShifts.find(s =>
            (s.code && s.code.toUpperCase() === sCodeUpper) ||
            s.name.toLowerCase().trim() === sNameLower
        );

        let hrs = 8;
        let category: 'pagi' | 'siang' | 'malam' | 'other' = 'other';

        if (def && def.startTime && def.endTime) {
            const [startH, startM] = def.startTime.split(':').map(Number);
            const [endH, endM] = def.endTime.split(':').map(Number);
            let diff = (endH + endM / 60) - (startH + startM / 60);
            if (diff <= 0) diff += 24;
            const breakM = def.breakDurationMinutes ?? 0;
            const netHrs = Math.max(1, diff - (breakM / 60));
            hrs = Number(netHrs.toFixed(1));

            if (startH >= 5 && startH < 13) {
                category = 'pagi';
            } else if (startH >= 13 && startH < 19) {
                category = 'siang';
            } else {
                category = 'malam';
            }
        } else {
            if (sCodeUpper === 'PA' || sNameLower.includes('pagi')) {
                category = 'pagi';
            } else if (sCodeUpper === 'SI' || sNameLower.includes('siang') || sNameLower.includes('sore')) {
                category = 'siang';
            } else if (sCodeUpper === 'MA' || sNameLower.includes('malam')) {
                category = 'malam';
            }
        }

        if (sCodeUpper === 'PA') category = 'pagi';
        if (sCodeUpper === 'SI') category = 'siang';
        if (sCodeUpper === 'MA') category = 'malam';

        return { hours: hrs, category };
    };

    // Calculate Statistics & K3 Risk Warnings per Employee
    const { statsList, overallUnitAvg } = useMemo(() => {
        const list: EmployeeShiftStats[] = [];
        const activeSchedules = schedules.filter(s =>
            s.schedule_date >= startDate && s.schedule_date <= endDate
        );

        const targetEmployees = selectedJabatan === 'all'
            ? employees
            : employees.filter(e => (e.jabatan || '').trim() === selectedJabatan);

        let totalNightSum = 0;
        let totalHoursSum = 0;

        targetEmployees.forEach(emp => {
            const empScheds = activeSchedules
                .filter(s => s.employee_id === emp.id)
                .sort((a, b) => a.schedule_date.localeCompare(b.schedule_date));

            let pagiCount = 0, pagiHours = 0;
            let siangCount = 0, siangHours = 0;
            let malamCount = 0, malamHours = 0;
            let otherShiftCount = 0, otherShiftHours = 0;
            let offCount = 0;
            let cutiCount = 0;
            let totalHours = 0;

            const k3Warnings: string[] = [];
            let consecutiveNightCount = 0;
            let maxConsecutiveNight = 0;
            let prevShiftEndHour: number | null = null;
            let prevShiftDate: string | null = null;

            empScheds.forEach(s => {
                const shiftDetail = getShiftDetails(s.shift_name, (s as any).shift_code);

                if (shiftDetail.category === 'off') {
                    offCount++;
                    consecutiveNightCount = 0;
                    prevShiftEndHour = null;
                } else if (shiftDetail.category === 'cuti') {
                    cutiCount++;
                    consecutiveNightCount = 0;
                    prevShiftEndHour = null;
                } else {
                    const hrs = shiftDetail.hours;

                    if (shiftDetail.category === 'pagi') {
                        pagiCount++;
                        pagiHours += hrs;
                        consecutiveNightCount = 0;
                    } else if (shiftDetail.category === 'siang') {
                        siangCount++;
                        siangHours += hrs;
                        consecutiveNightCount = 0;
                    } else if (shiftDetail.category === 'malam') {
                        malamCount++;
                        malamHours += hrs;
                        consecutiveNightCount++;
                        if (consecutiveNightCount > maxConsecutiveNight) {
                            maxConsecutiveNight = consecutiveNightCount;
                        }
                    } else {
                        otherShiftCount++;
                        otherShiftHours += hrs;
                        consecutiveNightCount = 0;
                    }

                    const def = unitShifts.find(u => u.name === s.shift_name);
                    if (def && def.startTime && prevShiftEndHour !== null && prevShiftDate) {
                        const [currStartH] = def.startTime.split(':').map(Number);
                        const dPrev = new Date(prevShiftDate);
                        const dCurr = new Date(s.schedule_date);
                        const diffDays = Math.round((dCurr.getTime() - dPrev.getTime()) / (1000 * 3600 * 24));

                        if (diffDays === 1) {
                            const restHours = (24 - prevShiftEndHour) + currStartH;
                            if (restHours < 11 && restHours > 0) {
                                k3Warnings.push(`⚠️ Jeda Istirahat Singkat (${restHours.toFixed(1)} jam pada tgl ${s.schedule_date.slice(8)})`);
                            }
                        }
                    }

                    if (def && def.endTime) {
                        const [endH] = def.endTime.split(':').map(Number);
                        prevShiftEndHour = endH;
                        prevShiftDate = s.schedule_date;
                    } else {
                        prevShiftEndHour = null;
                    }

                    totalHours += hrs;
                }
            });

            if (maxConsecutiveNight >= 3) {
                k3Warnings.unshift(`🚨 Shift Malam Berturut-turut (${maxConsecutiveNight}x)`);
            }

            const workableDays = Math.max(0, daysInFilter - cutiCount);
            const targetHours = Math.round(workableDays * (160 / 30));
            const hoursDiff = totalHours - targetHours;

            totalNightSum += malamCount;
            totalHoursSum += totalHours;

            list.push({
                employeeId: emp.id,
                nik: (emp as any).nik || (emp as any).ktpNumber || '',
                nama: emp.nama,
                jabatan: emp.jabatan || '-',
                foto: emp.foto,
                pagiCount, pagiHours,
                siangCount, siangHours,
                malamCount, malamHours,
                otherShiftCount, otherShiftHours,
                offCount,
                cutiCount,
                totalShifts: pagiCount + siangCount + malamCount + otherShiftCount,
                totalHours,
                targetHours,
                hoursDiff,
                k3Warnings,
                fairnessStatus: 'balanced',
                fairnessNote: 'Distribusi Seimbang'
            });
        });

        const empCount = targetEmployees.length || 1;
        const avgNight = totalNightSum / empCount;
        const avgHours = totalHoursSum / empCount;
        const maxAllowedNightDiff = Math.max(1, Number(((daysInFilter / 30) * 2.5).toFixed(1)));
        const maxAbsoluteNightLimit = Math.max(2, Math.round((daysInFilter / 30) * 7));

        list.forEach(item => {
            const nightDiff = Math.abs(item.malamCount - avgNight);
            const hoursDiffPct = avgHours > 0 ? Math.abs(item.totalHours - avgHours) / avgHours : 0;
            const hasSevereK3 = item.k3Warnings.some(w => w.includes('🚨'));

            if (hasSevereK3 || nightDiff > maxAllowedNightDiff || item.malamCount >= maxAbsoluteNightLimit || hoursDiffPct > 0.25) {
                item.fairnessStatus = 'unbalanced';
                if (hasSevereK3) {
                    item.fairnessNote = `Risiko K3: ${item.k3Warnings[0]}`;
                } else if (item.malamCount >= maxAbsoluteNightLimit) {
                    item.fairnessNote = `Beban Malam Tinggi (${item.malamCount}x malam / max ${maxAbsoluteNightLimit}x)`;
                } else if (nightDiff > maxAllowedNightDiff) {
                    item.fairnessNote = `Deviasi Malam Tembus Limit (Deviasi ±${nightDiff.toFixed(1)})`;
                } else {
                    item.fairnessNote = `Selisih Jam Kerja (${item.totalHours}h vs Rerata ${avgHours.toFixed(0)}h)`;
                }
            } else if (nightDiff > maxAllowedNightDiff * 0.5 || hoursDiffPct > 0.12 || item.k3Warnings.length > 0) {
                item.fairnessStatus = 'moderate';
                item.fairnessNote = item.k3Warnings.length > 0
                    ? item.k3Warnings[0]
                    : `Variasi Sedang (Deviasi ±${nightDiff.toFixed(1)} malam)`;
            } else {
                item.fairnessStatus = 'balanced';
                item.fairnessNote = item.cutiCount > 0
                    ? `Optimal & Seimbang (Disesuaikan Cuti ${item.cutiCount}hr)`
                    : `Optimal & Seimbang (Deviasi ±${nightDiff.toFixed(1)})`;
            }
        });

        return {
            statsList: list,
            overallUnitAvg: {
                avgNight,
                avgHours,
                totalNightSum,
                totalHoursSum
            }
        };
    }, [schedules, employees, selectedJabatan, startDate, endDate, unitShifts, daysInFilter]);

    // Filter & Sort
    const processedList = useMemo(() => {
        let filtered = statsList;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            filtered = filtered.filter(e =>
                e.nama.toLowerCase().includes(q) ||
                e.jabatan.toLowerCase().includes(q) ||
                e.nik.toLowerCase().includes(q)
            );
        }

        return [...filtered].sort((a, b) => {
            let valA: any = a[sortField];
            let valB: any = b[sortField];

            if (sortField === 'fairnessStatus') {
                const orderMap = { unbalanced: 3, moderate: 2, balanced: 1 };
                valA = orderMap[a.fairnessStatus];
                valB = orderMap[b.fairnessStatus];
            } else if (sortField === 'k3Warnings') {
                valA = a.k3Warnings.length;
                valB = b.k3Warnings.length;
            }

            if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
            if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
            return 0;
        });
    }, [statsList, searchQuery, sortField, sortOrder]);

    // Equitability Overall Unit Score
    const unitFairnessScore = useMemo(() => {
        if (statsList.length <= 1) return 100;
        const unbalancedCount = statsList.filter(s => s.fairnessStatus === 'unbalanced').length;
        const moderateCount = statsList.filter(s => s.fairnessStatus === 'moderate').length;
        const score = 100 - (unbalancedCount * 15) - (moderateCount * 5);
        return Math.max(0, Math.min(100, score));
    }, [statsList]);

    // Handle Sort
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortOrder('asc');
        }
    };

    // Export Excel
    const handleExportExcel = () => {
        try {
            const rows = processedList.map((item, idx) => ({
                'No': idx + 1,
                'NIK': item.nik,
                'Nama Karyawan': item.nama,
                'Jabatan': item.jabatan,
                'Shift Pagi': item.pagiCount,
                'Shift Siang': item.siangCount,
                'Shift Malam': item.malamCount,
                'Shift Lainnya': item.otherShiftCount,
                'Hari Libur (OFF)': item.offCount,
                'Hari Cuti': item.cutiCount,
                'Total Shift': item.totalShifts,
                'Total Jam Kerja': item.totalHours,
                'Target Standar Jam': item.targetHours,
                'Selisih Jam Kerja': item.hoursDiff > 0 ? `+${item.hoursDiff} jam` : `${item.hoursDiff} jam`,
                'Status Keseimbangan': item.fairnessStatus.toUpperCase(),
                'Catatan Distribusi': item.fairnessNote,
                'Peringatan K3': item.k3Warnings.join(' | ') || 'Aman'
            }));

            const ws = XLSX.utils.json_to_sheet(rows);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Rekap Jam & Shift');

            const fileName = `Rekap_Beban_Shift_${periodMode.toUpperCase()}_${viewMonth}.xlsx`;
            XLSX.writeFile(wb, fileName);
            onNotify('success', `Berhasil mengekspor ${rows.length} data ke Excel.`);
        } catch (err: any) {
            onNotify('error', `Gagal export Excel: ${err.message}`);
        }
    };

    return {
        loading,
        viewMonth,
        setViewMonth,
        periodMode,
        setPeriodMode,
        selectedJabatan,
        setSelectedJabatan,
        searchQuery,
        setSearchQuery,
        sortField,
        sortOrder,
        handleSort,
        availableJabatanList,
        startDate,
        endDate,
        monthLabel,
        periodLabel,
        daysInFilter,
        totalDaysInMonth,
        statsList,
        processedList,
        overallUnitAvg,
        unitFairnessScore,
        handleExportExcel,
    };
}
