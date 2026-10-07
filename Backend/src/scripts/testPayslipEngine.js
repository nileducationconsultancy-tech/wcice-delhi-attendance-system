const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config({ path: path.join(__dirname, '../../.env') });

const Employee = require('../models/EmployeeModel');
const Payslip = require('../models/PayslipModel');
const { generateSinglePayslip, generateBulkPayslips, calculatePayrollData } = require('../services/payrollService');
const { buildPayslipPDF } = require('../services/payslipPDFService');

async function testEngine() {
    console.log('🧪 Starting Payslip Engine Test...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');

    const month = 8;
    const year = 2026;

    // 1. Find an active test employee
    const employee = await Employee.findOne({ status: 'ACTIVE', role: { $nin: ['ADMIN', 'SUPER_ADMIN'] } });
    if (!employee) {
        console.log('⚠️ No active employee found for test');
        await mongoose.disconnect();
        return;
    }

    console.log(`👤 Testing with Employee: ${employee.name} (${employee.employeeId}) Base: ₹${employee.baseSalary}`);

    // 2. Test Single Payslip Generation
    console.log('▶️ Generating Single Payslip...');
    const payslip = await generateSinglePayslip(
        employee._id,
        month,
        year,
        { bonus: 500, incentive: 250, otherDeductions: 0, remarks: 'August Performance Bonus', paymentStatus: 'Processed' }
    );
    console.log('✅ Single Payslip Created/Updated:', {
        id: payslip._id,
        employeeName: payslip.employeeName,
        totalWorkingDays: payslip.totalWorkingDays,
        presentDays: payslip.presentDays,
        paidLeaveDays: payslip.paidLeaveDays,
        halfDays: payslip.halfDays,
        absentDays: payslip.absentDays,
        lateDays: payslip.lateDays,
        paidDays: payslip.paidDays,
        grossSalary: payslip.grossSalary,
        totalDeduction: payslip.totalDeduction,
        netSalary: payslip.netSalary,
        status: payslip.paymentStatus
    });

    // 3. Test Bulk Payslips Generation
    console.log('▶️ Generating Bulk Payslips for Month 8/2026...');
    const bulkResult = await generateBulkPayslips(month, year);
    console.log('✅ Bulk Payslips Result:', bulkResult);

    // 4. Test PDF Generation
    console.log('▶️ Building PDF buffer...');
    const pdfBuffer = await buildPayslipPDF(payslip);
    console.log(`✅ PDF Generated Successfully! Buffer size: ${pdfBuffer.length} bytes`);

    // Verify PDF header %PDF
    const pdfHeader = pdfBuffer.slice(0, 4).toString();
    console.log(`📄 PDF Header check: "${pdfHeader}" (Valid: ${pdfHeader === '%PDF'})`);

    await mongoose.disconnect();
    console.log('🎉 All Payslip Engine Tests Passed!');
}

testEngine().catch(err => {
    console.error('❌ Test Failed:', err);
    process.exit(1);
});
