const mongoose = require('mongoose');

const employeeDocumentSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },
    documentTypeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DocumentType',
        required: true,
        index: true
    },
    documentTypeName: {
        type: String,
        required: true
    },
    category: {
        type: String,
        enum: ['Identity', 'Employment', 'Banking', 'Education', 'Other'],
        required: true
    },
    fileName: {
        type: String,
        required: true
    },
    fileKey: {
        type: String,
        required: true
    },
    fileUrl: {
        type: String,
        default: ''
    },
    fileType: {
        type: String,
        required: true
    },
    fileSize: {
        type: Number,
        required: true
    },
    storageProvider: {
        type: String,
        enum: ['SUPABASE', 'LOCAL'],
        default: 'SUPABASE'
    },
    status: {
        type: String,
        enum: ['PENDING_VERIFICATION', 'VERIFIED', 'REJECTED'],
        default: 'PENDING_VERIFICATION',
        index: true
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    uploadedByRole: {
        type: String,
        enum: ['SUPER_ADMIN', 'ADMIN', 'HR', 'EMPLOYEE', 'MANAGER'],
        default: 'EMPLOYEE'
    },
    uploadedByName: {
        type: String,
        default: ''
    },
    uploadSource: {
        type: String,
        enum: ['EMAIL', 'MANUAL_HR', 'EMPLOYEE_PORTAL'],
        default: 'MANUAL_HR'
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    },
    verifiedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    verifiedByName: {
        type: String,
        default: ''
    },
    verifiedAt: {
        type: Date
    },
    rejectionReason: {
        type: String,
        default: ''
    },
    notes: {
        type: String,
        default: ''
    }
}, { timestamps: true });

// Compound indexes for high performance querying
employeeDocumentSchema.index({ employeeId: 1, documentTypeId: 1 });
employeeDocumentSchema.index({ status: 1, createdAt: -1 });
employeeDocumentSchema.index({ category: 1 });

module.exports = mongoose.model('EmployeeDocument', employeeDocumentSchema);
