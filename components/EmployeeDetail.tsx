import React, { useEffect, useState } from 'react';
import { Employee, WorkUnit, AttendanceRecord } from '../types.ts';
import { XMarkIcon, PaperClipIcon, DocumentTextIcon, ClockIcon, CurrencyDollarIcon, PrinterIcon, PencilIcon, TrashIcon } from './icons.tsx';
import DetailTab from './employee-detail/DetailTab.tsx';
import DocumentTab from './employee-detail/DocumentTab.tsx';
import AttendanceTab from './employee-detail/AttendanceTab.tsx';
import CompensationTab from './employee-detail/CompensationTab.tsx';
import DeviceTab from './employee-detail/DeviceTab.tsx';
import { EmployeeIdCardModal } from './EmployeeIdCardModal.tsx';
import { canManageEmployees } from '../services/portalAccessService.ts';
import { printEmployeeBiodata } from './employee-detail/printTemplate.ts';

const DeviceIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={props.className}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-6 18.75h12" />
  </svg>
);

interface EmployeeDetailProps {
  isOpen: boolean;
  onClose: () => void;
  employee: Employee;
  workUnit?: WorkUnit;
  attendanceRecords: AttendanceRecord[];
  onOpenAttendanceDetail?: () => void;
  institutionName?: string;
  onEdit?: (employee: Employee) => void;
  onDelete?: (id: string) => void;
  currentUserRole?: string;
}

