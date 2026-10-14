import { authSupabase } from './authSupabaseClient';
import logger from './logger.ts';

const isBrowser = typeof window !== 'undefined';

const getEnvVar = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

// Menggunakan variabel lingkungan untuk konfigurasi Supabase
let configuredSupabaseUrl = String(getEnvVar('VITE_SUPABASE_URL') || '').trim();

if (configuredSupabaseUrl && configuredSupabaseUrl.includes('<IP_KOMPUTER_SERVER>')) {
  configuredSupabaseUrl = configuredSupabaseUrl.replace('<IP_KOMPUTER_SERVER>', isBrowser ? window.location.hostname : 'localhost');
}

const getBrowserSupabaseUrl = (url: string): string => {
  if (isBrowser && window.location.port !== '5173') {
    return `${window.location.origin}/supabase`;
  }
  return url;
};

const supabaseUrl = getBrowserSupabaseUrl(
  (!configuredSupabaseUrl || String(configuredSupabaseUrl).toLowerCase() === 'auto')
    ? (isBrowser ? `${window.location.protocol}//${window.location.hostname}:54321` : 'http://localhost:54321')
    : configuredSupabaseUrl
);
const supabaseKey = String(getEnvVar('VITE_SUPABASE_ANON_KEY') || '');

// Validasi konfigurasi untuk mencegah error
if (!supabaseUrl || !supabaseKey) {
  logger.error('Konfigurasi Supabase tidak lengkap!', undefined, {
    url: configuredSupabaseUrl ? 'SET' : 'MISSING',
    key: supabaseKey ? 'SET' : 'MISSING',
  });
} else {
  logger.info('Supabase configuration loaded', { url: supabaseUrl });
}

// Reuse auth client to avoid spawning another GoTrue client instance.
export const supabase = authSupabase;

// Fungsi helper untuk mengubah objek dari snake_case (DB) ke camelCase (JS)
// Diabaikan untuk saat ini karena kita menggunakan quoted identifiers
// export const fromSnakeCase = (data: any) => { ... }

// Fungsi helper untuk mengubah objek dari camelCase (JS) ke snake_case (DB)
// Diabaikan untuk saat ini
// export const toSnakeCase = (data: any) => { ... }


