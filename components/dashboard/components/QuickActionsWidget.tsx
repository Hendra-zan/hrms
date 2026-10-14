import React from 'react';
import {
    DocumentTextIcon,
    CurrencyDollarIcon,
    CalendarDaysIcon,
    LockClosedIcon,
    ClipboardDocumentListIcon,
} from '../../icons.tsx';

interface QuickActionsWidgetProps {
    onNavigate?: (view: any, tab?: 'overview' | 'attendance' | 'profile' | 'kinerja', action?: 'payslip' | 'leave' | 'reimbursement') => void;
    onOpenChangePassword: () => void;
}

const QuickActionCard: React.FC<{ title: string; description: string; icon: React.ReactNode; badge?: string; onClick?: () => void }> = ({
    title, description, icon, badge, onClick
}) => (
    <button
        onClick={onClick}
        className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-slate-200/80 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-[#06736a]/30 text-left w-full group cursor-pointer relative overflow-hidden"
    >
        {badge && (
            <span className="absolute top-3 right-3 rounded-full bg-teal-50 text-[#06736a] text-[10px] font-bold px-2 py-0.5 border border-teal-200">
                {badge}
            </span>
        )}
        <div className="flex items-start gap-3.5">
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-50 text-[#06736a] group-hover:scale-110 transition-transform duration-300 flex-shrink-0">
                <div className="w-5 h-5">{icon}</div>
            </div>
            <div className="min-w-0 flex-1">
                <h3 className="text-sm font-bold text-slate-800 group-hover:text-[#06736a] transition-colors">{title}</h3>
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{description}</p>
            </div>
        </div>
    </button>
);

export const QuickActionsWidget: React.FC<QuickActionsWidgetProps> = ({
    onNavigate,
    onOpenChangePassword,
}) => {
    return (
        <div className="space-y-6">
            <div className="bg-gradient-to-b from-teal-50/60 to-slate-50 p-5 rounded-2xl border border-teal-100 shadow-sm">
                <h2 className="text-sm font-bold text-[#06736a] uppercase tracking-wider mb-4 flex items-center gap-2">
                    ⚡ Aksi Cepat Karyawan
                </h2>
                <div className="space-y-3">
                    <QuickActionCard
                        title="Ajukan Cuti / Izin"
                        description="Buat permohonan cuti atau izin dinas"
                        icon={<DocumentTextIcon />}
                        badge="Formulir"
                        onClick={() => onNavigate?.('ess', 'overview', 'leave')}
                    />
                    <QuickActionCard
                        title="Lihat Slip Gaji Resmi"
                        description="Cetak & unduh slip gaji bulanan Anda"
                        icon={<CurrencyDollarIcon />}
                        badge="PDF"
                        onClick={() => onNavigate?.('ess', 'overview', 'payslip')}
                    />
                    <QuickActionCard
                        title="Riwayat Presensi"
                        description="Cek rincian log jam masuk & pulang"
                        icon={<CalendarDaysIcon />}
                        onClick={() => onNavigate?.('ess', 'attendance')}
                    />
                    <QuickActionCard
                        title="Kebijakan & SOP RS"
                        description="Akses seluruh regulasi & aturan RS"
                        icon={<ClipboardDocumentListIcon />}
                        onClick={() => onNavigate?.('announcements')}
                    />
                    <QuickActionCard
                        title="Ubah Kata Sandi"
                        description="Ganti password keamanan akun Anda"
                        icon={<LockClosedIcon />}
                        onClick={onOpenChangePassword}
                    />
                </div>
            </div>
        </div>
    );
};
