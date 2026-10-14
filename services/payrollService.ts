import { Employee, AttendanceRecord, Payslip, SystemSettings } from '../types.ts';

// Default rates (can be overridden via SystemSettings)
const DEFAULT_BPJS_KESEHATAN_RATE = 0.01;               // 1% for employee
const DEFAULT_BPJS_KESEHATAN_MAX_WAGE = 12000000;       // Cap: Rp 12 juta
// BPJS Ketenagakerjaan (employee portion)
// JHT = 2%, JP = 1% (capped at wage ceiling) — per PP 46/2015 & PP 35/2021
const DEFAULT_JHT_RATE = 0.02;                          // Jaminan Hari Tua
const DEFAULT_JP_RATE = 0.01;                           // Jaminan Pensiun
const DEFAULT_JP_MAX_WAGE = 9077600;                    // JP wage ceiling 2024
const DEFAULT_OVERTIME_RATE_PER_HOUR = 30000;

export interface PayrollConfig {
    overtimeRatePerHour: number;
    bpjsKesehatanRate: number;
    bpjsKesehatanMaxWage: number;
    jhtRate: number;
    jpRate: number;
    jpMaxWage: number;
    useTERTaxMethod?: boolean; // PPh21 TER per PP 58/2023
}

/** Build payroll config from SystemSettings, fallback to defaults */
export function buildPayrollConfig(settings?: Partial<SystemSettings> | null): PayrollConfig {
    return {
        overtimeRatePerHour:  settings?.overtime_rate_per_hour  ?? DEFAULT_OVERTIME_RATE_PER_HOUR,
        bpjsKesehatanRate:    settings?.bpjs_kesehatan_rate     ?? DEFAULT_BPJS_KESEHATAN_RATE,
        bpjsKesehatanMaxWage: settings?.bpjs_kesehatan_max_wage ?? DEFAULT_BPJS_KESEHATAN_MAX_WAGE,
        jhtRate:              DEFAULT_JHT_RATE,
        jpRate:               DEFAULT_JP_RATE,
        jpMaxWage:            DEFAULT_JP_MAX_WAGE,
        useTERTaxMethod:      true, // Aktifkan TER PP 58/2023 sebagai default
    };
}

// Calculate PTKP (Penghasilan Tidak Kena Pajak)
const getPTKP = (employee: Employee): number => {
    const basePTKP = 54000000; // TK/0 (Single)
    let ptkp = basePTKP;

    if (employee.maritalStatus === 'Married') {
        ptkp += 4500000; // Additional for married
    }

    const dependents = Math.min(employee.dependents || 0, 3);
    ptkp += dependents * 4500000; // Max 3 dependents

    return ptkp;
};

/**
 * Penentuan Kategori TER (Tarif Efektif Rata-Rata) PPh 21 PP 58/2023
 * - Kategori A: TK/0, TK/1, K/0
 * - Kategori B: TK/2, TK/3, K/1, K/2
 * - Kategori C: K/3
 */
export const getTERCategory = (employee: Employee): 'A' | 'B' | 'C' => {
    const isMarried = employee.maritalStatus === 'Married';
    const dependents = Math.min(employee.dependents || 0, 3);

    if (!isMarried) {
        // TK/0, TK/1 => A; TK/2, TK/3 => B
        return dependents <= 1 ? 'A' : 'B';
    } else {
        // K/0 => A; K/1, K/2 => B; K/3 => C
        if (dependents === 0) return 'A';
        if (dependents <= 2) return 'B';
        return 'C';
    }
};

/**
 * Tabel Tarif Efektif Rata-Rata (TER) Bulanan PPh 21 (PP 58/2023 / PMK 168/2023)
 */
