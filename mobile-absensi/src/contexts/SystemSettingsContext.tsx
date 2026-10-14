/**
 * src/contexts/SystemSettingsContext.tsx
 *
 * Menyediakan identitas institusi (nama, tipe, logo, alamat, telepon)
 * yang diambil dari `system_settings` Supabase ke seluruh aplikasi mobile.
 *
 * Data otomatis sinkron dengan apa yang dikonfigurasi admin di
 * menu Pengaturan Sistem pada aplikasi web.
 */
import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  getSystemSettings,
  clearSystemSettingsCache,
  type SystemSettings,
} from '../services/systemSettingsService';

// ─────────────────────────── Tipe Context ────────────────────────────────────

interface SystemSettingsContextValue {
  settings: SystemSettings;
  loading: boolean;
  /** Paksa ambil ulang dari server (lewati cache). */
  refresh: () => Promise<void>;
}

// ─────────────────────────── Default ─────────────────────────────────────────

const DEFAULT: SystemSettingsContextValue = {
  settings: {
    institutionName: 'HRMS Absensi',
    institutionType: 'Rumah Sakit',
  },
  loading: true,
  refresh: async () => {},
};

// ─────────────────────────── Context & Provider ───────────────────────────────

const SystemSettingsContext = createContext<SystemSettingsContextValue>(DEFAULT);

export function SystemSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SystemSettings>(DEFAULT.settings);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (force = false) => {
    try {
      const data = await getSystemSettings(force);
      setSettings(data);
    } catch (err) {
      console.warn('[SystemSettings] Gagal memuat:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Muat saat pertama kali provider dipasang (saat app dibuka)
  useEffect(() => {
    void load(false);
  }, [load]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await clearSystemSettingsCache();
    await load(true);
  }, [load]);

  return (
    <SystemSettingsContext.Provider value={{ settings, loading, refresh }}>
      {children}
    </SystemSettingsContext.Provider>
  );
}

// ─────────────────────────── Hook ────────────────────────────────────────────

/**
 * Gunakan hook ini di komponen manapun untuk mengakses identitas institusi.
 *
 * @example
 *   const { settings } = useSystemSettings();
 *   <Text>{settings.institutionName}</Text>
 */
export function useSystemSettings(): SystemSettingsContextValue {
  return useContext(SystemSettingsContext);
}
