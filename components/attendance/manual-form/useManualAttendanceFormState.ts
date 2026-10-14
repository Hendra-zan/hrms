import { useState } from 'react';
import { Employee, AttendanceReasonCode, AttendanceRecord } from '../../../types.ts';
import { calculateDistanceMeters } from '../../../utils/geofence.ts';

interface UseManualAttendanceFormStateProps {
  employees: Employee[];
  isGeofenceConfigured: boolean;
  officeLat: number;
  officeLng: number;
  officeRadiusMeters: number;
  onSave: (record: Omit<AttendanceRecord, 'id'>) => Promise<boolean> | boolean;
  calculateAttendanceDetails: (employeeId: string, clockIn: string, clockOut: string, recordDate?: string) => { isLate: boolean; overtimeHours: number };
}

export const useManualAttendanceFormState = ({
  employees,
  isGeofenceConfigured,
  officeLat,
  officeLng,
  officeRadiusMeters,
  onSave,
  calculateAttendanceDetails,
}: UseManualAttendanceFormStateProps) => {
  const today = new Date().toISOString().split('T')[0];
  const [showManualForm, setShowManualForm] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isLocating, setIsLocating] = useState(false);

  const [newRecord, setNewRecord] = useState({
    employeeId: '',
    tanggal: today,
    clockIn: '',
    clockOut: '',
    location: 'RS Utama (Manual)',
    notes: '',
    source: 'web-admin' as const,
    reasonCode: '' as AttendanceReasonCode | '',
    reasonDetail: '',
    latitude: '',
    longitude: '',
    locationDistanceMeters: '',
    locationVerified: false,
  });

  const [fingerprintModal, setFingerprintModal] = useState<{
    isOpen: boolean;
    targetField: 'clockIn' | 'clockOut';
  }>({ isOpen: false, targetField: 'clockIn' });

  const [fingerprintVerified, setFingerprintVerified] = useState<{
    clockIn: boolean;
    clockOut: boolean;
  }>({ clockIn: false, clockOut: false });

  const setCurrentTime = (field: 'clockIn' | 'clockOut') => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    setNewRecord(prev => ({ ...prev, [field]: `${hours}:${minutes}` }));
  };

  const handleFingerprintSuccess = (data: {
    template: string;
    format: string;
    hostname?: string;
    ip_local?: string;
  }) => {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const field = fingerprintModal.targetField;

    const pcLabel = data.hostname
      ? `${data.hostname}${data.ip_local ? ` (${data.ip_local})` : ''}`
      : 'Workstation Kantor (Fingerprint)';

    setNewRecord(prev => ({
      ...prev,
      [field]: `${hh}:${mm}`,
      source: 'fingerprint-desktop' as any,
      location: pcLabel,
      locationVerified: true,
      locationDistanceMeters: '0',
    }));

    setFingerprintVerified(prev => ({ ...prev, [field]: true }));
    setFingerprintModal({ isOpen: false, targetField: 'clockIn' });
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Browser Anda tidak mendukung Geolocation.');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        let distStr = '';
        let verified = false;

        if (isGeofenceConfigured) {
          const d = calculateDistanceMeters(lat, lng, officeLat, officeLng);
          distStr = String(Math.round(d));
          verified = d <= officeRadiusMeters;
        }

        setNewRecord(prev => ({
          ...prev,
          latitude: String(lat),
          longitude: String(lng),
          locationDistanceMeters: distStr,
          locationVerified: verified,
        }));
        setIsLocating(false);
      },
      (err) => {
        alert(`Gagal mengambil koordinat GPS: ${err.message}`);
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRecord.employeeId) {
      alert('Silakan pilih karyawan.');
      return;
    }

    const employee = employees.find(emp => emp.id === newRecord.employeeId);
    if (!employee) {
      alert('Data karyawan tidak ditemukan.');
      return;
    }

    const details = calculateAttendanceDetails(
      newRecord.employeeId,
      newRecord.clockIn,
      newRecord.clockOut,
      newRecord.tanggal
    );

    const recordToSave: Omit<AttendanceRecord, 'id'> = {
      employeeId: newRecord.employeeId,
      tanggal: newRecord.tanggal,
      clockIn: newRecord.clockIn || '',
      clockOut: newRecord.clockOut || '',
      status: (newRecord.clockIn ? (details.isLate ? 'Terlambat' : 'Hadir') : 'Belum Hadir') as any,
      location: newRecord.location,
      notes: newRecord.notes,
      source: newRecord.source as any,
      isLate: details.isLate,
      overtimeHours: details.overtimeHours,
      latitude: newRecord.latitude ? parseFloat(newRecord.latitude) : undefined,
      longitude: newRecord.longitude ? parseFloat(newRecord.longitude) : undefined,
    };

    setIsSaving(true);
    try {
      const ok = await onSave(recordToSave);
      if (ok) {
        setNewRecord({
          employeeId: '',
          tanggal: today,
          clockIn: '',
          clockOut: '',
          location: 'RS Utama (Manual)',
          notes: '',
          source: 'web-admin',
          reasonCode: '',
          reasonDetail: '',
          latitude: '',
          longitude: '',
          locationDistanceMeters: '',
          locationVerified: false,
        });
        setFingerprintVerified({ clockIn: false, clockOut: false });
      }
    } finally {
      setIsSaving(false);
    }
  };

  return {
    today,
    showManualForm,
    setShowManualForm,
    isSaving,
    isLocating,
    newRecord,
    setNewRecord,
    fingerprintModal,
    setFingerprintModal,
    fingerprintVerified,
    setCurrentTime,
    handleFingerprintSuccess,
    handleUseCurrentLocation,
    handleSaveAttendance,
  };
};
