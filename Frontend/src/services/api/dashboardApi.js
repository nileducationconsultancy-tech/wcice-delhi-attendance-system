import client from './client';

export const dashboardApi = {
    getAdminStats: () => client.get('/api/dashboard/stats'),
    getEmployeeStats: () => client.get('/api/dashboard/employee')
};
