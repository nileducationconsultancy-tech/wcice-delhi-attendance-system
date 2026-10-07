import { useState, useEffect, useCallback } from 'react';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../store/authStore';

// Keep native splash visible until custom animated splash takes over
SplashScreen.preventAutoHideAsync().catch(() => {
    /* ignore error if already prevented */
});

export const useAppInitialization = () => {
    const { checkAuth } = useAuthStore();
    const [isAppReady, setIsAppReady] = useState(false);
    const [initError, setInitError] = useState(null);

    const initialize = useCallback(async () => {
        setInitError(null);
        const startTime = Date.now();

        try {
            // Run real JWT check / profile verification
            await checkAuth();
        } catch (err) {
            console.log('App init check note:', err?.message);
        } finally {
            // Ensure minimum visual duration (1800ms) for smooth branding choreography
            const elapsed = Date.now() - startTime;
            const remaining = Math.max(0, 1800 - elapsed);

            setTimeout(async () => {
                try {
                    await SplashScreen.hideAsync();
                } catch (e) {
                    // Ignore if splash already hidden
                }
                setIsAppReady(true);
            }, remaining);
        }
    }, [checkAuth]);

    useEffect(() => {
        initialize();
    }, [initialize]);

    return {
        isAppReady,
        initError,
        retry: initialize
    };
};

export default useAppInitialization;
