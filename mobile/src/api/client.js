import axios from 'axios';
import { API_BASE_URL, APP_CONFIG } from '../constants/config';
import { storage } from '../utils/storage';

const client = axios.create({
    baseURL: API_BASE_URL,
    timeout: APP_CONFIG.apiTimeout,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
});

// Request Interceptor: Attach Bearer JWT token from SecureStore
client.interceptors.request.use(
    async (config) => {
        const token = await storage.getToken();
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor: Handle response errors cleanly
client.interceptors.response.use(
    (response) => response,
    async (error) => {
        // Optional: auto handle 401 unauthenticated
        if (error.response?.status === 401) {
            // Token expired or invalid
        }
        return Promise.reject(error);
    }
);

export default client;
