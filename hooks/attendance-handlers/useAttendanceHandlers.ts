import { useCallback } from 'react';
import { supabase } from '../../services/supabaseClient.ts';
import { createAuditLog } from '../../services/auditLogService.ts';
import {
  AttendanceRecord,
  AttendanceReasonCode,
} from '../../types.ts';
import { calculateDistanceMeters } from '../../utils/geofence.ts';
import { useAuth, useUI } from '../../stores/appStore.ts';
import { useMessageHandlers } from '../useMessageHandlers.ts';
import {
  ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY,
  getCachedUnavailable,
} from './types.ts';
import { useAttendanceSaveRecord } from './useAttendanceSaveRecord.ts';
import { useAttendanceChangeRequests } from './useAttendanceChangeRequests.ts';

interface UseAttendanceHandlersProps {
  activePortal?: 'admin' | 'operational' | 'personal';
  authUser?: any;
  showSuccess?: (title: string, message?: string) => void;
  showError?: (title: string, error?: any) => void;
}

const parseNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const validatePersonalAttendanceAccess = (
  activePortal?: 'admin' | 'operational' | 'personal' | null,
  authProfileId?: string,
  targetEmployeeId?: string
): string | null => {
  if (activePortal !== 'personal') return null;
  if (!authProfileId) return 'Sesi login portal personal tidak valid.';
  if (!targetEmployeeId) return 'ID karyawan tidak boleh kosong.';
  if (authProfileId !== targetEmployeeId) {
    return 'Anda hanya diizinkan mencatat kehadiran untuk akun Anda sendiri.';
  }
  return null;
};

const validateOperationalAttendanceAccess = (
  activePortal?: 'admin' | 'operational' | 'personal' | null,
  userRole?: string,
  targetEmployeeId?: string
): string | null => {
  if (activePortal !== 'operational') return null;
  if (!targetEmployeeId) return 'ID karyawan tidak boleh kosong.';
  const allowedRoles = ['super-admin', 'admin', 'hrd', 'manager', 'head-division'];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return 'Role Anda tidak memiliki izin untuk input absensi manual di portal operasional.';
  }
  return null;
};

