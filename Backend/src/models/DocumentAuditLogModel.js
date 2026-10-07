const mongoose = require('mongoose');

const documentAuditLogSchema = new mongoose.Schema({
    documentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'EmployeeDocument',
        index: true
    },
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: true,
        index: true
    },
    documentTypeName: {
        type: String,
        default: ''
    },
    action: {
        type: String,
        enum: ['UPLOAD', 'VERIFY', 'REJECT', 'RE_UPLOAD', 'DELETE', 'DOWNLOAD', 'VIEW'],
        required: true
    },
    performedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    performedByName: {
        type: String,
        default: 'System'
    },
    performedByRole: {
        type: String,
        default: 'SYSTEM'
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

documentAuditLogSchema.index({ employeeId: 1, timestamp: -1 });
documentAuditLogSchema.index({ documentId: 1, timestamp: -1 });

module.exports = mongoose.model('DocumentAuditLog', documentAuditLogSchema);
