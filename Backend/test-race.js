require('dotenv').config();
const mongoose = require('mongoose');
const dns = require('dns');
try { dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']); } catch(e) {}
const bcrypt = require('bcrypt');

async function run() {
    try {
        const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
        if (!uri) throw new Error('MONGODB_URI is required');
        await mongoose.connect(uri);
        const hash = await bcrypt.hash('password123', 10);
        await mongoose.connection.db.collection('users').updateOne({ email: 'mdhasnainraza463@gmail.com' }, { $set: { passwordHash: hash, status: 'ACTIVE' } });
        console.log('Password reset successfully');
        
        const res = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'mdhasnainraza463@gmail.com', password: 'password123' })
        });
        const data = await res.json();
        console.log('Login:', data.message || 'success');
        
        let cookies = res.headers.get('set-cookie');
        
        const dateStr = new Date().toISOString().split('T')[0];
        // clean up old records for today
        await mongoose.connection.db.collection('attendancerecords').deleteMany({ date: dateStr });
        await mongoose.connection.db.collection('attendanceevents').deleteMany({ date: dateStr });

        console.log('Hammering check-in endpoint...');
        const checkInPromises = [];
        for (let i = 0; i < 5; i++) {
            checkInPromises.push(fetch('http://localhost:5000/api/attendance/check-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Cookie': cookies },
                body: JSON.stringify({ latitude: 28.6139, longitude: 77.2090, accuracy: 10 })
            }).then(r => r.json()));
        }
        
        const results = await Promise.all(checkInPromises);
        results.forEach((r, i) => console.log('Check-in', i, r.message));
        
        const events = await mongoose.connection.db.collection('attendanceevents').find({ eventType: 'CHECK_IN', date: dateStr }).toArray();
        console.log('Duplicate events created:', events.length);
        
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}
run();
