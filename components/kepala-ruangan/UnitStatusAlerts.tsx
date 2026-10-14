import React from 'react';

interface AttendanceStats {
    totalEmployees: number;
    presentToday: number;
    absentToday: number;
    onLeave: number;
}

interface UnitStatusAlertsProps {
    attendanceStats: AttendanceStats;
}

const UnitStatusAlerts: React.FC<UnitStatusAlertsProps> = ({ attendanceStats }) => {
    const { presentToday = 0, totalEmployees = 0, absentToday = 0 } = attendanceStats || {};
    const attendanceRate = totalEmployees > 0 ? (presentToday / totalEmployees) * 100 : 0;

    const alerts: Array<{
        show: boolean;
        icon: string;
        title: string;
        desc: string;
        gradient: string;
        border: string;
        iconBg: string;
    }> = [
        {
            show: attendanceRate < 80 && totalEmployees > 0,
            icon: '🚨',
            title: 'Kehadiran Rendah!',
            desc: `Hanya ${presentToday} dari ${totalEmployees} karyawan hadir (${Math.round(attendanceRate)}%). Segera tindak lanjuti.`,
            gradient: 'from-red-50 to-rose-50',
            border: 'border-red-200',
            iconBg: 'bg-red-100',
        },
        {
            show: absentToday > 0,
            icon: '📝',
            title: `${absentToday} Karyawan Tidak Hadir`,
            desc: 'Periksa alasan ketidakhadiran dan buat catatan jika diperlukan.',
            gradient: 'from-amber-50 to-yellow-50',
            border: 'border-amber-200',
            iconBg: 'bg-amber-100',
        },
        {
            show: presentToday === totalEmployees && totalEmployees > 0,
            icon: '🎉',
            title: 'Kehadiran Sempurna!',
            desc: 'Semua karyawan hadir hari ini. Unit beroperasi dengan kapasitas penuh.',
            gradient: 'from-emerald-50 to-green-50',
            border: 'border-emerald-200',
            iconBg: 'bg-emerald-100',
        },
        {
            show: presentToday === 0 && totalEmployees > 0,
            icon: '📊',
            title: 'Belum Ada Data Kehadiran',
            desc: 'Data kehadiran akan muncul setelah karyawan melakukan absensi hari ini.',
            gradient: 'from-gray-50 to-slate-50',
            border: 'border-gray-200',
            iconBg: 'bg-gray-100',
        },
    ];

    const visibleAlerts = alerts.filter(a => a.show);
    if (visibleAlerts.length === 0) return null;

    return (
        <div className="rounded-2xl bg-white p-6 shadow-md border border-gray-100">
            <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-rose-500 to-red-600 text-white shadow-sm">
                    <span className="text-lg">🔔</span>
                </div>
                <div>
                    <h2 className="text-lg font-bold text-gray-800">Status Unit</h2>
                    <p className="text-xs text-gray-500">Notifikasi penting hari ini</p>
                </div>
            </div>

            <div className="space-y-3">
                {visibleAlerts.map((alert, idx) => (
                    <div
                        key={idx}
                        className={`flex items-start gap-3.5 rounded-xl border bg-gradient-to-r p-4 ${alert.gradient} ${alert.border}`}
                    >
                        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg ${alert.iconBg} shadow-sm`}>
                            {alert.icon}
                        </div>
                        <div>
                            <p className="text-sm font-bold text-gray-800">{alert.title}</p>
                            <p className="mt-0.5 text-xs text-gray-600 leading-relaxed">{alert.desc}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default UnitStatusAlerts;
