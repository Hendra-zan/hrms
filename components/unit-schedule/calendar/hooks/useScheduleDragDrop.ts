import { useState } from 'react';
import { Employee, EmployeeSchedule, ShiftDefinition } from '../../../../types.ts';
import { DraggedCellState, DragOverTargetState } from '../types.ts';
import { supabase } from '../../../../services/supabaseClient.ts';

interface UseScheduleDragDropProps {
    unitId: string;
    unitShifts: ShiftDefinition[];
    userId: string;
    scheduleGrid: Record<string, Record<string, EmployeeSchedule>>;
    schedules: EmployeeSchedule[];
    setSchedules: React.Dispatch<React.SetStateAction<EmployeeSchedule[]>>;
    onNotify: (type: 'success' | 'error', text: string) => void;
    loadData: () => Promise<void>;
    setGenerating: (val: boolean) => void;
}

export const useScheduleDragDrop = ({
    unitId,
    unitShifts,
    userId,
    scheduleGrid,
    schedules,
    setSchedules,
    onNotify,
    loadData,
    setGenerating,
}: UseScheduleDragDropProps) => {
    const [draggedCell, setDraggedCell] = useState<DraggedCellState | null>(null);
    const [dragOverTarget, setDragOverTarget] = useState<DragOverTargetState | null>(null);
    const [hasUnsavedDndChanges, setHasUnsavedDndChanges] = useState(false);

    const handleDragStart = (e: React.DragEvent, emp: Employee, dateStr: string, sched?: EmployeeSchedule) => {
        const sName = sched ? (sched.is_off_day ? 'Libur' : sched.shift_name) : 'Libur';
        const isOff = sched ? sched.is_off_day : true;
        setDraggedCell({
            employeeId: emp.id,
            employeeNama: emp.nama,
            date: dateStr,
            shiftName: sName,
            isOffDay: isOff,
        });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', JSON.stringify({ empId: emp.id, date: dateStr }));
    };

    const handleDragOver = (e: React.DragEvent, empId: string, dateStr: string) => {
        if (!draggedCell || draggedCell.employeeId !== empId) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (dragOverTarget?.date !== dateStr || dragOverTarget?.employeeId !== empId) {
            setDragOverTarget({ employeeId: empId, date: dateStr });
        }
    };

    const handleDrop = (e: React.DragEvent, targetEmp: Employee, targetDateStr: string) => {
        e.preventDefault();
        if (!draggedCell) return;

        if (draggedCell.employeeId !== targetEmp.id) {
            onNotify('error', '🚫 Geser shift hanya berlaku pada baris karyawan yang sama.');
            setDraggedCell(null);
            setDragOverTarget(null);
            return;
        }

        const sourceDateStr = draggedCell.date;
        if (sourceDateStr === targetDateStr) {
            setDraggedCell(null);
            setDragOverTarget(null);
            return;
        }

        const targetSched = scheduleGrid[targetEmp.id]?.[targetDateStr];
        const targetShiftName = targetSched ? (targetSched.is_off_day ? 'Libur' : targetSched.shift_name) : 'Libur';
        const targetIsOff = targetSched ? targetSched.is_off_day : true;

        setSchedules(prevSchedules => {
            const newSchedules = [...prevSchedules];
            const updateOrCreateSched = (date: string, shiftName: string, isOff: boolean) => {
                const idx = newSchedules.findIndex(s => s.employee_id === targetEmp.id && s.schedule_date === date);
                const shiftDef = unitShifts.find(s => s.name.toLowerCase() === shiftName.toLowerCase());

                const updatedObj: EmployeeSchedule = {
                    id: idx >= 0 ? newSchedules[idx].id : `temp-${targetEmp.id}-${date}`,
                    employee_id: targetEmp.id,
                    unit_id: unitId,
                    schedule_date: date,
                    shift_name: isOff ? 'Libur' : shiftName,
                    shift_start_time: isOff ? null : (shiftDef?.startTime || '07:00'),
                    shift_end_time: isOff ? null : (shiftDef?.endTime || '14:00'),
                    is_off_day: isOff,
                    status: 'draft',
                    created_at: idx >= 0 ? newSchedules[idx].created_at : new Date().toISOString(),
                    updated_at: new Date().toISOString(),
                };

                if (idx >= 0) {
                    newSchedules[idx] = updatedObj;
                } else {
                    newSchedules.push(updatedObj);
                }
            };

            updateOrCreateSched(targetDateStr, draggedCell.shiftName, draggedCell.isOffDay);
            updateOrCreateSched(sourceDateStr, targetShiftName, targetIsOff);
            return newSchedules;
        });

        setHasUnsavedDndChanges(true);
        onNotify('success', `🔄 Shift ${targetEmp.nama} ditukar antara tgl ${sourceDateStr.slice(8)} (${draggedCell.shiftName}) & tgl ${targetDateStr.slice(8)} (${targetShiftName}). Draf diperbarui!`);
        setDraggedCell(null);
        setDragOverTarget(null);
    };

    const handleDragEnd = () => {
        setDraggedCell(null);
        setDragOverTarget(null);
    };

    const handleSaveDndChanges = async () => {
        if (!hasUnsavedDndChanges) return;
        try {
            setGenerating(true);
            const bulkRows = schedules.map(s => {
                const shiftDef = unitShifts.find(u => u.name.toLowerCase() === s.shift_name?.toLowerCase());
                return {
                    unit_id: unitId,
                    employee_id: s.employee_id,
                    schedule_date: s.schedule_date,
                    shift_name: s.is_off_day ? 'Libur' : s.shift_name,
                    shift_start_time: s.is_off_day ? null : (shiftDef?.startTime || s.shift_start_time || '07:00'),
                    shift_end_time: s.is_off_day ? null : (shiftDef?.endTime || s.shift_end_time || '14:00'),
                    status: 'draft' as const,
                    is_off_day: s.is_off_day,
                    created_by: userId,
                };
            });

            const { error: upsertErr } = await supabase
                .from('employee_schedules')
                .upsert(bulkRows as any, { onConflict: 'employee_id,schedule_date' });
            if (upsertErr) throw upsertErr;

            onNotify('success', '✅ Perubahan draf geser-tukar shift berhasil disimpan ke server.');
            setHasUnsavedDndChanges(false);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal menyimpan pergeseran shift: ${err.message}`);
        } finally {
            setGenerating(false);
        }
    };

    return {
        draggedCell,
        dragOverTarget,
        hasUnsavedDndChanges,
        handleDragStart,
        handleDragOver,
        handleDrop,
        handleDragEnd,
        handleSaveDndChanges,
    };
};