const EmployeeDetail: React.FC<EmployeeDetailProps> = ({
  isOpen,
  onClose,
  employee,
  workUnit,
  attendanceRecords,
  onOpenAttendanceDetail,
  institutionName,
  onEdit,
  onDelete,
  currentUserRole,
}) => {
  const [activeTab, setActiveTab] = useState('detail');
  const [isIdCardOpen, setIsIdCardOpen] = useState(false);
  const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

  const handlePrint = () => {
    printEmployeeBiodata(employee, workUnit, institutionName);
  };

  const handleDelete = () => {
    if (!onDelete) return;
    onDelete(employee.id);
    setIsConfirmDeleteOpen(false);
    onClose();
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        if (isConfirmDeleteOpen) {
          setIsConfirmDeleteOpen(false);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    if (isOpen) document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, isConfirmDeleteOpen, onClose]);

  const TabButton: React.FC<{ tabName: string; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
        activeTab === tabName ? 'bg-[#e6f3f2] text-[#06736a] dark:bg-teal-950/40 dark:text-teal-400' : 'text-gray-600 dark:text-slate-400 hover:bg-gray-100 dark:hover:bg-slate-800'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'dokumen':
        return <DocumentTab employee={employee} />;
      case 'kehadiran':
        return <AttendanceTab attendanceRecords={attendanceRecords} onOpenAttendanceDetail={onOpenAttendanceDetail} />;
      case 'kompensasi':
        return <CompensationTab employee={employee} />;
      case 'device':
        return <DeviceTab employee={employee} />;
      default:
        return <DetailTab employee={employee} workUnit={workUnit} />;
    }
  };

  const canManage = canManageEmployees(currentUserRole);

  return (
    <div
      className={`fixed inset-0 z-50 transition-opacity duration-300 ${isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
      aria-modal="true"
      role="dialog"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={onClose} />

      {/* Drawer */}
      <div className={`absolute inset-y-0 right-0 flex w-full max-w-3xl flex-col bg-white dark:bg-slate-900 shadow-2xl transition-transform duration-300 ease-in-out rounded-l-2xl overflow-hidden ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      }`}>
        {/* Header */}
        <div className="flex-shrink-0 p-5 border-b border-gray-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center">
          <div className="flex items-center gap-4 min-w-0">
            <img
              className="h-14 w-14 rounded-full object-cover ring-2 ring-[#06736a]/20 shrink-0"
              src={employee.foto || `https://ui-avatars.com/api/?name=${employee.nama.replace(/\s/g, '+')}&background=random`}
              alt={employee.nama}
            />
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-gray-900 dark:text-slate-100 truncate">
                {employee.nama}
                {employee.kredensial && <span className="ml-2 text-sm font-normal text-gray-500 dark:text-slate-400">{employee.kredensial}</span>}
              </h2>
              <p className="text-sm text-gray-500 dark:text-slate-400 mt-0.5 truncate">
                {employee.jabatan || '-'} &middot; {employee.departemen || '-'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {onEdit && canManage && (
              <button
                onClick={() => {
                  onClose();
                  onEdit(employee);
                }}
                title="Edit Data Karyawan"
                aria-label="Edit Data Karyawan"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#06736a] text-white hover:bg-[#055f57] transition-colors text-xs font-semibold shadow-xs"
              >
                <PencilIcon className="h-4 w-4" />
                <span>Edit</span>
              </button>
            )}
            {onDelete && canManage && (
              <button
                onClick={() => setIsConfirmDeleteOpen(true)}
                title="Hapus Data Karyawan"
                aria-label="Hapus Data Karyawan"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors text-xs font-semibold border border-rose-200 dark:border-rose-900/50"
              >
                <TrashIcon className="h-4 w-4" />
                <span>Hapus</span>
              </button>
            )}
            <button
              onClick={() => setIsIdCardOpen(true)}
              title="Cetak ID Card Karyawan"
              aria-label="Cetak ID Card Karyawan"
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#06736a]/10 text-[#06736a] dark:text-teal-400 hover:bg-[#06736a]/20 transition-colors text-xs font-semibold"
            >
              <span>🎴 ID Card</span>
            </button>
            <button
              onClick={handlePrint}
              title="Cetak Biodata Karyawan"
              aria-label="Cetak Biodata Karyawan"
              className="rounded-full p-2 text-[#06736a] dark:text-teal-400 hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
            >
              <PrinterIcon className="h-5 w-5" />
            </button>
            <button
              onClick={onClose}
              title="Tutup detail karyawan"
              aria-label="Tutup detail karyawan"
              className="rounded-full p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 hover:text-gray-600 dark:hover:text-slate-200 transition-colors"
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex-shrink-0 border-b border-gray-200 dark:border-slate-800 bg-gray-50 dark:bg-slate-850 px-4">
          <div className="flex gap-1 overflow-x-auto py-1">
            <TabButton tabName="detail" label="Detail" icon={<DocumentTextIcon className="w-4 h-4" />} />
            <TabButton tabName="dokumen" label="Dokumen" icon={<PaperClipIcon className="w-4 h-4" />} />
            <TabButton tabName="kehadiran" label="Kehadiran" icon={<ClockIcon className="w-4 h-4" />} />
            <TabButton tabName="kompensasi" label="Kompensasi" icon={<CurrencyDollarIcon className="w-4 h-4" />} />
            <TabButton tabName="device" label="Perangkat" icon={<DeviceIcon className="w-4 h-4" />} />
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {renderContent()}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isConfirmDeleteOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-gray-200 dark:border-slate-800 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-4">
              <div className="p-3 bg-rose-100 dark:bg-rose-950/60 rounded-xl">
                <TrashIcon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-slate-100">Hapus Data Karyawan</h3>
                <p className="text-xs text-gray-500 dark:text-slate-400">Konfirmasi tindakan penghapusan</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-slate-300 mb-6">
              Apakah Anda yakin ingin menghapus data karyawan <span className="font-semibold text-gray-900 dark:text-slate-100">"{employee.nama}"</span> (NIK: <span className="font-mono">{employee.nik || '-'}</span>)? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsConfirmDeleteOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-slate-300 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition-colors"
              >
                Ya, Hapus Data
              </button>
            </div>
          </div>
        </div>
      )}

      <EmployeeIdCardModal
        isOpen={isIdCardOpen}
        onClose={() => setIsIdCardOpen(false)}
        employee={employee}
        workUnit={workUnit}
        institutionName={institutionName}
      />
    </div>
  );
};

export default EmployeeDetail;
