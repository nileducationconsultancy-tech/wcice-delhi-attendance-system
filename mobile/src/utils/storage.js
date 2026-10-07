import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const TOKEN_KEY = 'wecice_auth_jwt_token';
const USER_KEY = 'wecice_auth_user_cache';

export const storage = {
    /**
     * Save JWT token to encrypted device storage
     */
    async setToken(token) {
        try {
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.setItem(TOKEN_KEY, token);
                }
            } else {
                await SecureStore.setItemAsync(TOKEN_KEY, token);
            }
        } catch (e) {
            console.error('SecureStore: Failed to save auth token', e);
        }
    },

    /**
     * Retrieve JWT token from encrypted device storage
     */
    async getToken() {
        try {
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && window.localStorage) {
                    return window.localStorage.getItem(TOKEN_KEY);
                }
                return null;
            }
            return await SecureStore.getItemAsync(TOKEN_KEY);
        } catch (e) {
            console.error('SecureStore: Failed to retrieve auth token', e);
            return null;
        }
    },

    /**
     * Remove JWT token & cache upon logout
     */
    async clearAuth() {
        try {
            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined' && window.localStorage) {
                    window.localStorage.removeItem(TOKEN_KEY);
                    window.localStorage.removeItem(USER_KEY);
                }
            } else {
                await SecureStore.deleteItemAsync(TOKEN_KEY);
                await SecureStore.deleteItemAsync(USER_KEY);
            }
        } catch (e) {
            console.error('SecureStore: Failed to clear auth storage', e);
        }
    },

    // Convenience aliases
    async getItem(key) {
        if (key === 'token' || key === TOKEN_KEY) return this.getToken();
        try {
            if (Platform.OS === 'web') {
                return window.localStorage?.getItem(key) || null;
            }
            return await SecureStore.getItemAsync(key);
        } catch (e) {
            return null;
        }
    },

    async setItem(key, value) {
        if (key === 'token' || key === TOKEN_KEY) return this.setToken(value);
        try {
            if (Platform.OS === 'web') {
                window.localStorage?.setItem(key, value);
            } else {
                await SecureStore.setItemAsync(key, value);
            }
        } catch (e) {
            console.error('Failed to set item', e);
        }
    },

    async removeItem(key) {
        if (key === 'token' || key === TOKEN_KEY) return this.clearAuth();
        try {
            if (Platform.OS === 'web') {
                window.localStorage?.removeItem(key);
            } else {
                await SecureStore.deleteItemAsync(key);
            }
        } catch (e) {
            console.error('Failed to remove item', e);
        }
    }
};

export default storage;
