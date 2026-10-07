const mongoose = require('mongoose');

const holidaySchema = new mongoose.Schema({
    name: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    type: { 
        type: String, 
        enum: ['National Holiday', 'Company Holiday', 'Optional Holiday', 'Festival Working Day'], 
        default: 'Company Holiday' 
    },
    isWorkingDay: { type: Boolean, default: false }, // true if office is open (e.g. Festival Working Day)
    grantFullDayOnCheckIn: { type: Boolean, default: true }, // true to mark any check-in as PRESENT (full day)
    customCutoffTime: { type: String, default: null }, // optional custom cutoff (e.g. '14:00')
    description: { type: String },
    isActive: { type: Boolean, default: true }
}, { timestamps: true, optimisticConcurrency: true });

holidaySchema.index({ date: 1 }, { unique: true });

module.exports = mongoose.model('Holiday', holidaySchema);
