const Employee = require('../models/EmployeeModel');
const User = require('../models/UserModel');

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

const adminFilter = ADMIN_EMAIL ? { email: { $ne: ADMIN_EMAIL } } : {};

exports.getAllEmployees = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const skip = (page - 1) * limit;

        const query = { ...adminFilter };

        if (req.query.search) {
            query.$and = [
                { ...adminFilter },
                {
                    $or: [
                        { name: { $regex: req.query.search, $options: 'i' } },
                        { employeeId: { $regex: req.query.search, $options: 'i' } },
                        { email: { $regex: req.query.search, $options: 'i' } }
                    ]
                }
            ];
            delete query.role;
            delete query.designation;
            delete query.email;
            delete query.name;
        }
        if (req.query.status) query.status = req.query.status;

        const employees = await Employee.find(query)
            .populate('userId', 'email role status')
            .skip(skip)
            .limit(limit)
            .sort({ createdAt: -1 });

        const total = await Employee.countDocuments(query);

        res.status(200).json({
            employees,
            total,
            page,
            pages: Math.ceil(total / limit)
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const generateNextEmployeeId = async () => {
    const employees = await Employee.find({}, 'employeeId');
    let maxNum = 0;
    let prefix = process.env.EMPLOYEE_ID_PREFIX || 'WECICE-EMP-';
    let padLength = 3;

    for (const emp of employees) {
        if (!emp.employeeId) continue;
        const str = emp.employeeId.trim();
        const match = str.match(/^(.*?)(\d+)$/);
        if (match) {
            const p = match[1];
            const num = parseInt(match[2], 10);
            if (!isNaN(num) && num > maxNum) {
                maxNum = num;
                if (p) prefix = p;
                if (match[2].length > padLength) padLength = match[2].length;
            }
        }
    }

    const nextNum = maxNum + 1;
    return `${prefix}${String(nextNum).padStart(padLength, '0')}`;
};

exports.getNextEmployeeId = async (req, res) => {
    try {
        const nextEmployeeId = await generateNextEmployeeId();
        res.status(200).json({ nextEmployeeId });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.getEmployeeDetails = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id)
            .populate('userId', 'email role status');
            
        if (!employee) return res.status(404).json({ message: 'Employee not found' });
            
        res.status(200).json({ employee });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.createEmployee = async (req, res) => {
    try {
        let {
            employeeId, name, email, phone, designation,
            role, workSchedule, baseSalary, joiningDate
        } = req.body;

        if (!name || !email) {
            return res.status(400).json({ message: 'Name and Email are required.' });
        }

        const finalEmployeeId = employeeId && employeeId.trim()
            ? employeeId.trim()
            : await generateNextEmployeeId();

        let user = await User.findOne({ email });
        if (user) {
            const linkedEmp = await Employee.findOne({ $or: [{ userId: user._id }, { email }] });
            if (linkedEmp) {
                return res.status(400).json({ message: 'Email already registered to an existing employee.' });
            }
            // If user exists without an employee record, re-link it
            user.role = role || user.role || 'EMPLOYEE';
            user.status = 'ACTIVE';
            if (phone && phone.trim()) {
                user.passwordHash = phone.trim().replace(/\s+/g, '');
            }
            await user.save();
        } else {
            const defaultPassword = phone && phone.trim() ? phone.trim().replace(/\s+/g, '') : '123456';
            user = await User.create({
                email,
                passwordHash: defaultPassword,
                role: role || 'EMPLOYEE',
                status: 'ACTIVE'
            });
        }

        const employee = await Employee.create({
            userId: user._id,
            employeeId: finalEmployeeId,
            name,
            email,
            phone,
            designation: designation || 'Staff',
            role: role || 'EMPLOYEE',
            workSchedule: workSchedule === '5_DAYS' ? '5_DAYS' : '6_DAYS',
            baseSalary: Number(baseSalary) || 0,
            joiningDate: joiningDate || Date.now(),
            status: 'ACTIVE'
        });

        user.employeeId = employee._id;
        await user.save();

        res.status(201).json({ message: 'Employee created successfully', employee });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEmployee = async (req, res) => {
    try {
        const {
            name, phone, designation, role, workSchedule,
            baseSalary, joiningDate, status
        } = req.body;

        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        employee.name = name || employee.name;
        employee.phone = phone !== undefined ? phone : employee.phone;
        employee.designation = designation || employee.designation;
        employee.role = role || employee.role;
        if (workSchedule) employee.workSchedule = workSchedule;
        employee.baseSalary = baseSalary !== undefined ? Number(baseSalary) : employee.baseSalary;
        employee.joiningDate = joiningDate || employee.joiningDate;
        if (status) employee.status = status;

        await employee.save();

        if (employee.userId) {
            await User.findByIdAndUpdate(employee.userId, { 
                role: role || employee.role,
                status: status || employee.status 
            });
        }

        res.status(200).json({ message: 'Employee updated successfully', employee });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.updateEmployeeStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        employee.status = status;
        await employee.save();

        if (employee.userId) {
            await User.findByIdAndUpdate(employee.userId, { status });
        }

        res.status(200).json({ message: 'Status updated successfully', status });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

exports.deleteEmployee = async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) return res.status(404).json({ message: 'Employee not found' });

        if (employee.userId) {
            await User.findByIdAndDelete(employee.userId);
        }
        await Employee.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error: error.message });
    }
};

const fileStorageService = require('../services/fileStorageService');

exports.uploadProfilePicture = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No profile image file uploaded.' });
        }

        let employeeId = req.user.employeeId?._id || req.user.employeeId;
        let employee = null;

        if (employeeId) {
            employee = await Employee.findById(employeeId);
        }

        if (!employee && req.user.email) {
            employee = await Employee.findOne({ email: req.user.email });
        }

        const targetId = employee ? String(employee._id) : String(req.user._id);

        // Upload image to Supabase Storage
        const uploadResult = await fileStorageService.uploadFile({
            file: req.file,
            employeeId: targetId,
            category: 'ProfilePictures'
        });

        // Get accessible URL from Supabase
        let avatarUrl = await fileStorageService.getSignedUrl(
            uploadResult.fileKey,
            uploadResult.storageProvider,
            60 * 60 * 24 * 365 // 1 year expiry
        );

        if (!avatarUrl) {
            avatarUrl = `/api/employees/avatar/${targetId}?t=${Date.now()}`;
        }

        // Save to Employee if exists
        if (employee) {
            employee.profilePicture = avatarUrl;
            employee.profilePictureKey = uploadResult.fileKey;
            await employee.save();
        }

        // Also save to User model
        const user = await User.findById(req.user._id);
        if (user) {
            user.profilePicture = avatarUrl;
            user.profilePictureKey = uploadResult.fileKey;
            await user.save();
        }

        res.status(200).json({
            message: 'Profile picture saved in Supabase successfully!',
            profilePicture: avatarUrl,
            employee: employee || null,
            user: {
                _id: user?._id,
                email: user?.email,
                role: user?.role,
                profilePicture: avatarUrl
            }
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        res.status(500).json({ message: 'Failed to upload profile picture to Supabase', error: error.message });
    }
};

/**
 * Public/Accessible stream for employee avatar
 */
exports.getAvatarStream = async (req, res) => {
    try {
        const { id } = req.params;
        let fileKey = null;

        const employee = await Employee.findById(id);
        if (employee && employee.profilePictureKey) {
            fileKey = employee.profilePictureKey;
        } else {
            const user = await User.findById(id);
            if (user && user.profilePictureKey) {
                fileKey = user.profilePictureKey;
            }
        }

        if (!fileKey) {
            return res.status(404).send('Avatar not found');
        }

        const buffer = await fileStorageService.getFileBuffer(
            fileKey,
            'SUPABASE'
        );

        if (!buffer) {
            return res.status(404).send('File buffer not found');
        }

        res.setHeader('Content-Type', 'image/jpeg');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        return res.send(buffer);
    } catch (err) {
        console.error('Error streaming avatar:', err);
        return res.status(500).send('Error streaming avatar');
    }
};


