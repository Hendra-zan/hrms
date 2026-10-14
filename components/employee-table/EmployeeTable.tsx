import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import * as XLSX from 'xlsx';
import logger from '../../services/logger.ts';
import EmptyState from '../EmptyState.tsx';
import { ImportProgress, ImportOptions } from '../../hooks/useEmployeeImport.ts';
import ImportPreviewModal from '../ImportPreviewModal.tsx';
import { generatePreview } from '../../utils/importPreviewUtils.ts';
import { EmployeeTableProps, MAX_FILE_SIZE, ALLOWED_EXTENSIONS } from './types.ts';
import { ImportProgressBar } from './ImportProgressBar.tsx';
import { EmployeeTableToolbar } from './EmployeeTableToolbar.tsx';
import { EmployeeTableHeader } from './EmployeeTableHeader.tsx';
import { EmployeeTableRow } from './EmployeeTableRow.tsx';
import { EmployeeTablePagination } from './EmployeeTablePagination.tsx';
import { exportEmployeesToExcel } from './exportEmployeeExcel.ts';

export const EmployeeTable: React.FC<EmployeeTableProps> = ({
  employees,
  workUnits = [],
  onEdit,
  onDelete,
  onView,
  onImport,
  sortKey,
  sortDirection,
  onSort,
  isViewOnly = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragAreaRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [importProgress, setImportProgress] = useState<ImportProgress | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Preview modal state
  const [showPreview, setShowPreview] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [previewTotalRows, setPreviewTotalRows] = useState(0);
  const [importData, setImportData] = useState<any[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);

  const isShowAll = pageSize === 0;
  const totalPages = isShowAll ? 1 : Math.max(1, Math.ceil(employees.length / pageSize));
  const paginatedEmployees = useMemo(() => {
    if (isShowAll) return employees;
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return employees.slice(startIndex, endIndex);
  }, [employees, currentPage, pageSize, isShowAll]);

  const startRow = employees.length === 0 ? 0 : (isShowAll ? 1 : (currentPage - 1) * pageSize + 1);
  const endRow = isShowAll ? employees.length : Math.min(currentPage * pageSize, employees.length);

  const handlePageSizeChange = (value: number) => {
    setPageSize(value);
    setCurrentPage(1);
  };

  const goToPrevPage = () => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  };

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleExportXLSX = () => {
    exportEmployeesToExcel(employees, workUnits);
  };

  const validateFile = (file: File): { valid: boolean; error?: string } => {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        error: `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(2)}MB). Maksimal 5MB.`,
      };
    }

    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExtension) {
      return {
        valid: false,
        error: `Format file tidak didukung. Gunakan file Excel (.xlsx atau .xls).`,
      };
    }

    return { valid: true };
  };

  const performImport = async (data: any[], options?: Omit<ImportOptions, 'onProgress'>) => {
    if (!onImport) {
      alert('Fungsi import belum tersedia.');
      setIsImporting(false);
      return;
    }

    setShowPreview(false);
    setIsImporting(true);

    const onProgress = (progress: ImportProgress) => {
      setImportProgress(progress);
    };

    const importOptions: ImportOptions = { ...options, onProgress };
    const result = await onImport(data, importOptions);

    if (result.success) {
      setTimeout(() => {
        setIsImporting(false);
        setImportProgress(null);
      }, 2000);
    } else {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const processFile = async (file: File, showPreviewFirst: boolean = true) => {
    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    setIsImporting(true);

    try {
      const reader = new FileReader();
      reader.onload = async (evt) => {
        try {
          const data = new Uint8Array(evt.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const imported: any[] = XLSX.utils.sheet_to_json(worksheet, {
            raw: false,
            defval: '',
          });

          if (imported.length === 0) {
            alert('File Excel kosong atau tidak memiliki data.');
            setIsImporting(false);
            return;
          }

          if (imported.length > 5000) {
            alert('File terlalu besar. Maksimal 5000 baris per import.');
            setIsImporting(false);
            return;
          }

          const firstRow = imported[0] || {};
          const headers = Object.keys(firstRow).map(k => k.trim().toUpperCase());

          const missingColumns = [];
          if (!headers.includes('NIK')) missingColumns.push('NIK');
          if (!headers.includes('NAMA')) missingColumns.push('Nama');

          if (missingColumns.length > 0) {
            alert(`Kolom berikut tidak ditemukan: ${missingColumns.join(', ')}\n\nPastikan file Excel minimal memiliki kolom: NIK dan Nama.`);
            setIsImporting(false);
            return;
          }

          if (showPreviewFirst) {
            const preview = generatePreview(imported, 10);
            setPreviewData(preview);
            setPreviewTotalRows(imported.length);
            setImportData(imported);
            setShowPreview(true);
            setIsImporting(false);
          } else {
            await performImport(imported, undefined);
          }
        } catch (error: any) {
          logger.error('Error parsing Excel', error);
          alert(`Gagal membaca file Excel: ${error.message}`);
          setIsImporting(false);
        }
      };

      reader.onerror = () => {
        alert('Gagal membaca file. Pastikan file tidak corrupt.');
        setIsImporting(false);
      };

      reader.readAsArrayBuffer(file);
    } catch (error: any) {
      logger.error('Error reading file', error);
      alert(`Gagal membaca file: ${error.message}`);
      setIsImporting(false);
    }
  };

  const handleImportXLSX = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await processFile(file, true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length === 0) return;

    const file = files[0];
    await processFile(file, true);
  }, []);

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-slate-700">
      <ImportPreviewModal
        isOpen={showPreview}
        onClose={() => {
          setShowPreview(false);
          setImportData([]);
          setPreviewData([]);
        }}
        onConfirm={(options) => performImport(importData, options)}
        previewData={previewData}
        totalRows={previewTotalRows}
        isLoading={isImporting}
      />

      <ImportProgressBar progress={importProgress} />

      {isImporting && <div className="fixed inset-0 bg-black/10 z-40" />}

      <EmployeeTableToolbar
        isViewOnly={isViewOnly}
        isImporting={isImporting}
        isDragOver={isDragOver}
        fileInputRef={fileInputRef}
        dragAreaRef={dragAreaRef}
        handleExportXLSX={handleExportXLSX}
        handleImportXLSX={handleImportXLSX}
        handleDragOver={handleDragOver}
        handleDragLeave={handleDragLeave}
        handleDrop={handleDrop}
      />

      <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-slate-700">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
          <EmployeeTableHeader
            sortKey={sortKey}
            sortDirection={sortDirection}
            onSort={onSort}
            isViewOnly={isViewOnly}
          />
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-gray-200 dark:divide-slate-700">
            {paginatedEmployees.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8">
                  <EmptyState title="Tidak ada karyawan ditemukan" description="Coba ubah filter atau kata kunci pencarian Anda" />
                </td>
              </tr>
            ) : (
              paginatedEmployees.map(emp => (
                <EmployeeTableRow
                  key={emp.id}
                  emp={emp}
                  workUnits={workUnits}
                  isViewOnly={isViewOnly}
                  onView={onView}
                  onEdit={onEdit}
                  onDelete={onDelete}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      <EmployeeTablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        pageSize={pageSize}
        totalEmployees={employees.length}
        startRow={startRow}
        endRow={endRow}
        onPageSizeChange={handlePageSizeChange}
        goToPrevPage={goToPrevPage}
        goToNextPage={goToNextPage}
      />
    </div>
  );
};
