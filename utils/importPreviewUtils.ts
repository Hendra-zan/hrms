/**
 * Import Preview Validation Utilities
 * Validates data before showing in preview modal
 */

import { toSafeString } from './dateUtils';
import {
  getImportField,
  normalizeImportMaritalStatus,
} from './employeeImportUtils';

export interface PreviewValidation {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

const isValidEmail = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(value.trim()) && value.length <= 254;
};

const isValidNIK = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Optional
  return /^\d{11}$/.test(value.trim());
};

const isValidNPWP = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Optional
  const clean = value.trim().replace(/[.\-]/g, '');
  return /^\d{15}$/.test(clean);
};

const isValidPhone = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Optional
  const clean = value.trim().replace(/[\s\-\(\)\+]/g, '');
  return /^[\d]{10,15}$/.test(clean);
};

const isValidDate = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Optional
  const date = new Date(value);
  return !isNaN(date.getTime()) && date.getFullYear() > 1900 && date < new Date('2099-12-31');
};

const isFutureDate = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  const date = new Date(value);
  return date > new Date();
};

export const validatePreviewData = (row: any, rowNumber: number): PreviewValidation => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Nama
  const nama = toSafeString(getImportField(row, 'Nama', 'nama'));
  if (!nama || nama.trim() === '') {
    errors.push('Nama wajib diisi');
  } else if (nama.length < 2) {
    errors.push('Nama minimal 2 karakter');
  }

  // Optional: Email
  const rawEmail = toSafeString(getImportField(row, 'Email', 'email'));
  if (rawEmail) {
    if (!isValidEmail(rawEmail)) {
      errors.push(`Email tidak valid: ${rawEmail}`);
    }
  }

  // Optional: NIK
  const nik = toSafeString(getImportField(row, 'NIK', 'nik'));
  if (nik && !isValidNIK(nik)) {
    errors.push('Format NIK tidak valid (harus 11 digit angka)');
  }

  // Optional: NPWP (15 digit)
  const npwp = toSafeString(getImportField(row, 'NPWP', 'npwp'));
  if (npwp && !isValidNPWP(npwp)) {
    errors.push('NPWP harus 15 digit angka');
  }

  // Optional: Telepon
  const telepon = toSafeString(getImportField(row, 'Telepon', 'telepon'));
  if (telepon && !isValidPhone(telepon)) {
    warnings.push('Format telepon mungkin tidak valid');
  }

  // Optional: Tanggal Lahir
  const birthDate = toSafeString(getImportField(row, 'Tanggal_Lahir', 'TanggalLahir', 'Tanggal Lahir', 'birthDate'));
  if (birthDate) {
    if (!isValidDate(birthDate)) {
      errors.push('Tanggal lahir tidak valid');
    } else if (isFutureDate(birthDate)) {
      errors.push('Tanggal lahir tidak boleh di masa depan');
    }
  }

  // Optional: Tanggal Masuk
  const hireDate = toSafeString(getImportField(row, 'Tanggal_Masuk', 'TanggalMasuk', 'Tanggal Masuk', 'hireDate'));
  if (hireDate) {
    if (!isValidDate(hireDate)) {
      errors.push('Tanggal masuk tidak valid');
    } else if (isFutureDate(hireDate)) {
      warnings.push('Tanggal masuk di masa depan');
    }
  }

  // Optional: Gaji
  const gaji = getImportField(row, 'Gaji_Pokok', 'GajiPokok', 'Gaji Pokok', 'gajiPokok');
  if (gaji !== '' && gaji !== undefined && gaji !== null) {
    const gajiNum = Number(gaji);
    if (isNaN(gajiNum) || gajiNum < 0) {
      errors.push('Gaji pokok tidak valid (harus angka positif)');
    } else if (gajiNum > 1000000000) {
      warnings.push('Gaji pokok terlalu besar (> 1M)');
    }
  }

  // Optional: Tunjangan
  const tunjangan = getImportField(row, 'Tunjangan_Profesi', 'TunjanganProfesi', 'Tunjangan Profesi', 'tunjanganProfesi');
  if (tunjangan !== '' && tunjangan !== undefined && tunjangan !== null) {
    const tunjanganNum = Number(tunjangan);
    if (isNaN(tunjanganNum) || tunjanganNum < 0) {
      errors.push('Tunjangan tidak valid (harus angka positif)');
    }
  }

  // Optional: Status
  const status = toSafeString(getImportField(row, 'Status', 'status'));
  if (status) {
    const validStatuses = ['aktif', 'cuti', 'non-aktif', 'nonaktif'];
    if (!validStatuses.includes(status.toLowerCase())) {
      warnings.push(`Status "${status}" akan dikonversi ke "Aktif"`);
    }
  }

  // Optional: Status Nikah
  const maritalStatus = toSafeString(getImportField(row, 'Status_Nikah', 'StatusNikah', 'Status Nikah', 'maritalStatus'));
  if (maritalStatus) {
    const normalized = normalizeImportMaritalStatus(maritalStatus);
    if (normalized === 'Single' && maritalStatus.toLowerCase() !== 'single' && maritalStatus !== '') {
      // Was normalized to Single, but input wasn't 'single'
      // This is fine, just a normalization
    }
  }

  // Optional: Jumlah Tanggungan
  const dependents = getImportField(row, 'Jumlah_Tanggungan', 'JumlahTanggungan', 'Jumlah Tanggungan', 'dependents');
  if (dependents !== '' && dependents !== undefined && dependents !== null) {
    const depsNum = Number(dependents);
    if (isNaN(depsNum) || depsNum < 0 || depsNum > 20 || !Number.isInteger(depsNum)) {
      errors.push('Jumlah tanggungan tidak valid (0-20)');
    }
  }

  // Optional: Unit Kerja (warning if not found, but not error)
  const unitKerja = toSafeString(getImportField(row, 'Unit_Kerja', 'UnitKerja', 'Unit Kerja', 'unitKerjaId'));
  // We can't validate against DB here, so this will be checked during actual import

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
};

/**
 * Generate preview data from imported rows
 * Limit to first N rows for performance
 */
export const generatePreview = (
  importedData: any[],
  limit: number = 10
): { rowNumber: number; data: any; validation: PreviewValidation }[] => {
  return importedData.slice(0, limit).map((row, index) => ({
    rowNumber: index + 2, // +2 because row 1 is header
    data: row,
    validation: validatePreviewData(row, index + 2),
  }));
};
