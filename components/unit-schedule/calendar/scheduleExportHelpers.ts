import * as XLSX from 'xlsx';
import { Employee, EmployeeSchedule, ShiftDefinition } from '../../../types.ts';
import { DayHeader } from './types.ts';

export const getShiftDurationHours = (shiftName: string, unitShifts: ShiftDefinition[]): number => {
    if (!shiftName || shiftName.toLowerCase() === 'libur' || shiftName.toLowerCase() === 'off') return 0;
    if (shiftName.toLowerCase().includes('oncall') || shiftName.toLowerCase().includes('on-call')) return 0;
    const def = unitShifts.find(s => s.name === shiftName);
    if (!def) return 8;

    if (def.type === 'rotating' && def.startTime && def.endTime) {
        const [startH, startM] = def.startTime.split(':').map(Number);
        const [endH, endM] = def.endTime.split(':').map(Number);
        let diffMs = (endH * 60 + endM) - (startH * 60 + startM);
        if (diffMs < 0) diffMs += 24 * 60;
        return diffMs / 60;
    }
    return 8;
};

export const exportScheduleToXLSX = (
    employees: Employee[],
    schedules: EmployeeSchedule[],
    scheduleGrid: Record<string, Record<string, EmployeeSchedule>>,
    dayHeaders: DayHeader[],
    unitShifts: ShiftDefinition[],
    monthLabel: string
) => {
    if (schedules.length === 0) return;

    const headers = ['No', 'NIK', 'Nama Karyawan', 'Jabatan'];
    dayHeaders.forEach(h => {
        headers.push(String(h.dayNum));
    });
    headers.push('Total Jam Kerja');

    const rows = employees.map((emp, index) => {
        const rowData: Record<string, any> = {
            'No': index + 1,
            'NIK': (emp as any).nik || '-',
            'Nama Karyawan': emp.nama,
            'Jabatan': emp.jabatan || '-',
        };

        let totalHours = 0;
        dayHeaders.forEach(h => {
            const sched = scheduleGrid[emp.id]?.[h.date];
            if (sched && !sched.is_off_day) {
                rowData[String(h.dayNum)] = sched.shift_name;
                totalHours += getShiftDurationHours(sched.shift_name, unitShifts);
            } else {
                rowData[String(h.dayNum)] = 'L'; // Libur
            }
        });

        rowData['Total Jam Kerja'] = `${totalHours} Jam`;
        return rowData;
    });

    const ws = XLSX.utils.json_to_sheet(rows, { header: headers });

    const colWidths = [
        { wch: 5 },  // No
        { wch: 15 }, // NIK
        { wch: 25 }, // Nama Karyawan
        { wch: 20 }, // Jabatan
    ];
    dayHeaders.forEach(() => {
        colWidths.push({ wch: 8 });
    });
    colWidths.push({ wch: 18 });
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal Dinas');
    const today = new Date().toISOString().split('T')[0];
    XLSX.writeFile(wb, `jadwal_dinas_${monthLabel.replace(/\s+/g, '_')}_${today}.xlsx`);
};

export const downloadScheduleExcelTemplate = (
    employees: Employee[],
    scheduleGrid: Record<string, Record<string, EmployeeSchedule>>,
    dayHeaders: DayHeader[],
    viewMonth: string
) => {
    const headers = ['NIK', 'Nama Karyawan', 'Jabatan', ...dayHeaders.map(h => String(h.dayNum))];
    const sampleRows = employees.map(emp => {
        const row: Record<string, any> = {
            'NIK': (emp as any).nik || (emp as any).ktpNumber || '',
            'Nama Karyawan': emp.nama,
            'Jabatan': emp.jabatan || '-',
        };
        dayHeaders.forEach(h => {
            const existing = scheduleGrid[emp.id]?.[h.date];
            row[String(h.dayNum)] = existing ? (existing.is_off_day ? 'OFF' : existing.shift_name) : (h.isWeekend ? 'OFF' : 'Pagi');
        });
        return row;
    });

    const ws = XLSX.utils.json_to_sheet(sampleRows, { header: headers });
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Jadwal_Bulanan');
    const [year, month] = viewMonth.split('-');
    XLSX.writeFile(wb, `Template_Jadwal_Bulanan_${month}_${year}.xlsx`);
};
