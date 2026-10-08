const mongoose = require('mongoose');

const policySchema = new mongoose.Schema({
    companyName: { type: String, default: 'WECICE Delhi' },
    workStartTime: { type: String, default: '11:00' }, // 11:00 AM
    workEndTime: { type: String, default: '18:00' },   // 6:00 PM
    halfDayCutoffTime: { type: String, default: '14:00' }, // 2:00 PM
    workingDays: { 
        type: [String], 
        default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] 
    },
    timezone: { type: String, default: 'Asia/Kolkata' },
    
    // Geofencing Settings
    geofenceEnabled: { type: Boolean, default: true },
    officeLatitude: { type: Number, default: 28.6139 },
    officeLongitude: { type: Number, default: 77.2090 },
    attendanceRadius: { type: Number, default: 500 }, // in meters
    maxGpsAccuracy: { type: Number, default: 150 }
}, { timestamps: true });

module.exports = mongoose.model('Policy', policySchema);
