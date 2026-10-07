const express = require('express');
const { getAdminDashboardStats, getEmployeeDashboardStats } = require('../controllers/dashboardController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/admin', protect, adminHR, getAdminDashboardStats);
router.get('/employee', protect, getEmployeeDashboardStats);

module.exports = router;
