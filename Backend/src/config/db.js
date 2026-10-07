const mongoose = require('mongoose');
const dns = require('dns');

// Configure public reliable DNS servers to resolve MongoDB Atlas SRV records
// (Prevents querySrv ECONNREFUSED issues with restrictive local ISP / router DNS)
try {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
} catch (e) {
    // Ignore if not supported in custom environment
}

let isConnected = false;

const connectDB = async () => {
    if (isConnected || mongoose.connection.readyState >= 1) {
        return;
    }
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!mongoUri) {
            console.error('❌ MONGODB_URI is not defined in environment variables.');
            throw new Error('MONGODB_URI environment variable is required');
        }
        const conn = await mongoose.connect(mongoUri);
        isConnected = true;
        console.log(`✅ Database connected successfully`);
        console.log(`   Host: ${conn.connection.host}`);
        console.log(`   Database: ${conn.connection.name}`);
    } catch (error) {
        console.log('❌ Database connection failed');
        const safeErrorMessage = error.message.replace(/:([^:@]+)@/, ':****@');
        console.log(`Error: ${safeErrorMessage}`);
        if (!process.env.VERCEL) {
            process.exit(1);
        }
        throw error;
    }
};

module.exports = connectDB;
