import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, existsSync } from 'fs';
import { createGzip } from 'zlib';
import { createClient } from '@supabase/supabase-js';
import loggingService from './server/services/loggingService.js';
import { getRedisStats } from './server/services/redisAdapter.js';
import { getCache } from './server/services/redisCache.js';
import dotenv from 'dotenv';
// Sentry import removed

import helmet from 'helmet';
import cors from 'cors';
import { setupSystemRoutes, setupMetricsRoute } from './server/routes/systemRoutes.js';
import { setupEmployeeRoutes } from './server/routes/employeeRoutes.js';
import { setupOrganizationRoutes } from './server/routes/organizationRoutes.js';
import { setupOperationsRoutes } from './server/routes/operationsRoutes.js';
import { setupHikvisionRoutes } from './server/routes/hikvisionRoutes.js';
import { startServerHikvisionSync } from './server/services/hikvisionSyncService.js';
import { setupAdminRoutes } from './server/routes/adminRoutes.js';


const envLocalPath = path.resolve(process.cwd(), '.env.local');
if (existsSync(envLocalPath)) {
  dotenv.config({ path: envLocalPath });
}
dotenv.config();

// Removed __filename and __dirname to fix Vercel import.meta ESM syntax error

const app = express();
const PORT = process.env.PORT || 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

let SUPABASE_URL = process.env.VITE_DATA_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
if (!SUPABASE_URL || SUPABASE_URL.toLowerCase() === 'auto') {
  SUPABASE_URL = 'http://127.0.0.1:54321';
}
const SUPABASE_ANON_KEY = process.env.VITE_DATA_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

let SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || '';
if (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.startsWith('your-') || SUPABASE_SERVICE_ROLE_KEY.includes('gwfymzfrxsvtmtdhryft')) {
  if (SUPABASE_URL.includes('127.0.0.1') || SUPABASE_URL.includes('localhost')) {
    SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU';
  }
}

if (IS_PROD && (!SUPABASE_SERVICE_ROLE_KEY || SUPABASE_SERVICE_ROLE_KEY.startsWith('your-') || SUPABASE_SERVICE_ROLE_KEY.includes('supabase-demo'))) {
  console.error('CRITICAL ERROR: Invalid or default SUPABASE_SERVICE_ROLE_KEY provided in production mode! Startup aborted for security.');
  process.exit(1);
}

const publicSupabase = SUPABASE_URL && SUPABASE_ANON_KEY
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

const adminSupabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

if (adminSupabase) {
  startServerHikvisionSync(adminSupabase);
}

const invalidateEmployeeCaches = async (employee) => {
  try {
    const cache = getCache();
    await cache.invalidatePattern('employees:*');
    const identifiers = [employee?.user_id, employee?.id].filter(Boolean);
    for (const identifier of identifiers) {
      await cache.invalidateUser(identifier);
    }
  } catch (err) {
    loggingService.warn('Employee cache invalidation failed', { error: err.message });
  }
};

const invalidateOrganizationCaches = async () => {
  try {
    const cache = getCache();
    await cache.invalidatePattern('employees:*');
    await cache.invalidatePattern('organization:*');
    await cache.invalidatePattern('units:*');
  } catch (err) {
    loggingService.warn('Organization cache invalidation failed', { error: err.message });
  }
};

const getBearerToken = (req) => {
  const authHeader = String(req.headers.authorization || '');
  if (!authHeader.startsWith('Bearer ')) return '';
  return authHeader.slice(7).trim();
};

