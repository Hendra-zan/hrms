import { useState, useEffect, useRef, useCallback } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../../../config/supabase';
import {
    requestService,
    type LeaveRequest,
    type LeaveRequestDraft,
    type RequestType,
} from '../../../services/requestService';
import { logMobileAudit } from '../../../services/auditService';
import { storage } from '../../../lib/storage';
import { formatDate, formatClock, formatDateID } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import type { MobileUser, ShiftSwapRequest } from '../../../types';
import { verifyFace as verifyFaceFromUri } from '../../../services/faceRecognitionService';
import { biometricService } from '../../../services/biometricService';
import { deviceService } from '../../../services/deviceService';
import { getAttendanceLocation } from '../../../services/locationService';
import { geofenceService } from '../../../services/geofenceService';
import { attendanceService } from '../../../services/attendanceService';
import {
    getShiftSwapRequests,
    respondShiftSwapByPeer,
} from '../../../services/shiftSwapService';

const today = () => formatDate(new Date());

export const useRequestsScreenState = (
    user: MobileUser,
    onListChange?: (list: LeaveRequest[]) => void
) => {
    const [list, setList] = useState<LeaveRequest[]>([]);
    const [activeFilter, setActiveFilter] = useState<'Semua' | RequestType>('Semua');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // States for Overtime Clock-In/Out
    const [liveVisible, setLiveVisible] = useState(false);
    const [busy, setBusy] = useState(false);
    const [biometricStatus, setBiometricStatus] = useState<string>('Menunggu verifikasi');
    const [deviceInfo, setDeviceInfo] = useState<any>(null);
    const liveResolverRef = useRef<((uri: string | null) => void) | null>(null);

    // Form Modal states
    const [showForm, setShowForm] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [type, setType] = useState<RequestType>('Izin');
    const [startDate, setStartDate] = useState<string>(today());
    const [endDate, setEndDate] = useState<string>(today());
    const [reason, setReason] = useState('');
    const [amount, setAmount] = useState('');
    const [formError, setFormError] = useState<string | null>(null);
    const [pickerOpen, setPickerOpen] = useState<null | 'start' | 'end'>(null);
    const [draftRestored, setDraftRestored] = useState(false);

    // Shift Swap states
    const [showSwapModal, setShowSwapModal] = useState(false);
    const [shiftSwaps, setShiftSwaps] = useState<ShiftSwapRequest[]>([]);

    const draftKey = `hrms.mobile.requestDraft.${user.id}`;

    useEffect(() => {
        (async () => {
            try {
                const info = await deviceService.ensureDeviceRegistered(user);
                setDeviceInfo(info);
            } catch (err: any) {
                console.warn('Device registration failed:', err?.message || err);
            }
        })();
    }, [user]);

    // Restore draft saat mount.
    useEffect(() => {
        let mounted = true;
        void storage
            .getJSON<
                | {
                    type: RequestType;
                    startDate: string;
                    endDate: string;
                    reason: string;
                    amount: string;
                }
                | null
            >(draftKey, null)
            .then((d) => {
                if (!mounted || !d) {
                    setDraftRestored(true);
                    return;
                }
                if (d.type) setType(d.type);
                if (d.startDate) setStartDate(d.startDate);
                if (d.endDate) setEndDate(d.endDate);
                if (d.reason) setReason(d.reason);
                if (d.amount) setAmount(d.amount);
                if (d.reason?.trim() || (d.amount && d.amount !== '')) {
                    setShowForm(true);
                }
                setDraftRestored(true);
            });
        return () => {
            mounted = false;
        };
    }, [draftKey]);

    // Persist draft (debounced).
    useEffect(() => {
        if (!draftRestored) return;
        const t = setTimeout(() => {
            void storage.setJSON(draftKey, { type, startDate, endDate, reason, amount });
        }, 400);
        return () => clearTimeout(t);
    }, [draftRestored, draftKey, type, startDate, endDate, reason, amount]);

    const clearDraft = () => {
        void storage.remove(draftKey);
    };

    const load = useCallback(async () => {
        setError(null);
        try {
            const data = await requestService.listForEmployee(user.id);
            setList(data);

            const swaps = await getShiftSwapRequests({ employeeId: user.employeeId || user.id });
            setShiftSwaps(swaps);
        } catch (err: any) {
            setError(err?.message || 'Gagal memuat pengajuan');
        }
    }, [user.id, user.employeeId]);

    const handlePeerRespond = async (swapId: string, approve: boolean) => {
        try {
            await respondShiftSwapByPeer(swapId, user.employeeId || user.id, approve);
            Alert.alert('Sukses', approve ? 'Persetujuan tukar shift dikirim ke Kepala Unit' : 'Pengajuan ditolak');
            await load();
        } catch (err: any) {
            Alert.alert('Gagal', err?.message || 'Gagal memproses persetujuan');
        }
    };

    useEffect(() => {
        onListChange?.(list);
    }, [list, onListChange]);

    useEffect(() => {
        let mounted = true;
        setLoading(true);
        void load().finally(() => {
            if (mounted) setLoading(false);
        });

        const empId = user.id || user.employeeId;
        const channel = supabase
            .channel(`mobile_leave_requests_${empId}`)
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'requests',
                },
                () => {
                    if (mounted) {
                        void load();
                    }
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            void supabase.removeChannel(channel);
        };
    }, [load, user.id, user.employeeId]);

    const handleRefresh = async () => {
        setRefreshing(true);
        try {
            await load();
        } finally {
            setRefreshing(false);
        }
    };

    const resetForm = () => {
        setType('Izin');
        setStartDate(today());
        setEndDate(today());
        setReason('');
        setAmount('');
        setFormError(null);
        clearDraft();
    };

    const handleCancel = (item: LeaveRequest) => {
        Alert.alert(
            'Batalkan pengajuan?',
            `${item.type} ${formatDateID(item.startDate)} akan dihapus permanen.`,
            [
                { text: 'Tutup', style: 'cancel' },
                {
                    text: 'Batalkan',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await requestService.cancel(item.id);
                            setList((prev) => prev.filter((r) => r.id !== item.id));
                            haptics.success();
                        } catch (err: any) {
                            haptics.error();
                            Alert.alert('Gagal membatalkan', err?.message || 'Coba lagi nanti.');
                        }
                    },
                },
            ]
        );
    };

    const captureAndVerify = async (phase: 'check_in' | 'check_out') => {
        setBiometricStatus('Memeriksa biometrik perangkat...');
        const isDeviceBioAuth = await biometricService.authenticateFingerprint('Verifikasi Biometrik');
        if (!isDeviceBioAuth.success) {
            console.log('[requests] Biometrik perangkat tidak aktif/dibatalkan, lanjut ke verifikasi wajah...');
        }

        setBiometricStatus('Liveness & Face Recognition...');
        const photoUri = await new Promise<string | null>((resolve) => {
            liveResolverRef.current = resolve;
            setLiveVisible(true);
        });

        if (!photoUri) {
            Alert.alert('Batal', 'Verifikasi wajah dibatalkan.');
            return null;
        }

        setBiometricStatus('Mencocokkan wajah...');
        const faceRes = await verifyFaceFromUri(user.employeeId || user.id, photoUri);
        return {
            verified: faceRes.verified,
            score: faceRes.similarity,
            photoUri,
        };
    };

    const handleOvertimeCheckIn = async (item: LeaveRequest) => {
        setBusy(true);
        try {
            const verification = await captureAndVerify('check_in');
            if (!verification) {
                setBusy(false);
                return;
            }
            if (!verification.verified) {
                Alert.alert('Verifikasi gagal', 'Wajah tidak cocok.');
                setBusy(false);
                return;
            }

            const location = await getAttendanceLocation();
            if (location.error || location.latitude === undefined || location.longitude === undefined) {
                Alert.alert('Lokasi tidak tersedia', location.label || 'Gagal mendeteksi lokasi');
                setBusy(false);
                return;
            }

            const geofence = await geofenceService.evaluate(location.latitude, location.longitude);
            if (geofence && !geofence.withinRadius) {
                const distanceKm = (geofence.distanceMeters / 1000).toFixed(2);
                Alert.alert('Di luar area RS', `Jarak Anda: ${distanceKm} km (batas ${geofence.radiusMeters} m).`);
                setBusy(false);
                return;
            }

            const meta = {
                clockIn: formatClock(),
                locationIn: location.label,
                latitudeIn: location.latitude,
                longitudeIn: location.longitude,
                faceScoreIn: verification.score,
            };

            await requestService.updateOvertimeMetadata(item.id, meta);
            haptics.success();
            Alert.alert('Mulai lembur berhasil', `Waktu masuk dicatat: ${meta.clockIn}`);
            await load();
        } catch (err: any) {
            haptics.error();
            Alert.alert('Gagal check-in lembur', err?.message || 'Silakan coba lagi.');
        } finally {
            setBusy(false);
        }
    };

    const handleOvertimeCheckOut = async (item: LeaveRequest) => {
        setBusy(true);
        try {
            const verification = await captureAndVerify('check_out');
            if (!verification) {
                setBusy(false);
                return;
            }
            if (!verification.verified) {
                Alert.alert('Verifikasi gagal', 'Wajah tidak cocok.');
                setBusy(false);
                return;
            }

            const location = await getAttendanceLocation();
            if (location.error || location.latitude === undefined || location.longitude === undefined) {
                Alert.alert('Lokasi tidak tersedia', location.label || 'Gagal mendeteksi lokasi');
                setBusy(false);
                return;
            }

            const geofence = await geofenceService.evaluate(location.latitude, location.longitude);
            if (geofence && !geofence.withinRadius) {
                const distanceKm = (geofence.distanceMeters / 1000).toFixed(2);
                Alert.alert('Di luar area RS', `Jarak Anda: ${distanceKm} km (batas ${geofence.radiusMeters} m).`);
                setBusy(false);
                return;
            }

            const currentMeta = item.overtimeMetadata || {};
            const clockOutTime = formatClock();
            const updatedMeta = {
                ...currentMeta,
                clockOut: clockOutTime,
                locationOut: location.label,
                latitudeOut: location.latitude,
                longitudeOut: location.longitude,
                faceScoreOut: verification.score,
            };

            const [inH, inM] = String(currentMeta.clockIn || '08:00').split(':').map(Number);
            const [outH, outM] = clockOutTime.split(':').map(Number);
            let diff = (outH + outM / 60) - (inH + inM / 60);
            if (diff < 0) diff += 24;
            diff = parseFloat(diff.toFixed(2));

            await requestService.updateOvertimeMetadata(item.id, updatedMeta);

            await attendanceService.syncOvertimeToAttendance(
                user.id,
                item.startDate,
                currentMeta.clockIn,
                clockOutTime,
                diff,
                deviceInfo?.id || undefined
            );

            haptics.success();
            Alert.alert('Lembur selesai', `Waktu keluar dicatat: ${clockOutTime}. Lembur ${diff} jam.`);
            await load();
        } catch (err: any) {
            haptics.error();
            Alert.alert('Gagal check-out lembur', err?.message || 'Silakan coba lagi.');
        } finally {
            setBusy(false);
        }
    };

    const finishLive = (uri: string | null) => {
        setLiveVisible(false);
        const r = liveResolverRef.current;
        liveResolverRef.current = null;
        if (r) r(uri);
    };

    const submit = async () => {
        setFormError(null);
        if (!reason.trim()) {
            setFormError('Alasan / keterangan wajib diisi.');
            return;
        }
        if (startDate > endDate) {
            setFormError('Tanggal selesai tidak boleh sebelum tanggal mulai.');
            return;
        }

        let parsedAmount: number | undefined;
        if (type === 'Reimburse') {
            const raw = amount.replace(/[^\d]/g, '');
            if (!raw) {
                setFormError('Nominal reimburse wajib diisi.');
                return;
            }
            parsedAmount = Number(raw);
            if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
                setFormError('Nominal reimburse harus angka lebih dari 0.');
                return;
            }
        }

        setSubmitting(true);
        try {
            const draft: LeaveRequestDraft = {
                type,
                startDate,
                endDate,
                reason: reason.trim(),
                amount: parsedAmount,
            };
            const created = await requestService.create(user.id, draft);
            setList((prev) => [created, ...prev]);
            setShowForm(false);
            resetForm();
            haptics.success();
            Alert.alert('Terkirim', 'Pengajuan Anda berhasil dibuat.');
        } catch (err: any) {
            haptics.error();
            setFormError(err?.message || 'Gagal mengirim pengajuan.');
        } finally {
            setSubmitting(false);
        }
    };

    const filtered =
        activeFilter === 'Semua' ? list : list.filter((r) => r.type === activeFilter);

    return {
        list,
        filtered,
        activeFilter,
        setActiveFilter,
        loading,
        refreshing,
        error,
        liveVisible,
        busy,
        biometricStatus,
        showForm,
        setShowForm,
        submitting,
        type,
        setType,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
        reason,
        setReason,
        amount,
        setAmount,
        formError,
        pickerOpen,
        setPickerOpen,
        showSwapModal,
        setShowSwapModal,
        shiftSwaps,
        load,
        handleRefresh,
        handleCancel,
        handlePeerRespond,
        handleOvertimeCheckIn,
        handleOvertimeCheckOut,
        finishLive,
        submit,
    };
};
