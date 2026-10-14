export interface HikvisionConfig {
  ip: string;
  port: number;
  username: string;
  password: string;
  deviceLocation: string;
  syncIntervalMinutes: number;
  syncEnabled: boolean;
}

export function getHikvisionConfig(): HikvisionConfig {
  return {
    ip: import.meta.env.VITE_HIKVISION_DEVICE_IP || '',
    port: Number(import.meta.env.VITE_HIKVISION_DEVICE_PORT || '80'),
    username: import.meta.env.VITE_HIKVISION_USERNAME || 'admin',
    password: import.meta.env.VITE_HIKVISION_PASSWORD || '',
    deviceLocation: import.meta.env.VITE_HIKVISION_DEVICE_LOCATION || 'Kantor Utama',
    syncIntervalMinutes: Number(import.meta.env.VITE_HIKVISION_SYNC_INTERVAL_MINUTES || '5'),
    syncEnabled: import.meta.env.VITE_HIKVISION_SYNC_ENABLED === 'true',
  };
}

export interface HikvisionAttendanceEvent {
  employeeNoString: string; // Employee ID on device
  name: string; // Employee name on device
  time: string; // ISO8601 timestamp
  deviceSerial: string; // Device serial number
  verifyMode?: string; // face, fingerprint, card, etc.
  matchScore?: number; // Face match score (0-100)
  pictureName?: string; // Capture photo filename (if any)
  type?: 'checkIn' | 'checkOut';
}

export interface HikvisionSyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: string[];
  lastSyncTime: string;
}

export interface PushEmployeePayload {
  pin_mesin: string; // ID di mesin (angka pendek, misal: "5")
  nama: string;
  employeeId: string; // UUID karyawan di HRMS (untuk referensi)
  faceTemplateBase64?: string; // Opsional: template wajah
}
