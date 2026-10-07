import apiClient from './client';
import { API_BASE_URL } from '../constants/config';
import storage from '../utils/storage';

export const documentApi = {
    /**
     * Get employee's own documents and verification matrix
     */
    getMyDocuments: async () => {
        const response = await apiClient.get('/api/documents/my');
        return response.data;
    },

    /**
     * Get active document types configured in system
     */
    getDocumentTypes: async () => {
        const response = await apiClient.get('/api/document-types');
        return response.data;
    },

    /**
     * Upload a new employee document
     * @param {FormData} formData
     */
    uploadDocument: async (formData) => {
        const response = await apiClient.post('/api/documents/upload', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        return response.data;
    },

    /**
     * Get signed URL for previewing/downloading a document file
     */
    getSignedUrl: async (documentId) => {
        const response = await apiClient.get(`/api/documents/${documentId}/signed-url`);
        return response.data;
    },

    /**
     * Get authenticated stream URL for a document file
     */
    getFileStreamUrl: async (documentId) => {
        const token = await storage.getItem('token');
        return `${API_BASE_URL}/api/documents/${documentId}/stream?token=${encodeURIComponent(token || '')}`;
    },

    /**
     * [ADMIN/HR] Get all company documents with filtering
     */
    getAllCompanyDocuments: async (params = {}) => {
        const response = await apiClient.get('/api/documents/admin/all', { params });
        return response.data;
    },

    /**
     * [ADMIN/HR] Get document statistics overview
     */
    getDocumentStats: async () => {
        const response = await apiClient.get('/api/documents/stats/overview');
        return response.data;
    },

    /**
     * [ADMIN/HR] Verify / Accept an uploaded employee document
     */
    verifyDocument: async (documentId) => {
        const response = await apiClient.put(`/api/documents/${documentId}/verify`);
        return response.data;
    },

    /**
     * [ADMIN/HR] Reject an uploaded employee document with mandatory reason
     */
    rejectDocument: async (documentId, rejectionReason) => {
        const response = await apiClient.put(`/api/documents/${documentId}/reject`, { rejectionReason });
        return response.data;
    },

    /**
     * [ADMIN/HR] Delete a document record
     */
    deleteDocument: async (documentId) => {
        const response = await apiClient.delete(`/api/documents/${documentId}`);
        return response.data;
    }
};

export default documentApi;
