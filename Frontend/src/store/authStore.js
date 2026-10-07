import { create } from 'zustand';
import axios from 'axios';

const useAuthStore = create((set) => ({
    user: null,
    loading: true,
    error: null,
    login: async (email, password) => {
        try {
            set({ loading: true, error: null });
            const { data } = await axios.post('/api/auth/login', { email, password });
            if (data.token) {
                localStorage.setItem('token', data.token);
            }
            set({ user: data, loading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login failed', loading: false });
        }
    },
    logout: async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (error) {
            console.error(error);
        } finally {
            localStorage.removeItem('token');
            set({ user: null });
        }
    },
    checkAuth: async () => {
        try {
            const { data } = await axios.get('/api/auth/me');
            set({ user: data, loading: false });
        } catch (error) {
            localStorage.removeItem('token');
            set({ user: null, loading: false });
        }
    }
}));

export default useAuthStore;
