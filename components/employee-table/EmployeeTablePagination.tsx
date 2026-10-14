import React from 'react';

interface EmployeeTablePaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalEmployees: number;
  startRow: number;
  endRow: number;
  onPageSizeChange: (val: number) => void;
  goToPrevPage: () => void;
  goToNextPage: () => void;
}

export const EmployeeTablePagination: React.FC<EmployeeTablePaginationProps> = ({
  currentPage,
  totalPages,
  pageSize,
  totalEmployees,
  startRow,
  endRow,
  onPageSizeChange,
  goToPrevPage,
  goToNextPage,
}) => {
  const isShowAll = pageSize === 0;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700 text-xs text-gray-500 dark:text-slate-400">
      <div className="flex items-center gap-2">
        <span>
          {isShowAll
            ? `Menampilkan seluruh ${totalEmployees} karyawan`
            : `Menampilkan ${startRow}-${endRow} dari ${totalEmployees} karyawan`}
        </span>
        <select
          value={pageSize}
          onChange={e => onPageSizeChange(Number(e.target.value))}
          className="px-2.5 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none font-medium text-gray-700 dark:text-slate-300 cursor-pointer hover:border-teal-500 transition-colors"
        >
          <option value={10}>10 per halaman</option>
          <option value={25}>25 per halaman</option>
          <option value={50}>50 per halaman</option>
          <option value={100}>100 per halaman</option>
          <option value={0}>Semua (Tampilkan Semua)</option>
        </select>
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={goToPrevPage}
          disabled={currentPage <= 1 || isShowAll}
          className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
        >
          ‹ Sebelumnya
        </button>
        <span className="px-3 py-1 font-bold text-gray-800 dark:text-slate-200">
          {isShowAll ? '1 / 1' : `${currentPage} / ${totalPages}`}
        </span>
        <button
          onClick={goToNextPage}
          disabled={currentPage >= totalPages || isShowAll}
          className="px-3 py-1 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed font-medium transition-colors"
        >
          Berikutnya ›
        </button>
      </div>
    </div>
  );
};
