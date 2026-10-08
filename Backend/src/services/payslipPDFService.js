const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

// Helper to format currency without unicode corruption in standard PDF fonts
const formatINR = (amount, decimals = 2) => {
    const num = Number(amount || 0);
    return 'Rs. ' + num.toLocaleString('en-IN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
};

/**
 * Builds a streamable PDF buffer for a payslip document using pdfkit
 */
const buildPayslipPDF = (payslip) => {
    return new Promise((resolve, reject) => {
        try {
            const doc = new PDFDocument({
                size: 'A4',
                margin: 40
            });

            const buffers = [];
            doc.on('data', buffers.push.bind(buffers));
            doc.on('end', () => {
                const pdfData = Buffer.concat(buffers);
                resolve(pdfData);
            });

            const monthName = monthNames[(payslip.month || 1) - 1] || 'Month';
            const year = payslip.year || new Date().getFullYear();

            // Colors
            const primaryColor = '#0F172A'; // Slate 900
            const accentColor = '#059669'; // Emerald 600
            const lightBg = '#F8FAFC'; // Slate 50
            const borderColor = '#E2E8F0'; // Slate 200
            const textColor = '#334155'; // Slate 700
            const mutedText = '#64748B'; // Slate 500

            // 1. TOP HEADER BANNER
            doc.rect(40, 40, 515, 68).fill(primaryColor);
            
            // Render Company Logo if exists
            const logoPath = path.join(__dirname, '../assets/logo.png');
            let textStartX = 55;
            if (fs.existsSync(logoPath)) {
                try {
                    doc.image(logoPath, 52, 48, { fit: [50, 50] });
                    textStartX = 112; // Shift title to make room for logo
                } catch (imgErr) {
                    console.error('Error rendering logo in PDF:', imgErr);
                }
            }

            doc.fillColor('#FFFFFF')
               .fontSize(16)
               .font('Helvetica-Bold')
               .text('WECICE DELHI', textStartX, 52);
            
            doc.fontSize(8.5)
               .font('Helvetica')
               .fillColor('#94A3B8')
               .text('Attendance & Payroll Management System', textStartX, 73);

            doc.fillColor('#34D399')
               .fontSize(11.5)
               .font('Helvetica-Bold')
               .text('SALARY PAYSLIP', 390, 53, { align: 'right', width: 150 });

            doc.fillColor('#FFFFFF')
               .fontSize(9.5)
               .font('Helvetica')
               .text(`${monthName} ${year}`, 390, 71, { align: 'right', width: 150 });

            let y = 122;

            // 2. EMPLOYEE DETAILS SECTION
            doc.rect(40, y, 515, 75).fill(lightBg).stroke(borderColor);

            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('EMPLOYEE DETAILS', 55, y + 10);
            
            doc.fillColor(mutedText).fontSize(8.5).font('Helvetica').text('Employee Name:', 55, y + 28);
            doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text(payslip.employeeName || 'N/A', 140, y + 28);

            doc.fillColor(mutedText).fontSize(8.5).font('Helvetica').text('Employee ID:', 55, y + 44);
            doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text(payslip.employeeId || 'N/A', 140, y + 44);

            doc.fillColor(mutedText).fontSize(8.5).font('Helvetica').text('Designation:', 300, y + 28);
            doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text(payslip.designation || 'Staff', 375, y + 28);

            doc.fillColor(mutedText).fontSize(8.5).font('Helvetica').text('Work Schedule:', 300, y + 44);
            doc.fillColor(textColor).fontSize(9).font('Helvetica-Bold').text(payslip.workSchedule === '5_DAYS' ? '5 Days (Mon-Fri)' : '6 Days (Mon-Sat)', 375, y + 44);

            doc.fillColor(mutedText).fontSize(8.5).font('Helvetica').text('Payment Status:', 300, y + 60);
            const statusColor = payslip.paymentStatus === 'Paid' ? '#059669' : (payslip.paymentStatus === 'Processed' ? '#2563EB' : '#D97706');
            doc.fillColor(statusColor).fontSize(9).font('Helvetica-Bold').text(payslip.paymentStatus || 'Pending', 375, y + 60);

            y += 90;

            // 3. ATTENDANCE BREAKDOWN SECTION
            doc.rect(40, y, 515, 65).fill(lightBg).stroke(borderColor);

            doc.fillColor(primaryColor).fontSize(10).font('Helvetica-Bold').text('ATTENDANCE SUMMARY', 55, y + 8);

            const totalMonthDays = new Date(year, payslip.month, 0).getDate();
            const totalPaidOffs = (payslip.weeklyOffDays || 0) + (payslip.holidayDays || 0);

            const attendanceItems = [
                { label: 'Month Days', value: totalMonthDays },
                { label: 'Office Days', value: payslip.totalWorkingDays || 0 },
                { label: 'Paid Offs', value: totalPaidOffs },
                { label: 'Present', value: payslip.presentDays || 0 },
                { label: 'Paid Leave', value: payslip.paidLeaveDays || 0 },
                { label: 'Half Days', value: payslip.halfDays || 0 },
                { label: 'Absent', value: payslip.absentDays || 0 },
                { label: 'Paid Days', value: payslip.paidDays || 0 }
            ];

            const colWidth = 515 / attendanceItems.length;
            attendanceItems.forEach((item, idx) => {
                const colX = 40 + (idx * colWidth);
                doc.fillColor(mutedText).fontSize(7.2).font('Helvetica').text(item.label, colX, y + 26, { align: 'center', width: colWidth });
                doc.fillColor(item.label === 'Paid Days' ? accentColor : (item.label === 'Absent' ? '#DC2626' : textColor))
                   .fontSize(9.5)
                   .font('Helvetica-Bold')
                   .text(String(item.value), colX, y + 42, { align: 'center', width: colWidth });
            });

            y += 80;

            // 4. EARNINGS & DEDUCTIONS TABLE (2 Columns)
            const tableWidth = 250;
            const leftColX = 40;
            const rightColX = 305;

            // Earnings Header
            doc.rect(leftColX, y, tableWidth, 22).fill('#ECFDF5').stroke('#A7F3D0');
            doc.fillColor('#065F46').fontSize(9).font('Helvetica-Bold').text('EARNINGS', leftColX + 10, y + 6);
            doc.text('AMOUNT', leftColX + 150, y + 6, { align: 'right', width: 90 });

            // Deductions Header
            doc.rect(rightColX, y, tableWidth, 22).fill('#FFF1F2').stroke('#FECDD3');
            doc.fillColor('#9F1239').fontSize(9).font('Helvetica-Bold').text('DEDUCTIONS', rightColX + 10, y + 6);
            doc.text('AMOUNT', rightColX + 150, y + 6, { align: 'right', width: 90 });

            y += 22;

            // Rows
            const earnings = [
                { label: 'Basic Monthly Salary', amount: payslip.monthlySalary || 0 },
                { label: 'Bonus', amount: payslip.bonus || 0 },
                { label: 'Incentive / Allowance', amount: payslip.incentive || 0 },
                { label: 'Per Day Salary Rate', amount: payslip.perDaySalary || 0, isRate: true }
            ];

            const deductions = [
                { label: `Absent Deduction (${payslip.absentDays || 0}d - PL)`, amount: payslip.absentDeduction || 0 },
                { label: `Half-Day Deduction (${payslip.halfDays || 0}d @ 50%)`, amount: payslip.halfDayDeduction || 0 },
                { label: 'Other Deductions / Advance', amount: payslip.otherDeductions || 0 }
            ];

            const maxRows = Math.max(earnings.length, deductions.length);
            const rowHeight = 22;

            for (let i = 0; i < maxRows; i++) {
                const rowY = y + (i * rowHeight);
                
                // Left box row
                doc.rect(leftColX, rowY, tableWidth, rowHeight).fill(i % 2 === 0 ? '#FFFFFF' : '#F8FAFC').stroke(borderColor);
                const earn = earnings[i];
                if (earn) {
                    doc.fillColor(earn.isRate ? mutedText : textColor).fontSize(8.5).font('Helvetica').text(earn.label, leftColX + 10, rowY + 6);
                    doc.fillColor(earn.isRate ? mutedText : textColor).fontSize(8.5).font('Helvetica-Bold').text(formatINR(earn.amount), leftColX + 120, rowY + 6, { align: 'right', width: 120 });
                }

                // Right box row
                doc.rect(rightColX, rowY, tableWidth, rowHeight).fill(i % 2 === 0 ? '#FFFFFF' : '#F8FAFC').stroke(borderColor);
                const ded = deductions[i];
                if (ded) {
                    doc.fillColor(textColor).fontSize(8.5).font('Helvetica').text(ded.label, rightColX + 10, rowY + 6);
                    doc.fillColor(ded.amount > 0 ? '#DC2626' : mutedText).fontSize(8.5).font('Helvetica-Bold').text(formatINR(ded.amount), rightColX + 120, rowY + 6, { align: 'right', width: 120 });
                }
            }

            y += (maxRows * rowHeight);

            // Subtotals
            doc.rect(leftColX, y, tableWidth, 24).fill('#E2E8F0').stroke(borderColor);
            doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('GROSS EARNINGS', leftColX + 10, y + 7);
            doc.text(formatINR(payslip.grossSalary), leftColX + 120, y + 7, { align: 'right', width: 120 });

            doc.rect(rightColX, y, tableWidth, 24).fill('#E2E8F0').stroke(borderColor);
            doc.fillColor(primaryColor).fontSize(8.5).font('Helvetica-Bold').text('TOTAL DEDUCTIONS', rightColX + 10, y + 7);
            doc.fillColor('#DC2626').text(formatINR(payslip.totalDeduction), rightColX + 120, y + 7, { align: 'right', width: 120 });

            y += 35;

            // 5. NET SALARY HIGHLIGHT BOX
            doc.rect(40, y, 515, 52).fill('#064E3B').stroke('#047857');
            
            doc.fillColor('#A7F3D0')
               .fontSize(9.5)
               .font('Helvetica-Bold')
               .text('NET TAKE-HOME PAY (AFTER DEDUCTIONS)', 55, y + 12);

            doc.fillColor('#FFFFFF')
               .fontSize(17)
               .font('Helvetica-Bold')
               .text(formatINR(payslip.netSalary), 300, y + 16, { align: 'right', width: 240 });

            doc.fillColor('#D1FAE5')
               .fontSize(8)
               .font('Helvetica')
               .text(`Paid Attendance: ${payslip.paidDays || 0} Days | Monthly Salary: ${formatINR(payslip.monthlySalary, 0)}`, 55, y + 32);

            y += 65;

            // 6. REMARKS (If any)
            if (payslip.remarks) {
                doc.rect(40, y, 515, 24).fill(lightBg).stroke(borderColor);
                doc.fillColor(mutedText).fontSize(7.5).font('Helvetica-Bold').text('REMARKS:', 50, y + 6);
                doc.fillColor(textColor).fontSize(8).font('Helvetica').text(payslip.remarks, 105, y + 6);
                y += 32;
            }

            // 7. SIGNATURES SECTION (Employee Signature on Left, Authorized Signature on Right)
            const sigY = Math.max(y, 635);
            
            // Left: Employee signature line
            doc.strokeColor(borderColor).moveTo(55, sigY + 50).lineTo(195, sigY + 50).stroke();
            doc.fillColor(mutedText).fontSize(8).font('Helvetica').text('Employee Signature', 55, sigY + 56, { width: 140, align: 'center' });

            // Right: Official Authorized Signatory Stamp / Signature
            const signaturePath = path.join(__dirname, '../assets/signature.png');
            if (fs.existsSync(signaturePath)) {
                try {
                    doc.image(signaturePath, 370, sigY - 10, { width: 165 });
                } catch (imgErr) {
                    console.error('Error rendering signature image in PDF:', imgErr);
                }
            } else {
                doc.strokeColor(borderColor).moveTo(380, sigY + 50).lineTo(520, sigY + 50).stroke();
                doc.fillColor(mutedText).fontSize(8).font('Helvetica').text('Authorised Signatory', 380, sigY + 56, { width: 140, align: 'center' });
            }

            // 8. FOOTER
            doc.fontSize(7.5)
               .fillColor(mutedText)
               .font('Helvetica')
               .text('This is a computer-generated payslip verified by WECICE Delhi.', 40, 752, { align: 'center', width: 515 });

            doc.fontSize(7)
               .text(`Generated on ${new Date(payslip.generatedAt || Date.now()).toLocaleDateString('en-IN')} | WECICE Delhi Attendance & Payroll System`, 40, 764, { align: 'center', width: 515 });

            doc.end();
        } catch (error) {
            reject(error);
        }
    });
};

module.exports = { buildPayslipPDF };
