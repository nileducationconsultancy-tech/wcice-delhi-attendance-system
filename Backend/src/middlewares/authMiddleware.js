const jwt = require('jsonwebtoken');
const User = require('../models/UserModel');
const Employee = require('../models/EmployeeModel');

const protect = async (req, res, next) => {
    let token = req.cookies?.jwt;

    if (!token && req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token && req.query?.token) {
        token = req.query.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.userId).select('-passwordHash').populate('employeeId');
            
            if (!user) {
                return res.status(401).json({ message: 'User not found' });
            }

            if (user.status !== 'ACTIVE') {
                return res.status(403).json({ message: 'Account is not active' });
            }

            req.user = user;
            next();
        } catch (error) {
            res.status(401).json({ message: 'Not authorized, token failed' });
        }
    } else {
        res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const adminHR = (req, res, next) => {
    if (req.user && ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
        next();
    } else {
        res.status(403).json({ message: 'Not authorized as Admin/HR' });
    }
};

module.exports = { protect, adminHR };
