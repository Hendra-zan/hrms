/**
 * server/services/hikvision/hikvisionConfig.js
 * Konfigurasi koneksi dan parameter sinkronisasi Hikvision / HikCentral.
 */

export function getHikvisionServerConfig() {
  return {
    ip: process.env.VITE_HIKVISION_DEVICE_IP || '',
    port: Number(process.env.VITE_HIKVISION_DEVICE_PORT || '80'),
    username: process.env.VITE_HIKVISION_USERNAME || 'admin',
    password: process.env.VITE_HIKVISION_PASSWORD || '',
    deviceLocation: process.env.VITE_HIKVISION_DEVICE_LOCATION || 'Kantor Utama',
    syncIntervalMinutes: Number(process.env.VITE_HIKVISION_SYNC_INTERVAL_MINUTES || '5'),
    syncEnabled: process.env.VITE_HIKVISION_SYNC_ENABLED === 'true',
  };
}

export function formatLocalISOString(date) {
  const pad = (n) => String(n).padStart(2, '0');
  const yyyy = date.getFullYear();
  const mm = pad(date.getMonth() + 1);
  const dd = pad(date.getDate());
  const hh = pad(date.getHours());
  const min = pad(date.getMinutes());
  const ss = pad(date.getSeconds());
  return `${yyyy}-${mm}-${dd}T${hh}:${min}:${ss}`;
}

export const ALLOWED_MINOR_CODES = [75, 76, 38, 50, 112, 113, 114, 115, 116, 117, 1, 2, 3, 4];
