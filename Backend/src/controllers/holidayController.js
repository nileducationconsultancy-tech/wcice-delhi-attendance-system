const Holiday = require('../models/HolidayModel');

// @desc    Get all holidays
// @route   GET /api/holidays
// @access  Private
const getHolidays = async (req, res) => {
    try {
        const { year, month } = req.query;
        let query = {};
        
        if (year && month) {
            query.date = { $regex: `^${year}-${month.padStart(2, '0')}` };
        } else if (year) {
            query.date = { $regex: `^${year}` };
        }
        
        const holidays = await Holiday.find(query).sort({ date: 1 });
        res.status(200).json(holidays);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Create a holiday
// @route   POST /api/holidays
// @access  Private/Admin
const createHoliday = async (req, res) => {
    try {
        const { name, date, type, description, isActive, isWorkingDay, grantFullDayOnCheckIn, customCutoffTime } = req.body;
        
        const existingHoliday = await Holiday.findOne({ date });
        if (existingHoliday) {
            return res.status(400).json({ message: 'A holiday already exists on this date' });
        }

        const holiday = await Holiday.create({
            name,
            date,
            type,
            description,
            isActive,
            isWorkingDay: isWorkingDay !== undefined ? isWorkingDay : (type === 'Festival Working Day'),
            grantFullDayOnCheckIn: grantFullDayOnCheckIn !== undefined ? grantFullDayOnCheckIn : true,
            customCutoffTime: customCutoffTime || null
        });

        res.status(201).json({ message: 'Holiday created successfully', holiday });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A holiday already exists on this date.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Update a holiday
// @route   PUT /api/holidays/:id
// @access  Private/Admin
const updateHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const { __v, ...updateData } = req.body;
        
        const holiday = await Holiday.findById(id);
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }

        if (__v !== undefined && holiday.__v !== __v) {
            return res.status(409).json({ message: 'This holiday was modified by another user. Please refresh and try again.' });
        }

        Object.assign(holiday, updateData);
        const updatedHoliday = await holiday.save();

        res.status(200).json({ message: 'Holiday updated successfully', holiday: updatedHoliday });
    } catch (error) {
        if (error.name === 'VersionError') {
            return res.status(409).json({ message: 'This holiday was modified by another user. Please refresh and try again.' });
        }
        if (error.code === 11000) {
            return res.status(409).json({ message: 'A holiday already exists on this date.' });
        }
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// @desc    Delete a holiday
// @route   DELETE /api/holidays/:id
// @access  Private/Admin
const deleteHoliday = async (req, res) => {
    try {
        const { id } = req.params;
        const holiday = await Holiday.findById(id);
        
        if (!holiday) {
            return res.status(404).json({ message: 'Holiday not found' });
        }

        await Holiday.findByIdAndDelete(id);
        res.status(200).json({ message: 'Holiday deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

module.exports = {
    getHolidays,
    createHoliday,
    updateHoliday,
    deleteHoliday
};
