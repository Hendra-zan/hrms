/**
 * indonesianHolidays.ts
 * Daftar Hari Libur Nasional & Cuti Bersama Indonesia
 * Sumber: SKB 3 Menteri / Keppres
 */

export interface NationalHoliday {
    date: string;   // Format: 'YYYY-MM-DD'
    name: string;   // Nama hari libur
    type: 'libur_nasional' | 'cuti_bersama';
}

export const INDONESIAN_HOLIDAYS_2025: NationalHoliday[] = [
    { date: '2025-01-01', name: 'Tahun Baru 2025', type: 'libur_nasional' },
    { date: '2025-01-27', name: 'Isra Miraj Nabi Muhammad SAW', type: 'libur_nasional' },
    { date: '2025-01-28', name: 'Cuti Bersama Isra Miraj', type: 'cuti_bersama' },
    { date: '2025-01-29', name: 'Tahun Baru Imlek 2576', type: 'libur_nasional' },
    { date: '2025-03-29', name: 'Hari Suci Nyepi (Tahun Baru Saka 1947)', type: 'libur_nasional' },
    { date: '2025-03-31', name: 'Idul Fitri 1446 H', type: 'libur_nasional' },
    { date: '2025-04-01', name: 'Idul Fitri 1446 H (Hari ke-2)', type: 'libur_nasional' },
    { date: '2025-04-02', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2025-04-03', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2025-04-04', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2025-04-07', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2025-04-18', name: 'Wafat Isa Al-Masih (Good Friday)', type: 'libur_nasional' },
    { date: '2025-05-01', name: 'Hari Buruh Internasional', type: 'libur_nasional' },
    { date: '2025-05-12', name: 'Hari Raya Waisak 2569 BE', type: 'libur_nasional' },
    { date: '2025-05-13', name: 'Cuti Bersama Waisak', type: 'cuti_bersama' },
    { date: '2025-05-29', name: 'Kenaikan Isa Al-Masih', type: 'libur_nasional' },
    { date: '2025-06-01', name: 'Hari Lahir Pancasila', type: 'libur_nasional' },
    { date: '2025-06-06', name: 'Idul Adha 1446 H', type: 'libur_nasional' },
    { date: '2025-06-27', name: 'Tahun Baru Islam 1447 H', type: 'libur_nasional' },
    { date: '2025-08-17', name: 'Hari Kemerdekaan Republik Indonesia', type: 'libur_nasional' },
    { date: '2025-09-05', name: 'Maulid Nabi Muhammad SAW', type: 'libur_nasional' },
    { date: '2025-12-25', name: 'Hari Raya Natal', type: 'libur_nasional' },
    { date: '2025-12-26', name: 'Cuti Bersama Natal', type: 'cuti_bersama' },
];

export const INDONESIAN_HOLIDAYS_2026: NationalHoliday[] = [
    { date: '2026-01-01', name: 'Tahun Baru 2026', type: 'libur_nasional' },
    { date: '2026-01-17', name: 'Isra Miraj Nabi Muhammad SAW', type: 'libur_nasional' },
    { date: '2026-02-17', name: 'Tahun Baru Imlek 2577', type: 'libur_nasional' },
    { date: '2026-03-19', name: 'Hari Suci Nyepi (Tahun Baru Saka 1948)', type: 'libur_nasional' },
    { date: '2026-03-20', name: 'Idul Fitri 1447 H', type: 'libur_nasional' },
    { date: '2026-03-21', name: 'Idul Fitri 1447 H (Hari ke-2)', type: 'libur_nasional' },
    { date: '2026-03-23', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2026-03-24', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2026-03-25', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2026-03-26', name: 'Cuti Bersama Idul Fitri', type: 'cuti_bersama' },
    { date: '2026-04-02', name: 'Wafat Isa Al-Masih (Good Friday)', type: 'libur_nasional' },
    { date: '2026-05-01', name: 'Hari Buruh Internasional', type: 'libur_nasional' },
    { date: '2026-05-14', name: 'Kenaikan Isa Al-Masih', type: 'libur_nasional' },
    { date: '2026-05-26', name: 'Hari Raya Waisak 2570 BE', type: 'libur_nasional' },
    { date: '2026-05-27', name: 'Idul Adha 1447 H', type: 'libur_nasional' },
    { date: '2026-06-01', name: 'Hari Lahir Pancasila', type: 'libur_nasional' },
    { date: '2026-06-17', name: 'Tahun Baru Islam 1448 H', type: 'libur_nasional' },
    { date: '2026-08-17', name: 'Hari Kemerdekaan Republik Indonesia', type: 'libur_nasional' },
    { date: '2026-08-25', name: 'Maulid Nabi Muhammad SAW', type: 'libur_nasional' },
    { date: '2026-12-24', name: 'Cuti Bersama Natal', type: 'cuti_bersama' },
    { date: '2026-12-25', name: 'Hari Raya Natal', type: 'libur_nasional' },
];

export const ALL_INDONESIAN_HOLIDAYS: NationalHoliday[] = [
    ...INDONESIAN_HOLIDAYS_2025,
    ...INDONESIAN_HOLIDAYS_2026,
];

export function getHolidayInfo(dateStr: string): NationalHoliday | null {
    return ALL_INDONESIAN_HOLIDAYS.find(h => h.date === dateStr) || null;
}

export function getHolidaysInMonth(yearMonth: string): NationalHoliday[] {
    return ALL_INDONESIAN_HOLIDAYS.filter(h => h.date.startsWith(yearMonth));
}
