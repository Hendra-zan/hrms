import React from 'react';
import { createEmployeeImportTemplate } from '../../services/excelTemplateService.ts';

interface EmployeeTableToolbarProps {
  isViewOnly: boolean;
  isImporting: boolean;
  isDragOver: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
  dragAreaRef: React.RefObject<HTMLDivElement>;
  handleExportXLSX: () => void;
  handleImportXLSX: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  handleDragOver: (e: React.DragEvent) => void;
  handleDragLeave: (e: React.DragEvent) => void;
  handleDrop: (e: React.DragEvent) => Promise<void>;
}

export const EmployeeTableToolbar: React.FC<EmployeeTableToolbarProps> = ({
  isViewOnly,
  isImporting,
  isDragOver,
  fileInputRef,
  dragAreaRef,
  handleExportXLSX,
  handleImportXLSX,
  handleDragOver,
  handleDragLeave,
  handleDrop,
}) => {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
      <div>
        <h3 className="text-lg font-bold text-gray-800 dark:text-slate-100">Daftar Karyawan</h3>
        <p className="text-xs text-gray-500 dark:text-slate-400">Kelola informasi seluruh staf dan tenaga medis</p>
      </div>

      {!isViewOnly && (
        <div className="flex flex-wrap items-center gap-2">
          {/* Export button */}
          <button
            onClick={handleExportXLSX}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            title="Download data karyawan dalam format Excel"
          >
            <span>📥</span> Export Excel
          </button>

          {/* Download Template button */}
          <button
            onClick={createEmployeeImportTemplate}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
            title="Download template Excel untuk import data"
          >
            <span>📄</span> Unduh Template
          </button>

          {/* Hidden File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleImportXLSX}
            className="hidden"
          />

          {/* Import Drop Area / Button */}
          <div
            ref={dragAreaRef}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`px-3 py-1.5 border-2 border-dashed rounded-lg cursor-pointer text-xs font-semibold flex items-center gap-1.5 transition-all ${
              isDragOver
                ? 'border-teal-500 bg-teal-50 text-teal-700 scale-105'
                : 'border-gray-300 hover:border-[#06736a] text-gray-700 dark:text-slate-200 hover:bg-teal-50/50'
            } ${isImporting ? 'opacity-50 pointer-events-none' : ''}`}
            title="Klik atau drag-drop file Excel untuk import data"
          >
            <span>📤</span> Import Excel
          </div>
        </div>
      )}
    </div>
  );
};
