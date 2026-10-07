const express = require('express');
const multer = require('multer');
const {
    getEmployeeDocuments,
    getMyDocuments,
    uploadDocument,
    verifyDocument,
    rejectDocument,
    deleteDocument,
    getDocumentSignedUrl,
    streamDocumentFile,
    getDocumentStatsOverview,
    getAllCompanyDocuments
} = require('../controllers/documentController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

// Configure multer memory storage
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

const router = express.Router();

router.use(protect);

// Global & Stats Routes
router.get('/stats/overview', adminHR, getDocumentStatsOverview);
router.get('/admin/all', adminHR, getAllCompanyDocuments);

// Employee / Self Routes
router.get('/my', getMyDocuments);
router.get('/employee/:employeeId', getEmployeeDocuments);

// Document CRUD & Upload
router.post('/upload', upload.single('file'), uploadDocument);
router.put('/:id/verify', adminHR, verifyDocument);
router.put('/:id/reject', adminHR, rejectDocument);
router.delete('/:id', adminHR, deleteDocument);

// File Download & Preview (Signed URL or Auth Stream)
router.get('/:id/signed-url', getDocumentSignedUrl);
router.get('/:id/stream', streamDocumentFile);

module.exports = router;