const TER_TABLE_A: Array<{ maxGross: number; rate: number }> = [
    { maxGross: 5400000, rate: 0.00 },
    { maxGross: 5650000, rate: 0.0025 },
    { maxGross: 5950000, rate: 0.005 },
    { maxGross: 6300000, rate: 0.0075 },
    { maxGross: 6750000, rate: 0.01 },
    { maxGross: 7500000, rate: 0.0125 },
    { maxGross: 8550000, rate: 0.015 },
    { maxGross: 9650000, rate: 0.0175 },
    { maxGross: 10050000, rate: 0.02 },
    { maxGross: 10350000, rate: 0.0225 },
    { maxGross: 10700000, rate: 0.025 },
    { maxGross: 11500000, rate: 0.03 },
    { maxGross: 12500000, rate: 0.04 },
    { maxGross: 13750000, rate: 0.05 },
    { maxGross: 15100000, rate: 0.06 },
    { maxGross: 16950000, rate: 0.07 },
    { maxGross: 19750000, rate: 0.08 },
    { maxGross: 24150000, rate: 0.09 },
    { maxGross: 26450000, rate: 0.10 },
    { maxGross: 28000000, rate: 0.11 },
    { maxGross: 30050000, rate: 0.12 },
    { maxGross: 32400000, rate: 0.13 },
    { maxGross: 35400000, rate: 0.14 },
    { maxGross: 39100000, rate: 0.15 },
    { maxGross: 43850000, rate: 0.16 },
    { maxGross: 47800000, rate: 0.17 },
    { maxGross: 51400000, rate: 0.18 },
    { maxGross: 56300000, rate: 0.19 },
    { maxGross: 62200000, rate: 0.20 },
    { maxGross: 68600000, rate: 0.21 },
    { maxGross: 77500000, rate: 0.22 },
    { maxGross: 89000000, rate: 0.23 },
    { maxGross: 103000000, rate: 0.24 },
    { maxGross: 125000000, rate: 0.25 },
    { maxGross: 157000000, rate: 0.26 },
    { maxGross: 206000000, rate: 0.27 },
    { maxGross: 337000000, rate: 0.28 },
    { maxGross: 454000000, rate: 0.29 },
    { maxGross: 550000000, rate: 0.30 },
    { maxGross: 695000000, rate: 0.31 },
    { maxGross: 910000000, rate: 0.32 },
    { maxGross: 1400000000, rate: 0.33 },
    { maxGross: Infinity, rate: 0.34 },
];

const TER_TABLE_B: Array<{ maxGross: number; rate: number }> = [
    { maxGross: 6200000, rate: 0.00 },
    { maxGross: 6500000, rate: 0.0025 },
    { maxGross: 6850000, rate: 0.005 },
    { maxGross: 7300000, rate: 0.0075 },
    { maxGross: 9200000, rate: 0.015 },
    { maxGross: 10750000, rate: 0.02 },
    { maxGross: 11250000, rate: 0.025 },
    { maxGross: 12300000, rate: 0.03 },
    { maxGross: 13300000, rate: 0.04 },
    { maxGross: 14650000, rate: 0.05 },
    { maxGross: 16000000, rate: 0.06 },
    { maxGross: 17850000, rate: 0.07 },
    { maxGross: 20850000, rate: 0.08 },
    { maxGross: 25400000, rate: 0.09 },
    { maxGross: 27850000, rate: 0.10 },
    { maxGross: 29700000, rate: 0.11 },
    { maxGross: 31750000, rate: 0.12 },
    { maxGross: 34150000, rate: 0.13 },
    { maxGross: 37300000, rate: 0.14 },
    { maxGross: 41150000, rate: 0.15 },
    { maxGross: 45900000, rate: 0.16 },
    { maxGross: 50000000, rate: 0.17 },
    { maxGross: 53800000, rate: 0.18 },
    { maxGross: 58800000, rate: 0.19 },
    { maxGross: 64900000, rate: 0.20 },
    { maxGross: 71500000, rate: 0.21 },
    { maxGross: 80650000, rate: 0.22 },
    { maxGross: 92400000, rate: 0.23 },
    { maxGross: 106850000, rate: 0.24 },
    { maxGross: 129750000, rate: 0.25 },
    { maxGross: 162900000, rate: 0.26 },
    { maxGross: 213700000, rate: 0.27 },
    { maxGross: 349750000, rate: 0.28 },
    { maxGross: 471050000, rate: 0.29 },
    { maxGross: 570750000, rate: 0.30 },
    { maxGross: 721200000, rate: 0.31 },
    { maxGross: 944300000, rate: 0.32 },
    { maxGross: 1453000000, rate: 0.33 },
    { maxGross: Infinity, rate: 0.34 },
];