const getRequesterContext = async (req) => {
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return { ok: false, status: 503, error: 'Supabase server clients are not configured' };
  }

  const token = getBearerToken(req);
  if (!token) {
    return { ok: false, status: 401, error: 'Missing authorization token' };
  }

  const { data: { user }, error: userError } = await publicSupabase.auth.getUser(token);
  if (userError || !user) {
    return { ok: false, status: 401, error: 'Invalid or expired session' };
  }

  // Create a per-request authenticated client with the user's JWT token
  // to ensure Supabase Row Level Security (RLS) is strictly enforced.
  const dbClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${token}` } },
  });

  let employee = null;
  let employeeRole = null;
  const clientToUse = adminSupabase || dbClient;

  try {
    const { data: empData } = await clientToUse
      .from('employees')
      .select('id, user_id, role, "unitKerjaId", managed_unit_id, "managedUnitId", nama, email')
      .eq('user_id', user.id)
      .maybeSingle();
    if (empData) {
      employee = empData;
      employeeRole = String(empData.role || '').trim().toLowerCase();
    }
  } catch (_) {}

  let profileRole = null;
  try {
    const { data: profData } = await clientToUse
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle();
    if (profData && profData.role) {
      profileRole = String(profData.role).trim().toLowerCase();
    }
  } catch (_) {}

  const metaRole = String(user.user_metadata?.role || user.app_metadata?.role || '').trim().toLowerCase();
  const isPrivilegedRole = (r) => ['admin', 'hrd', 'hr', 'superadmin', 'administrator'].includes(String(r || '').toLowerCase());

  let effectiveRole = 'karyawan';
  if (isPrivilegedRole(employeeRole)) {
    effectiveRole = employeeRole;
  } else if (isPrivilegedRole(profileRole)) {
    effectiveRole = profileRole;
  } else if (isPrivilegedRole(metaRole)) {
    effectiveRole = metaRole;
  } else if (employeeRole) {
    effectiveRole = employeeRole;
  } else if (profileRole) {
    effectiveRole = profileRole;
  } else if (metaRole) {
    effectiveRole = metaRole;
  }

  return {
    ok: true,
    user,
    employee: employee || { id: user.id, user_id: user.id, role: effectiveRole, nama: user.email },
    role: effectiveRole,
    dbClient,
  };
};

const canManageEmployeesRole = (role) => {
  const norm = String(role || '').trim().toLowerCase();
  return norm === 'admin' || norm === 'hrd' || norm === 'hr' || norm === 'superadmin' || norm === 'administrator';
};
const canDeleteEmployeesRole = (role) => {
  const norm = String(role || '').trim().toLowerCase();
  return norm === 'admin' || norm === 'hrd' || norm === 'hr' || norm === 'superadmin' || norm === 'administrator';
};
const canManageOrganizationRole = (role) => {
  const norm = String(role || '').trim().toLowerCase();
  return norm === 'admin' || norm === 'superadmin' || norm === 'administrator';
};

// ── Error message helper ──
const getClientErrorMessage = (errorType, fallback = 'Operation failed') => {
  const errorMap = {
    auth_create_failed: 'Gagal membuat akun login, email mungkin sudah terdaftar.',
    profile_save_failed: 'Gagal menyimpan profil karyawan, periksa data yang dimasukkan.',
    delete_failed: 'Data gagal dihapus karena masih digunakan atau terhubung dengan data lain.',
    cleanup_failed: 'Gagal membersihkan data terkait. Operasi dibatalkan.',
    internal_error: 'Terjadi kesalahan sistem internal. Silakan hubungi administrator.',
    request_save_failed: 'Gagal menyimpan pengajuan perubahan data.',
    // [BE-M9] Adding explicit fallback mapping
  };

  // Production: Always return predefined mapped message or fallback
  // Dev: Can return more detailed errors if needed
  if (IS_PROD) {
    return errorMap[errorType] || fallback;
  }
  return errorMap[errorType] || fallback;
};

const logDetailedError = (context, error, details = {}) => {
  try {
    loggingService.error(`[${context}]`, {
      error: error?.message || String(error),
      code: error?.code,
      status: error?.status,
      details,
    });
  } catch (e) {
    loggingService.error(`[${context}] Logging failed`, { error: e?.message });
  }
};
const canManageOperationalRequestsRole = (role) => role === 'admin' || role === 'hrd' || role === 'kepala_ruangan';

const pick = (source, allowedKeys) => {
  const result = {};
  if (!source || typeof source !== 'object') return result;
  for (const key of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(source, key) && source[key] !== undefined) {
      result[key] = source[key];
    }
  }
  return result;
};

const normalizeEmptyStringsToNull = (payload) => {
  if (!payload || typeof payload !== 'object') return payload;

  const normalized = {};
  for (const [key, value] of Object.entries(payload)) {
    normalized[key] = typeof value === 'string' && value.trim() === '' ? null : value;
  }

  return normalized;
};

const allowedEmployeeFields = [
  'user_id',
  'nik',
  'nama',
  'foto',
  'jabatan',
  'departemen',
  'email',
  'telepon',
  'hireDate',
  'birthDate',
  'status',
  'shift',
  'sisaCuti',
  'role',
  'pin_mesin',
  'spesialisasi',
  'kredensial',
  'nomorSTR',
  'tanggalKadaluarsaSTR',
  'unitKerjaId',
  'unit_kerja_id',
  'sertifikasi',
  'kompetensi',
  'gajiPokok',
  'tunjanganProfesi',
  'gaji_pokok',
  'tunjangan_profesi',
  'ktpNumber',
  'ktp_number',
  'npwp',
  'bpjsKesehatan',
  'bpjs_kesehatan',
  'bpjsKetenagakerjaan',
  'bpjs_ketenagakerjaan',
  'agama',
  'maritalStatus',
  'marital_status',
  'dependents',
  'address',
  'emergencyContacts',
  'emergency_contacts',
  'education',
  'workHistory',
  'work_history',
  'bankAccount',
  'bank_account',
  'isProfileCompleted',
  'is_profile_completed',
  'isVerified',
  'is_verified',
  'verifiedBy',
  'verified_by',
  'verifiedAt',
  'verified_at',
  'isLocked',
  'is_locked',
  'managedUnitId',
  'managed_unit_id'
];

const normalizeEmployeeStatus = (status) => {
  if (!status || typeof status !== 'string') return 'Aktif';
  const s = status.trim().toLowerCase();
  if (s.includes('non') || s.includes('inactive')) return 'Non-Aktif';
  if (s.includes('cuti') || s.includes('leave')) return 'Cuti';
  return 'Aktif';
};

const normalizeEmployeeData = (employeeData) => {
  const payload = normalizeEmptyStringsToNull(pick(employeeData, allowedEmployeeFields));
  if (payload) {
    payload.status = normalizeEmployeeStatus(payload.status);
  }
  return payload;
};
const normalizeEmployeeUpdateData = (updateData) => {
  const payload = normalizeEmptyStringsToNull(pick(updateData, allowedEmployeeFields));
  if (payload && payload.status) {
    payload.status = normalizeEmployeeStatus(payload.status);
  }
  return payload;
};

const normalizeUnitData = (unit) => pick(unit, ['id', 'nama', 'shifts', 'shift_assignments', 'kode']);
const normalizeSimpleNameEntity = (entity) => pick(entity, ['nama', 'kode']);
const normalizeAttendanceData = (attendance) => pick(attendance, [
  'employeeId',
  'tanggal',
  'clockIn',
  'clockOut',
  'status',
  'shift',
  'notes',
  'source',
  'lat',
  'lng',
  'deviceId',
  'photoUrl',
]);

const normalizeRequestPayload = (payload) => pick(payload, [
  'employee_id',
  'attendance_date',
  'request_type',
  'reason_code',
  'reason_detail',
  'proposed_data',
  'current_data',
  'source_portal',
  'maker_user_id',
  'maker_employee_id',
  'maker_user_agent',
  'status',
]);

// (Duplicate block of pick + normalize* helpers removed.)

// Parse JSON bodies for API endpoints (limit to prevent DoS)
app.use(express.json({ limit: '10mb' }));

// ── Security Headers ──
app.use(helmet({
  contentSecurityPolicy: false, // CSP handled by Vite build
  crossOriginEmbedderPolicy: false,
}));

// ── CORS ──
const ALLOWED_ORIGINS = (process.env.CORS_ORIGINS || '').split(',').filter(Boolean);

if (IS_PROD && ALLOWED_ORIGINS.length === 0) {
  console.warn('⚠️ CORS_ORIGINS environment variable is not set in production. Defaulting to allow all origins temporarily.');
}

app.use(cors({
  origin: ALLOWED_ORIGINS.length > 0 ? ALLOWED_ORIGINS : true, // Fallback to allow all if not set
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-internal-auth'],
  maxAge: 86400,
}));

// ── Redis-based Rate Limiter (scalable for multi-instance) ──
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 120;

const redisRateLimiter = async (req, res, next) => {
  try {
    const cache = getCache();
    const ip = req.ip || req.socket.remoteAddress;
    const key = `ratelimit:${ip}`;
    const windowSeconds = RATE_LIMIT_WINDOW_MS / 1000;

    // [BE-M2] Use atomic INCR
    const currentCount = await cache.incr(key);
    
    if (currentCount === 1) {
      // First request in window, set expiration
      await cache.expire(key, windowSeconds);
      return next();
    }

    if (currentCount > RATE_LIMIT_MAX) {
      res.setHeader('Retry-After', windowSeconds);
      return res.status(429).json({ error: 'Too many requests' });
    }

    next();
  } catch (err) {
    loggingService.warn('Redis rate limiter failed, allowing request', { error: err.message });
    next();
  }
};
app.use(redisRateLimiter);

// ── Request Logging ──
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const msg = `${req.method} ${req.path} ${res.statusCode} ${duration}ms`;
    try {
      if (res.statusCode >= 500) loggingService.error(msg, { status: res.statusCode, duration });
      else if (res.statusCode >= 400) loggingService.warn(msg, { status: res.statusCode, duration });
      else if (!IS_PROD) loggingService.info(msg, { status: res.statusCode, duration });
      // In production we avoid noisy info logs
    } catch (err) {
      loggingService.warn(msg, { error: err.message });
    }
  });
  next();
});

// Static file serving removed for Vercel Serverless

// ── System Routes (Health & Metrics & Cache) ──
app.use('/api', setupSystemRoutes(publicSupabase));
app.use(setupMetricsRoute(null));

// ── Employee CRUD API ──
app.use('/api/employees', setupEmployeeRoutes({
  getRequesterContext,
  canManageEmployeesRole,
  canDeleteEmployeesRole,
  adminSupabase,
  logDetailedError,
  getClientErrorMessage,
  invalidateEmployeeCaches,
  normalizeEmployeeData,
  normalizeEmployeeUpdateData,
  loggingService
}));

// ── Organization API ──
app.use('/api/organization', setupOrganizationRoutes({
  getRequesterContext,
  canManageOrganizationRole,
  logDetailedError,
  getClientErrorMessage,
  invalidateOrganizationCaches,
  normalizeUnitData,
  normalizeSimpleNameEntity
}));

// ── Hikvision Proxy API ──
app.use('/api/hikvision', setupHikvisionRoutes({
  getRequesterContext,
  logDetailedError,
  adminSupabase
}));

// ── Admin Secure API ──
setupAdminRoutes(app, {
  adminSupabase,
  getRequesterContext,
  canManageEmployeesRole,
  loggingService
});

// ── Operations API ──
app.use('/api', setupOperationsRoutes({
  getRequesterContext,
  canManageOperationalRequestsRole,
  canManageOrganizationRole,
  normalizeRequestPayload,
  logDetailedError,
  getClientErrorMessage
}));

// SPA fallback routing removed for Vercel compatibility

// ── Error Handling Middleware ──
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  
  // Log to logging service
  try {
    loggingService.error('Unhandled error', {
      message: err.message,
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  } catch (logErr) {
    console.error('Failed to log error:', logErr);
  }

  // Send error response
  const status = err.status || 500;
  const message = IS_PROD ? 'Internal server error' : err.message;
  
  res.status(status).json({
    success: false,
    error: message,
    ...(IS_PROD ? {} : { stack: err.stack }),
  });
});

// Server start logic moved to local-server.js

// Sentry initialization removed
export default app;