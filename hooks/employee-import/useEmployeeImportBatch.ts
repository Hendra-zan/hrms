import { useCallback } from 'react';
import { getAuthHeaders } from '../../utils/apiUtils.ts';
import { toSafeString } from '../../utils/dateUtils.ts';
import {
  hasMeaningfulImportContent,
  validateRequiredImportFields,
  ImportValidationError,
} from '../../utils/employeeImportUtils.ts';
import { mapEmployeeFromDatabase } from '../../utils/dataMapping.ts';
import type { Employee } from '../../types.ts';
import { BATCH_SIZE, ImportOptions } from './types.ts';

interface ProcessBatchParams {
  batchData: any[];
  batchNumber: number;
  totalBatches: number;
  unitNameMap: Map<string, string>;
  options?: ImportOptions;
  parseEmployeeRow: (row: any, index: number, unitNameMap: Map<string, string>) => any | null;
  getField: (row: any, ...keys: string[]) => any;
}

export const useEmployeeImportBatch = () => {
  const processBatch = useCallback(async ({
    batchData,
    batchNumber,
    unitNameMap,
    options,
    parseEmployeeRow,
    getField,
  }: ProcessBatchParams): Promise<{
    success: number;
    skipped: number;
    errors: number;
    errorRows: ImportValidationError[];
    importedEmployees: Employee[];
  }> => {
    const errorRows: ImportValidationError[] = [];
    const importedEmployees: Employee[] = [];
    const validEmployees: any[] = [];

    // Parse and validate each row
    for (let i = 0; i < batchData.length; i++) {
      const row = batchData[i];
      const rowNumber = (batchNumber - 1) * BATCH_SIZE + i + 2;

      if (!hasMeaningfulImportContent(row)) continue;

      const requiredValidation = validateRequiredImportFields(row);
      if (!requiredValidation.valid) {
        errorRows.push({
          baris: rowNumber,
          nama: requiredValidation.nama,
          email: requiredValidation.email,
          nik: toSafeString(getField(row, 'NIK', 'nik')),
          kategori: 'ERROR',
          error: requiredValidation.error,
        });
        continue;
      }

      const parsed = parseEmployeeRow(row, i, unitNameMap);
      if (parsed) {
        validEmployees.push({ rowNumber, data: parsed, raw: row });
      }
    }

    if (validEmployees.length > 0) {
      console.info(`Processing ${validEmployees.length} employees via create_employee_import...`);

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      const authHeaders = await getAuthHeaders();

      for (const item of validEmployees) {
        try {
          await delay(50);
          const response = await fetch('/api/employees', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              ...authHeaders,
            },
            body: JSON.stringify({
              employeeData: item.data,
              updateExisting: options?.updateExisting,
            }),
          });

          const result = await response.json().catch(() => null);

          if (!response.ok || !result?.success) {
            const errMsg = result?.error || 'Gagal memproses baris';
            if (
              errMsg.includes('already exists') ||
              errMsg.includes('sudah terdaftar') ||
              errMsg.includes('duplicate') ||
              response.status === 409
            ) {
              skipCount++;
              errorRows.push({
                baris: item.rowNumber,
                nama: item.data.nama,
                email: item.data.email,
                nik: item.data.nik,
                kategori: 'SKIP',
                error: 'Data sudah terdaftar',
              });
            } else {
              errorCount++;
              errorRows.push({
                baris: item.rowNumber,
                nama: item.data.nama,
                email: item.data.email,
                nik: item.data.nik,
                kategori: 'ERROR',
                error: errMsg,
              });
            }
          } else if (result?.data) {
            successCount++;
            const employeeWithCompensation = mapEmployeeFromDatabase(result.data);
            importedEmployees.push(employeeWithCompensation);
          }
        } catch (e: any) {
          errorCount++;
          errorRows.push({
            baris: item.rowNumber,
            nama: item.data.nama,
            email: item.data.email,
            nik: item.data.nik,
            kategori: 'ERROR',
            error: e.message || 'Gagal memproses baris',
          });
        }
      }

      return { success: successCount, skipped: skipCount, errors: errorCount, errorRows, importedEmployees };
    }

    return { success: 0, skipped: 0, errors: errorRows.length, errorRows, importedEmployees };
  }, []);

  return { processBatch };
};
