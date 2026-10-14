/**
 * AUTH SUPABASE CLIENT
 * Purpose: Hosted Supabase Authentication service
 * URL: https://<project-ref>.supabase.co (recommended)
 * Operations: Login, Logout, Password Reset, Session Management
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
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

let configuredAuthUrl = String(getEnvVar('VITE_AUTH_SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL') || '').trim();

if (configuredAuthUrl && configuredAuthUrl.includes('<IP_KOMPUTER_SERVER>')) {
  configuredAuthUrl = configuredAuthUrl.replace('<IP_KOMPUTER_SERVER>', isBrowser ? window.location.hostname : 'localhost');
}

const getBrowserSupabaseUrl = (url: string): string => {
  if (isBrowser && url) {
    if (url.startsWith('/')) {
      return `${window.location.origin}${url}`;
    }
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
  }
  if (isBrowser && (!window.location.port || window.location.port === '80' || window.location.port === '443')) {
    return `${window.location.origin}/supabase`;
  }
  return url;
};

const authSupabaseUrl = getBrowserSupabaseUrl(
  (!configuredAuthUrl || String(configuredAuthUrl).toLowerCase() === 'auto')
    ? (isBrowser ? `${window.location.protocol}//${window.location.hostname}:54321` : 'http://localhost:54321')
    : configuredAuthUrl
);

const authSupabaseKey = String(import.meta.env.VITE_AUTH_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || '');


if (!authSupabaseUrl || !authSupabaseKey) {
  logger.error('Supabase Auth configuration missing!', undefined, {
    url: authSupabaseUrl ? 'SET' : 'MISSING',
    key: authSupabaseKey ? 'SET' : 'MISSING',
  });
} else {
  logger.info('Supabase Auth Client Initialized', { url: authSupabaseUrl });
}

const authClientKey = '__hrms_auth_supabase_client__';
const globalAuthScope = globalThis as typeof globalThis & {
  [authClientKey]?: ReturnType<typeof createClient<Database>>;
};

export const authSupabase =
  globalAuthScope[authClientKey] ||
  createClient<Database>(authSupabaseUrl || 'http://localhost:54321', authSupabaseKey || 'dummy-key-to-prevent-crash-if-env-is-missing', {
  auth: {
    storageKey: 'hrms-auth-session',
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
});

globalAuthScope[authClientKey] = authSupabase;


