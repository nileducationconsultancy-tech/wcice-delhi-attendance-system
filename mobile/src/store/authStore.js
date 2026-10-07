import { create } from 'zustand';
import { authApi } from '../api/authApi';
import { storage } from '../utils/storage';

export const useAuthStore = create((set, get) => ({
    user: null,
    token: null,
    isLoading: true,
    isLoggingIn: false,
    error: null,

    clearError: () => set({ error: null }),

    setProfilePicture: (url) =>
        set((state) => ({
            user: state.user
                ? {
                      ...state.user,
                      profilePicture: url,
                      employee: state.user.employee
                          ? { ...state.user.employee, profilePicture: url }
                          : { profilePicture: url }
                  }
                : null
        })),

    /**
     * Check saved authentication on app launch with fail-safe timeout
     */
    checkAuth: async () => {
        set({ isLoading: true, error: null });
        try {
            const token = await storage.getToken();
            if (!token) {
                set({ user: null, token: null, isLoading: false });
                return;
            }

            // Verify token with backend with a 5-second timeout fail-safe
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Network timeout')), 5000)
            );

            const response = await Promise.race([
                authApi.getMe(),
                timeoutPromise
            ]);

            const data = response.data;
            const profilePic = data.profilePicture || data.employee?.profilePicture || null;
            const user = {
                _id: data._id,
                email: data.email,
                name: data.name,
                role: data.role,
                status: data.status,
                profilePicture: profilePic,
                employee: data.employee
                    ? { ...data.employee, profilePicture: data.employee.profilePicture || profilePic }
                    : null
            };

            set({
                user,
                token,
                isLoading: false
            });
        } catch (err) {
            // Silently fallback if offline or token expired on startup
            set({ isLoading: false });
        }
    },

    /**
     * Login with email and password
     */
    login: async (email, password) => {
        set({ error: null, isLoggingIn: true });
        try {
            const cleanEmail = (email || '').trim().toLowerCase();
            const response = await authApi.login({ email: cleanEmail, password });
            const data = response.data;

            if (data.token) {
                await storage.setToken(data.token);
            }

            const profilePic = data.profilePicture || data.employee?.profilePicture || null;
            const user = {
                _id: data._id,
                email: data.email,
                name: data.name,
                role: data.role,
                status: data.status,
                profilePicture: profilePic,
                employee: data.employee
                    ? { ...data.employee, profilePicture: data.employee.profilePicture || profilePic }
                    : null
            };

            set({
                user,
                token: data.token,
                error: null,
                isLoggingIn: false,
                isLoading: false
            });

            return { success: true, user };
        } catch (err) {
            let errorMessage = 'Gmail or password is wrong';

            if (err.response) {
                const status = err.response.status;
                const serverMsg = err.response.data?.message;

                if (serverMsg) {
                    errorMessage = serverMsg;
                } else if (status === 401 || status === 400 || status === 404) {
                    errorMessage = 'Invalid email or password. Please try again.';
                } else if (status === 403) {
                    errorMessage = 'Your account is not authorized to log in. Please contact admin.';
                } else {
                    errorMessage = `Server error (${status}). Please try again.`;
                }
            } else if (err.code === 'ECONNABORTED' || err.message?.toLowerCase().includes('timeout')) {
                errorMessage = 'Server is taking too long to respond. Please check your internet connection.';
            } else if (err.message === 'Network Error' || err.code === 'ERR_NETWORK') {
                errorMessage = 'Network connection failed. Please check your internet connection and verify backend status.';
            } else {
                errorMessage = err.message || 'Unable to log in. Please try again.';
            }

            set({ error: errorMessage, isLoggingIn: false });
            return { success: false, error: errorMessage };
        }
    },

    /**
     * Logout and clear all device tokens
     */
    logout: async () => {
        try {
            await authApi.logout();
        } catch (e) {
            // Ignore network errors on logout
        } finally {
            await storage.clearAuth();
            set({ user: null, token: null, error: null, isLoggingIn: false, isLoading: false });
        }
    }
}));

export default useAuthStore;
