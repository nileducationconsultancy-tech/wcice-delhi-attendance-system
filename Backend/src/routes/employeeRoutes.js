const express = require('express');
const multer = require('multer');
const {
    getAllEmployees,
    getNextEmployeeId,
    getEmployeeDetails,
    createEmployee,
    updateEmployee,
    updateEmployeeStatus,
    deleteEmployee,
    uploadProfilePicture,
    getAvatarStream
} = require('../controllers/employeeController');
const { protect, adminHR } = require('../middlewares/authMiddleware');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

const router = express.Router();

// Public stream endpoint for employee profile avatars
router.get('/avatar/:id', getAvatarStream);

router.use(protect);

// Employee Profile Picture (Self)
router.post('/profile-picture', upload.single('file'), uploadProfilePicture);

// Admin & Details Routes
router.get('/', adminHR, getAllEmployees);
router.get('/next-id', adminHR, getNextEmployeeId);
router.post('/', adminHR, createEmployee);
router.get('/:id', getEmployeeDetails);
router.put('/:id', adminHR, updateEmployee);
router.patch('/:id/status', adminHR, updateEmployeeStatus);
router.delete('/:id', adminHR, deleteEmployee);

module.exports = router;
