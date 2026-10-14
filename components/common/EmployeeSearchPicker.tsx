import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Employee } from '../../types';

interface EmployeeSearchPickerProps {
  employees: Employee[];
  selectedEmployeeId: string;
  onSelectEmployee: (employeeId: string) => void;
  label?: string;
  placeholder?: string;
  excludeEmployeeId?: string;
}

export const EmployeeSearchPicker: React.FC<EmployeeSearchPickerProps> = ({
  employees,
  selectedEmployeeId,
  onSelectEmployee,
  label = '👤 Pilih Karyawan Penerima:',
  placeholder = '🔍 Cari nama karyawan, NIK, atau jabatan...',
  excludeEmployeeId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return employees.filter(emp => {
      if (excludeEmployeeId && emp.id === excludeEmployeeId) return false;
      if (!term) return true;
      const nameMatch = emp.nama?.toLowerCase().includes(term);
      const nikMatch = emp.nik?.toLowerCase().includes(term);
      const positionMatch = emp.jabatan?.toLowerCase().includes(term);
      const roleMatch = emp.role?.toLowerCase().includes(term);
      return nameMatch || nikMatch || positionMatch || roleMatch;
    });
  }, [employees, searchTerm, excludeEmployeeId]);

  const selectedEmployee = useMemo(() => {
    return employees.find(e => e.id === selectedEmployeeId);
  }, [employees, selectedEmployeeId]);

  return (
    <div className="space-y-1 relative" ref={containerRef}>
      {label && (
        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}

      {selectedEmployee ? (
        <div className="p-3 rounded-2xl bg-teal-50/80 dark:bg-teal-950/40 border border-teal-200 dark:border-teal-800 flex items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-2.5 overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-[#06736a] text-white font-bold text-xs flex items-center justify-center flex-shrink-0 shadow">
              {selectedEmployee.nama?.charAt(0)?.toUpperCase() || 'K'}
            </div>
            <div className="overflow-hidden text-left">
              <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                {selectedEmployee.nama}
              </p>
              <p className="text-[10px] text-[#06736a] dark:text-teal-400 font-medium truncate">
                {selectedEmployee.jabatan || selectedEmployee.role || 'Karyawan'} • NIK: {selectedEmployee.nik || '-'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              onSelectEmployee('');
              setSearchTerm('');
              setIsOpen(true);
            }}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/50 px-2.5 py-1 rounded-xl transition-all"
            title="Ganti karyawan penerima"
          >
            Ganti ✎
          </button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <input
              type="text"
              value={searchTerm}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setIsOpen(true);
              }}
              placeholder={placeholder}
              className="w-full pl-9 pr-4 py-2.5 text-xs border border-slate-200 dark:border-slate-700 rounded-2xl dark:bg-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#06736a] shadow-sm"
            />
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">
              🔍
            </span>
          </div>

          {isOpen && (
            <div className="absolute z-50 left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl max-h-56 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-700/50 animate-in fade-in zoom-in-95 duration-150">
              {filteredEmployees.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400">
                  Karyawan tidak ditemukan
                </div>
              ) : (
                filteredEmployees.map((emp) => (
                  <div
                    key={emp.id}
                    onClick={() => {
                      onSelectEmployee(emp.id);
                      setIsOpen(false);
                    }}
                    className="p-3 hover:bg-teal-50/60 dark:hover:bg-teal-950/30 cursor-pointer flex items-center justify-between gap-3 transition-colors text-left"
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {emp.nama?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">
                          {emp.nama}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {emp.jabatan || emp.role || 'Staf'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-semibold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-md flex-shrink-0">
                      {emp.nik || 'Staf'}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
