import apiClient from './client';

export const attendanceApi = {
    /**
     * Get today's attendance status, holiday info, and active punch record
     */
    getTodayStatus: async () => {
        const response = await apiClient.get('/api/attendance/today');
        return response.data;
    },

    /**
     * Perform GPS Check-In
     * @param {Object} coords - { latitude, longitude, accuracy }
     */
    checkIn: async (coords) => {
        const response = await apiClient.post('/api/attendance/check-in', coords);
        return response.data;
    },

    /**
     * Perform GPS Check-Out
     * @param {Object} coords - { latitude, longitude, accuracy }
     */
    checkOut: async (coords) => {
        const response = await apiClient.post('/api/attendance/check-out', coords);
        return response.data;
    },

    /**
     * Get monthly attendance history and summary
     * @param {number} year - YYYY
     * @param {number} month - 1-12
     */
    getMyAttendance: async (year, month) => {
        const response = await apiClient.get('/api/attendance/my', {
            params: { year, month }
        });
        return response.data;
    }
};

export default attendanceApi;
