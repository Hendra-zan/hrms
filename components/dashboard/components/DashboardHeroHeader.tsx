import React from 'react';
import { Employee } from '../../../types.ts';
import { LiveClockWidget } from './LiveClockWidget.tsx';

interface DashboardHeroHeaderProps {
    currentUser: Employee;
    onNavigate?: (view: any, tab?: 'overview' | 'attendance' | 'profile' | 'kinerja', action?: 'payslip' | 'leave' | 'reimbursement') => void;
}

export const DashboardHeroHeader: React.FC<DashboardHeroHeaderProps> = ({
    currentUser,
    onNavigate,
}) => {
    return (
        <div className="relative overflow-hidden bg-gradient-to-r from-[#06736a] via-[#089c8e] to-teal-700 p-6 sm:p-8 rounded-3xl shadow-lg text-white border border-teal-500/20">
            <div className="absolute inset-0 bg-[radial-gradient(#ffffff22_1px,transparent_1px)] [background-size:20px_20px] opacity-30 pointer-events-none"></div>
            <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 z-10">
                <div className="flex items-center gap-5">
                    {currentUser.foto && currentUser.foto.startsWith('http') ? (
                        <img
                            src={currentUser.foto}
                            alt={currentUser.nama}
                            className="w-20 h-20 rounded-2xl object-cover ring-4 ring-white/30 shadow-xl flex-shrink-0"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-2xl bg-white/20 text-white font-black text-2xl flex items-center justify-center ring-4 ring-white/30 shadow-xl flex-shrink-0 backdrop-blur-md">
                            {(currentUser.nama || 'K').split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase()}
                        </div>
                    )}
                    <div>
                        <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-0.5 text-xs font-semibold backdrop-blur-md text-teal-100 mb-2 border border-white/20">
                            🏢 {currentUser.departemen || 'RSU Meloy'}
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                            Selamat Datang, {currentUser.nama.split(' ')[0]}!
                        </h1>
                        <p className="text-sm font-medium text-teal-100/90 mt-1">
                            {currentUser.jabatan} &middot; <span className="font-semibold text-white">Shift: {currentUser.shift || 'Default'}</span>
                        </p>
                    </div>
                </div>

                {/* Live Clock & Quick Launch Button & Notification Center */}
                <div className="flex flex-col items-start md:items-end gap-3 flex-shrink-0">
                    <div className="flex items-center gap-2 w-full justify-between sm:justify-end">
                        <LiveClockWidget />
                    </div>

                    <button
                        onClick={() => onNavigate?.('ess', 'overview')}
                        className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 rounded-2xl bg-white px-6 py-3.5 text-sm font-bold text-[#06736a] shadow-xl hover:bg-teal-50 hover:scale-105 transition-all duration-300 active:scale-95 cursor-pointer"
                    >
                        <span className="text-lg">📷</span>
                        Buka Panel Presensi ESS
                    </button>
                </div>
            </div>
        </div>
    );
};
