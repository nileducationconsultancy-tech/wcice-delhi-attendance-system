const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');
const generateToken = require('../utils/generateToken');

const registerUser = async (req, res) => {
    try {
        const { email, password, name, phone, designation, employeeId } = req.body;
        
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const employee = await Employee.create({
            employeeId,
            user: null,
            designation: designation || 'Staff',
            phone,
            name
        });

        const user = await User.create({
            email,
            passwordHash: password,
            role: 'EMPLOYEE',
            status: 'PENDING',
            employeeId: employee._id
        });

        employee.user = user._id;
        await employee.save();

        res.status(201).json({ message: 'Registration successful. Waiting for admin approval.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const loginUser = async (req, res) => {
    const { email, password } = req.body;
    
    try {
        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        const cleanEmail = String(email).trim().toLowerCase();
        const rawPassword = String(password);
        const cleanPassword = rawPassword.trim();

        // Case-insensitive query
        const user = await User.findOne({
            email: { $regex: new RegExp(`^${cleanEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i') }
        }).populate('employeeId');
        
        if (user) {
            const isMatch = (await user.matchPassword(rawPassword)) || (await user.matchPassword(cleanPassword));
            
            if (isMatch) {
                if (user.status === 'PENDING') {
                    return res.status(403).json({ message: 'Your account is pending admin approval.' });
                }
                if (user.status === 'DISABLED' || user.status === 'INACTIVE') {
                    return res.status(403).json({ message: 'Your account is inactive or disabled. Please contact admin.' });
                }

                const token = generateToken(res, user._id);
                return res.json({
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    status: user.status,
                    name: user.employeeId?.name || (['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (process.env.ADMIN_NAME || 'Dr. Feroz') : 'Employee'),
                    profilePicture: user.profilePicture || user.employeeId?.profilePicture || null,
                    employee: user.employeeId,
                    token
                });
            }
        }

        return res.status(401).json({ message: 'Invalid email or password' });
    } catch (error) {
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Server Error during login' });
    }
};

const approveUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ message: 'User not found' });

        user.status = 'ACTIVE';
        await user.save();

        res.status(200).json({ message: 'User approved successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error' });
    }
};

const logoutUser = (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('jwt', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        expires: new Date(0)
    });
    res.status(200).json({ message: 'User logged out' });
};

const getMe = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).populate('employeeId');
        res.status(200).json({
            _id: user._id,
            email: user.email,
            role: user.role,
            status: user.status,
            name: user.employeeId?.name || (['ADMIN', 'SUPER_ADMIN'].includes(user.role) ? (process.env.ADMIN_NAME || 'Dr. Feroz') : 'Employee'),
            profilePicture: user.profilePicture || user.employeeId?.profilePicture || null,
            employee: user.employeeId
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

// PUT /api/auth/change-password (Authenticated User)
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        if (currentPassword) {
            const isMatch = await user.matchPassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: 'Current password is incorrect.' });
            }
        }

        if (!newPassword || newPassword.trim().length < 4) {
            return res.status(400).json({ message: 'New password must be at least 4 characters.' });
        }

        user.passwordHash = newPassword.trim();
        await user.save();

        res.status(200).json({ message: 'Password changed successfully!' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// POST /api/auth/reset-password (Public self-service with Phone/ID verification)
const resetPassword = async (req, res) => {
    try {
        const { email, phone, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ message: 'Email and new password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(404).json({ message: 'No account found with this email address.' });
        }

        // Verify phone number for extra security if provided
        if (phone) {
            const cleanPhone = phone.replace(/\D/g, '');
            const employee = await Employee.findOne({ 
                $or: [
                    { email: email.toLowerCase().trim() },
                    { userId: user._id }
                ] 
            });

            if (employee && employee.phone) {
                const empCleanPhone = employee.phone.replace(/\D/g, '');
                if (empCleanPhone && !empCleanPhone.includes(cleanPhone) && !cleanPhone.includes(empCleanPhone)) {
                    return res.status(400).json({ message: 'Phone number does not match our records for this account.' });
                }
            }
        }

        if (newPassword.trim().length < 4) {
            return res.status(400).json({ message: 'Password must be at least 4 characters.' });
        }

        user.passwordHash = newPassword.trim();
        await user.save();

        res.status(200).json({ message: 'Password reset successfully! You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Server error during password reset', error: error.message });
    }
};

module.exports = { registerUser, loginUser, approveUser, logoutUser, getMe, changePassword, resetPassword };
