import React, { useMemo, useState } from 'react';
import { XMarkIcon, CheckCircleIcon, ExclamationTriangleIcon } from './icons';
import { EMPLOYEE_XLSX_HEADERS } from '../services/excelTemplateService';
import { ImportOptions } from '../hooks/useEmployeeImport';

interface PreviewRow {
  rowNumber: number;
  data: Record<string, any>;
  validation: {
    valid: boolean;
    errors: string[];
    warnings: string[];
  };
}

interface ImportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (options: Omit<ImportOptions, 'onProgress'>) => void;
  previewData: PreviewRow[];
  totalRows: number;
  isLoading?: boolean;
}

const ImportPreviewModal: React.FC<ImportPreviewModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  previewData,
  totalRows,
  isLoading = false,
}) => {
  if (!isOpen) return null;

  const stats = useMemo(() => {
    const valid = previewData.filter(r => r.validation.valid).length;
    const withErrors = previewData.filter(r => r.validation.errors.length > 0).length;
    const withWarnings = previewData.filter(r => r.validation.warnings.length > 0 && r.validation.errors.length === 0).length;
    return { valid, withErrors, withWarnings };
  }, [previewData]);

  const [updateExisting, setUpdateExisting] = useState(false);

  const getStatusIcon = (row: PreviewRow) => {
    if (row.validation.errors.length > 0) {
      return <span className="text-red-500 text-lg">✗</span>;
    }
    if (row.validation.warnings.length > 0) {
      return <span className="text-yellow-500 text-lg">⚠</span>;
    }
    return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
  };

  const getStatusClass = (row: PreviewRow) => {
    if (row.validation.errors.length > 0) return 'bg-red-50 border-red-200';
    if (row.validation.warnings.length > 0) return 'bg-yellow-50 border-yellow-200';
    return 'bg-green-50 border-green-200';
  };

  // Show key columns only in preview
  const keyColumns = ['Nama', 'Email', 'NIK', 'Jabatan', 'Departemen', 'Status', 'Unit_Kerja'];

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-bold text-gray-900">Preview Data Import</h2>
            <p className="text-sm text-gray-500 mt-1">
              Menampilkan {previewData.length} dari {totalRows} baris
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="h-6 w-6 text-gray-500" />
          </button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 border-b border-gray-200">
          <div className="bg-white p-3 rounded-lg border border-green-200">
            <div className="flex items-center gap-2">
              <CheckCircleIcon className="h-5 w-5 text-green-500" />
              <span className="text-sm font-medium text-gray-700">Valid</span>
            </div>
            <p className="text-2xl font-bold text-green-600 mt-1">{stats.valid}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-yellow-200">
            <div className="flex items-center gap-2">
              <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
              <span className="text-sm font-medium text-gray-700">Peringatan</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600 mt-1">{stats.withWarnings}</p>
          </div>
          <div className="bg-white p-3 rounded-lg border border-red-200">
            <div className="flex items-center gap-2">
              <span className="text-red-500 font-bold">✗</span>
              <span className="text-sm font-medium text-gray-700">Error</span>
            </div>
            <p className="text-2xl font-bold text-red-600 mt-1">{stats.withErrors}</p>
          </div>
        </div>

        {/* Preview Table */}
        <div className="flex-1 overflow-auto p-6">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-16">
                  Baris
                </th>
                {keyColumns.map(col => (
                  <th key={col} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {col.replace(/_/g, ' ')}
                  </th>
                ))}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Catatan
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.map((row) => (
                <tr key={row.rowNumber} className={`${getStatusClass(row)} border-l-4`}>
                  <td className="px-4 py-3 whitespace-nowrap">
                    {getStatusIcon(row)}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 font-medium">
                    {row.rowNumber}
                  </td>
                  {keyColumns.map(col => (
                    <td key={col} className="px-4 py-3 whitespace-nowrap text-sm text-gray-700 max-w-xs truncate">
                      {row.data[col] || '-'}
                    </td>
                  ))}
                  <td className="px-4 py-3 text-sm">
                    {row.validation.errors.length > 0 && (
                      <div className="text-red-600 text-xs space-y-1">
                        {row.validation.errors.map((err, i) => (
                          <p key={i}>• {err}</p>
                        ))}
                      </div>
                    )}
                    {row.validation.warnings.length > 0 && row.validation.errors.length === 0 && (
                      <div className="text-yellow-600 text-xs space-y-1">
                        {row.validation.warnings.map((warn, i) => (
                          <p key={i}>• {warn}</p>
                        ))}
                      </div>
                    )}
                    {row.validation.valid && (
                      <span className="text-green-600 text-xs">Siap diimport</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalRows > previewData.length && (
            <div className="text-center py-4 text-gray-500 text-sm">
              ... dan {totalRows - previewData.length} baris lainnya
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {stats.withErrors > 0 ? (
              <span className="text-red-600 font-medium">
                ⚠️ Perbaiki {stats.withErrors} error sebelum melanjutkan
              </span>
            ) : stats.withWarnings > 0 ? (
              <span className="text-yellow-600">
                ℹ️ Ada {stats.withWarnings} peringatan, tetap bisa diimport
              </span>
            ) : (
              <span className="text-green-600">✓ Semua data valid</span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-2 hover:bg-gray-100 transition-colors">
              <input
                type="checkbox"
                checked={updateExisting}
                onChange={(e) => setUpdateExisting(e.target.checked)}
                disabled={isLoading}
                className="h-4 w-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500 cursor-pointer"
              />
              <span>Timpa data lama jika NIK sama (Update)</span>
            </label>
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors disabled:opacity-50 text-sm font-medium"
              >
                Batal
              </button>
              <button
                onClick={() => onConfirm({ updateExisting })}
                disabled={isLoading || stats.withErrors > 0}
                className="px-6 py-2 bg-[#06736a] hover:bg-[#055f57] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-sm"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Memproses...
                  </span>
                ) : (
                  `Import ${totalRows} Data`
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ImportPreviewModal;
