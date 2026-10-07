const express = require('express');
const {
    getPayslips,
    getPayslipById,
    generatePayslip,
    generateAllPayslips,
    regeneratePayslip,
    updatePayslip,
    deletePayslip,
    downloadPayslipPDF,
    getMyPayslips,
    downloadMyPayslipPDF
} = require('../controllers/payslipController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

// Employee Self-Service Routes (Must come before /:id wildcard)
router.get('/my/history', protect, getMyPayslips);
router.get('/my/:id/pdf', protect, downloadMyPayslipPDF);

// Admin / HR Action Routes (Must come before /:id wildcard)
router.get('/', protect, adminHR, getPayslips);
router.post('/generate', protect, adminHR, generatePayslip);
router.post('/generate-all', protect, adminHR, generateAllPayslips);

// Specific ID Routes
router.get('/:id', protect, adminHR, getPayslipById);
router.put('/:id/regenerate', protect, adminHR, regeneratePayslip);
router.put('/:id', protect, adminHR, updatePayslip);
router.delete('/:id', protect, adminHR, deletePayslip);
router.get('/:id/pdf', protect, adminHR, downloadPayslipPDF);

module.exports = router;
