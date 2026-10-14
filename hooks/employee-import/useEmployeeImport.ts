import { useCallback } from 'react';
import { useAppData, useAppDataActions } from '../../stores/appStore.ts';
import { useMessageHandlers } from '../useMessageHandlers.ts';
import {
  validateImportInternalDuplicates,
  ImportValidationError,
} from '../../utils/employeeImportUtils.ts';
import type { Employee } from '../../types.ts';
import {
  BATCH_SIZE,
  ImportResult,
  ImportOptions,
} from './types.ts';
import { useEmployeeImportRowParser } from './useEmployeeImportRowParser.ts';
import { useEmployeeImportBatch } from './useEmployeeImportBatch.ts';

export const useEmployeeImport = () => {
  const { setEmployees } = useAppDataActions();
  const { showSuccess, showError } = useMessageHandlers();

  const {
    getField,
    normalizeMaritalStatus,
    downloadErrorReport,
    checkSchemaSupport,
    fetchUnits,
    parseEmployeeRow,
    validateFile,
  } = useEmployeeImportRowParser(showError);

  const { processBatch } = useEmployeeImportBatch();

  const validateInternalDuplicates = useCallback(
    (importedData: any[]) => validateImportInternalDuplicates(importedData),
    []
  );

  const handleImportEmployees = useCallback(
    async (importedData: any[], options?: ImportOptions): Promise<ImportResult> => {
      const result: ImportResult = {
        success: false,
        summary: { total: 0, success: 0, skipped: 0, errors: 0 },
        errors: [],
        importedEmployees: [],
      };

      try {
        await checkSchemaSupport();

        const { errors: duplicateErrors, errorRows: duplicateErrorRows } = validateInternalDuplicates(importedData);
        if (duplicateErrors.length > 0) {
          downloadErrorReport(duplicateErrorRows);
          showError(
            'Validasi import gagal',
            `Ditemukan ${duplicateErrors.length} data duplikat dalam file. Silakan perbaiki dan coba lagi.`
          );
          result.errors = duplicateErrorRows;
          return result;
        }

        options?.onProgress?.({
          status: 'processing',
          totalRows: importedData.length,
          processedRows: 0,
          currentBatch: 0,
          totalBatches: Math.ceil(importedData.length / BATCH_SIZE),
          successCount: 0,
          skipCount: 0,
          errorCount: 0,
          message: 'Memproses data...',
        });

        const unitNameMap = await fetchUnits();
        const totalBatches = Math.ceil(importedData.length / BATCH_SIZE);
        let totalSuccess = 0;
        let totalSkipped = 0;
        let totalErrors = 0;
        const allErrorRows: ImportValidationError[] = [];
        const allImportedEmployees: Employee[] = [];

        for (let batchNum = 1; batchNum <= totalBatches; batchNum++) {
          const startIdx = (batchNum - 1) * BATCH_SIZE;
          const endIdx = Math.min(startIdx + BATCH_SIZE, importedData.length);
          const batch = importedData.slice(startIdx, endIdx);

          const batchResult = await processBatch({
            batchData: batch,
            batchNumber: batchNum,
            totalBatches,
            unitNameMap,
            options,
            parseEmployeeRow,
            getField,
          });

          totalSuccess += batchResult.success;
          totalSkipped += batchResult.skipped;
          totalErrors += batchResult.errors;
          allErrorRows.push(...batchResult.errorRows);
          allImportedEmployees.push(...batchResult.importedEmployees);

          options?.onProgress?.({
            status: 'processing',
            totalRows: importedData.length,
            processedRows: Math.min(endIdx, importedData.length),
            currentBatch: batchNum,
            totalBatches,
            successCount: totalSuccess,
            skipCount: totalSkipped,
            errorCount: totalErrors,
            message: `Memproses batch ${batchNum}/${totalBatches}...`,
          });
        }

        if (allImportedEmployees.length > 0) {
          setEmployees((prev) => {
            const updatedMap = new Map(prev.map((emp) => [emp.id, emp]));
            allImportedEmployees.forEach((emp) => {
              updatedMap.set(emp.id, emp);
            });
            return Array.from(updatedMap.values());
          });
        }

        result.success = totalSuccess > 0;
        result.summary = {
          total: importedData.length,
          success: totalSuccess,
          skipped: totalSkipped,
          errors: totalErrors,
        };
        result.errors = allErrorRows;
        result.importedEmployees = allImportedEmployees;

        if (totalErrors > 0 || totalSkipped > 0) {
          downloadErrorReport(allErrorRows);
          if (totalErrors > 0) {
            showError(
              'Import selesai dengan catatan',
              `${totalSuccess} berhasil, ${totalSkipped} dilewati, ${totalErrors} gagal.`
            );
          } else {
            showSuccess(`✅ ${totalSuccess} berhasil, ${totalSkipped} dilewati.`);
          }
        } else {
          showSuccess(`✅ ${totalSuccess} karyawan berhasil diimport.`);
        }

        options?.onProgress?.({
          status: 'completed',
          totalRows: importedData.length,
          processedRows: importedData.length,
          currentBatch: totalBatches,
          totalBatches,
          successCount: totalSuccess,
          skipCount: totalSkipped,
          errorCount: totalErrors,
          message: 'Import selesai.',
        });

        return result;
      } catch (error: any) {
        showError('Gagal mengimport karyawan', error);
        options?.onProgress?.({
          status: 'error',
          totalRows: importedData.length,
          processedRows: 0,
          currentBatch: 0,
          totalBatches: 0,
          successCount: 0,
          skipCount: 0,
          errorCount: 1,
          message: error.message || 'Terjadi kesalahan saat import.',
        });
        result.errors = [{ baris: 0, nama: '', email: '', nik: '', error: error.message }];
        return result;
      }
    },
    [
      checkSchemaSupport,
      fetchUnits,
      processBatch,
      setEmployees,
      showSuccess,
      showError,
      downloadErrorReport,
      validateInternalDuplicates,
      parseEmployeeRow,
      getField,
    ]
  );

  return {
    handleImportEmployees,
    downloadErrorReport,
    validateFile,
    checkSchemaSupport,
  };
};
