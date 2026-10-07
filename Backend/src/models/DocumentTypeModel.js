const mongoose = require('mongoose');

const documentTypeSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    category: {
        type: String,
        required: true,
        enum: ['Identity', 'Employment', 'Banking', 'Education', 'Other'],
        default: 'Other'
    },
    isRequired: {
        type: Boolean,
        default: true
    },
    isActive: {
        type: Boolean,
        default: true
    },
    description: {
        type: String,
        default: ''
    },
    sortOrder: {
        type: Number,
        default: 0
    }
}, { timestamps: true });

// Indexes for fast category and active filtering
documentTypeSchema.index({ category: 1, isActive: 1 });
documentTypeSchema.index({ name: 1 });

module.exports = mongoose.model('DocumentType', documentTypeSchema);
