const express = require('express');
const {
    checkIn,
    checkOut,
    getTodayStatus,
    getMyAttendance,
    getEmployeeAttendanceHistory,
    getAdminAttendanceOverview,
    getAttendanceReport,
    markManualAttendance
} = require('../controllers/attendanceController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

// Employee & Shared Endpoints
router.post('/check-in', protect, checkIn);
router.post('/check-out', protect, checkOut);
router.get('/today', protect, getTodayStatus);
router.get('/my', protect, getMyAttendance);

// Admin Endpoints
router.get('/employee/:id/history', protect, adminHR, getEmployeeAttendanceHistory);
router.get('/admin/overview', protect, adminHR, getAdminAttendanceOverview);
router.get('/report', protect, adminHR, getAttendanceReport);
router.post('/admin/manual-entry', protect, adminHR, markManualAttendance);

module.exports = router;
