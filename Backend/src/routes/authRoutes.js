const express = require('express');
const { registerUser, loginUser, approveUser, logoutUser, getMe, changePassword, resetPassword } = require('../controllers/authController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.put('/approve/:id', protect, adminHR, approveUser);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);
router.put('/change-password', protect, changePassword);
router.post('/reset-password', resetPassword);

module.exports = router;
