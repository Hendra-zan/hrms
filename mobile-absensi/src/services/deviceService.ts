import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';
import { logMobileAudit } from './auditService';
import { secureStorage } from '../lib/storage';
import type { MobileUser } from '../types';

const STORAGE_KEY_DEVICE_ID = 'hrms_mobile_device_id';
const STORAGE_KEY_DEVICE_NAME = 'hrms_mobile_device_name';

export interface DeviceInfo {
  id?: string; // database UUID
  deviceId: string;
  deviceName: string;
  platform: 'Android' | 'iOS' | 'web' | 'unknown';
  deviceFingerprint: string;
  isPrimary: boolean;
}

// Lazy-load expo-crypto (optional dependency)
let ExpoCrypto: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  ExpoCrypto = require('expo-crypto');
} catch {
  /* fallback below */
}

const generateDeviceId = (): string => {
  // Prefer Web Crypto randomUUID (RFC 4122 v4)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Prefer expo-crypto for cryptographically secure random bytes
  if (ExpoCrypto && typeof ExpoCrypto.randomUUID === 'function') {
    return ExpoCrypto.randomUUID();
  }

  if (ExpoCrypto && typeof ExpoCrypto.getRandomBytes === 'function') {
    const bytes = ExpoCrypto.getRandomBytes(16);
    const hex = Array.from(bytes as Uint8Array)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20, 32)}`;
  }

  // Last-resort fallback: log warning so it's visible device IDs may not be unique
  console.warn('[deviceService] No crypto API available — device ID fallback is NOT cryptographically secure');
  return `device-${Math.random().toString(36).slice(2)}-${Date.now().toString(36)}`;
};

const normalizePlatform = (): DeviceInfo['platform'] => {
  if (Platform.OS === 'android') return 'Android';
  if (Platform.OS === 'ios') return 'iOS';
  if (Platform.OS === 'web') return 'web';
  return 'unknown';
};

export const deviceService = {
  async getLocalDeviceId(): Promise<string> {
    let existing = await secureStorage.getJSON<string | null>(STORAGE_KEY_DEVICE_ID, null);
    if (existing) return existing;

    const oldVal = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_ID);
    if (oldVal) {
      await secureStorage.setJSON(STORAGE_KEY_DEVICE_ID, oldVal);
      await AsyncStorage.removeItem(STORAGE_KEY_DEVICE_ID);
      console.log('[deviceService] Migrated device ID to SecureStore');
      return oldVal;
    }

    const newId = generateDeviceId();
    await secureStorage.setJSON(STORAGE_KEY_DEVICE_ID, newId);
    return newId;
  },

  async getDeviceName(): Promise<string> {
    let existing = await secureStorage.getJSON<string | null>(STORAGE_KEY_DEVICE_NAME, null);
    if (existing) return existing;

    const oldVal = await AsyncStorage.getItem(STORAGE_KEY_DEVICE_NAME);
    if (oldVal) {
      await secureStorage.setJSON(STORAGE_KEY_DEVICE_NAME, oldVal);
      await AsyncStorage.removeItem(STORAGE_KEY_DEVICE_NAME);
      return oldVal;
    }

    const name = `${Platform.OS}-${Platform.Version || 'unknown'}`;
    await secureStorage.setJSON(STORAGE_KEY_DEVICE_NAME, name);
    return name;
  },

  async getDeviceInfo(): Promise<DeviceInfo> {
    const deviceId = await this.getLocalDeviceId();
    const deviceName = await this.getDeviceName();
    const platform = normalizePlatform();
    const deviceFingerprint = `${platform}:${deviceId}:${deviceName}`;

    return {
      deviceId,
      deviceName,
      platform,
      deviceFingerprint,
      isPrimary: true,
    };
  },

  async getDeviceRegistration(user: MobileUser): Promise<any | null> {
    const deviceInfo = await this.getDeviceInfo();
    const { data, error } = await supabase
      .from('employee_devices')
      .select('id')
      .eq('employeeId', user.id)
      .eq('deviceId', deviceInfo.deviceId)
      .limit(1)
      .maybeSingle();

    if (error || !data) return null;
    return data;
  },

  async registerDevice(user: MobileUser, deviceInfo: DeviceInfo): Promise<DeviceInfo> {
    // 1. Cek apakah perangkat ini sudah terdaftar dan aktif digunakan oleh karyawan lain
    try {
      const { data: duplicate } = await supabase
        .from('employee_devices')
        .select('employeeId')
        .eq('deviceId', deviceInfo.deviceId)
        .eq('status', 'Active')
        .neq('employeeId', user.id)
        .limit(1)
        .maybeSingle();

      if (duplicate) {
        const errorMsg = 'Perangkat ini sudah terdaftar dan aktif digunakan oleh karyawan lain. Hubungi Admin/HRD untuk menonaktifkan perangkat lama.';
        Alert.alert('Akses Perangkat Ditolak', errorMsg);
        throw new Error(errorMsg);
      }
    } catch (e: any) {
      if (e.message && e.message.includes('terdaftar')) {
        throw e;
      }
      console.warn('[deviceService] Gagal memeriksa perangkat duplikat:', e);
    }

    try {
      // Ambil daftar device aktif untuk karyawan ini
      const { data: activeDevices, error: fetchErr } = await supabase
        .from('employee_devices')
        .select('id, deviceId, status, registeredAt')
        .eq('employeeId', user.id)
        .eq('status', 'Active')
        .order('registeredAt', { ascending: true });

      if (!fetchErr && activeDevices && activeDevices.length >= 2) {
        // Cek apakah device saat ini sudah ada di daftar aktif.
        // Jika sudah ada, ini hanya registrasi ulang (atau update) device yang sama,
        // sehingga tidak menambah jumlah perangkat fisik aktif baru.
        const exists = activeDevices.some((d: any) => d.deviceId === deviceInfo.deviceId);
        if (!exists) {
          // Nonaktifkan device terlama (indeks 0 karena kita urutkan secara menaik/ascending)
          const oldestDevice = activeDevices[0];
          await supabase
            .from('employee_devices')
            .update({ status: 'Inactive' })
            .eq('id', oldestDevice.id);

          console.log(`[deviceService] Auto-deactivating oldest device: ${oldestDevice.deviceId}`);
        }
      }
    } catch (e) {
      console.warn('[deviceService] Gagal memproses batasan maksimal perangkat:', e);
    }

    const payload = {
      employeeId: user.id,
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      platform: deviceInfo.platform,
      deviceFingerprint: deviceInfo.deviceFingerprint,
      biometricEnabled: true,
      isPrimary: deviceInfo.isPrimary,
      status: 'Active',
    };

    const { data, error } = await supabase
      .from('employee_devices')
      .upsert(payload, { onConflict: 'employeeId,deviceId' })
      .select('id')
      .single();

    if (error || !data) {
      throw new Error(`Gagal mendaftarkan device: ${error?.message || 'unknown'}`);
    }

    void logMobileAudit({
      user,
      action: 'DEVICE_REGISTER',
      entityName: deviceInfo.deviceName,
      metadata: {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
        fingerprint: deviceInfo.deviceFingerprint,
      },
    });

    return {
      ...deviceInfo,
      id: data.id,
    };
  },

  async ensureDeviceRegistered(user: MobileUser): Promise<DeviceInfo> {
    const deviceInfo = await this.getDeviceInfo();
    const reg = await this.getDeviceRegistration(user);

    if (reg) {
      return {
        ...deviceInfo,
        id: reg.id,
      };
    }

    return this.registerDevice(user, deviceInfo);
  },
};
