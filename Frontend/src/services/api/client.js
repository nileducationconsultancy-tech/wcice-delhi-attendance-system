import axios from 'axios';

const client = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '',
    withCredentials: true,
    timeout: 15000,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Request Interceptor: Attach Bearer token from localStorage for cross-domain support
client.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Centralized error handling
client.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Optional: handle session expiry gracefully
            if (window.location.pathname !== '/login' && window.location.pathname !== '/forgot-password') {
                // If token is invalid/expired, let store handle logout
            }
        }
        return Promise.reject(error);
    }
);

export default client;
