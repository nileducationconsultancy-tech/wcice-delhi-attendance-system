import apiClient from './client';

export const adminApi = {
    /**
     * Get live admin dashboard metrics, attendance rates, and recent feed
     */
    getDashboardStats: async () => {
        const response = await apiClient.get('/api/dashboard/admin');
        return response.data;
    },

    /**
     * Get live employee attendance overview for specific date
     * @param {string} date - 'YYYY-MM-DD'
     */
    getAttendanceOverview: async (date) => {
        const response = await apiClient.get('/api/attendance/admin/overview', {
            params: date ? { date } : {}
        });
        return response.data;
    },

    /**
     * Get all active company employees
     */
    getAllEmployees: async () => {
        const response = await apiClient.get('/api/employees');
        return response.data;
    },

    /**
     * Get company-wide documents overview
     */
    getCompanyDocuments: async (params) => {
        const response = await apiClient.get('/api/documents/admin/all', { params });
        return response.data;
    },

    /**
     * Get company-wide payslips
     */
    getPayslipsOverview: async () => {
        const response = await apiClient.get('/api/payslips');
        return response.data;
    },

    /**
     * Get specific employee attendance history for month & year
     * @param {string} employeeId
     * @param {number} year
     * @param {number} month
     */
    getEmployeeAttendanceHistory: async (employeeId, year, month) => {
        const response = await apiClient.get(`/api/attendance/employee/${employeeId}/history`, {
            params: { year, month }
        });
        return response.data;
    },

    /**
     * Get automatically computed next sequential employee ID based on database records
     */
    getNextEmployeeId: async () => {
        const response = await apiClient.get('/api/employees/next-id');
        return response.data;
    },

    /**
     * Create / Register a new employee
     * @param {Object} employeeData
     */
    createEmployee: async (employeeData) => {
        const response = await apiClient.post('/api/employees', employeeData);
        return response.data;
    },

    /**
     * Update employee details
     * @param {string} id
     * @param {Object} employeeData
     */
    updateEmployee: async (id, employeeData) => {
        const response = await apiClient.put(`/api/employees/${id}`, employeeData);
        return response.data;
    },

    /**
     * Get specific employee profile & user details
     * @param {string} id
     */
    getEmployeeDetails: async (id) => {
        const response = await apiClient.get(`/api/employees/${id}`);
        return response.data;
    },

    /**
     * Delete an employee
     * @param {string} id
     */
    deleteEmployee: async (id) => {
        const response = await apiClient.delete(`/api/employees/${id}`);
        return response.data;
    }
};

export default adminApi;
