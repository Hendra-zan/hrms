import React from 'react';
import { Employee } from '../../../types.ts';
import { TodayAttendance } from '../types.ts';
import { CheckCircleIcon, SunIcon, ClockIcon, BriefcaseIcon } from '../../icons.tsx';

interface DashboardMetricCardsProps {
    currentUser: Employee;
    todayAttendance: TodayAttendance | null;
}

const InfoCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon: React.ReactNode; color?: string }> = ({
    title, value, subtitle, icon, color = 'text-[#06736a]'
}) => (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 flex items-center gap-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
        <div className={`w-12 h-12 flex items-center justify-center rounded-2xl bg-opacity-10 ${color.replace('text-', 'bg-')} ${color} flex-shrink-0`}>
            <div className="w-6 h-6">{icon}</div>
        </div>
        <div className="min-w-0 flex-1">
            <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{title}</h3>
            <p className={`text-lg font-black ${color} truncate mt-0.5`}>{value}</p>
            {subtitle && <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{subtitle}</p>}
        </div>
    </div>
);

export const DashboardMetricCards: React.FC<DashboardMetricCardsProps> = ({
    currentUser,
    todayAttendance,
}) => {
    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        const date = new Date(dateStr);
        return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' });
    };

    const calculateWorkDuration = () => {
        if (!currentUser.hireDate) return '-';
        const hireDate = new Date(currentUser.hireDate);
        const now = new Date();
        const years = now.getFullYear() - hireDate.getFullYear();
        const months = now.getMonth() - hireDate.getMonth();

        if (months < 0) {
            return `${years - 1}th ${12 + months}bln`;
        }
        return years > 0 ? `${years}th ${months}bln` : `${months}bln`;
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <InfoCard
                title="Status Kepegawaian"
                value={currentUser.status}
                subtitle={`NIK: ${currentUser.nik || '-'}`}
                icon={<CheckCircleIcon />}
                color={currentUser.status === 'Aktif' ? 'text-emerald-600' : 'text-amber-600'}
            />
            <InfoCard
                title="Sisa Cuti Tahunan"
                value={`${currentUser.sisaCuti} Hari`}
                subtitle="Hak Cuti Berjalan"
                icon={<SunIcon />}
                color="text-orange-500"
            />
            <InfoCard
                title="Presensi Hari Ini"
                value={todayAttendance?.time_in ? `Masuk: ${todayAttendance.time_in}` : 'Belum Absen'}
                subtitle={todayAttendance?.time_out ? `Pulang: ${todayAttendance.time_out}` : (todayAttendance?.time_in ? 'Sedang Bertugas' : 'Harap melakukan absensi')}
                icon={<ClockIcon />}
                color={todayAttendance?.time_in ? 'text-emerald-600' : 'text-amber-600'}
            />
            <InfoCard
                title="Masa Kerja RS"
                value={calculateWorkDuration()}
                subtitle={`Masuk: ${formatDate(currentUser.hireDate)}`}
                icon={<BriefcaseIcon />}
                color="text-indigo-600"
            />
        </div>
    );
};
