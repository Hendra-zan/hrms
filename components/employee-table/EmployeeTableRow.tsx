import React from 'react';
import { Employee, WorkUnit } from '../../types.ts';

interface EmployeeTableRowProps {
  emp: Employee;
  workUnits: WorkUnit[];
  isViewOnly?: boolean;
  onView: (emp: Employee) => void;
  onEdit?: (emp: Employee) => void;
  onDelete?: (id: string) => void;
}

export const EmployeeTableRow: React.FC<EmployeeTableRowProps> = ({
  emp,
  workUnits,
  onView,
}) => {
  const raw = emp as any;
  const unitName = workUnits.find(u => u.id === (emp.unitKerjaId || raw.unitKerjaId))?.nama || emp.unitKerjaId || raw.unitKerjaId || '-';
  const gajiPokok = emp.compensation?.gajiPokok ?? raw.gajiPokok ?? 0;

  return (
    <tr className="hover:bg-teal-50/40 dark:hover:bg-slate-800/60 transition-colors group">
      <td className="px-6 py-4 whitespace-nowrap">
        <button
          type="button"
          onClick={() => onView(emp)}
          className="flex items-center gap-3 text-left w-full group/btn focus:outline-none"
          title={`Lihat detail data ${emp.nama}`}
        >
          <img
            className="h-10 w-10 rounded-full object-cover border border-gray-200 dark:border-slate-700 ring-2 ring-transparent group-hover/btn:ring-[#06736a]/30 group-hover:scale-105 transition-all"
            src={emp.foto || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&auto=format&fit=crop&q=80'}
            alt={emp.nama}
          />
          <div>
            <div className="text-sm font-bold text-gray-900 dark:text-slate-100 group-hover/btn:text-[#06736a] dark:group-hover/btn:text-teal-400 transition-colors flex items-center gap-1.5">
              <span>{emp.nama}</span>
              <span className="text-[11px] text-teal-600 dark:text-teal-400 opacity-0 group-hover/btn:opacity-100 transition-opacity font-normal">
                &rarr; Detail
              </span>
            </div>
            <div className="text-xs text-gray-500 dark:text-slate-400 font-mono">NIK: {emp.nik || '-'}</div>
          </div>
        </button>
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900 dark:text-slate-200 font-medium">{emp.jabatan || '-'}</div>
        <div className="text-xs text-teal-600 dark:text-teal-400 font-semibold">{unitName}</div>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
        {emp.departemen || '-'}
      </td>

      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${
          emp.status === 'Aktif'
            ? 'bg-green-100 text-green-800 dark:bg-green-950/60 dark:text-green-300'
            : 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300'
        }`}>
          {emp.status || 'Aktif'}
        </span>
      </td>

      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono font-medium text-gray-900 dark:text-slate-200">
        Rp {gajiPokok.toLocaleString('id-ID')}
      </td>
    </tr>
  );
};
