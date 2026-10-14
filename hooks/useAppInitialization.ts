import { useCallback, useEffect, useRef } from 'react';
import logger from '../services/logger.ts';
import { authService } from '../services/AuthService.ts';
import { dataService } from '../services/DataService.ts';
import { Employee } from '../types.ts';
import { useAuth, useAuthActions, useAppDataActions, useAppErrorActions } from '../stores/appStore.ts';
import { mapEmployeeFromDatabase } from '../utils/dataMapping.ts';
import {
    PERF_ENABLED,
    SESSION_CHECK_STUCK_MS,
    SESSION_QUERY_TIMEOUT_MS,
    isOperationalRole,
    timed,
    withTimeout,
    enforceEmployeeAccess,
    useDataLoader,
    useViewAwareRefresh,
    usePasswordRecovery,
} from './initialization/index.ts';

export const useAppInitialization = () => {
    const mounted = useRef(true);
    const isSessionCheckRunning = useRef(false);
    const sessionCheckStartedAt = useRef<number | null>(null);
    const perfBootstrapLogCount = useRef(0);

    const { isResetPasswordPage, authUser } = useAuth();
    const { setAuthUser, setAuthLoading, setAuthError, setIsResetPasswordPage } = useAuthActions();
    const {
        setWorkUnits,
        setDepartments,
        setPositions,
        setSystemSettings,
        setDataLoading,
    } = useAppDataActions();
    const { setError: setAppError, setIsDatabaseError } = useAppErrorActions();

    const { loadAdminData, loadEmployeeData } = useDataLoader();
    usePasswordRecovery();
    useViewAwareRefresh(authUser, mounted);

    const handleSession = useCallback(async (options?: { silent?: boolean }) => {
        const isSilent = options?.silent ?? false;

        if (isSessionCheckRunning.current) {
            const elapsed = sessionCheckStartedAt.current ? performance.now() - sessionCheckStartedAt.current : 0;
            if (elapsed < SESSION_CHECK_STUCK_MS) return;

            if (PERF_ENABLED) {
                logger.warn('[PERF] session-check watchdog: forcing recovery from stale lock');
            }
            isSessionCheckRunning.current = false;
            sessionCheckStartedAt.current = null;
        }

        isSessionCheckRunning.current = true;
        sessionCheckStartedAt.current = performance.now();
        const bootstrapStartedAt = performance.now();

        if (isResetPasswordPage) {
            setAuthLoading(false);
            isSessionCheckRunning.current = false;
            sessionCheckStartedAt.current = null;
            return;
        }

        if (!isSilent) {
            setAuthLoading(true);
        }
        setAuthError(null);
        setIsDatabaseError(false);

        try {
            const sessionResult = await timed('auth:getSession', () =>
                withTimeout(authService.getSession(), SESSION_QUERY_TIMEOUT_MS, 'auth:getSession')
            );

            if (!mounted.current) {
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            if (!sessionResult.success || !sessionResult.session) {
                setAuthUser(null);
                setAuthLoading(false);
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            const session = sessionResult.session;
            const profileResult = await timed('auth:employeeProfile', () =>
                dataService.getEmployee(session.user.id)
            );

            if (!mounted.current) {
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            if (!profileResult.success || !profileResult.data) {
                await authService.logout();
                setAuthError('Akun Anda tidak terdaftar sebagai karyawan. Hubungi admin HRD.');
                setAuthUser(null);
                setAuthLoading(false);
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            const rawProfile = profileResult.data as any;
            const profile = mapEmployeeFromDatabase(rawProfile) as Employee;

            try {
                await enforceEmployeeAccess(session.user.email, profile);
            } catch (accessErr: any) {
                await authService.logout();
                setAuthError(accessErr.message || 'Akses ditolak. Hubungi administrator.');
                setAuthUser(null);
                setAuthLoading(false);
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            setAuthUser({ id: session.user.id, email: session.user.email, profile });

            const [
                workUnitsResult,
                departmentsResult,
                positionsResult,
                settingsResult,
            ] = await Promise.all([
                timed('master:units', () => dataService.getWorkUnits()),
                timed('master:departments', () => dataService.getDepartments()),
                timed('master:positions', () => dataService.getPositions()),
                timed('master:system_settings', () => dataService.getSystemSettings()),
            ]);

            if (!mounted.current) {
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            if (!workUnitsResult.success) {
                if (workUnitsResult.error?.includes('relation "public.units" does not exist')) {
                    setIsDatabaseError(true);
                } else {
                    throw new Error(`Gagal mengambil data unit kerja: ${workUnitsResult.error}`);
                }
                setDataLoading(false);
                setAuthLoading(false);
                isSessionCheckRunning.current = false;
                sessionCheckStartedAt.current = null;
                return;
            }

            setWorkUnits(workUnitsResult.data || []);
            setDepartments(departmentsResult.data || []);
            setPositions(positionsResult.data || []);
            setSystemSettings(settingsResult.data?.[0] || null);

            if (!isSilent) {
                setAuthLoading(false);
            }
            isSessionCheckRunning.current = false;
            sessionCheckStartedAt.current = null;

            setDataLoading(true);
            void (async () => {
                try {
                    if (isOperationalRole(profile.role)) {
                        await loadAdminData();
                    } else {
                        await loadEmployeeData(profile.id, profile);
                    }
                    if (PERF_ENABLED) {
                        const total = performance.now() - bootstrapStartedAt;
                        if (perfBootstrapLogCount.current < 3) {
                            logger.debug(`[PERF] bootstrap:totalUntilBackgroundDone: ${total.toFixed(1)}ms`);
                        }
                        perfBootstrapLogCount.current += 1;
                    }
                } catch (backgroundError: any) {
                    if (!mounted.current) return;
                    setAppError(`Terjadi kesalahan saat memuat data lanjutan: ${backgroundError.message}`);
                } finally {
                    if (mounted.current) {
                        setDataLoading(false);
                    }
                }
            })();
        } catch (err: any) {
            if (!mounted.current) return;
            setAppError(`Terjadi kesalahan: ${err.message}`);
            setDataLoading(false);
            setAuthLoading(false);
        } finally {
            isSessionCheckRunning.current = false;
            sessionCheckStartedAt.current = null;
        }
    }, [
        isResetPasswordPage,
        setAuthLoading,
        setAuthError,
        setIsDatabaseError,
        setAuthUser,
        setDataLoading,
        setWorkUnits,
        setDepartments,
        setPositions,
        setSystemSettings,
        loadAdminData,
        loadEmployeeData,
        setAppError,
    ]);

    useEffect(() => {
        const { data: authListener } = authService.onAuthStateChange(async (event) => {
            if (event === 'PASSWORD_RECOVERY') {
                setIsResetPasswordPage(true);
                setAuthLoading(false);
                return;
            }

            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
                setIsResetPasswordPage(false);
                if (!mounted.current) return;
                await handleSession({ silent: Boolean(authUser) || event !== 'SIGNED_IN' });
            }

            if (event === 'SIGNED_OUT') {
                setAuthUser(null);
                setAuthLoading(false);
            }
        });

        return () => {
            authListener?.subscription.unsubscribe();
        };
    }, [authUser, handleSession, setAuthLoading, setAuthUser, setIsResetPasswordPage]);

    useEffect(() => {
        const refreshOnResume = () => {
            if (!mounted.current || !authUser) return;
            if (document.visibilityState === 'hidden') return;
            void handleSession({ silent: true });
        };

        const onVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                refreshOnResume();
            }
        };

        window.addEventListener('focus', refreshOnResume);
        window.addEventListener('online', refreshOnResume);
        document.addEventListener('visibilitychange', onVisibilityChange);

        return () => {
            window.removeEventListener('focus', refreshOnResume);
            window.removeEventListener('online', refreshOnResume);
            document.removeEventListener('visibilitychange', onVisibilityChange);
        };
    }, [authUser, handleSession]);

    useEffect(() => {
        mounted.current = true;
        handleSession();
        return () => {
            mounted.current = false;
        };
    }, [handleSession]);
};
