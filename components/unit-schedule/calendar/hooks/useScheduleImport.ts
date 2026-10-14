import { useState } from 'react';
import * as XLSX from 'xlsx';
import { Employee, ShiftDefinition } from '../../../../types.ts';
import { ImportDataState } from '../types.ts';
import { supabase } from '../../../../services/supabaseClient.ts';

interface UseScheduleImportProps {
    unitId: string;
    userId: string;
    unitShifts: ShiftDefinition[];
    employees: Employee[];
    viewMonth: string;
    daysInMonth: number;
    onNotify: (type: 'success' | 'error', text: string) => void;
    loadData: () => Promise<void>;
}

export const useScheduleImport = ({
    unitId,
    userId,
    unitShifts,
    employees,
    viewMonth,
    daysInMonth,
    onNotify,
    loadData,
}: UseScheduleImportProps) => {
    const [showImportModal, setShowImportModal] = useState(false);
    const [importing, setImporting] = useState(false);
    const [importData, setImportData] = useState<ImportDataState | null>(null);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data: any[] = XLSX.utils.sheet_to_json(ws);

                if (data.length === 0) {
                    onNotify('error', 'File Excel kosong.');
                    return;
                }

                const parsedSchedules: ImportDataState['parsedSchedules'] = [];
                const errors: string[] = [];
                let matchedEmpCount = 0;
                const [year, month] = viewMonth.split('-').map(Number);

                data.forEach((row, idx) => {
                    const nik = String(row['NIK'] || '').trim();
                    const nama = String(row['Nama Karyawan'] || row['Nama'] || '').trim();

                    const emp = employees.find(e =>
                        (nik && ((e as any).nik === nik || (e as any).ktpNumber === nik)) ||
                        (nama && e.nama.toLowerCase() === nama.toLowerCase())
                    );

                    if (!emp) {
                        errors.push(`Baris ${idx + 2}: Karyawan "${nama || nik}" tidak ditemukan di unit ini.`);
                        return;
                    }

                    matchedEmpCount++;

                    for (let d = 1; d <= daysInMonth; d++) {
                        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
                        const rawShift = String(row[String(d)] || row[d] || '').trim();
                        if (!rawShift) continue;

                        const isOff = rawShift.toUpperCase() === 'OFF' || rawShift.toLowerCase() === 'libur' || rawShift.toUpperCase() === 'L';
                        const matchedShift = unitShifts.find(s => s.name.toLowerCase() === rawShift.toLowerCase());
                        const shiftName = matchedShift ? matchedShift.name : (isOff ? 'Libur' : rawShift);

                        parsedSchedules.push({
                            employeeId: emp.id,
                            employeeNama: emp.nama,
                            date: dateStr,
                            shiftName: shiftName,
                            isOff: isOff,
                        });
                    }
                });

                setImportData({
                    matchedEmpCount,
                    parsedSchedules,
                    errors,
                });
            } catch (err: any) {
                onNotify('error', `Gagal membaca file Excel: ${err.message}`);
            }
        };
        reader.readAsBinaryString(file);
    };

    const handleSaveImportedSchedules = async () => {
        if (!importData || importData.parsedSchedules.length === 0) return;
        try {
            setImporting(true);
            const bulkPayload = importData.parsedSchedules.map(item => {
                const shiftDef = unitShifts.find(s => s.name === item.shiftName);
                return {
                    unit_id: unitId,
                    employee_id: item.employeeId,
                    schedule_date: item.date,
                    shift_name: item.isOff ? 'Libur' : item.shiftName,
                    shift_start_time: shiftDef?.startTime || null,
                    shift_end_time: shiftDef?.endTime || null,
                    status: 'draft' as const,
                    is_off_day: item.isOff,
                    created_by: userId,
                };
            });

            const { error: upsertErr } = await supabase
                .from('employee_schedules')
                .upsert(bulkPayload as any, { onConflict: 'employee_id,schedule_date' });
            if (upsertErr) throw upsertErr;

            onNotify('success', `✅ Berhasil meng-import ${bulkPayload.length} jadwal dari Excel.`);
            setShowImportModal(false);
            setImportData(null);
            await loadData();
        } catch (err: any) {
            onNotify('error', `Gagal menyimpan jadwal import: ${err.message}`);
        } finally {
            setImporting(false);
        }
    };

    return {
        showImportModal,
        setShowImportModal,
        importing,
        importData,
        setImportData,
        handleFileUpload,
        handleSaveImportedSchedules,
    };
};
