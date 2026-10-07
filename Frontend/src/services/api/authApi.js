import client from './client';

export const authApi = {
    login: (email, password) => client.post('/api/auth/login', { email, password }),
    getMe: () => client.get('/api/auth/me'),
    logout: () => client.post('/api/auth/logout'),
    changePassword: (data) => client.put('/api/auth/change-password', data),
    resetPassword: (data) => client.post('/api/auth/reset-password', data)
};
