import client from './client';

export const attendanceApi = {
    getTodayStatus: () => client.get('/api/attendance/today'),
    checkIn: (data) => client.post('/api/attendance/check-in', data),
    checkOut: (data) => client.post('/api/attendance/check-out', data),
    getMyHistory: (params = {}) => client.get('/api/attendance/my', { params }),
    getEmployeeHistory: (id, params = {}) => client.get(`/api/attendance/employee/${id}/history`, { params }),
    getAdminOverview: (params = {}) => client.get('/api/attendance/admin/overview', { params }),
    getReports: (params = {}) => client.get('/api/attendance/reports', { params }),
    markManual: (data) => client.post('/api/attendance/admin/manual-entry', data)
};