const TER_TABLE_C: Array<{ maxGross: number; rate: number }> = [
    { maxGross: 6600000, rate: 0.00 },
    { maxGross: 6950000, rate: 0.0025 },
    { maxGross: 7350000, rate: 0.005 },
    { maxGross: 7800000, rate: 0.0075 },
    { maxGross: 8850000, rate: 0.01 },
    { maxGross: 9800000, rate: 0.0125 },
    { maxGross: 10950000, rate: 0.0175 },
    { maxGross: 11200000, rate: 0.02 },
    { maxGross: 12050000, rate: 0.025 },
    { maxGross: 12950000, rate: 0.03 },
    { maxGross: 14150000, rate: 0.04 },
    { maxGross: 15550000, rate: 0.05 },
    { maxGross: 17050000, rate: 0.06 },
    { maxGross: 19000000, rate: 0.07 },
    { maxGross: 22200000, rate: 0.08 },
    { maxGross: 26950000, rate: 0.09 },
    { maxGross: 29550000, rate: 0.10 },
    { maxGross: 31400000, rate: 0.11 },
    { maxGross: 33650000, rate: 0.12 },
    { maxGross: 36100000, rate: 0.13 },
    { maxGross: 39400000, rate: 0.14 },
    { maxGross: 43450000, rate: 0.15 },
    { maxGross: 48450000, rate: 0.16 },
    { maxGross: 52750000, rate: 0.17 },
    { maxGross: 56750000, rate: 0.18 },
    { maxGross: 62050000, rate: 0.19 },
    { maxGross: 68500000, rate: 0.20 },
    { maxGross: 75450000, rate: 0.21 },
    { maxGross: 85100000, rate: 0.22 },
    { maxGross: 97500000, rate: 0.23 },
    { maxGross: 112700000, rate: 0.24 },
    { maxGross: 136850000, rate: 0.25 },
    { maxGross: 171800000, rate: 0.26 },
    { maxGross: 225350000, rate: 0.27 },
    { maxGross: 368800000, rate: 0.28 },
    { maxGross: 496700000, rate: 0.29 },
    { maxGross: 601750000, rate: 0.30 },
    { maxGross: 760450000, rate: 0.31 },
    { maxGross: 995600000, rate: 0.32 },
    { maxGross: 1532000000, rate: 0.33 },
    { maxGross: Infinity, rate: 0.34 },
];

/** Hitung Potongan PPh 21 Bulanan dengan Metode TER (PP 58/2023) */
export const calculatePPh21MonthlyTER = (totalPendapatan: number, employee: Employee): number => {
    if (totalPendapatan <= 0) return 0;
    const category = getTERCategory(employee);
    const table = category === 'A' ? TER_TABLE_A : category === 'B' ? TER_TABLE_B : TER_TABLE_C;

    const row = table.find(r => totalPendapatan <= r.maxGross) || table[table.length - 1];
    return Math.round(totalPendapatan * row.rate);
};

