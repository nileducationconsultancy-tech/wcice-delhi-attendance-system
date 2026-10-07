const mongoose = require('mongoose');

const attendanceEventSchema = new mongoose.Schema({
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: String, required: true }, // Format: YYYY-MM-DD (Logical Shift Date)
    eventType: { type: String, enum: ['CHECK_IN', 'CHECK_OUT', 'BREAK_START', 'BREAK_END', 'SYSTEM_CHECKOUT', 'MANUAL_OVERRIDE'], required: true },
    timestamp: { type: Date, default: Date.now, required: true }, // UTC Server Time
    ipAddress: { type: String },
    deviceInfo: { type: String },
    
    // Geofencing Info
    latitude: { type: Number },
    longitude: { type: Number },
    accuracy: { type: Number }, // in meters
    distanceFromOffice: { type: Number }, // calculated on backend
    isVerifiedLocation: { type: Boolean, default: false },
    address: { type: String } // from Geoapify
});

module.exports = mongoose.model('AttendanceEvent', attendanceEventSchema);
