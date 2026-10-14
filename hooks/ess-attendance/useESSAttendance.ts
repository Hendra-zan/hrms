/**
 * hooks/ess-attendance/useESSAttendance.ts
 * Coordinator hook untuk Employee Self Service (ESS) Presensi.
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { EmployeeSchedule } from '../../types.ts';
import { FaceVerificationResult } from '../../services/faceVerificationService.ts';
import { uploadAttendancePhoto } from '../../services/attendancePhotoService.ts';
import { PendingCheckIn, UseESSAttendanceProps } from './types.ts';
import { useESSGeoLocation } from './useESSGeoLocation.ts';
import { useESSFaceVerification } from './useESSFaceVerification.ts';
import { useESSFingerprint } from './useESSFingerprint.ts';

export function useESSAttendance({ user, attendanceRecords, onSaveAttendance, activeShiftDefs }: UseESSAttendanceProps) {
  const [isAttendanceSubmitting, setIsAttendanceSubmitting] = useState(false);
  const [attendanceActionError, setAttendanceActionError] = useState<string | null>(null);
  const [pendingCheckIn, setPendingCheckIn] = useState<PendingCheckIn | null>(null);
  const [isLanMode] = useState(true);
  const [todaySchedule, setTodaySchedule] = useState<EmployeeSchedule | null>(null);

  const { officeLat, officeLng, officeRadiusMeters, isGeofenceConfigured, resolveCurrentLocation } = useESSGeoLocation();
  const faceVerif = useESSFaceVerification(user.id);

  useEffect(() => {
    if (!user.id) return;
    import('../../services/scheduleService.ts').then(({ getTodaySchedule }) => {
      getTodaySchedule(user.id).then(setTodaySchedule).catch(() => {});
    });
  }, [user.id]);

  const getTodayDate = () => new Date().toISOString().split('T')[0];
  const getNowTime = () => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  };

  const todayDate = getTodayDate();
  const pendingStorageKey = `hrms.pending-attendance.${user.id}`;

  const serverPendingRecord = useMemo(() => {
    const nowMs = Date.now();
    const thirtySixHoursMs = 36 * 60 * 60 * 1000;

    return attendanceRecords.find((record) => {
      if (record.clockOut) return false;
      if (!record.tanggal) return false;

      const recTime = new Date(`${record.tanggal}T${record.clockIn || '00:00'}:00`).getTime();
      if (isNaN(recTime)) return record.tanggal === todayDate;

      const diff = nowMs - recTime;
      return diff >= 0 && diff <= thirtySixHoursMs;
    }) || null;
  }, [attendanceRecords, todayDate]);

  const todaysRecord = useMemo(() => {
    return attendanceRecords.find((record) => record.tanggal === getTodayDate()) || null;
  }, [attendanceRecords]);

  useEffect(() => {
    if (serverPendingRecord) {
      setPendingCheckIn({
        tanggal: serverPendingRecord.tanggal,
        clockIn: serverPendingRecord.clockIn,
        location: serverPendingRecord.location,
        latitude: serverPendingRecord.latitude,
        longitude: serverPendingRecord.longitude,
      });
      return;
    }
    try {
      const raw = localStorage.getItem(pendingStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed?.tanggal && parsed?.clockIn) {
        setPendingCheckIn(parsed);
      }
    } catch {}
  }, [pendingStorageKey, serverPendingRecord]);

  const persistPendingCheckIn = useCallback((value: PendingCheckIn | null) => {
    setPendingCheckIn(value);
    try {
      if (value) {
        localStorage.setItem(pendingStorageKey, JSON.stringify(value));
      } else {
        localStorage.removeItem(pendingStorageKey);
      }
    } catch {}
  }, [pendingStorageKey]);

  const calculateAttendanceSummary = useCallback((clockIn: string, clockOut: string) => {
    const shiftDef = activeShiftDefs.find((s) => s.name === (todaySchedule?.shift_name || user.shift));
    const shiftStartStr = (todaySchedule && !todaySchedule.is_off_day && todaySchedule.shift_start_time)
      ? todaySchedule.shift_start_time
      : (shiftDef?.startTime || '08:00');
    const shiftEndStr = (todaySchedule && !todaySchedule.is_off_day && todaySchedule.shift_end_time)
      ? todaySchedule.shift_end_time
      : (shiftDef?.endTime || '16:00');

    const [startH, startM] = shiftStartStr.split(':').map(Number);
    const [endH, endM] = shiftEndStr.split(':').map(Number);
    const tolerance = (todaySchedule as any)?.late_tolerance_minutes ?? shiftDef?.lateToleranceMinutes ?? 15;
    const breakDuration = (todaySchedule as any)?.break_duration_minutes ?? shiftDef?.breakDurationMinutes ?? 0;
    const autoOTThreshold = (todaySchedule as any)?.auto_ot_threshold_minutes ?? shiftDef?.autoOvertimeThresholdMinutes ?? 0;

    let shiftDuration = (endH + endM / 60) - (startH + startM / 60);
    if (shiftDuration <= 0) shiftDuration += 24;

    const [inHour, inMinute] = clockIn.split(':').map(Number);
    const [outHour, outMinute] = clockOut.split(':').map(Number);

    let adjustedInH = inHour;
    if (startH >= 18 && inHour <= 12) adjustedInH += 24;

    const isLate = (adjustedInH * 60 + inMinute) > (startH * 60 + startM + tolerance);

    const inValue = inHour + inMinute / 60;
    let outValue = outHour + outMinute / 60;
    if (outValue < inValue) outValue += 24;

    const workDuration = outValue - inValue;
    const netPresence = workDuration - (breakDuration / 60);
    const rawOvertime = Math.max(0, netPresence - shiftDuration);

    let calculatedOvertime = rawOvertime;
    if (autoOTThreshold > 0 && (rawOvertime * 60) < autoOTThreshold) {
      calculatedOvertime = 0;
    }
    const overtimeHours = parseFloat(calculatedOvertime.toFixed(2));
    return { isLate, overtimeHours };
  }, [activeShiftDefs, todaySchedule, user.shift]);

  const fpHandler = useESSFingerprint({
    user,
    officeLat,
    officeLng,
    onSaveAttendance,
    calculateAttendanceSummary,
    persistPendingCheckIn,
    setAttendanceActionError,
    setIsAttendanceSubmitting,
    setIsFingerprintModalOpen: faceVerif.setIsFingerprintModalOpen,
  });

  const handleCheckInClick = () => {
    if (faceVerif.faceEnrolled !== true) {
      setAttendanceActionError('⚠️ Wajah Anda belum terdaftar di sistem. Silakan lakukan Pendaftaran Wajah pada modal yang terbuka.');
      faceVerif.setIsFaceEnrollmentOpen(true);
      return;
    }
    if (todaysRecord && !todaysRecord.clockOut) {
      setAttendanceActionError('Anda sudah melakukan check-in hari ini. Silakan check-out terlebih dahulu.');
      return;
    }
    setAttendanceActionError(null);
    faceVerif.setVerificationActionType('checkin');
    faceVerif.setIsVerificationFlowOpen(true);
  };

  const handleCheckOutClick = () => {
    if (faceVerif.faceEnrolled !== true) {
      setAttendanceActionError('⚠️ Wajah Anda belum terdaftar di sistem. Silakan lakukan Pendaftaran Wajah pada modal yang terbuka.');
      faceVerif.setIsFaceEnrollmentOpen(true);
      return;
    }
    setAttendanceActionError(null);
    faceVerif.setVerificationActionType('checkout');
    faceVerif.setIsVerificationFlowOpen(true);
  };

  const handleFingerprintClick = (action: 'checkin' | 'checkout') => {
    setAttendanceActionError(null);
    faceVerif.setVerificationActionType(action);
    faceVerif.setIsFingerprintModalOpen(true);
  };

  const handleFingerprintSuccess = async (data: { hostname?: string; ip_local?: string }) => {
    await fpHandler.handleFingerprintSuccess(faceVerif.verificationActionType, data, pendingCheckIn, todaysRecord?.clockIn);
  };

  const handleVerificationSuccess = async (
    result: { photoUrl: string; photoBlob?: Blob; faceDescriptor?: Float32Array; verificationResult: FaceVerificationResult },
    checkoutDetails?: { dailyWorkLog?: string; earlyLeaveReason?: string; shiftHandoverConfirmed?: boolean }
  ) => {
    setIsAttendanceSubmitting(true);
    setAttendanceActionError(null);

    let photoUrl = result.photoUrl || '';
    if (!photoUrl && result.photoBlob) {
      const uploaded = await uploadAttendancePhoto(result.photoBlob, user.id, faceVerif.verificationActionType);
      if (uploaded) photoUrl = uploaded;
    }

    const locationData = await resolveCurrentLocation();
    const actionType = faceVerif.verificationActionType;

    if (actionType === 'checkin') {
      try {
        const nowTime = getNowTime();
        const { isLate } = calculateAttendanceSummary(nowTime, nowTime);
        const draft = {
          tanggal: getTodayDate(),
          clockIn: nowTime,
          clockOut: '',
          location: locationData.location,
          latitude: locationData.latitude,
          longitude: locationData.longitude,
          isLate,
          overtimeHours: 0,
          status: (isLate ? 'Terlambat' : 'Hadir') as any,
          source: 'web-ess' as const,
          notes: 'Check-in melalui Employee Self Service dengan face verification',
          photoUrl,
          biometricType: 'face' as const,
          biometricVerified: true,
          faceMatchScoreCheckIn: result.verificationResult?.matchScore,
        };

        const saved = await onSaveAttendance({ employeeId: user.id, ...draft });
        if (saved) {
          persistPendingCheckIn(draft);
          setAttendanceActionError(null);
        }
      } catch {
        setAttendanceActionError('Gagal memproses check-in. Coba lagi.');
      } finally {
        setIsAttendanceSubmitting(false);
        faceVerif.setIsVerificationFlowOpen(false);
      }
    } else {
      try {
        const effectiveDraft = pendingCheckIn || (serverPendingRecord ? {
          tanggal: serverPendingRecord.tanggal,
          clockIn: serverPendingRecord.clockIn,
          location: serverPendingRecord.location,
          latitude: serverPendingRecord.latitude,
          longitude: serverPendingRecord.longitude,
        } : null);

        if (!effectiveDraft) {
          setAttendanceActionError('Tidak ada check-in hari ini. Silakan check-in terlebih dahulu.');
          setIsAttendanceSubmitting(false);
          return;
        }

        const clockOut = getNowTime();
        const summary = calculateAttendanceSummary(effectiveDraft.clockIn, clockOut);

        const success = await onSaveAttendance({
          employeeId: user.id,
          tanggal: effectiveDraft.tanggal,
          clockIn: effectiveDraft.clockIn,
          clockOut,
          location: effectiveDraft.location,
          latitude: effectiveDraft.latitude,
          longitude: effectiveDraft.longitude,
          checkOutLocation: locationData.location || 'RSUD Meloy',
          checkOutLatitude: locationData.latitude,
          checkOutLongitude: locationData.longitude,
          earlyLeaveReason: checkoutDetails?.earlyLeaveReason,
          dailyWorkLog: checkoutDetails?.dailyWorkLog,
          shiftHandoverConfirmed: checkoutDetails?.shiftHandoverConfirmed,
          isLate: summary.isLate,
          overtimeHours: summary.overtimeHours,
          status: summary.isLate ? 'Terlambat' : 'Hadir',
          source: 'web-ess',
          notes: checkoutDetails?.dailyWorkLog
            ? `Check-out ESS | Log: ${checkoutDetails.dailyWorkLog}`
            : 'Check-out melalui Employee Self Service dengan face verification',
          photoUrl,
          biometricType: 'face',
          biometricVerified: true,
          faceMatchScoreCheckOut: result.verificationResult?.matchScore,
        });

        if (success) {
          persistPendingCheckIn(null);
          setAttendanceActionError(null);
        }
      } catch {
        setAttendanceActionError('Gagal memproses check-out. Coba lagi.');
      } finally {
        setIsAttendanceSubmitting(false);
        faceVerif.setIsVerificationFlowOpen(false);
      }
    }
  };

  const handleFaceEnrollmentSuccess = () => {
    faceVerif.setFaceEnrolled(true);
    faceVerif.setIsFaceEnrollmentOpen(false);
    setAttendanceActionError(null);
  };

  return {
    isAttendanceSubmitting,
    attendanceActionError,
    setAttendanceActionError,
    pendingCheckIn,
    isLanMode,
    isVerificationFlowOpen: faceVerif.isVerificationFlowOpen,
    setIsVerificationFlowOpen: faceVerif.setIsVerificationFlowOpen,
    isFingerprintModalOpen: faceVerif.isFingerprintModalOpen,
    setIsFingerprintModalOpen: faceVerif.setIsFingerprintModalOpen,
    isFaceEnrollmentOpen: faceVerif.isFaceEnrollmentOpen,
    setIsFaceEnrollmentOpen: faceVerif.setIsFaceEnrollmentOpen,
    verificationActionType: faceVerif.verificationActionType,
    faceEnrolled: faceVerif.faceEnrolled,
    setFaceEnrolled: faceVerif.setFaceEnrolled,
    todaySchedule,
    bridgeDetected: faceVerif.bridgeDetected,
    serverPendingRecord,
    todaysRecord,
    officeLat,
    officeLng,
    officeRadiusMeters,
    isGeofenceConfigured,
    calculateAttendanceSummary,
    handleCheckInClick,
    handleCheckOutClick,
    handleFingerprintClick,
    handleFingerprintSuccess,
    handleVerificationSuccess,
    handleFaceEnrollmentSuccess,
  };
}
