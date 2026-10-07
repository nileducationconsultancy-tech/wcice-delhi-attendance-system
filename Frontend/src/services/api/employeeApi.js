import client from './client';

export const employeeApi = {
    getAll: (params = {}) => client.get('/api/employees', { params }),
    getById: (id) => client.get(`/api/employees/${id}`),
    create: (data) => client.post('/api/employees', data),
    update: (id, data) => client.put(`/api/employees/${id}`, data),
    delete: (id) => client.delete(`/api/employees/${id}`)
};
