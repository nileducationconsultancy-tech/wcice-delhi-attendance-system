import client from './client';

export const payslipApi = {
    getAll: (params = {}) => client.get('/api/admin/payslips', { params }),
    getById: (id) => client.get(`/api/admin/payslips/${id}`),
    generate: (data) => client.post('/api/admin/payslips/generate', data),
    generateAll: (data) => client.post('/api/admin/payslips/generate-all', data),
    regenerate: (id, data = {}) => client.put(`/api/admin/payslips/${id}/regenerate`, data),
    update: (id, data) => client.put(`/api/admin/payslips/${id}`, data),
    delete: (id) => client.delete(`/api/admin/payslips/${id}`),
    downloadPDF: (id) => client.get(`/api/admin/payslips/${id}/pdf`, { responseType: 'blob' }),
    
    // Employee self-service
    getMyHistory: () => client.get('/api/payslips/my/history'),
    downloadMyPDF: (id) => client.get(`/api/payslips/my/${id}/pdf`, { responseType: 'blob' })
};
