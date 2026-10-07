import client from './client';

export const holidayApi = {
    getAll: (params = {}) => client.get('/api/holidays', { params }),
    create: (data) => client.post('/api/holidays', data),
    update: (id, data) => client.put(`/api/holidays/${id}`, data),
    delete: (id) => client.delete(`/api/holidays/${id}`)
};
