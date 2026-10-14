/**
 * src/services/systemSettingsService.ts
 *
 * Mengambil identitas institusi dari tabel `system_settings` Supabase —
 * tabel yang SAMA dengan yang dipakai aplikasi web/dashboard.
 *
 * Perubahan nama institusi, tipe, alamat, atau telepon yang dilakukan
 * admin di menu Pengaturan Sistem akan langsung terlihat di mobile
 * tanpa perlu update APK.
 *
 * Cache AsyncStorage (TTL 1 jam) memastikan app tetap berjalan offline.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../config/supabase';

const CACHE_KEY = 'hrms.systemSettings.v1';
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 jam

// ─────────────────────────────── Tipe ────────────────────────────────────────

export interface SystemSettings {
  /** Nama institusi dari Pengaturan Sistem web, mis. "RS MELOY" */
  institutionName: string;
  /** Tipe institusi: "Rumah Sakit" | "Klinik" | "Puskesmas" */
  institutionType: string;
  /** URL logo institusi (opsional) */
  logoUrl?: string;
  /** Alamat lengkap institusi */
  address?: string;
  /** Nomor telepon institusi */
  phone?: string;
}

const DEFAULT_SETTINGS: SystemSettings = {
  institutionName: 'HRMS Absensi',
  institutionType: 'Rumah Sakit',
};

interface CachedSettings {
  settings: SystemSettings;
  fetchedAt: number;
}

// ─────────────────────────── Helper internal ──────────────────────────────────

async function loadCache(): Promise<CachedSettings | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as CachedSettings;
  } catch {
    return null;
  }
}

async function saveCache(data: CachedSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {}
}

function mapRow(row: Record<string, any>): SystemSettings {
  return {
    institutionName: String(row.institution_name || DEFAULT_SETTINGS.institutionName),
    institutionType: String(row.institution_type || DEFAULT_SETTINGS.institutionType),
    logoUrl: row.logo_url ? String(row.logo_url) : undefined,
    address: row.address ? String(row.address) : undefined,
    phone: row.phone ? String(row.phone) : undefined,
  };
}

// ─────────────────────────── Public API ──────────────────────────────────────

/**
 * Ambil pengaturan sistem institusi.
 *
 * Prioritas:
 *   1. Cache segar (< 1 jam) — respons instan
 *   2. Fetch dari Supabase `system_settings`
 *   3. Cache stale (sudah expired, dipakai saat offline)
 *   4. Nilai default hardcoded
 */
export async function getSystemSettings(forceRefresh = false): Promise<SystemSettings> {
  if (!forceRefresh) {
    const cached = await loadCache();
    if (cached && Date.now() - cached.fetchedAt < CACHE_TTL_MS) {
      return cached.settings;
    }
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('institution_name, institution_type, logo_url, address, phone')
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    if (!data) return DEFAULT_SETTINGS;

    const settings = mapRow(data);
    await saveCache({ settings, fetchedAt: Date.now() });
    return settings;
  } catch (err) {
    console.warn('[systemSettings] Fetch gagal, fallback ke cache/default:', err);
    const stale = await loadCache();
    if (stale) return stale.settings;
    return DEFAULT_SETTINGS;
  }
}

/** Hapus cache (dipakai saat logout atau refresh paksa). */
export async function clearSystemSettingsCache(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHE_KEY);
  } catch {}
}
