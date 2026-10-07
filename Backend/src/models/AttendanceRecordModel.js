const mongoose = require('mongoose');

const attendanceRecordSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // YYYY-MM-DD (IST)
    firstIn: { type: Date },
    lastOut: { type: Date },
    checkInAddress: { type: String },
    checkOutAddress: { type: String },
    checkInLocation: {
        latitude: Number,
        longitude: Number,
        accuracy: Number,
        distanceFromOffice: Number
    },
    checkOutLocation: {
        latitude: Number,
        longitude: Number,
        accuracy: Number,
        distanceFromOffice: Number
    },
    status: { 
        type: String, 
        enum: ['PRESENT', 'HALF_DAY', 'ABSENT', 'HOLIDAY', 'SUNDAY'], 
        default: 'ABSENT' 
    },
    totalWorkingMinutes: { type: Number, default: 0 },
    workingHoursFormatted: { type: String, default: '0h 0m' },
    isManualEntry: { type: Boolean, default: false },
    manualRemarks: { type: String, default: '' },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

// Indexes for maximum query performance
attendanceRecordSchema.index({ employeeId: 1, date: 1 }, { unique: true });
attendanceRecordSchema.index({ date: 1 });
attendanceRecordSchema.index({ date: 1, status: 1 });
attendanceRecordSchema.index({ employeeId: 1, createdAt: -1 });

module.exports = mongoose.model('AttendanceRecord', attendanceRecordSchema);
