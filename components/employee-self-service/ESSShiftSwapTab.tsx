import React, { useEffect, useState } from 'react';
import { supabase } from '../../services/supabaseClient.ts';
import { Employee, ShiftSwapRequest, EmployeeSchedule } from '../../types.ts';
import { createShiftSwapRequest, respondShiftSwapByPeer, getShiftSwapRequests } from '../../services/shiftSwapService.ts';
import { getSchedulesByEmployee } from '../../services/scheduleService.ts';
import LoadingSpinner from '../LoadingSpinner.tsx';
import logger from '../../services/logger.ts';

interface ESSShiftSwapTabProps {
    user: Employee;
}

const ESSShiftSwapTab: React.FC<ESSShiftSwapTabProps> = ({ user }) => {
    const [requests, setRequests] = useState<ShiftSwapRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    // Form states
    const [mySchedules, setMySchedules] = useState<EmployeeSchedule[]>([]);
    const [selectedMySchedId, setSelectedMySchedId] = useState('');
    const [peers, setPeers] = useState<Employee[]>([]);
    const [selectedPeerId, setSelectedPeerId] = useState('');
    const [peerSchedules, setPeerSchedules] = useState<EmployeeSchedule[]>([]);
    const [selectedPeerSchedId, setSelectedPeerSchedId] = useState('');
    const [reason, setReason] = useState('');

    const [notification, setNotification] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [showNewRequestForm, setShowNewRequestForm] = useState(false);

    const showNotification = (type: 'success' | 'error', text: string) => {
        setNotification({ type, text });
        setTimeout(() => setNotification(null), 4000);
    };

    useEffect(() => {
        loadData();
    }, [user.id]);

    const loadData = async () => {
        try {
            setLoading(true);
            // 1. Ambil daftar pengajuan yang melibatkan user ini
            const reqs = await getShiftSwapRequests({ employeeId: user.id });
            setRequests(reqs);

            // 2. Ambil jadwal dinas terbit milik user (45 hari ke depan)
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            const end = new Date();
            end.setDate(end.getDate() + 45);
            const endDate = end.toISOString().split('T')[0];

            const myScheds = await getSchedulesByEmployee(user.id, startDate, endDate);
            // Hanya tampilkan jadwal dinas kerja (bukan hari libur) yang sudah terbit (published)
            setMySchedules(myScheds.filter(s => !s.is_off_day && s.status === 'published'));

            // 3. Ambil daftar rekan kerja se-unit
            const unitId = user.unitKerjaId || user.managedUnitId;
            if (unitId) {
                const { data: peerData, error: peerErr } = await supabase
                    .from('employees')
                    .select('id, nama, jabatan, foto')
                    .eq('unitKerjaId', unitId)
                    .neq('id', user.id)
                    .order('nama');
                
                if (!peerErr && peerData) {
                    setPeers(peerData as unknown as Employee[]);
                }
            }
        } catch (err: any) {
            logger.error('Error loading shift swap data', err);
            showNotification('error', `Gagal memuat data: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    const handlePeerChange = async (peerId: string) => {
        setSelectedPeerId(peerId);
        setSelectedPeerSchedId('');
        setPeerSchedules([]);
        if (!peerId) return;

        try {
            const today = new Date();
            const startDate = today.toISOString().split('T')[0];
            const end = new Date();
            end.setDate(end.getDate() + 45);
            const endDate = end.toISOString().split('T')[0];

            const pScheds = await getSchedulesByEmployee(peerId, startDate, endDate);
            setPeerSchedules(pScheds.filter(s => !s.is_off_day && s.status === 'published'));
        } catch (err: any) {
            showNotification('error', `Gagal memuat jadwal rekan: ${err.message}`);
        }
    };

    const handleCreateRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMySchedId || !selectedPeerId || !selectedPeerSchedId || !reason.trim()) {
            showNotification('error', 'Semua kolom formulir wajib diisi.');
            return;
        }

        try {
            setSubmitting(false);
            await createShiftSwapRequest({
                requesterEmployeeId: user.id,
                requesterScheduleId: selectedMySchedId,
                targetEmployeeId: selectedPeerId,
                targetScheduleId: selectedPeerSchedId,
                reason: reason.trim()
            });

            showNotification('success', 'Pengajuan tukar shift berhasil dikirim ke rekan kerja.');
            setShowNewRequestForm(false);
            
            // Reset form
            setSelectedMySchedId('');
            setSelectedPeerId('');
            setSelectedPeerSchedId('');
            setPeerSchedules([]);
            setReason('');
            
            await loadData();
        } catch (err: any) {
            showNotification('error', `Gagal membuat pengajuan: ${err.message}`);
        } finally {
            setSubmitting(false);
        }
    };

    const handlePeerResponse = async (requestId: string, approve: boolean) => {
        try {
            setActionLoading(requestId);
            await respondShiftSwapByPeer(requestId, user.id, approve);
            showNotification(
                'success',
                approve 
                    ? 'Persetujuan terkirim. Menunggu persetujuan final Kepala Unit.' 
                    : 'Pengajuan tukar shift berhasil ditolak.'
            );
            await loadData();
        } catch (err: any) {
            showNotification('error', `Gagal memproses persetujuan: ${err.message}`);
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadgeClass = (status: string) => {
        switch (status) {
            case 'pending_peer':
                return 'bg-amber-50 text-amber-700 border-amber-200';
            case 'pending_unit':
                return 'bg-purple-50 text-purple-700 border-purple-200';
            case 'approved':
                return 'bg-emerald-50 text-emerald-700 border-emerald-200';
            case 'rejected':
                return 'bg-rose-50 text-rose-700 border-rose-200';
            default:
                return 'bg-slate-50 text-slate-600 border-slate-200';
        }
    };

    const getStatusText = (status: string) => {
        switch (status) {
            case 'pending_peer':
                return 'Menunggu Rekan';
            case 'pending_unit':
                return 'Menunggu Kepala Unit';
            case 'approved':
                return 'Disetujui';
            case 'rejected':
                return 'Ditolak';
            default:
                return status;
        }
    };

    if (loading && requests.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <LoadingSpinner size="large" />
                <p className="text-gray-500 text-sm animate-pulse">Memuat data pertukaran shift...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Top Bar / Notification */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-bold text-gray-800">🔀 Pengajuan Tukar Shift Kerja</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Ajukan pertukaran jadwal dinas antar rekan kerja dalam satu unit.
                    </p>
                </div>
                {!showNewRequestForm && (
                    <button
                        onClick={() => setShowNewRequestForm(true)}
                        className="px-4 py-2 text-sm bg-gradient-to-r from-[#06736a] to-[#089c8e] text-white rounded-xl hover:from-[#055f57] hover:to-[#067c71] transition-all shadow-md font-semibold flex items-center gap-1.5"
                    >
                        <span>＋</span> Buat Pengajuan Baru
                    </button>
                )}
            </div>

            {notification && (
                <div className={`p-4 rounded-xl border flex items-center justify-between text-sm shadow-sm transition-all duration-300 animate-fadeIn ${
                    notification.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                    <span>{notification.text}</span>
                    <button onClick={() => setNotification(null)} className="text-xs opacity-60 hover:opacity-100 font-bold">✕</button>
                </div>
            )}

            {/* Create Request Form */}
            {showNewRequestForm && (
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden animate-slideDown">
                    <div className="p-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <span className="font-bold text-gray-800">📝 Formulir Pengajuan Tukar Shift</span>
                        <button
                            onClick={() => setShowNewRequestForm(false)}
                            className="text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
                        >
                            Batal
                        </button>
                    </div>

                    <form onSubmit={handleCreateRequest} className="p-6 space-y-5">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            {/* Step 1: Select My Schedule */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-gray-600">
                                    1. Pilih Jadwal Dinas Anda yang Ingin Ditukar
                                </label>
                                <select
                                    value={selectedMySchedId}
                                    onChange={e => setSelectedMySchedId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    required
                                >
                                    <option value="">-- Pilih Jadwal Anda --</option>
                                    {mySchedules.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.schedule_date} ({s.shift_name})
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Step 2: Select Peer */}
                            <div className="space-y-1.5">
                                <label className="block text-xs font-semibold text-gray-600">
                                    2. Pilih Rekan Kerja Unit Anda
                                </label>
                                <select
                                    value={selectedPeerId}
                                    onChange={e => handlePeerChange(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white"
                                    required
                                >
                                    <option value="">-- Pilih Rekan Kerja --</option>
                                    {peers.map(p => (
                                        <option key={p.id} value={p.id}>
                                            {p.nama} {p.jabatan ? `(${p.jabatan})` : ''}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Step 3: Select Peer's Schedule */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600">
                                    3. Pilih Jadwal Dinas Rekan Kerja untuk Ditukar
                                </label>
                                <select
                                    value={selectedPeerSchedId}
                                    onChange={e => setSelectedPeerSchedId(e.target.value)}
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary bg-white disabled:bg-gray-50 disabled:text-gray-400"
                                    disabled={!selectedPeerId}
                                    required
                                >
                                    <option value="">
                                        {!selectedPeerId ? '[Pilih rekan kerja terlebih dahulu]' : '-- Pilih Jadwal Rekan --'}
                                    </option>
                                    {peerSchedules.map(s => (
                                        <option key={s.id} value={s.id}>
                                            {s.schedule_date} ({s.shift_name})
                                        </option>
                                    ))}
                                </select>
                                {selectedPeerId && peerSchedules.length === 0 && (
                                    <p className="text-[10px] text-rose-500 mt-1">
                                        ⚠️ Rekan kerja ini belum memiliki jadwal dinas aktif/terbit untuk ditukar.
                                    </p>
                                )}
                            </div>

                            {/* Step 4: Reason */}
                            <div className="space-y-1.5 md:col-span-2">
                                <label className="block text-xs font-semibold text-gray-600">
                                    4. Alasan Tukar Shift (Wajib)
                                </label>
                                <textarea
                                    value={reason}
                                    onChange={e => setReason(e.target.value)}
                                    placeholder="Tulis alasan pertukaran jadwal..."
                                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary h-20 resize-none"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={() => setShowNewRequestForm(false)}
                                className="px-4 py-2 text-sm border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-100 font-medium"
                            >
                                Batal
                            </button>
                            <button
                                type="submit"
                                disabled={submitting || !selectedMySchedId || !selectedPeerSchedId}
                                className="px-5 py-2 text-sm bg-[#06736a] text-white rounded-xl hover:bg-[#055f57] disabled:opacity-50 font-semibold flex items-center gap-1.5 shadow-md shadow-teal-100"
                            >
                                {submitting ? <LoadingSpinner size="small" color="white" /> : null}
                                Kirim Pengajuan
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Swap Request List */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50/50">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Daftar & Riwayat Tukar Shift Anda
                    </span>
                </div>

                <div className="divide-y divide-gray-100">
                    {requests.length === 0 ? (
                        <div className="text-center py-12 text-gray-500 space-y-2">
                            <span className="text-3xl block">🔄</span>
                            <p className="text-sm">Belum ada pengajuan tukar shift saat ini.</p>
                        </div>
                    ) : (
                        requests.map(req => {
                            const isRequester = req.requester_employee_id === user.id;
                            const reqSched = req.requester_schedule as any;
                            const tarSched = req.target_schedule as any;
                            const peerName = isRequester ? req.target_employee?.nama : req.requester_employee?.nama;
                            const showActionButtons = !isRequester && req.peer_status === 'pending';

                            return (
                                <div key={req.id} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="space-y-2 max-w-2xl">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-100 text-slate-700">
                                                {isRequester ? '📤 Keluar (Pemohon)' : '📥 Masuk (Diajak)'}
                                            </span>
                                            <span className={`px-2 py-0.5 text-[10px] font-bold border rounded-full ${getStatusBadgeClass(req.overall_status)}`}>
                                                {getStatusText(req.overall_status)}
                                            </span>
                                            <span className="text-[10px] text-gray-400">
                                                Dibuat: {new Date(req.created_at).toLocaleDateString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>

                                        {/* Swap Details */}
                                        <div className="text-sm text-gray-800 space-y-1">
                                            <p className="font-semibold text-[#06736a]">
                                                {isRequester ? `Mengajak bertukar dengan: ${peerName}` : `Diajak bertukar oleh: ${peerName}`}
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100 mt-2">
                                                <div>
                                                    <p className="font-semibold text-gray-500">Jadwal Pemohon:</p>
                                                    <p>{reqSched?.schedule_date || '??'} ({reqSched?.shift_name || '??'})</p>
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-gray-500">Jadwal Rekan:</p>
                                                    <p>{tarSched?.schedule_date || '??'} ({tarSched?.shift_name || '??'})</p>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-500 italic mt-1.5">
                                                <strong>Alasan:</strong> "{req.reason}"
                                            </p>
                                            {req.unit_approval_note && (
                                                <p className="text-xs text-amber-700 bg-amber-50 rounded-lg p-2 border border-amber-100 font-medium">
                                                    💬 <strong>Catatan Unit Head:</strong> "{req.unit_approval_note}"
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Action Buttons for Peer */}
                                    {showActionButtons && (
                                        <div className="flex gap-2 self-end md:self-center">
                                            <button
                                                onClick={() => handlePeerResponse(req.id, false)}
                                                disabled={actionLoading !== null}
                                                className="px-3 py-1.5 text-xs font-semibold border border-rose-300 text-rose-600 rounded-xl hover:bg-rose-50 disabled:opacity-50"
                                            >
                                                {actionLoading === req.id ? 'Loading...' : 'Tolak'}
                                            </button>
                                            <button
                                                onClick={() => handlePeerResponse(req.id, true)}
                                                disabled={actionLoading !== null}
                                                className="px-4 py-1.5 text-xs font-semibold bg-[#06736a] text-white rounded-xl hover:bg-[#055f57] disabled:opacity-50 flex items-center gap-1 shadow-sm"
                                            >
                                                {actionLoading === req.id ? <LoadingSpinner size="small" color="white" /> : 'Setujui'}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
};

export default ESSShiftSwapTab;
