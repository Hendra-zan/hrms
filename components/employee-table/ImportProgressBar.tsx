import React from 'react';
import { ImportProgress } from '../../hooks/useEmployeeImport.ts';

export const ImportProgressBar: React.FC<{ progress: ImportProgress | null }> = ({ progress }) => {
  if (!progress || progress.status === 'idle') return null;

  const percentage = progress.totalRows > 0
    ? Math.round((progress.processedRows / progress.totalRows) * 100)
    : 0;

  const statusColors = {
    idle: 'bg-gray-200',
    validating: 'bg-blue-500',
    processing: 'bg-blue-600',
    completed: 'bg-green-500',
    error: 'bg-red-500',
  };

  const statusLabels = {
    idle: 'Menunggu...',
    validating: 'Memvalidasi data...',
    processing: 'Memproses...',
    completed: 'Selesai!',
    error: 'Error!',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
        <h3 className="text-lg font-semibold mb-4">Import Data Karyawan</h3>

        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{statusLabels[progress.status]}</span>
            <span>{percentage}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${statusColors[progress.status]}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        <div className="text-sm text-gray-600 space-y-1">
          <p>Baris diproses: {progress.processedRows} / {progress.totalRows}</p>
          <p>Batch: {progress.currentBatch} / {progress.totalBatches}</p>
          <div className="flex gap-4 mt-2">
            <span className="text-green-600">✓ Berhasil: {progress.successCount}</span>
            <span className="text-yellow-600">⚠ Dilewati: {progress.skipCount}</span>
            <span className="text-red-600">✗ Error: {progress.errorCount}</span>
          </div>
        </div>

        {progress.message && (
          <p className="text-sm text-gray-500 mt-3 italic">{progress.message}</p>
        )}
      </div>
    </div>
  );
};
