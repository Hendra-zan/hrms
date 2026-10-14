import logger from '../../services/logger.ts';
import { Employee, Status } from '../../types.ts';

export const PERF_ENABLED = import.meta.env.DEV;
export const SESSION_CHECK_STUCK_MS = 15000;
export const SESSION_QUERY_TIMEOUT_MS = 12000;

export const normalizeRole = (role?: string | null) => String(role || '').trim().toLowerCase();

export const isOperationalRole = (role?: string | null) => {
    const normalized = normalizeRole(role);
    return normalized === 'admin' || normalized === 'hrd' || normalized === 'hr';
};

export const timed = async <T>(label: string, task: () => Promise<T>): Promise<T> => {
    const startedAt = performance.now();
    try {
        return await task();
    } finally {
        if (PERF_ENABLED) {
            const elapsed = performance.now() - startedAt;
            logger.debug(`[PERF] ${label}: ${elapsed.toFixed(1)}ms`);
        }
    }
};

export const withTimeout = async <T>(task: Promise<T>, timeoutMs: number, label: string): Promise<T> => {
    return new Promise<T>((resolve, reject) => {
        const timeoutId = window.setTimeout(() => {
            reject(new Error(`${label} timeout (${timeoutMs}ms)`));
        }, timeoutMs);

        task
            .then((value) => {
                window.clearTimeout(timeoutId);
                resolve(value);
            })
            .catch((error) => {
                window.clearTimeout(timeoutId);
                reject(error);
            });
    });
};

export const enforceEmployeeAccess = async (sessionEmail: string | undefined, profile: Employee) => {
    if (!profile) {
        throw new Error('Akun Anda tidak terdaftar sebagai karyawan. Hubungi admin HRD.');
    }

    const normalizeEmail = (email?: string | null) => email?.trim().toLowerCase() || '';
    const authEmail = normalizeEmail(sessionEmail);
    const employeeEmail = normalizeEmail(profile.email);

    if (profile.status !== Status.Aktif) {
        throw new Error('Akun karyawan Anda tidak aktif. Hubungi admin HRD.');
    }

    if (!employeeEmail || employeeEmail !== authEmail) {
        throw new Error('Email login tidak sesuai dengan data karyawan. Hubungi admin HRD.');
    }
};
