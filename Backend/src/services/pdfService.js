const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const os = require('os');

const generateSalarySlipPDF = async (slip, employee) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({ margin: 50 });
            const slipsDir = process.env.VERCEL
                ? path.join(os.tmpdir(), 'slips')
                : path.join(__dirname, '../../slips');
            
            if (!fs.existsSync(slipsDir)) {
                fs.mkdirSync(slipsDir, { recursive: true });
            }
            
            const filePath = path.join(slipsDir, `slip_${slip._id}.pdf`);
            const writeStream = fs.createWriteStream(filePath);
            
            doc.pipe(writeStream);
            
            // Header
            doc.fontSize(20).text('WECICE Delhi Attendance System', { align: 'center' });
            doc.moveDown();
            doc.fontSize(16).text('Salary Slip', { align: 'center' });
            doc.moveDown(2);
            
            // Employee Info
            doc.fontSize(12).text(`Employee Name: ${employee.name}`);
            doc.text(`Department: ${employee.department || 'N/A'}`);
            doc.text(`Designation: ${employee.designation || 'N/A'}`);
            doc.moveDown();
            
            // Salary Details
            doc.text(`Base Salary: ${slip.baseSalary.toFixed(2)}`);
            doc.text(`Total Days: ${slip.totalDays}`);
            doc.text(`Present Days: ${slip.presentDays}`);
            doc.text(`Absent Days: ${slip.absentDays}`);
            doc.text(`Half Days: ${slip.halfDays}`);
            doc.moveDown();
            
            // Deductions & Net Pay
            doc.text(`Total Deductions: ${slip.deductions.toFixed(2)}`, { stroke: true });
            doc.moveDown();
            doc.fontSize(14).text(`NET PAY: ${slip.netPay.toFixed(2)}`, { underline: true, bold: true });
            
            doc.end();
            
            writeStream.on('finish', () => resolve(filePath));
            writeStream.on('error', reject);
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { generateSalarySlipPDF };
