import { useState, useMemo } from 'react';
import { Employee } from '../../../../types.ts';
import {
    generateBulkSchedules, publishSchedules, unpublishSchedules,
    cancelMonthSchedules, cancelEmployeeMonthSchedules,
    copyPreviousMonthSchedules, applyNationalHolidays,
    type ScheduleSummary
} from '../../../../services/scheduleService.ts';
import { useConfirm } from '../../../ConfirmDialog.tsx';
import { INDONESIAN_MONTHS } from '../constants.ts';

interface UseScheduleBatchActionsProps {
    unitId: string;
    userId: string;
    employees: Employee[];
    startDate: string;
    endDate: string;
    viewMonth: string;
    setViewMonth: (month: string) => void;
    monthLabel: string;
    summary: ScheduleSummary | null;
    onNotify: (type: 'success' | 'error', text: string) => void;
    loadData: () => Promise<void>;
}

export const useScheduleBatchActions = ({
    unitId,
    userId,
    employees,
    startDate,
    endDate,
    viewMonth,
    setViewMonth,
    monthLabel,
    summary,
    onNotify,
    loadData,
}: UseScheduleBatchActionsProps) => {
    const confirm = useConfirm();
    const [generating, setGenerating] = useState(false);
    const [publishing, setPublishing] = useState(false);

    // Generate modal state
    const [showGenerateModal, setShowGenerateModal] = useState(false);
    const [selectedPatternId, setSelectedPatternId] = useState('');
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<string[]>([]);
    const [staggerOffset, setStaggerOffset] = useState(0);
    const [genSearchQuery, setGenSearchQuery] = useState('');
    const [genJabatanFilter, setGenJabatanFilter] = useState('ALL');
    const [sundayLockEmpIds, setSundayLockEmpIds] = useState<string[]>([]);
    const [autoAlignDayOfWeek, setAutoAlignDayOfWeek] = useState<boolean>(true);
    const [genPeriodMode, setGenPeriodMode] = useState<'MONTH' | '1WEEK' | '2WEEKS' | 'CUSTOM'>('MONTH');
    const [genCustomStartDate, setGenCustomStartDate] = useState<string>('');
    const [genCustomEndDate, setGenCustomEndDate] = useState<string>('');
    const [genTargetMonth, setGenTargetMonth] = useState<string>('');

    const { targetGenStartDate, targetGenEndDate, genMonthLabel } = useMemo(() => {
        const activeMonth = genTargetMonth || viewMonth;
        const [year, month] = activeMonth.split('-').map(Number);
        const mStart = `${year}-${String(month).padStart(2, '0')}-01`;
        const lastDay = new Date(year, month, 0).getDate();
        const mEnd = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
        const label = `${INDONESIAN_MONTHS[month - 1]} ${year}`;

        const start = genCustomStartDate || mStart;
        if (genPeriodMode === 'MONTH') {
            return { targetGenStartDate: mStart, targetGenEndDate: mEnd, genMonthLabel: label };
        }
        if (genPeriodMode === '1WEEK') {
            const dt = new Date(start);
            dt.setDate(dt.getDate() + 6);
            return { targetGenStartDate: start, targetGenEndDate: dt.toLocaleDateString('en-CA'), genMonthLabel: label };
        }
        if (genPeriodMode === '2WEEKS') {
            const dt = new Date(start);
            dt.setDate(dt.getDate() + 13);
            return { targetGenStartDate: start, targetGenEndDate: dt.toLocaleDateString('en-CA'), genMonthLabel: label };
        }
        return {
            targetGenStartDate: start,
            targetGenEndDate: genCustomEndDate || mEnd,
            genMonthLabel: label,
        };
    }, [genTargetMonth, viewMonth, genCustomStartDate, genCustomEndDate, genPeriodMode]);

    const handleGenerate = async () => {
        if (!selectedPatternId || selectedEmployeeIds.length === 0) {
            onNotify('error', 'Pilih pola rotasi dan minimal 1 karyawan.');
            return;
        }
        try {
            setGenerating(true);
            const result = await generateBulkSchedules(
                selectedEmployeeIds, unitId, selectedPatternId,
                targetGenStartDate, targetGenEndDate, userId, staggerOffset, sundayLockEmpIds, autoAlignDayOfWeek
            );
            onNotify('success', `Berhasil generate ${result.total} jadwal untuk ${selectedEmployeeIds.length} karyawan (${sundayLockEmpIds.length} terkunci Minggu OFF).`);

            setShowGenerateModal(false);
            if (genTargetMonth && genTargetMonth !== viewMonth) {
                setViewMonth(genTargetMonth);
            } else {
                await loadData();
            }
        } catch (err: any) {
            onNotify('error', `Gagal generate: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handlePublish = async () => {
        if (!summary || summary.draftDays === 0) {
            onNotify('error', 'Tidak ada jadwal draft untuk dipublikasi.');
            return;
        }
        const ok = await confirm({
            title: 'Publikasi Jadwal',
            message: `Publish ${summary.draftDays} jadwal draft? Setelah publish, jadwal akan aktif untuk validasi absensi.`,
            confirmLabel: 'Publish',
            variant: 'success',
        });
        if (!ok) return;
        try {
            setPublishing(true);
            const count = await publishSchedules(unitId, startDate, endDate, userId);
            onNotify('success', `${count} jadwal berhasil dipublikasi.`);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal publish: ${err.message}`);
        } finally {
            setPublishing(false);
        }
    };

    const handleUnpublish = async () => {
        if (!summary || summary.publishedDays === 0) return;
        const ok = await confirm({
            title: '↩️ Batal Publish (Kembalikan ke Draft)',
            message: `Tarik kembali ${summary.publishedDays} jadwal yang sudah dipublikasi menjadi DRAFT? Karyawan tidak akan melihat jadwal ini di aplikasi HP hingga Anda mempublikasikannya kembali.`,
            confirmLabel: 'Kembalikan ke Draft',
            variant: 'warning',
        });
        if (!ok) return;
        try {
            setPublishing(true);
            const count = await unpublishSchedules(unitId, startDate, endDate);
            onNotify('success', `✅ ${count} jadwal berhasil ditarik kembali menjadi DRAFT.`);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal membatalkan publish: ${err.message}`);
        } finally {
            setPublishing(false);
        }
    };

    const handleCopyPreviousMonth = async () => {
        const ok = await confirm({
            title: '📋 Salin Jadwal Dari Bulan Lalu',
            message: `Salin penugasan shift bulan sebelumnya ke bulan ${monthLabel}? Jadwal baru akan dibuat sebagai DRAFT.`,
            confirmLabel: 'Salin Jadwal',
            variant: 'info',
        });
        if (!ok) return;
        try {
            setGenerating(true);
            const count = await copyPreviousMonthSchedules(unitId, startDate, endDate, userId);
            onNotify('success', `Berhasil menyalin ${count} jadwal dari bulan sebelumnya.`);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal menyalin jadwal: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleApplyHolidays = async () => {
        const ok = await confirm({
            title: '🇲🇨 Terapkan Hari Libur / Minggu',
            message: `Tandai seluruh hari Minggu di bulan ${monthLabel} sebagai Libur (OFF) untuk semua karyawan unit ini?`,
            confirmLabel: 'Terapkan Libur',
            variant: 'info',
        });
        if (!ok) return;
        try {
            setGenerating(true);
            const sundays: string[] = [];
            const sDt = new Date(startDate);
            const eDt = new Date(endDate);
            for (let dt = new Date(sDt); dt <= eDt; dt.setDate(dt.getDate() + 1)) {
                if (dt.getDay() === 0) sundays.push(dt.toLocaleDateString('en-CA'));
            }
            const empIds = employees.map(e => e.id);
            const count = await applyNationalHolidays(unitId, sundays, empIds, userId);
            onNotify('success', `Berhasil menandai ${count} hari Libur/Minggu.`);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal menerapkan libur: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleResetMonth = async () => {
        const ok = await confirm({
            title: 'Reset Jadwal Bulan Ini',
            message: `Hapus semua jadwal DRAFT & OVERRIDE di bulan ${monthLabel}? Jadwal yang sudah dipublikasikan (Published) tidak akan terpengaruh.`,
            confirmLabel: 'Reset Jadwal',
            variant: 'danger',
        });
        if (!ok) return;

        try {
            setGenerating(true);
            const count = await cancelMonthSchedules(unitId, startDate, endDate, userId);
            onNotify('success', `Berhasil mereset ${count} jadwal draft/override.`);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal mereset jadwal: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    const handleResetEmployeeMonth = async (emp: Employee) => {
        const ok = await confirm({
            title: `Reset Jadwal: ${emp.nama}`,
            message: `Hapus semua jadwal DRAFT & OVERRIDE untuk ${emp.nama} di bulan ${monthLabel}? Jadwal yang sudah dipublikasikan (Published) tidak akan terpengaruh.`,
            confirmLabel: 'Reset Jadwal Karyawan',
            variant: 'danger',
        });
        if (!ok) return;

        try {
            setGenerating(true);
            const count = await cancelEmployeeMonthSchedules(unitId, emp.id, startDate, endDate, userId);
            onNotify('success', `Berhasil mereset ${count} jadwal draft/override milik ${emp.nama}.`);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal mereset jadwal ${emp.nama}: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return {
        generating,
        setGenerating,
        publishing,
        showGenerateModal,
        setShowGenerateModal,
        selectedPatternId,
        setSelectedPatternId,
        selectedEmployeeIds,
        setSelectedEmployeeIds,
        staggerOffset,
        setStaggerOffset,
        genSearchQuery,
        setGenSearchQuery,
        genJabatanFilter,
        setGenJabatanFilter,
        sundayLockEmpIds,
        setSundayLockEmpIds,
        autoAlignDayOfWeek,
        setAutoAlignDayOfWeek,
        genPeriodMode,
        setGenPeriodMode,
        genCustomStartDate,
        setGenCustomStartDate,
        genCustomEndDate,
        setGenCustomEndDate,
        genTargetMonth,
        setGenTargetMonth,
        targetGenStartDate,
        targetGenEndDate,
        genMonthLabel,
        handleGenerate,
        handlePublish,
        handleUnpublish,
        handleCopyPreviousMonth,
        handleApplyHolidays,
        handleResetMonth,
        handleResetEmployeeMonth,
    };
};
