const mongoose = require('mongoose');

const payslipSchema = new mongoose.Schema({
    employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true
    },
    employeeId: {
        type: String,
        required: true
    },
    month: {
        type: Number,
        required: true,
        min: 1,
        max: 12
    },
    year: {
        type: Number,
        required: true
    },
    employeeName: {
        type: String,
        required: true
    },
    designation: {
        type: String,
        default: 'Staff'
    },
    department: {
        type: String,
        default: 'General'
    },
    workSchedule: {
        type: String,
        enum: ['5_DAYS', '6_DAYS'],
        default: '6_DAYS'
    },
    monthlySalary: {
        type: Number,
        required: true,
        min: 0
    },
    totalWorkingDays: {
        type: Number,
        required: true,
        default: 0
    },
    presentDays: {
        type: Number,
        default: 0
    },
    absentDays: {
        type: Number,
        default: 0
    },
    paidLeaveDays: {
        type: Number,
        default: 0
    },
    halfDays: {
        type: Number,
        default: 0
    },
    holidayDays: {
        type: Number,
        default: 0
    },
    weeklyOffDays: {
        type: Number,
        default: 0
    },
    lateDays: {
        type: Number,
        default: 0
    },
    onTimeDays: {
        type: Number,
        default: 0
    },
    paidDays: {
        type: Number,
        required: true,
        default: 0
    },
    perDaySalary: {
        type: Number,
        required: true,
        default: 0
    },
    absentDeduction: {
        type: Number,
        default: 0
    },
    halfDayDeduction: {
        type: Number,
        default: 0
    },
    lateDeduction: {
        type: Number,
        default: 0
    },
    otherDeductions: {
        type: Number,
        default: 0
    },
    bonus: {
        type: Number,
        default: 0
    },
    incentive: {
        type: Number,
        default: 0
    },
    remarks: {
        type: String,
        default: ''
    },
    grossSalary: {
        type: Number,
        required: true,
        default: 0
    },
    totalDeduction: {
        type: Number,
        required: true,
        default: 0
    },
    netSalary: {
        type: Number,
        required: true,
        default: 0
    },
    paymentStatus: {
        type: String,
        enum: ['Pending', 'Processed', 'Paid'],
        default: 'Pending'
    },
    generatedAt: {
        type: Date,
        default: Date.now
    },
    generatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Ensure an employee cannot have duplicate payslips for the same month and year
payslipSchema.index({ employee: 1, month: 1, year: 1 }, { unique: true });
payslipSchema.index({ month: 1, year: 1 });
payslipSchema.index({ paymentStatus: 1 });
payslipSchema.index({ employeeId: 1, month: 1, year: 1 });

module.exports = mongoose.model('Payslip', payslipSchema);
