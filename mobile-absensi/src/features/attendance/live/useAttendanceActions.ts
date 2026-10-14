import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { isLiveLivenessAvailable } from '../../../components/LiveLivenessModal';
import { verifyFace as verifyFaceFromUri } from '../../../services/faceRecognitionService';
import { attendanceService } from '../../../services/attendanceService';
import { biometricService } from '../../../services/biometricService';
import { deviceService } from '../../../services/deviceService';
import { getAttendanceLocation } from '../../../services/locationService';
import { getSupabaseHealthCheckUrl } from '../../../config/supabase';
import { logMobileAudit } from '../../../services/auditService';
import { offlineQueue } from '../../../services/offlineQueue';
import { geofenceService } from '../../../services/geofenceService';
import { formatClock, formatDate } from '../../../utils/date';
import { haptics } from '../../../utils/haptics';
import type { AttendanceRecord, CheckInDraft, DeviceInfo, MobileUser } from '../../../types';
import { isTransientNetworkError } from './types';

export function useAttendanceActions(
  user: MobileUser,
  records: AttendanceRecord[],
  onRefresh: () => Promise<void>
) {
  const [draft, setDraft] = useState<CheckInDraft | null>(null);
  const [busy, setBusy] = useState(false);
  const [sessionCheckedOut, setSessionCheckedOut] = useState(false);
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null);
  const [biometricStatus, setBiometricStatus] = useState<string>('Menunggu verifikasi');
  const [liveVisible, setLiveVisible] = useState(false);
  const liveResolverRef = useRef<((uri: string | null) => void) | null>(null);

  const today = formatDate();

  const captureAndVerify = async (
    phase: 'check_in' | 'check_out'
  ): Promise<{ verified: boolean; score: number; details?: any } | null> => {
    if (!user.employeeId) {
      throw new Error('employeeId tidak ditemukan pada sesi.');
    }

    try {
      const useFingerprint = await AsyncStorage.getItem('@use_fingerprint');
      if (useFingerprint === 'true') {
        const res = await biometricService.authenticateFingerprint(
          `Verifikasi Sidik Jari untuk ${phase === 'check_in' ? 'Check In' : 'Check Out'}`
        );

        if (res.success) {
          haptics.success();
          return {
            verified: true,
            score: 1.0,
            details: res.details,
          };
        }
        console.log('[attendance] Fingerprint tidak cocok/dibatalkan, beralih ke verifikasi wajah...');
      }
    } catch (err: any) {
      console.warn('[fingerprint] error:', err);
    }

    if (isLiveLivenessAvailable()) {
      const uri: string | null = await new Promise((resolve) => {
        liveResolverRef.current = resolve;
        setLiveVisible(true);
      });
      if (!uri) return null;
      try {
        const res = await verifyFaceFromUri(user.employeeId, uri);
        return {
          verified: res.verified,
          score: res.similarity,
          details: { method: 'mobilefacenet+ml-kit-liveness', threshold: res.threshold },
        };
      } catch (err: any) {
        Alert.alert('Verifikasi gagal', err?.message || 'Coba lagi.');
        return null;
      }
    }

    try {
      const res = await biometricService.captureAndVerifyFace(user.employeeId);
      return {
        verified: res.verified,
        score: res.score,
        details: res.details,
      };
    } catch (err: any) {
      Alert.alert('Verifikasi gagal', err?.message || 'Coba lagi.');
      return null;
    }
  };

  const finishLive = (uri: string | null) => {
    setLiveVisible(false);
    const r = liveResolverRef.current;
    liveResolverRef.current = null;
    if (r) r(uri);
  };

  useEffect(() => {
    if (draft || sessionCheckedOut) return;

    const nowMs = Date.now();
    const windowMs = 36 * 60 * 60 * 1000;
    const pendingRecord = records.find((item) => {
      if (item.clockOut) return false;
      const recMs = new Date(`${item.tanggal}T${item.clockIn || '00:00'}:00`).getTime();
      if (isNaN(recMs)) return false;
      const diff = nowMs - recMs;
      return diff >= 0 && diff <= windowMs;
    });
    if (pendingRecord) {
      setDraft({
        tanggal: pendingRecord.tanggal,
        clockIn: pendingRecord.clockIn,
        location: pendingRecord.location,
        latitude: pendingRecord.latitude,
        longitude: pendingRecord.longitude,
      });
    }
  }, [draft, records, today, sessionCheckedOut]);

  useEffect(() => {
    (async () => {
      try {
        const info = await deviceService.ensureDeviceRegistered(user);
        setDeviceInfo(info);
      } catch (error: any) {
        console.warn('Device registration failed:', error?.message || error);
      }
    })();
  }, [user]);

  const checkIn = async () => {
    const existingPending = records.find((item) => item.tanggal === today && !item.clockOut);
    if (existingPending) {
      setDraft({
        tanggal: existingPending.tanggal,
        clockIn: existingPending.clockIn,
        location: existingPending.location,
        latitude: existingPending.latitude,
        longitude: existingPending.longitude,
      });
      Alert.alert('Check-in sudah ada', 'Anda sudah melakukan check-in hari ini. Silakan check-out terlebih dahulu.');
      return;
    }

    setBusy(true);
    try {
      if (!deviceInfo) {
        throw new Error('Device belum siap. Tunggu sebentar lalu coba lagi.');
      }
      const device = deviceInfo;

      const verification = await captureAndVerify('check_in');
      if (!verification) {
        setBusy(false);
        return;
      }
      setBiometricStatus(verification.verified ? 'Wajah terverifikasi' : 'Verifikasi wajah gagal');
      if (!verification.verified) {
        const reason = verification.details?.reason as string | undefined;
        const msg =
          reason === 'spoof_static_image'
            ? 'Terdeteksi foto statis. Liveness gagal — gerakkan kepala saat verifikasi.'
            : reason === 'pose_mismatch_or_different_person'
            ? 'Wajah antar pose tidak konsisten.'
            : reason === 'not_enrolled'
            ? 'Wajah belum didaftarkan. Buka Profil → Daftar Wajah.'
            : `Skor kecocokan rendah (${verification.score}). Pastikan pencahayaan cukup.`;
        Alert.alert('Verifikasi wajah gagal', msg);
        void logMobileAudit({
          user,
          action: 'BIOMETRIC_FAILED',
          metadata: {
            phase: 'check_in',
            score: verification.score,
            method: verification.details?.method,
            reason,
          },
          description: 'Biometrik gagal saat check-in',
        });
        return;
      }

      const location = await getAttendanceLocation();
      if (location.error === 'mock_location' || location.mocked) {
        Alert.alert(
          'Lokasi tidak valid',
          'Aplikasi mendeteksi mock GPS aktif. Nonaktifkan aplikasi pemalsu lokasi sebelum absen.'
        );
        void logMobileAudit({
          user,
          action: 'MOCK_LOCATION_BLOCKED',
          metadata: { phase: 'check_in', deviceId: device.deviceId },
          description: 'Check-in diblokir karena mock GPS',
        });
        return;
      }
      if (location.error === 'low_accuracy') {
        let lanFallbackOk = false;
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 4000);
          const res = await fetch(getSupabaseHealthCheckUrl(), { signal: controller.signal });
          clearTimeout(timeoutId);
          lanFallbackOk = res.ok;
        } catch {
          lanFallbackOk = false;
        }

        if (!lanFallbackOk) {
          Alert.alert(
            'Akurasi GPS rendah',
            location.label + ' Pastikan Anda berada di area terbuka atau terhubung ke Wi-Fi RS, lalu coba lagi.'
          );
          return;
        }
        (location as any).lanFallback = true;
        (location as any).label = 'LAN/Wi-Fi RS (GPS tidak tersedia)';
      }

      const isLanFallback = !!(location as any).lanFallback;
      if (!isLanFallback && (location.error || location.latitude === undefined || location.longitude === undefined)) {
        Alert.alert('Lokasi tidak tersedia', location.label);
        return;
      }

      if (!isLanFallback) {
        const geofence = await geofenceService.evaluate(location.latitude!, location.longitude!);
        if (geofence && !geofence.withinRadius) {
          const distanceKm = (geofence.distanceMeters / 1000).toFixed(2);
          Alert.alert(
            'Di luar area RS',
            `Anda berada ${distanceKm} km dari titik pusat RS (batas ${geofence.radiusMeters} m). ` +
              'Silakan datang ke area RS untuk melakukan absensi.'
          );
          void logMobileAudit({
            user,
            action: 'MOCK_LOCATION_BLOCKED',
            metadata: {
              phase: 'check_in',
              deviceId: device.deviceId,
              reason: 'outside_geofence',
              distanceMeters: Math.round(geofence.distanceMeters),
              radiusMeters: geofence.radiusMeters,
            },
            description: 'Check-in diblokir: di luar geofence',
          });
          return;
        }
      }

      const nextDraft: CheckInDraft = {
        tanggal: today,
        clockIn: formatClock(),
        clockOut: '',
        location: location.label,
        latitude: location.latitude,
        longitude: location.longitude,
      };

      const extra = {
        deviceId: device.id || '',
        biometricType: 'face' as const,
        biometricVerified: true,
        faceMatchScoreCheckIn: verification.score,
        source: 'mobile' as const,
        notes: 'Check-in face verified dari aplikasi mobile',
        ...((location as any).lanFallback ? { lan_fallback: true, location_method: 'lan' } : {}),
      };
      const auditMetadata = {
        deviceId: device.deviceId,
        location: nextDraft.location,
        latitude: nextDraft.latitude,
        longitude: nextDraft.longitude,
        accuracy: location.accuracy,
        biometricScore: verification.score,
        ...((location as any).lanFallback ? { location_method: 'lan_fallback' } : {}),
      };

      try {
        await attendanceService.checkIn(user, nextDraft, extra);
        setDraft(nextDraft);
        setSessionCheckedOut(false);
        await onRefresh();
        void logMobileAudit({ user, action: 'CHECK_IN', entityName: nextDraft.tanggal, metadata: auditMetadata });
        haptics.success();
        Alert.alert('Check-in tersimpan', 'Lanjutkan check-out saat selesai shift.');
      } catch (error: any) {
        if (isTransientNetworkError(error?.message)) {
          await offlineQueue.enqueue({ type: 'check_in', user, draft: nextDraft, extra });
          setDraft(nextDraft);
          setSessionCheckedOut(false);
          void logMobileAudit({
            user,
            action: 'CHECK_IN',
            entityName: nextDraft.tanggal,
            metadata: { ...auditMetadata, queued: true, reason: error?.message },
            description: 'Check-in masuk antrian offline',
          });
          haptics.warning();
          Alert.alert(
            'Tersimpan offline',
            'Sinyal lemah/server tak tersedia. Check-in akan dikirim otomatis saat koneksi pulih.'
          );
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      haptics.error();
      Alert.alert('Check-in gagal', error?.message || 'Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  const checkOut = async () => {
    let activeDraft = draft;
    if (!activeDraft) {
      const nowMs = Date.now();
      const windowMs = 36 * 60 * 60 * 1000;
      const existingPending = records.find((item) => {
        if (item.clockOut) return false;
        const recMs = new Date(`${item.tanggal}T${item.clockIn || '00:00'}:00`).getTime();
        if (isNaN(recMs)) return false;
        const diff = nowMs - recMs;
        return diff >= 0 && diff <= windowMs;
      });
      if (existingPending) {
        activeDraft = {
          tanggal: existingPending.tanggal,
          clockIn: existingPending.clockIn,
          location: existingPending.location,
          latitude: existingPending.latitude,
          longitude: existingPending.longitude,
        };
      }
    }

    if (!activeDraft) return;

    setBusy(true);
    try {
      if (!deviceInfo) {
        throw new Error('Device belum siap. Tunggu sebentar lalu coba lagi.');
      }
      const device = deviceInfo;
      const location = await getAttendanceLocation();

      const verification = await captureAndVerify('check_out');
      if (!verification) {
        setBusy(false);
        return;
      }
      setBiometricStatus(verification.verified ? 'Wajah terverifikasi' : 'Verifikasi wajah gagal');
      if (!verification.verified) {
        const reason = verification.details?.reason as string | undefined;
        const msg =
          reason === 'spoof_static_image'
            ? 'Terdeteksi foto statis.'
            : reason === 'pose_mismatch_or_different_person'
            ? 'Wajah antar pose tidak konsisten.'
            : reason === 'not_enrolled'
            ? 'Wajah belum didaftarkan.'
            : `Skor kecocokan rendah (${verification.score}).`;
        Alert.alert('Verifikasi wajah gagal', msg);
        void logMobileAudit({
          user,
          action: 'BIOMETRIC_FAILED',
          metadata: {
            phase: 'check_out',
            score: verification.score,
            method: verification.details?.method,
            reason,
          },
          description: 'Biometrik gagal saat check-out',
        });
        return;
      }

      const extra = {
        deviceId: device.id || '',
        biometricType: 'face' as const,
        biometricVerified: true,
        faceMatchScoreCheckOut: verification.score,
        checkOutLatitude: location.latitude,
        checkOutLongitude: location.longitude,
        checkOutLocation: location.label,
        source: 'mobile' as const,
        notes: 'Check-out face verified dari aplikasi mobile',
      };
      const auditMetadata = {
        deviceId: device.deviceId,
        location: activeDraft.location,
        latitude: activeDraft.latitude,
        longitude: activeDraft.longitude,
        biometricScore: verification.score,
      };

      try {
        await attendanceService.checkOut(user, activeDraft, extra);
        setDraft(null);
        setSessionCheckedOut(true);
        await onRefresh();
        void logMobileAudit({ user, action: 'CHECK_OUT', entityName: activeDraft.tanggal, metadata: auditMetadata });
        haptics.success();
        Alert.alert('Berhasil', 'Absensi berhasil disimpan.');
      } catch (error: any) {
        if (isTransientNetworkError(error?.message)) {
          await offlineQueue.enqueue({ type: 'check_out', user, draft: activeDraft, extra });
          setDraft(null);
          setSessionCheckedOut(true);
          void logMobileAudit({
            user,
            action: 'CHECK_OUT',
            entityName: activeDraft.tanggal,
            metadata: { ...auditMetadata, queued: true, reason: error?.message },
            description: 'Check-out masuk antrian offline',
          });
          haptics.warning();
          Alert.alert(
            'Tersimpan offline',
            'Sinyal lemah/server tak tersedia. Check-out akan dikirim otomatis saat koneksi pulih.'
          );
        } else {
          throw error;
        }
      }
    } catch (error: any) {
      haptics.error();
      Alert.alert('Check-out gagal', error?.message || 'Silakan coba lagi.');
    } finally {
      setBusy(false);
    }
  };

  return {
    draft,
    busy,
    sessionCheckedOut,
    deviceInfo,
    biometricStatus,
    liveVisible,
    finishLive,
    checkIn,
    checkOut,
    today,
  };
}
