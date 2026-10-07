const express = require('express');
const { getPayrollOverview, getMyPayroll } = require('../controllers/payrollController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, adminHR, getPayrollOverview);
router.get('/my', protect, getMyPayroll);

module.exports = router;