// Calculate Progressive PPh21 (Annualized Fallback)
const calculateAnnualPPh21 = (pkp: number): number => {
    if (pkp <= 0) return 0;
    
    let tax = 0;
    let remainingPkp = Math.floor(pkp / 1000) * 1000;

    if (remainingPkp > 5000000000) {
        tax += (remainingPkp - 5000000000) * 0.35;
        remainingPkp = 5000000000;
    }
    if (remainingPkp > 500000000) {
        tax += (remainingPkp - 500000000) * 0.30;
        remainingPkp = 500000000;
    }
    if (remainingPkp > 250000000) {
        tax += (remainingPkp - 250000000) * 0.25;
        remainingPkp = 250000000;
    }
    if (remainingPkp > 60000000) {
        tax += (remainingPkp - 60000000) * 0.15;
        remainingPkp = 60000000;
    }
    if (remainingPkp > 0) {
        tax += remainingPkp * 0.05;
    }

    return tax;
};

export const calculatePayslip = (
    employee: Employee,
    attendanceForPeriod: AttendanceRecord[],
    period: string,
    config?: PayrollConfig
): Payslip => {
    const { compensation } = employee;

    if (!compensation) {
        throw new Error(`Data kompensasi tidak ditemukan untuk karyawan ${employee.nama}`);
    }

    const cfg = config || buildPayrollConfig(null);
    const { gajiPokok, tunjanganProfesi } = compensation;

    // Calculate total overtime hours for the period
    const totalOvertime = attendanceForPeriod.reduce((acc, record) => acc + (record.overtimeHours || 0), 0);
    const upahLembur = totalOvertime * cfg.overtimeRatePerHour;

    const totalPendapatan = gajiPokok + tunjanganProfesi + upahLembur;

    // ── BPJS Kesehatan ──────────────────────────────────────────────────────
    const bpjsWageBase = Math.min(gajiPokok, cfg.bpjsKesehatanMaxWage);
    const potonganBPJSKesehatan = Math.round(bpjsWageBase * cfg.bpjsKesehatanRate);

    // ── BPJS Ketenagakerjaan ─────────────────────────────────────────────────
    const potonganJHT = Math.round(gajiPokok * cfg.jhtRate);
    const jpWageBase = Math.min(gajiPokok, cfg.jpMaxWage);
    const potonganJP = Math.round(jpWageBase * cfg.jpRate);
    const potonganBPJSKetenagakerjaan = potonganJHT + potonganJP;

    // ── PPh 21 Calculation (Metode TER PP 58/2023 atau Progresif) ─────────────
    let potonganPPh21 = 0;
    if (cfg.useTERTaxMethod !== false) {
        // Menggunakan metode TER PP 58/2023 terbaru
        potonganPPh21 = calculatePPh21MonthlyTER(totalPendapatan, employee);
    } else {
        // Metode tahunan progresif standar
        const annualGrossIncome = totalPendapatan * 12;
        const biayaJabatanAnnual = Math.min(annualGrossIncome * 0.05, 6_000_000);
        const annualBPJSDeductible = (potonganBPJSKesehatan + potonganBPJSKetenagakerjaan) * 12;
        const annualNetIncome = annualGrossIncome - biayaJabatanAnnual - annualBPJSDeductible;
        const ptkp = getPTKP(employee);
        const pkp = Math.max(annualNetIncome - ptkp, 0);

        const annualPPh21 = calculateAnnualPPh21(pkp);
        potonganPPh21 = Math.round(annualPPh21 / 12);
    }

    const potonganBPJS = potonganBPJSKesehatan;

    const totalPotongan = potonganPPh21 + potonganBPJS + potonganBPJSKetenagakerjaan;
    const gajiBersih = totalPendapatan - totalPotongan;

    const safePeriodStr = typeof period === 'string' ? period : String(period || '');
    const formattedPeriodId = safePeriodStr.replace(/\s+/g, '-');

    return {
        id: `payslip-${employee.id}-${formattedPeriodId}`,
        employeeId: employee.id,
        periode: safePeriodStr,
        gajiPokok,
        tunjanganProfesi,
        upahLembur,
        totalPendapatan,
        potonganPPh21,
        potonganBPJS,
        potonganBPJSKesehatan,
        potonganBPJSKetenagakerjaan,
        potonganJHT,
        potonganJP,
        totalPotongan,
        gajiBersih,
    };
};