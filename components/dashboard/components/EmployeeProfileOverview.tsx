import React from 'react';
import { Employee } from '../../../types.ts';

interface EmployeeProfileOverviewProps {
    currentUser: Employee;
    onNavigate?: (view: any, tab?: 'overview' | 'attendance' | 'profile' | 'kinerja', action?: 'payslip' | 'leave' | 'reimbursement') => void;
}

export const EmployeeProfileOverview: React.FC<EmployeeProfileOverviewProps> = ({
    currentUser,
    onNavigate,
}) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    return (
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                <h2 className="text-base font-bold text-[#06736a] flex items-center gap-2">
                    👤 Rincian Data Kepegawaian
                </h2>
                <button
                    onClick={() => onNavigate?.('ess', 'profile')}
                    className="text-xs font-semibold text-[#06736a] hover:underline"
                >
                    Edit Profil →
                </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-3">
                    <div>
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">NIK Karyawan</p>
                        <p className="font-bold text-slate-800 text-sm mt-0.5">{currentUser.nik || '-'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">Email Official</p>
                        <p className="font-semibold text-slate-700 mt-0.5 break-all">{currentUser.email}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">Nomor Telepon / WA</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{currentUser.telepon || '-'}</p>
                    </div>
                </div>
                <div className="space-y-3">
                    <div>
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">Tanggal Lahir</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{formatDate(currentUser.birthDate)}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 font-semibold uppercase text-[10px]">Tanggal Bergabung RS</p>
                        <p className="font-semibold text-slate-700 mt-0.5">{formatDate(currentUser.hireDate)}</p>
                    </div>
                    {currentUser.spesialisasi && (
                        <div>
                            <p className="text-slate-400 font-semibold uppercase text-[10px]">Spesialisasi Medis</p>
                            <p className="font-bold text-[#06736a] mt-0.5">{currentUser.spesialisasi}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
