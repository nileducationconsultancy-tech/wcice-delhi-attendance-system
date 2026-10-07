const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');

// Core Routes
const authRoutes = require('./routes/authRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const attendanceRoutes = require('./routes/attendanceRoutes');
const holidayRoutes = require('./routes/holidayRoutes');
const payrollRoutes = require('./routes/payrollRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const payslipRoutes = require('./routes/payslipRoutes');
const documentRoutes = require('./routes/documentRoutes');
const documentTypeRoutes = require('./routes/documentTypeRoutes');
const { seedDefaultDocumentTypes } = require('./services/documentService');

const app = express();

app.set('trust proxy', 1);

const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:3000',
    process.env.CLIENT_URL,
    process.env.FRONTEND_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        if (!origin) return callback(null, true);
        if (
            allowedOrigins.includes(origin) ||
            origin.endsWith('.vercel.app')
        ) {
            return callback(null, true);
        }
        return callback(null, true);
    },
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// Database connection middleware for Serverless
let isInitialized = false;
const seedAdmin = require('./scripts/seedAdmin');
app.use(async (req, res, next) => {
    try {
        await connectDB();
        if (!isInitialized) {
            isInitialized = true;
            seedAdmin().catch(console.error);
            seedDefaultDocumentTypes().catch(console.error);
        }
        next();
    } catch (err) {
        console.error('Database connection error in request:', err);
        return res.status(500).json({ success: false, message: 'Database connection failed' });
    }
});

// Lightweight Performance Response Time Logging
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        if (duration > 150 && process.env.NODE_ENV !== 'production') {
            console.log(`⏱️ [PERF] ${req.method} ${req.originalUrl} - ${duration}ms (${res.statusCode})`);
        }
    });
    next();
});

// Route Mounts
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/admin/payslips', payslipRoutes);
app.use('/api/payslips', payslipRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/document-types', documentTypeRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', time: new Date() });
});

// Start Cron Jobs (for non-serverless environments)
if (!process.env.VERCEL) {
    const startNightlyCheckoutJob = require('./jobs/nightlyCheckout');
    startNightlyCheckoutJob();
}

const PORT = process.env.PORT || 5000;

if (!process.env.VERCEL) {
    connectDB().then(async () => {
        await seedAdmin();
        await seedDefaultDocumentTypes();
        app.listen(PORT, () => console.log(`🚀 WECICE Delhi Attendance Server running on port ${PORT}`));
    });
}

module.exports = app;