export const useAttendanceHandlers = (props?: UseAttendanceHandlersProps) => {
  const { authUser: defaultAuthUser } = useAuth();
  const { activePortal: defaultPortal } = useUI();
  const { showSuccess: defaultShowSuccess, showError: defaultShowError } = useMessageHandlers();

  const activePortal = props?.activePortal ?? defaultPortal;
  const authUser = props?.authUser ?? defaultAuthUser;
  const showSuccess = props?.showSuccess ?? ((title: string, msg?: string) => defaultShowSuccess(msg ? `${title}: ${msg}` : title));
  const showError = props?.showError ?? defaultShowError;

  const { saveAttendanceRecord, normalizeAttendanceRecord } = useAttendanceSaveRecord();

  const {
    loadPendingAttendanceChangeRequests,
    loadAttendanceRevisionHistory,
    handleApproveAttendanceChangeRequest,
    handleRejectAttendanceChangeRequest,
  } = useAttendanceChangeRequests({
    authUser,
    showSuccess,
    showError,
    saveAttendanceRecord,
  });

  const isWorkflowUnavailable = (cacheKey: string) => getCachedUnavailable(cacheKey);

  const getOfficeGeoConfig = () => {
    const officeLat = parseNumber(import.meta.env.VITE_ATTENDANCE_CENTER_LAT);
    const officeLng = parseNumber(import.meta.env.VITE_ATTENDANCE_CENTER_LNG);
    const officeRadiusMeters = parseNumber(import.meta.env.VITE_ATTENDANCE_RADIUS_METERS) ?? 300;
    const isGeofenceConfigured =
      officeLat !== null &&
      officeLng !== null &&
      officeLat !== 0 &&
      officeLng !== 0;

    return {
      officeLat,
      officeLng,
      officeRadiusMeters,
      isGeofenceConfigured,
    };
  };

  const fetchCurrentAttendanceSnapshot = useCallback(async (employeeId: string, attendanceDate: string) => {
    const camel = await supabase
      .from('attendance')
      .select('*')
      .eq('employeeId', employeeId)
      .eq('tanggal', attendanceDate)
      .maybeSingle();

    if (!camel.error) {
      return camel.data || null;
    }

    const snake = await supabase
      .from('attendance')
      .select('*')
      .eq('employee_id', employeeId)
      .eq('date', attendanceDate)
      .maybeSingle();

    if (snake.error) {
      return null;
    }

    return snake.data || null;
  }, []);

  const handleSavePersonalAttendance = useCallback(
    async (record: Omit<AttendanceRecord, 'id'>): Promise<boolean> => {
      try {
        const accessError = validatePersonalAttendanceAccess(
          activePortal,
          authUser?.profile?.id,
          (record as any).employeeId || (record as any).employee_id
        );
        if (accessError) {
          showError('Akses ditolak', accessError);
          return false;
        }

        const { saved: savedRow, usedSnakeCase, error } = await saveAttendanceRecord(record);
        if (error || !savedRow) {
          showError('Gagal menyimpan kehadiran', error);
          return false;
        }

        showSuccess(
          usedSnakeCase
            ? 'Data kehadiran berhasil disimpan (mode kompatibilitas).'
            : 'Data kehadiran berhasil disimpan.'
        );

        await createAuditLog({
          action: 'CREATE',
          entityType: 'attendance',
          entityId: savedRow.id,
          entityName: authUser?.profile?.nama || 'Self attendance',
          newData: {
            employeeId: savedRow.employeeId,
            tanggal: savedRow.tanggal,
            source: savedRow.source,
          },
          description: `Mencatat absensi pribadi tanggal ${savedRow.tanggal}`,
          portalType: 'personal',
          metadata: { source: 'useAttendanceHandlers' },
        });

        return true;
      } catch (error: any) {
        showError('Gagal menyimpan kehadiran', error);
        return false;
      }
    },
    [activePortal, authUser, saveAttendanceRecord, showSuccess, showError]
  );

  const handleSaveOperationalAttendance = useCallback(
    async (record: Omit<AttendanceRecord, 'id'>): Promise<boolean> => {
      try {
        if (isWorkflowUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY)) {
          showError(
            'Workflow approval belum aktif',
            'Tabel workflow absensi belum tersedia. Jalankan database-setup-step6-attendance-governance.sql.'
          );
          return false;
        }

        const accessError = validateOperationalAttendanceAccess(
          activePortal,
          authUser?.profile?.role,
          (record as any).employeeId || (record as any).employee_id
        );
        if (accessError) {
          showError('Akses ditolak', accessError);
          return false;
        }

        const reasonCode = ((record as any).reasonCode || '').toString().trim() as AttendanceReasonCode;
        const reasonDetail = ((record as any).reasonDetail || '').toString().trim();

        if (!reasonCode) {
          showError('Validasi gagal', 'Reason code wajib diisi untuk perubahan absensi manual.');
          return false;
        }

        const normalized = normalizeAttendanceRecord({
          ...record,
          source: (record as any).source || 'web-admin',
        } as any);

        const lat = parseNumber((normalized as any).latitude);
        const lng = parseNumber((normalized as any).longitude);
        const { officeLat, officeLng, officeRadiusMeters, isGeofenceConfigured } = getOfficeGeoConfig();

        if (lat === null || lng === null) {
          showError('Validasi lokasi', 'Koordinat GPS wajib disertakan untuk perubahan absensi manual.');
          return false;
        }

        let locationDistanceMeters: number | null = null;
        let locationVerified = false;

        if (isGeofenceConfigured && officeLat !== null && officeLng !== null) {
          locationDistanceMeters = calculateDistanceMeters(lat, lng, officeLat, officeLng);
          locationVerified = locationDistanceMeters <= officeRadiusMeters;
        }

        const currentSnapshot = await fetchCurrentAttendanceSnapshot(normalized.employeeId, normalized.tanggal);

        const makerFingerprint =
          (record as any).deviceFingerprint ||
          (typeof navigator !== 'undefined' ? navigator.userAgent : 'web-admin-unknown-device');

        const { data: changeRequest, error: requestError } = await supabase
          .from('attendance_change_requests')
          .insert({
            employee_id: normalized.employeeId,
            attendance_date: normalized.tanggal,
            request_type: 'single',
            reason_code: reasonCode,
            reason_detail: reasonDetail || null,
            proposed_data: normalized,
            current_data: currentSnapshot,
            source_portal: 'operational',
            maker_user_id: authUser?.id || null,
            maker_employee_id: authUser?.profile?.id || null,
            maker_device_fingerprint: makerFingerprint,
            maker_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            location_lat: lat,
            location_lng: lng,
            location_text: normalized.location || null,
            location_distance_meters: locationDistanceMeters,
            location_verified: locationVerified,
            status: 'pending',
          })
          .select('*')
          .single();

        if (requestError) {
          const msg = String(requestError.message || '').toLowerCase();
          if (msg.includes('attendance_change_requests') || msg.includes('does not exist')) {
            showError(
              'Workflow approval belum aktif',
              'Tabel workflow absensi belum tersedia. Jalankan database-setup-step6-attendance-governance.sql.'
            );
            return false;
          }

          showError('Gagal mengajukan perubahan absensi', requestError);
          return false;
        }

        await createAuditLog({
          action: 'CREATE',
          entityType: 'attendance',
          entityId: changeRequest.id,
          entityName: `Attendance change request ${normalized.employeeId}`,
          newData: {
            employeeId: normalized.employeeId,
            tanggal: normalized.tanggal,
            requestStatus: 'pending',
          },
          description: `Mengajukan perubahan absensi (${reasonCode}) untuk karyawan ${normalized.employeeId} tanggal ${normalized.tanggal}`,
          portalType: 'operational',
          metadata: {
            source: 'useAttendanceHandlers',
            workflow: 'maker-checker',
            requestId: changeRequest.id,
            reasonCode,
            locationVerified,
          },
        });

        showSuccess('Permintaan perubahan absensi dikirim dan menunggu approval checker.');
        return true;
      } catch (error: any) {
        showError('Gagal menyimpan kehadiran', error);
        return false;
      }
    },
    [activePortal, authUser?.id, authUser?.profile?.id, authUser?.profile?.role, fetchCurrentAttendanceSnapshot, showSuccess, showError, normalizeAttendanceRecord]
  );

  const createBulkAttendanceCorrectionRequests = useCallback(
    async (
      records: Array<Omit<AttendanceRecord, 'id'>>,
      reasonCode: AttendanceReasonCode,
      reasonDetail?: string
    ): Promise<boolean> => {
      try {
        if (isWorkflowUnavailable(ATTENDANCE_CHANGE_REQUESTS_CACHE_KEY)) {
          showError(
            'Workflow approval belum aktif',
            'Tabel workflow absensi belum tersedia. Jalankan database-setup-step6-attendance-governance.sql.'
          );
          return false;
        }

        if (!records.length) {
          showError('Validasi gagal', 'Data bulk correction tidak boleh kosong.');
          return false;
        }

        const payloads = records.map((raw) => {
          const normalized = normalizeAttendanceRecord({ ...raw, source: (raw as any).source || 'web-admin' } as any);
          return {
            employee_id: normalized.employeeId,
            attendance_date: normalized.tanggal,
            request_type: 'bulk_import',
            reason_code: reasonCode,
            reason_detail: reasonDetail || null,
            proposed_data: normalized,
            current_data: null,
            source_portal: 'operational',
            maker_user_id: authUser?.id || null,
            maker_employee_id: authUser?.profile?.id || null,
            maker_user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : null,
            status: 'pending',
          };
        });

        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;
        const response = await fetch('/api/attendance-change-requests/bulk', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify({ payloads }),
        });

        const result = await response.json().catch(() => null);
        if (!response.ok) {
          showError('Gagal membuat bulk correction request', result?.error || 'Request gagal');
          return false;
        }

        showSuccess(`Berhasil membuat ${records.length} request bulk correction dan menunggu approval.`);
        return true;
      } catch (error: any) {
        showError('Gagal membuat bulk correction request', error);
        return false;
      }
    },
    [authUser?.id, authUser?.profile?.id, showError, showSuccess, normalizeAttendanceRecord]
  );

  return {
    handleSavePersonalAttendance,
    handleSaveOperationalAttendance,
    loadPendingAttendanceChangeRequests,
    loadAttendanceRevisionHistory,
    handleApproveAttendanceChangeRequest,
    handleRejectAttendanceChangeRequest,
    createBulkAttendanceCorrectionRequests,
  };
};
