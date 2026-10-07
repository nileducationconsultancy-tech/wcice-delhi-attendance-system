import axios from 'axios';

axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';
axios.defaults.withCredentials = true;

// Attach Bearer token from localStorage to support cross-domain deployments seamlessly
axios.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

import { usePopupStore } from '../store/popupStore';

axios.interceptors.response.use(
    response => response,
    error => {
        if (error.response && error.response.status === 409) {
            const msg = error.response.data?.message || 'Data conflict. Please refresh the page.';
            usePopupStore.getState().showAlert({
                title: 'Conflict Notice',
                message: msg,
                type: 'warning'
            });
        }
        return Promise.reject(error);
    }
);

export default axios;
