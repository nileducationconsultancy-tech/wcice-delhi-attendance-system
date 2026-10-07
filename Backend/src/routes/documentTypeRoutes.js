const express = require('express');
const {
    getDocumentTypes,
    createDocumentType,
    updateDocumentType,
    deleteDocumentType
} = require('../controllers/documentTypeController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(protect);

router.get('/', getDocumentTypes);
router.post('/', adminHR, createDocumentType);
router.put('/:id', adminHR, updateDocumentType);
router.delete('/:id', adminHR, deleteDocumentType);

module.exports = router;
