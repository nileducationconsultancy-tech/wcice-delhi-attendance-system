const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');

const seedAdmin = async () => {
    try {
        const adminEmail = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;
        const adminPassword = process.env.SUPER_ADMIN_PASSWORD || process.env.ADMIN_PASSWORD;

        if (!adminEmail || !adminPassword) {
            console.log('ℹ SUPER_ADMIN_EMAIL or SUPER_ADMIN_PASSWORD not set in environment. Skipping automatic admin bootstrap.');
            return;
        }

        let existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            existingAdmin = new User({
                email: adminEmail,
                passwordHash: adminPassword,
                role: 'ADMIN',
                status: 'ACTIVE',
            });
            await existingAdmin.save();
            console.log(`✔ Super Admin (${adminEmail}) created successfully`);
        } else {
            existingAdmin.passwordHash = adminPassword;
            existingAdmin.role = 'ADMIN';
            existingAdmin.status = 'ACTIVE';
            existingAdmin.employeeId = null;
            await existingAdmin.save();
            console.log(`✔ Super Admin (${adminEmail}) credentials synchronized`);
        }

        // Clean up any employee record created specifically for the Super Admin system email
        if (adminEmail) {
            await Employee.deleteMany({
                $or: [
                    { email: adminEmail },
                    { userId: existingAdmin._id }
                ]
            });
        }

        console.log('✔ Super Admin bootstrap verified');
    } catch (error) {
        console.error('Error seeding admin:', error);
    }
};

module.exports = seedAdmin;
