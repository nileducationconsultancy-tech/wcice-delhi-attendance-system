import client from './client';

export const authApi = {
    /**
     * Authenticate user with email and password
     */
    login: (credentials) => client.post('/api/auth/login', credentials),

    /**
     * Fetch currently authenticated employee/user profile
     */
    getMe: () => client.get('/api/auth/me'),

    /**
     * Upload profile picture to Supabase
     */
    uploadProfilePicture: (formData) =>
        client.post('/api/employees/profile-picture', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        }),

    /**
     * Change password
     */
    changePassword: (data) => client.put('/api/auth/change-password', data),

    /**
     * Logout session
     */
    logout: () => client.post('/api/auth/logout')
};

export default authApi;
