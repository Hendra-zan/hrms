import React from 'react';
import { AttendanceChangeRequest, Employee, AttendanceReasonCode } from '../../types';

export const ATTENDANCE_REASON_MAP: Record<AttendanceReasonCode, string> = {
    FORGOT_CHECK_IN: 'Lupa Check-in',
    FORGOT_CHECK_OUT: 'Lupa Check-out',
    DEVICE_FAILURE: 'Gangguan Perangkat',
    NETWORK_FAILURE: 'Gangguan Jaringan',
    SHIFT_ADJUSTMENT: 'Penyesuaian Shift',
    EMERGENCY_OVERRIDE: 'Emergency Override',
    BULK_IMPORT_FIX: 'Perbaikan Bulk Import'
};

interface ApprovalQueueProps {
    loadPendingRequests: () => Promise<void>;
    loadingPending: boolean;
    pendingRequests: AttendanceChangeRequest[];
    currentUserId?: string;
    canApproveAttendanceRequests: boolean;
    handleApproveRequest: (requestId: string) => Promise<void>;
    handleRejectRequest: (requestId: string) => Promise<void>;
    employees: Employee[];
}

const ApprovalQueue: React.FC<ApprovalQueueProps> = ({
    loadPendingRequests,
    loadingPending,
    pendingRequests,
    currentUserId,
    canApproveAttendanceRequests,
    handleApproveRequest,
    handleRejectRequest,
    employees
}) => {
    const formatDistance = (meters: number | null | undefined): string => {
        if (meters === null || meters === undefined) return '';
        if (meters >= 1000) {
            const kms = meters / 1000;
            return `${kms.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;
        }
        return `${Math.round(meters)} m`;
    };

    return (
        <section className="rounded-2xl border border-gray-150 bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
                <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                        Maker-Checker Queue
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">Antrean persetujuan perubahan kehadiran karyawan.</p>
                </div>
                <button
                    type="button"
                    onClick={() => void loadPendingRequests()}
                    className="flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm transition-all hover:bg-gray-50 active:scale-95"
                >
                    <svg className={`h-3.5 w-3.5 text-slate-500 ${loadingPending ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
                    </svg>
                    Refresh
                </button>
            </div>

            {loadingPending ? (
                <div className="flex flex-col items-center justify-center py-10 space-y-3">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-[#06736a]" />
                    <p className="text-sm font-medium text-slate-500">Memuat pending request...</p>
                </div>
            ) : pendingRequests.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                    <svg className="h-12 w-12 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-3 text-sm font-bold text-slate-800">Antrean Bersih</p>
                    <p className="text-xs text-slate-500 mt-1">Tidak ada request absensi yang menunggu approval.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pendingRequests.map((request) => {
                        const isOwnRequest = Boolean(currentUserId && request.maker_user_id === currentUserId);
                        
                        // Find matching employee details
                        const employee = employees.find(
                            (e) => e.id === request.employee_id || e.nik === request.employee_id
                        );

                        // Format clock in/out from proposed data
                        const proposedIn = request.proposed_data?.clockIn || '-';
                        const proposedOut = request.proposed_data?.clockOut || '-';

                        return (
                            <div 
                                key={request.id} 
                                className="group relative rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition-all duration-200 hover:border-gray-300"
                            >
                                {/* Header / Employee Profile */}
                                <div className="flex items-start justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        {employee?.foto ? (
                                            <img 
                                                src={employee.foto} 
                                                alt={employee.nama} 
                                                className="h-10 w-10 rounded-full object-cover border border-gray-200"
                                            />
                                        ) : (
                                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#06736a]/10 text-sm font-bold text-[#06736a]">
                                                {(employee?.nama || request.employee_id).substring(0, 2).toUpperCase()}
                                            </div>
                                        )}
                                        <div>
                                            <h4 className="text-sm font-bold text-slate-800 group-hover:text-[#06736a] transition-colors">
                                                {employee?.nama || 'Karyawan Tidak Dikenal'}
                                            </h4>
                                            <p className="text-xs text-slate-500">
                                                NIK: {employee?.nik || request.employee_id} &middot; {employee?.jabatan || 'Staf'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 border border-amber-200/50">
                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                                        Pending
                                    </span>
                                </div>

                                <hr className="my-3 border-gray-100" />

                                {/* Proposed Changes Details */}
                                <div className="grid grid-cols-2 gap-4 bg-slate-50/50 rounded-xl p-4 border border-gray-100">
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tanggal Absensi</p>
                                        <p className="text-xs font-semibold text-slate-700 mt-0.5">{request.attendance_date}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Alasan Perubahan</p>
                                        <p className="text-xs font-semibold text-[#06736a] mt-0.5">
                                            {ATTENDANCE_REASON_MAP[request.reason_code] || request.reason_code}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jam Masuk (Proposed)</p>
                                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{proposedIn}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Jam Keluar (Proposed)</p>
                                        <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{proposedOut}</p>
                                    </div>
                                </div>

                                {request.reason_detail && (
                                    <div className="mt-2.5 rounded-lg bg-[#06736a]/5 p-3 border border-[#06736a]/10">
                                        <p className="text-[10px] font-bold uppercase tracking-wider text-[#06736a]">Detail Catatan</p>
                                        <p className="text-xs text-slate-700 mt-0.5 italic">"{request.reason_detail}"</p>
                                    </div>
                                )}

                                {/* Location / Fingerprint Status */}
                                <div className="mt-3 flex flex-wrap items-center gap-2">
                                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium border ${
                                        request.location_verified
                                            ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
                                            : 'border-rose-200 bg-rose-50 text-rose-700'
                                    }`}>
                                        <span className={`h-1.5 w-1.5 rounded-full ${request.location_verified ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                                        {request.location_verified
                                            ? (request.location_text && request.location_text.includes('(')
                                                ? `🖐️ ${request.location_text}`
                                                : 'Lokasi Valid (Sesuai Geofence)')
                                            : 'Lokasi Belum Terverifikasi'}
                                    </span>
                                    {/* Jarak GPS — hanya tampil jika bukan absensi fingerprint desktop */}
                                    {request.location_distance_meters !== null && request.location_distance_meters !== undefined && request.location_distance_meters > 0 && (
                                        <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs text-slate-600 shadow-sm">
                                            📍 Jarak: {formatDistance(request.location_distance_meters)}
                                        </span>
                                    )}
                                    <span className="text-[10px] text-slate-400 ml-auto self-center">
                                        {request.source_portal === 'personal' ? '📱 Mobile App' : '🖥️ Web Desktop'}
                                    </span>
                                </div>

                                {/* Action Buttons / Access Warnings */}
                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-4">
                                    {canApproveAttendanceRequests && !isOwnRequest && (
                                        <div className="flex gap-2 w-full">
                                            <button
                                                type="button"
                                                onClick={() => void handleApproveRequest(request.id)}
                                                className="flex-1 rounded-xl bg-emerald-600 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-emerald-700 hover:shadow active:scale-98"
                                            >
                                                Setujui (Approve)
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => void handleRejectRequest(request.id)}
                                                className="flex-1 rounded-xl bg-rose-600 py-2.5 text-center text-xs font-bold text-white shadow-sm transition-all hover:bg-rose-700 hover:shadow active:scale-98"
                                            >
                                                Tolak (Reject)
                                            </button>
                                        </div>
                                    )}

                                    {canApproveAttendanceRequests && isOwnRequest && (
                                        <div className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2.5 text-xs text-amber-800 border border-amber-200/50 w-full">
                                            <svg className="h-4 w-4 text-amber-600 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                            <span>
                                                <strong>Maker = Checker Konflik:</strong> Anda adalah pembuat request ini. Persetujuan harus dilakukan oleh akun checker lain.
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </section>
    );
};

export default ApprovalQueue;
