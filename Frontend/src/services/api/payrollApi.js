import client from './client';

export const payrollApi = {
    getMonthly: (params = {}) => client.get('/api/payroll', { params }),
    downloadPayslip: (employeeId, params = {}) => 
        client.get(`/api/payroll/payslip/${employeeId}`, { 
            params, 
            responseType: 'blob' 
        })
};
