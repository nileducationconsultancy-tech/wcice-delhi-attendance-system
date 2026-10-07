const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, adminHR, getSettings);
router.put('/', protect, adminHR, updateSettings);

module.exports = router;
