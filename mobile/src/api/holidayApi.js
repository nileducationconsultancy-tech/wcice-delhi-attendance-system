import apiClient from './client';

export const holidayApi = {
    /**
     * Get list of holidays for a specific year
     * @param {number} year - YYYY
     * @param {number} month - 1-12 (optional)
     */
    getHolidays: async (year, month) => {
        const params = {};
        if (year) params.year = year;
        if (month) params.month = String(month);
        const response = await apiClient.get('/api/holidays', { params });
        return response.data;
    },

    /**
     * Create a new holiday (Admin / HR)
     * @param {Object} holidayData
     */
    createHoliday: async (holidayData) => {
        const response = await apiClient.post('/api/holidays', holidayData);
        return response.data;
    },

    /**
     * Update an existing holiday (Admin / HR)
     * @param {string} id
     * @param {Object} holidayData
     */
    updateHoliday: async (id, holidayData) => {
        const response = await apiClient.put(`/api/holidays/${id}`, holidayData);
        return response.data;
    },

    /**
     * Delete a holiday (Admin / HR)
     * @param {string} id
     */
    deleteHoliday: async (id) => {
        const response = await apiClient.delete(`/api/holidays/${id}`);
        return response.data;
    }
};

export default holidayApi;
