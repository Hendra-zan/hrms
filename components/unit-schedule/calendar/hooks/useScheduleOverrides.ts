import { useState } from 'react';
import { Employee, EmployeeSchedule } from '../../../../types.ts';
import { OverrideCellState } from '../types.ts';
import { overrideSchedule, cancelSchedule } from '../../../../services/scheduleService.ts';
import { useConfirm } from '../../../ConfirmDialog.tsx';

interface UseScheduleOverridesProps {
    unitId: string;
    userId: string;
    onNotify: (type: 'success' | 'error', text: string) => void;
    loadData: () => Promise<void>;
}

export const useScheduleOverrides = ({
    unitId,
    userId,
    onNotify,
    loadData,
}: UseScheduleOverridesProps) => {
    const confirm = useConfirm();
    const [showOverrideModal, setShowOverrideModal] = useState(false);
    const [overrideCell, setOverrideCell] = useState<OverrideCellState | null>(null);
    const [overrideShiftName, setOverrideShiftName] = useState('');
    const [overrideIsOffDay, setOverrideIsOffDay] = useState(false);
    const [overrideReason, setOverrideReason] = useState('');
    const [submittingOverride, setSubmittingOverride] = useState(false);

    const handleCellClick = (emp: Employee, dateStr: string, sched?: EmployeeSchedule) => {
        setOverrideCell({
            scheduleId: sched?.id || '',
            employeeId: emp.id,
            employeeNama: emp.nama,
            date: dateStr,
            currentShiftName: sched ? (sched.is_off_day ? 'Libur' : sched.shift_name) : 'Belum diisi',
            isOffDay: sched ? sched.is_off_day : false,
        });
        setOverrideShiftName(sched ? (sched.is_off_day ? '' : sched.shift_name) : '');
        setOverrideIsOffDay(sched ? sched.is_off_day : false);
        setOverrideReason('');
        setShowOverrideModal(true);
    };

    const handleSaveOverride = async () => {
        if (!overrideCell) return;
        if (!overrideIsOffDay && !overrideShiftName) {
            onNotify('error', 'Pilih shift yang valid.');
            return;
        }
        if (!overrideReason.trim()) {
            onNotify('error', 'Alasan perubahan wajib diisi.');
            return;
        }
        try {
            setSubmittingOverride(true);
            const targetShiftName = overrideIsOffDay ? 'Libur' : overrideShiftName;
            await overrideSchedule({
                scheduleId: overrideCell.scheduleId,
                employeeId: overrideCell.employeeId,
                unitId: unitId,
                date: overrideCell.date,
                shiftName: targetShiftName,
                isOffDay: overrideIsOffDay,
                reason: overrideReason,
                createdBy: userId,
            });
            onNotify('success', `Berhasil mengubah jadwal ${overrideCell.employeeNama} tanggal ${overrideCell.date} menjadi ${targetShiftName}.`);
            setShowOverrideModal(false);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal mengubah jadwal: ${err.message}`);
        } finally {
            setSubmittingOverride(false);
        }
    };

    const handleDeleteSchedule = async () => {
        if (!overrideCell) return;
        if (!overrideCell.scheduleId) {
            setShowOverrideModal(false);
            return;
        }
        const ok = await confirm({
            title: 'Hapus Jadwal',
            message: `Hapus jadwal ${overrideCell.employeeNama} pada tanggal ${overrideCell.date}?`,
            confirmLabel: 'Hapus',
            variant: 'danger',
        });
        if (!ok) return;

        try {
            setSubmittingOverride(true);
            await cancelSchedule(overrideCell.scheduleId);
            onNotify('success', `Jadwal ${overrideCell.employeeNama} pada tanggal ${overrideCell.date} berhasil dihapus.`);
            setShowOverrideModal(false);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal menghapus jadwal: ${err.message}`);
        } finally {
            setSubmittingOverride(false);
        }
    };

    return {
        showOverrideModal,
        setShowOverrideModal,
        overrideCell,
        overrideShiftName,
        setOverrideShiftName,
        overrideIsOffDay,
        setOverrideIsOffDay,
        overrideReason,
        setOverrideReason,
        submittingOverride,
        handleCellClick,
        handleSaveOverride,
        handleDeleteSchedule,
    };
};
