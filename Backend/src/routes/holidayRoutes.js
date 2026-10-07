const express = require('express');
const { getHolidays, createHoliday, updateHoliday, deleteHoliday } = require('../controllers/holidayController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getHolidays);
router.post('/', protect, adminHR, createHoliday);
router.put('/:id', protect, adminHR, updateHoliday);
router.delete('/:id', protect, adminHR, deleteHoliday);

module.exports = router;
