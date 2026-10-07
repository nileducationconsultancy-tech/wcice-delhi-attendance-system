import apiClient from './client';
import { API_BASE_URL } from '../constants/config';
import storage from '../utils/storage';

export const payslipApi = {
    /**
     * Get employee's own published payslips history
     */
    getMyPayslips: async () => {
        const response = await apiClient.get('/api/payslips/my/history');
        return response.data;
    },

    /**
     * Get direct download/preview URL for a payslip PDF (Employee)
     */
    getPdfDownloadUrl: async (payslipId) => {
        const token = (await storage.getToken?.()) || (await storage.getItem?.('token')) || '';
        return `${API_BASE_URL}/api/payslips/my/${payslipId}/pdf?token=${encodeURIComponent(token || '')}`;
    },

    /**
     * [ADMIN/HR] Get company-wide payslips with month/year/search filters
     */
    getAdminPayslips: async (params = {}) => {
        const response = await apiClient.get('/api/admin/payslips', { params });
        return response.data;
    },

    /**
     * [ADMIN/HR] Generate payslips for all active employees for a given month/year
     */
    generateBulkPayslips: async (month, year) => {
        const response = await apiClient.post('/api/admin/payslips/generate-all', { month, year });
        return response.data;
    },

    /**
     * [ADMIN/HR] Generate single employee payslip
     */
    generateSinglePayslip: async (employeeId, month, year, manualAdjustments = {}) => {
        const response = await apiClient.post('/api/admin/payslips/generate', {
            employeeId,
            month,
            year,
            manualAdjustments
        });
        return response.data;
    },

    /**
     * [ADMIN/HR] Regenerate payslip from updated attendance logs
     */
    regeneratePayslip: async (payslipId) => {
        const response = await apiClient.put(`/api/admin/payslips/${payslipId}/regenerate`);
        return response.data;
    },

    /**
     * [ADMIN/HR] Update payslip adjustments & payment status
     */
    updatePayslip: async (payslipId, payload) => {
        const response = await apiClient.put(`/api/admin/payslips/${payslipId}`, payload);
        return response.data;
    },

    /**
     * [ADMIN/HR] Delete payslip
     */
    deletePayslip: async (payslipId) => {
        const response = await apiClient.delete(`/api/admin/payslips/${payslipId}`);
        return response.data;
    },

    /**
     * [ADMIN/HR] Get Admin download URL for PDF
     */
    getAdminPdfDownloadUrl: async (payslipId) => {
        const token = (await storage.getToken?.()) || (await storage.getItem?.('token')) || '';
        return `${API_BASE_URL}/api/admin/payslips/${payslipId}/pdf?token=${encodeURIComponent(token || '')}`;
    },

    /**
     * [ADMIN/HR] Get real-time live attendance-based payroll calculation for all staff
     */
    getLivePayrollOverview: async (month, year) => {
        const response = await apiClient.get('/api/payroll', {
            params: { month, year }
        });
        return response.data;
    },

    /**
     * Get employee's own real-time live attendance-based payroll calculation
     */
    getMyLivePayroll: async (month, year) => {
        const response = await apiClient.get('/api/payroll/my', {
            params: { month, year }
        });
        return response.data;
    }
};

export default payslipApi;
