const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
    month: { type: Number, required: true }, // 1-12
    year: { type: Number, required: true },
    status: { type: String, enum: ['DRAFT', 'LOCKED'], default: 'DRAFT' },
    totalExpense: { type: Number, default: 0 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lockedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lockedAt: { type: Date }
}, { timestamps: true, optimisticConcurrency: true });

// Ensure only one payroll per month/year
payrollSchema.index({ month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);
