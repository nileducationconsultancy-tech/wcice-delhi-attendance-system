const { calculatePayrollData } = require('../services/payrollService');
const { getISTDateString } = require('../utils/dateUtils');

// GET /api/payroll
const getPayrollOverview = async (req, res) => {
    try {
        const now = new Date();
        const dateStr = getISTDateString(now);
        const currentYear = parseInt(dateStr.split('-')[0]);
        const currentMonth = parseInt(dateStr.split('-')[1]);

        const month = parseInt(req.query.month) || currentMonth;
        const year = parseInt(req.query.year) || currentYear;

        const data = await calculatePayrollData(month, year);
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ message: 'Server error calculating payroll', error: error.message });
    }
};

// GET /api/payroll/my
const getMyPayroll = async (req, res) => {
    try {
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        if (!employeeId) {
            return res.status(400).json({ message: 'No employee record associated with this account' });
        }

        const now = new Date();
        const dateStr = getISTDateString(now);
        const currentYear = parseInt(dateStr.split('-')[0]);
        const currentMonth = parseInt(dateStr.split('-')[1]);

        const month = parseInt(req.query.month) || currentMonth;
        const year = parseInt(req.query.year) || currentYear;

        const data = await calculatePayrollData(month, year);
        const myData = data.employees.find(e => e._id.toString() === employeeId.toString());

        res.status(200).json({
            month,
            year,
            totalWorkingDays: data.totalWorkingDays,
            totalSundays: data.totalSundays,
            totalHolidays: data.totalHolidays,
            payroll: myData || null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error calculating payroll', error: error.message });
    }
};

module.exports = { getPayrollOverview, getMyPayroll };
