import type { Employee } from '../../types.ts';
import type { ImportValidationError } from '../../utils/employeeImportUtils.ts';

export const BATCH_SIZE = 100;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const isUuid = (value: string) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(String(value || '').trim());

export const isValidEmail = (value: string): boolean => {
  if (!value || value.trim() === '') return false;
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  return emailRegex.test(value.trim()) && value.length <= 254;
};

export const isValidNIK = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Optional field
  const nik = value.trim();
  return /^\d{11}$/.test(nik);
};

export const isValidNPWP = (value: string): boolean => {
  if (!value || value.trim() === '') return true; // Optional field
  const npwp = value.trim().replace(/[.\-]/g, '');
  return /^\d{15}$/.test(npwp);
};

export const sanitizeInput = (value: string): string => {
  if (!value) return '';
  return value
    .trim()
    .replace(/[<>]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
};

export interface ImportProgress {
  status: 'idle' | 'validating' | 'processing' | 'completed' | 'error';
  totalRows: number;
  processedRows: number;
  currentBatch: number;
  totalBatches: number;
  successCount: number;
  skipCount: number;
  errorCount: number;
  message?: string;
}

export interface ImportResult {
  success: boolean;
  sessionId?: string;
  summary: {
    total: number;
    success: number;
    skipped: number;
    errors: number;
  };
  errors: ImportValidationError[];
  importedEmployees?: Employee[];
}

export interface ImportOptions {
  skipDuplicates?: boolean;
  updateExisting?: boolean;
  onProgress?: (progress: ImportProgress) => void;
}
