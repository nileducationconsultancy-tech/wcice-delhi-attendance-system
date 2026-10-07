import Constants from 'expo-constants';

const FALLBACK_PROD_URL = 'https://wcice-delhi-attendance-system.vercel.app';

// Dynamic API Base URL resolution:
// 1. If EXPO_PUBLIC_API_URL is configured (e.g. production URL)
// 2. Automatically detect laptop IP if running locally in Expo Go Metro
// 3. Fallback to production backend URL
const getBaseUrl = () => {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    
    // If an explicit environment URL is defined (e.g. Render, Vercel, or local IP)
    if (envUrl && envUrl.trim().length > 0) {
        // If it's not localhost/127.0.0.1 (which phones cannot resolve), use it directly
        if (!envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
            return envUrl.trim().replace(/\/+$/, '');
        }
    }

    // Auto-detect host IP from Expo Metro bundler if running locally in development mode
    if (__DEV__) {
        const debuggerHost =
            Constants.expoConfig?.hostUri ||
            Constants.manifest2?.extra?.expoClient?.hostUri ||
            Constants.manifest?.debuggerHost;

        if (debuggerHost) {
            const hostIp = debuggerHost.split(':')[0];
            if (hostIp && hostIp !== 'localhost' && hostIp !== '127.0.0.1') {
                return `http://${hostIp}:5000`;
            }
        }
    }

    // Fallback to deployed production backend or local default
    return FALLBACK_PROD_URL || 'http://localhost:5000';
};

export const API_BASE_URL = getBaseUrl();

export const APP_CONFIG = {
    appName: 'WECICE Attendance',
    companyName: 'WECICE Delhi',
    version: '1.0.0',
    apiTimeout: 60000
};
