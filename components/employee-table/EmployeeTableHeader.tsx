import React from 'react';
import { SortKey, SortDirection } from '../../types.ts';
import { ChevronUpIcon, ChevronDownIcon } from '../icons.tsx';

interface EmployeeTableHeaderProps {
  sortKey: SortKey;
  sortDirection: SortDirection;
  onSort: (key: SortKey) => void;
  isViewOnly?: boolean;
}

export const EmployeeTableHeader: React.FC<EmployeeTableHeaderProps> = ({
  sortKey,
  sortDirection,
  onSort,
}) => {
  const SortableHeader: React.FC<{ columnKey: SortKey; title: string }> = ({ columnKey, title }) => {
    const isSorting = sortKey === columnKey;
    const icon = isSorting ? (sortDirection === 'asc' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <span className="w-4" />;

    return (
      <th
        className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer select-none hover:bg-gray-100 dark:hover:bg-slate-700/50 transition-colors"
        onClick={() => onSort(columnKey)}
      >
        <div className="flex items-center gap-1">
          {title}
          {icon}
        </div>
      </th>
    );
  };

  return (
    <thead className="bg-gray-50 dark:bg-slate-800/80 border-b border-gray-200 dark:border-slate-700">
      <tr>
        <SortableHeader columnKey="nama" title="Karyawan" />
        <SortableHeader columnKey="jabatan" title="Jabatan & Unit" />
        <SortableHeader columnKey="departemen" title="Departemen" />
        <SortableHeader columnKey="status" title="Status" />
        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-slate-400 uppercase tracking-wider">
          Gaji Pokok
        </th>
      </tr>
    </thead>
  );
};
