import { useEffect } from 'react';
import { useAuthActions } from '../../stores/appStore.ts';

export const usePasswordRecovery = () => {
    const { setAuthLoading, setIsResetPasswordPage } = useAuthActions();

    useEffect(() => {
        const recoveryCheckTimerRef = { current: null as ReturnType<typeof setTimeout> | null };

        const checkForPasswordRecovery = () => {
            const hash = window.location.hash;
            const search = window.location.search;
            const referrer = document.referrer;

            const isRecoveryUrl =
                hash.includes('type=recovery') ||
                hash.includes('access_token=') ||
                hash.includes('recovery_token=') ||
                search.includes('type=recovery') ||
                referrer.includes('/auth/v1/verify');

            if (isRecoveryUrl) {
                setIsResetPasswordPage(true);
                setAuthLoading(false);
                return true;
            }

            return false;
        };

        const isRecovery = checkForPasswordRecovery();
        if (!isRecovery) {
            recoveryCheckTimerRef.current = setTimeout(checkForPasswordRecovery, 1000);
        }

        const handleHashChange = () => {
            checkForPasswordRecovery();
        };

        window.addEventListener('hashchange', handleHashChange);

        return () => {
            window.removeEventListener('hashchange', handleHashChange);
            if (recoveryCheckTimerRef.current) {
                clearTimeout(recoveryCheckTimerRef.current);
                recoveryCheckTimerRef.current = null;
            }
        };
    }, [setAuthLoading, setIsResetPasswordPage]);
};
