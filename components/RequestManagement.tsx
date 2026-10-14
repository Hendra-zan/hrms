import React, { useState, useMemo, useEffect } from 'react';
import { AllRequest, Employee, RequestStatus, RequestType, Role, ShiftSwapRequest } from '../types.ts';
import { CheckCircleIcon, XCircleIcon } from './icons.tsx';
import {
    getShiftSwapRequests,
    approveShiftSwapByUnitHead,
    rejectShiftSwapByUnitHead,
} from '../services/shiftSwapService.ts';

interface RequestManagementProps {
    allRequests: AllRequest[];
    employees: Employee[];
    onUpdateRequestStatus: (requestId: string, type: RequestType, newStatus: RequestStatus) => void;
    currentUserRole?: Role;
    currentEmployeeId?: string;
}

const RequestManagement: React.FC<RequestManagementProps> = ({
    allRequests,
    employees,
    onUpdateRequestStatus,
    currentUserRole = 'admin',
    currentEmployeeId,
}) => {
    const [activeTab, setActiveTab] = useState<'requests' | 'shift_swap'>('requests');
    const [statusFilter, setStatusFilter] = useState<RequestStatus | 'Semua'>('Semua');
    const [typeFilter, setTypeFilter] = useState<RequestType | 'Semua'>('Semua');

    // Shift Swap States
    const [swapRequests, setSwapRequests] = useState<ShiftSwapRequest[]>([]);
    const [swapStatusFilter, setSwapStatusFilter] = useState<string>('all');
    const [swapLoading, setSwapLoading] = useState(false);
    const [actionNote, setActionNote] = useState<{ [key: string]: string }>({});

    const employeeMap = useMemo(() => new Map(employees.map(emp => [emp.id, emp])), [employees]);

    const loadSwapRequests = async () => {
        setSwapLoading(true);
        try {
            const data = await getShiftSwapRequests({ statusFilter: swapStatusFilter });
            setSwapRequests(data);
        } catch (err) {
            console.error('Failed to load swap requests:', err);
        } finally {
            setSwapLoading(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'shift_swap') {
            loadSwapRequests();
        }
    }, [activeTab, swapStatusFilter]);

    const handleApproveSwap = async (requestId: string) => {
        if (!currentEmployeeId) {
            alert('ID Karyawan Pengguna aktif tidak terdeteksi.');
            return;
        }
        try {
            const note = actionNote[requestId] || 'Disetujui oleh Kepala Unit';
            await approveShiftSwapByUnitHead(requestId, currentEmployeeId, note);
            alert('Pertukaran shift berhasil disetujui & jadwal kerja diperbarui!');
            await loadSwapRequests();
        } catch (err: any) {
            alert(`Gagal menyetujui tukar shift: ${err?.message || err}`);
        }
    };

    const handleRejectSwap = async (requestId: string) => {
        if (!currentEmployeeId) {
            alert('ID Karyawan Pengguna aktif tidak terdeteksi.');
            return;
        }
        try {
            const note = actionNote[requestId] || 'Ditolak oleh Kepala Unit';
            await rejectShiftSwapByUnitHead(requestId, currentEmployeeId, note);
            alert('Pengajuan tukar shift ditolak.');
            await loadSwapRequests();
        } catch (err: any) {
            alert(`Gagal menolak tukar shift: ${err?.message || err}`);
        }
    };

    const filteredRequests = useMemo(() => {
        return allRequests
            .filter(req => statusFilter === 'Semua' || req.status === statusFilter)
            .filter(req => typeFilter === 'Semua' || req.type === typeFilter)
            .sort((a, b) => new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime());
    }, [allRequests, statusFilter, typeFilter]);

    const StatusBadge: React.FC<{ status: RequestStatus }> = ({ status }) => {
        const baseClasses = "px-2 inline-flex text-xs leading-5 font-semibold rounded-full";
        const statusClasses = {
            [RequestStatus.Pending]: "bg-yellow-100 text-yellow-800",
            [RequestStatus.Approved]: "bg-green-100 text-green-800",
            [RequestStatus.Rejected]: "bg-red-100 text-red-800",
        };
        const statusLabels = {
            [RequestStatus.Pending]: "Menunggu",
            [RequestStatus.Approved]: "Disetujui",
            [RequestStatus.Rejected]: "Ditolak",
        };
        return <span className={`${baseClasses} ${statusClasses[status]}`}>{statusLabels[status]}</span>;
    };

    const SwapStatusBadge: React.FC<{ status: ShiftSwapRequest['overall_status'] }> = ({ status }) => {
        const base = "px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full";
        switch (status) {
            case 'pending_peer':
                return <span className={`${base} bg-yellow-100 text-yellow-800`}>⏳ Menunggu Rekan Kerja</span>;
            case 'pending_unit':
                return <span className={`${base} bg-purple-100 text-purple-800`}>⏳ Menunggu Kepala Unit</span>;
            case 'approved':
                return <span className={`${base} bg-emerald-100 text-emerald-800`}>✅ Disetujui (Jadwal Swapped)</span>;
            case 'rejected':
                return <span className={`${base} bg-red-100 text-red-800`}>❌ Ditolak</span>;
            default:
                return <span className={`${base} bg-gray-100 text-gray-800`}>{status}</span>;
        }
    };

    const isHRDMonitoringOnly = currentUserRole === 'hrd';

    return (
        <div className="bg-white p-6 rounded-xl shadow-md">
            {/* Header & Sub-Nav Tabs */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b pb-4">
                <div>
                    <h3 className="text-xl font-bold text-primary">Manajemen Permohonan & Tukar Shift</h3>
                    <p className="text-xs text-gray-500 mt-1">
                        {isHRDMonitoringOnly
                            ? 'Mode Monitoring HRD (Read-Only Audit & Monitoring)'
                            : 'Kelola persetujuan cuti, izin, lembur, dan tukar shift berjenjang.'}
                    </p>
                </div>

                <div className="flex bg-gray-100 p-1 rounded-xl gap-1">
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition ${
                            activeTab === 'requests' ? 'bg-white text-[#06736a] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        📋 Permohonan Umum (Cuti/Izin/Lembur)
                    </button>
                    <button
                        onClick={() => setActiveTab('shift_swap')}
                        className={`px-4 py-2 text-xs font-bold rounded-lg transition flex items-center gap-1.5 ${
                            activeTab === 'shift_swap' ? 'bg-white text-[#06736a] shadow-sm' : 'text-gray-600 hover:text-gray-900'
                        }`}
                    >
                        <span>🔀 Tukar Shift</span>
                        {isHRDMonitoringOnly && (
                            <span className="px-1.5 py-0.5 text-[10px] bg-blue-100 text-blue-700 font-bold rounded-md">
                                HRD Monitoring
                            </span>
                        )}
                    </button>
                </div>
            </div>

            {/* TAB 1: PERMOHONAN UMUM */}
            {activeTab === 'requests' && (
                <>
                    <div className="flex gap-4 mb-4">
                        <select
                            value={statusFilter}
                            onChange={e => setStatusFilter(e.target.value as RequestStatus | 'Semua')}
                            className="border-gray-300 rounded-lg shadow-sm text-sm"
                        >
                            <option value="Semua">Semua Status</option>
                            {Object.values(RequestStatus).map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <select
                            value={typeFilter}
                            onChange={e => setTypeFilter(e.target.value as RequestType | 'Semua')}
                            className="border-gray-300 rounded-lg shadow-sm text-sm"
                        >
                            <option value="Semua">Semua Tipe</option>
                            {Object.values(RequestType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Karyawan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipe</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detail</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tgl Diajukan</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredRequests.map(req => {
                                    const employee = employeeMap.get(req.employeeId);
                                    return (
                                        <tr key={req.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{employee?.nama || 'N/A'}</div>
                                                <div className="text-sm text-gray-500">{employee?.jabatan}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">{req.type}</td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {(() => {
                                                    const getPropSafe = (obj: any, camelKey: string, snakeKey: string) => {
                                                        return obj[camelKey] !== undefined ? obj[camelKey] : obj[snakeKey];
                                                    };
                                                    const formatDateSafe = (dateVal: any) => {
                                                        if (!dateVal) return 'N/A';
                                                        const d = new Date(dateVal);
                                                        if (isNaN(d.getTime())) return 'N/A';
                                                        return d.toLocaleDateString('id-ID');
                                                    };

                                                    if (req.type === RequestType.Cuti || req.type === RequestType.Izin) {
                                                        return (
                                                            <div>
                                                                <p className="font-medium">
                                                                    {`${formatDateSafe(getPropSafe(req, 'startDate', 'start_date'))} - ${formatDateSafe(getPropSafe(req, 'endDate', 'end_date'))}`}
                                                                </p>
                                                                <p className="text-xs text-gray-500 max-w-xs break-words">{req.reason}</p>
                                                            </div>
                                                        );
                                                    }

                                                    if (req.type === RequestType.Overtime) {
                                                        const meta = getPropSafe(req, 'overtimeMetadata', 'overtime_metadata');
                                                        return (
                                                            <div>
                                                                <p className="font-medium">
                                                                    {`${formatDateSafe(getPropSafe(req, 'startDate', 'start_date'))}`}
                                                                </p>
                                                                <p className="text-xs text-gray-600"><span className="font-semibold text-gray-700">Alasan:</span> {req.reason}</p>
                                                            </div>
                                                        );
                                                    }

                                                    if (req.type === RequestType.Reimburse || req.type === RequestType.Reimbursement) {
                                                        const description = req.reason || req.description || '';
                                                        const amount = req.amount || 0;
                                                        return (
                                                            <div>
                                                                <p className="font-medium text-emerald-600">{`Rp ${amount.toLocaleString('id-ID')}`}</p>
                                                                <p className="text-xs text-gray-500 max-w-xs break-words">{description}</p>
                                                            </div>
                                                        );
                                                    }

                                                    return null;
                                                })()}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(req.requestedAt).toLocaleDateString('id-ID')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                {!isHRDMonitoringOnly && req.status === RequestStatus.Pending && (
                                                    <>
                                                        <button onClick={() => onUpdateRequestStatus(req.id, req.type, RequestStatus.Approved)} className="p-2 text-green-500 hover:text-green-700 rounded-full hover:bg-green-50" title="Setujui">
                                                            <CheckCircleIcon className="h-5 w-5" />
                                                        </button>
                                                        <button onClick={() => onUpdateRequestStatus(req.id, req.type, RequestStatus.Rejected)} className="p-2 text-red-500 hover:text-red-700 rounded-full hover:bg-red-50 ml-2" title="Tolak">
                                                            <XCircleIcon className="h-5 w-5" />
                                                        </button>
                                                    </>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    {filteredRequests.length === 0 && <p className="text-center py-10 text-gray-500">Tidak ada permohonan yang cocok dengan filter.</p>}
                </>
            )}

            {/* TAB 2: TUKAR SHIFT & MULTI-TIER APPROVAL */}
            {activeTab === 'shift_swap' && (
                <>
                    <div className="flex justify-between items-center mb-4">
                        <select
                            value={swapStatusFilter}
                            onChange={e => setSwapStatusFilter(e.target.value)}
                            className="border-gray-300 rounded-lg shadow-sm text-sm"
                        >
                            <option value="all">Semua Status Tukar Shift</option>
                            <option value="pending_peer">Menunggu Persetujuan Rekan Kerja (Tier 1)</option>
                            <option value="pending_unit">Menunggu Persetujuan Kepala Unit (Tier 2)</option>
                            <option value="approved">Disetujui (Approved)</option>
                            <option value="rejected">Ditolak (Rejected)</option>
                        </select>

                        <button
                            onClick={loadSwapRequests}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition"
                        >
                            🔄 Refresh Data
                        </button>
                    </div>

                    {swapLoading ? (
                        <p className="text-center py-8 text-gray-500">Memuat pengajuan tukar shift...</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pemohon (Staff A)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rekan Kerja (Staff B)</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alasan</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier 1: Rekan</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tier 2: Kepala Unit</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status Akhir</th>
                                        {!isHRDMonitoringOnly && <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Aksi Approval</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {swapRequests.map((swap) => (
                                        <tr key={swap.id}>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-gray-900">{swap.requester_employee?.nama || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{swap.requester_schedule?.schedule_date || '-'} ({swap.requester_schedule?.shift_name || '-'})</p>
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-sm font-semibold text-gray-900">{swap.target_employee?.nama || 'N/A'}</p>
                                                <p className="text-xs text-gray-500">{swap.target_schedule?.schedule_date || '-'} ({swap.target_schedule?.shift_name || '-'})</p>
                                            </td>
                                            <td className="px-4 py-3 text-xs text-gray-600 max-w-xs break-words">
                                                "{swap.reason}"
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                {swap.peer_status === 'approved' ? (
                                                    <span className="text-emerald-700 font-semibold">✓ Disetujui Rekan</span>
                                                ) : swap.peer_status === 'rejected' ? (
                                                    <span className="text-red-700 font-semibold">✗ Ditolak Rekan</span>
                                                ) : (
                                                    <span className="text-amber-600 italic">⏳ Menunggu Rekan</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap text-xs">
                                                {swap.unit_approval_status === 'approved' ? (
                                                    <div>
                                                        <span className="text-emerald-700 font-semibold">✓ Approved</span>
                                                        {swap.unit_approver_employee && (
                                                            <p className="text-[11px] text-gray-400">oleh {swap.unit_approver_employee.nama}</p>
                                                        )}
                                                    </div>
                                                ) : swap.unit_approval_status === 'rejected' ? (
                                                    <span className="text-red-700 font-semibold">✗ Rejected</span>
                                                ) : (
                                                    <span className="text-amber-600 italic">⏳ Menunggu Kepala Unit</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 whitespace-nowrap">
                                                <SwapStatusBadge status={swap.overall_status} />
                                            </td>

                                            {/* Aksi Kepala Unit / Supervisor */}
                                            {!isHRDMonitoringOnly && (
                                                <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                                                    {swap.overall_status === 'pending_unit' ? (
                                                        <div className="flex flex-col items-end gap-1.5">
                                                            <input
                                                                type="text"
                                                                placeholder="Catatan peninjauan..."
                                                                className="text-xs border border-gray-300 rounded px-2 py-1 w-36"
                                                                value={actionNote[swap.id] || ''}
                                                                onChange={(e) => setActionNote({ ...actionNote, [swap.id]: e.target.value })}
                                                            />
                                                            <div className="flex gap-1">
                                                                <button
                                                                    onClick={() => handleApproveSwap(swap.id)}
                                                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded shadow text-xs"
                                                                >
                                                                    Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectSwap(swap.id)}
                                                                    className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded shadow text-xs"
                                                                >
                                                                    Reject
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-gray-400 italic text-[11px]">Selesai</span>
                                                    )}
                                                </td>
                                            )}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                    {swapRequests.length === 0 && !swapLoading && (
                        <p className="text-center py-10 text-gray-500">Belum ada pengajuan tukar shift.</p>
                    )}
                </>
            )}
        </div>
    );
};

export default RequestManagement;