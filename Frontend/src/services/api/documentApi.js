import client from './client';

export const documentApi = {
    // Document Types
    getDocumentTypes: () => client.get('/api/document-types'),
    createDocumentType: (data) => client.post('/api/document-types', data),
    updateDocumentType: (id, data) => client.put(`/api/document-types/${id}`, data),
    deleteDocumentType: (id) => client.delete(`/api/document-types/${id}`),

    // Document Matrix & Queries
    getEmployeeDocuments: (employeeId) => client.get(`/api/documents/employee/${employeeId}`),
    getMyDocuments: () => client.get('/api/documents/my'),
    getDocumentStatsOverview: () => client.get('/api/documents/stats/overview'),
    getAllCompanyDocuments: (params) => client.get('/api/documents/admin/all', { params }),

    // Upload / Verification Actions
    uploadDocument: (formData, onUploadProgress) => client.post('/api/documents/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress
    }),
    verifyDocument: (id) => client.put(`/api/documents/${id}/verify`),
    rejectDocument: (id, rejectionReason) => client.put(`/api/documents/${id}/reject`, { rejectionReason }),
    deleteDocument: (id) => client.delete(`/api/documents/${id}`),

    // Signed URLs & Preview
    getDocumentSignedUrl: (id) => client.get(`/api/documents/${id}/signed-url`)
};
