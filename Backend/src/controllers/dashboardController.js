const Employee = require('../models/EmployeeModel');
const AttendanceRecord = require('../models/AttendanceRecordModel');
const Holiday = require('../models/HolidayModel');
const { calculatePayrollData } = require('../services/payrollService');
const {
    getISTDateString,
    formatTimeIST,
    isSunday,
    isSaturday,
    calculateDuration,
    calculateMonthWorkingDays
} = require('../utils/dateUtils');

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

const adminFilter = {
    status: 'ACTIVE',
    ...(ADMIN_EMAIL ? { email: { $ne: ADMIN_EMAIL } } : {})
};

exports.getAdminDashboardStats = async (req, res) => {
    try {
        const now = new Date();
        const dateStr = getISTDateString(now);
        const [yearStr, monthStr] = dateStr.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-31`;

        const isSun = isSunday(now);

        // 1. Concurrently fetch regular employees, today's holiday, month holidays, and payroll
        const [regularEmployees, todayHoliday, holidays, payrollData] = await Promise.all([
            Employee.find(adminFilter).select('_id').lean(),
            Holiday.findOne({ date: dateStr, isActive: { $ne: false } }).lean(),
            Holiday.find({
                date: { $gte: startDateStr, $lte: endDateStr },
                isActive: { $ne: false }
            }).lean(),
            calculatePayrollData(month, year)
        ]);

        const totalEmployees = regularEmployees.length;
        const regularEmpIds = regularEmployees.map(e => e._id);

        // 2. Fetch today's records and recent live feed concurrently
        const [todayRecords, recentAttendance] = await Promise.all([
            AttendanceRecord.find({ 
                date: dateStr, 
                employeeId: { $in: regularEmpIds } 
            }).lean(),
            AttendanceRecord.find({ 
                date: dateStr, 
                employeeId: { $in: regularEmpIds } 
            })
                .populate('employeeId', 'name designation employeeId profilePicture')
                .sort({ updatedAt: -1 })
                .limit(10)
                .lean()
        ]);

        const presentToday = todayRecords.filter(a => a.status === 'PRESENT' && a.firstIn).length;
        const halfDayToday = todayRecords.filter(a => a.status === 'HALF_DAY' && a.firstIn).length;
        const checkedInTotal = presentToday + halfDayToday;
        
        let absentToday = 0;
        if (!isSun && !todayHoliday) {
            absentToday = Math.max(0, totalEmployees - checkedInTotal);
        }

        const holidayDates = holidays.map(h => h.date);
        const monthMeta = calculateMonthWorkingDays(year, month, holidayDates);

        let totalMonthPresent = 0;
        let totalMonthHalfDay = 0;
        payrollData.employees.forEach(e => {
            totalMonthPresent += e.presentDays;
            totalMonthHalfDay += e.halfDays;
        });

        const totalExpectedDays = totalEmployees * (monthMeta.totalWorkingDays || 1);
        const attendancePercentage = totalExpectedDays > 0 
            ? Number((((totalMonthPresent + 0.5 * totalMonthHalfDay) / totalExpectedDays) * 100).toFixed(1)) 
            : 0;

        const liveFeed = recentAttendance.map(r => ({
            _id: r._id,
            employeeName: r.employeeId?.name || 'Unknown',
            designation: r.employeeId?.designation || '',
            profilePicture: r.employeeId?.profilePicture || null,
            status: r.status,
            firstIn: formatTimeIST(r.firstIn),
            lastOut: formatTimeIST(r.lastOut),
            workingHours: r.workingHoursFormatted || '0h 0m'
        }));

        res.status(200).json({
            date: dateStr,
            isSunday: isSun,
            holidayToday: todayHoliday ? todayHoliday.name : null,
            stats: {
                totalEmployees,
                presentToday,
                halfDayToday,
                absentToday,
                monthWorkingDays: monthMeta.totalWorkingDays,
                monthAttendancePercentage: attendancePercentage,
                monthTotalPayroll: payrollData.totalExpense
            },
            recentActivity: liveFeed
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error loading admin dashboard', error: error.message });
    }
};

exports.getEmployeeDashboardStats = async (req, res) => {
    try {
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        const now = new Date();
        const dateStr = getISTDateString(now);
        const [yearStr, monthStr] = dateStr.split('-');
        const year = parseInt(yearStr);
        const month = parseInt(monthStr);
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-31`;

        const isSun = isSunday(now);
        const isSat = isSaturday(now);

        // Concurrently fetch employee info, today's holiday, month holidays, today's record, and month records
        const [employee, todayHoliday, holidays, todayRecord, monthRecords] = await Promise.all([
            employeeId ? Employee.findById(employeeId).lean() : null,
            Holiday.findOne({ date: dateStr, isActive: { $ne: false } }).lean(),
            Holiday.find({
                date: { $gte: startDateStr, $lte: endDateStr },
                isActive: { $ne: false }
            }).lean(),
            employeeId ? AttendanceRecord.findOne({ employeeId, date: dateStr }).lean() : null,
            employeeId ? AttendanceRecord.find({
                employeeId,
                date: { $gte: startDateStr, $lte: endDateStr }
            }).lean() : []
        ]);

        const empSchedule = employee?.workSchedule || '6_DAYS';
        const isSatOff = isSat && empSchedule === '5_DAYS';

        let workingHours = '0h 0m';
        if (todayRecord?.firstIn) {
            workingHours = calculateDuration(todayRecord.firstIn, todayRecord.lastOut || now).formatted;
        }

        const holidayDates = holidays.map(h => h.date);
        const monthMeta = calculateMonthWorkingDays(year, month, holidayDates, empSchedule);

        let presentDays = 0;
        let halfDays = 0;
        let absentDays = 0;

        if (employeeId && employee) {
            const joiningStr = employee.joiningDate ? getISTDateString(employee.joiningDate) : '2000-01-01';

            const recMap = {};
            monthRecords.forEach(r => { recMap[r.date] = r; });

            for (const workDate of monthMeta.workingDates) {
                if (workDate > dateStr) continue;
                if (workDate < joiningStr) continue;

                const rec = recMap[workDate];
                if (rec && rec.firstIn) {
                    if (rec.status === 'PRESENT') presentDays++;
                    else if (rec.status === 'HALF_DAY') halfDays++;
                } else {
                    absentDays++;
                }
            }
        }

        const paidDays = presentDays + (halfDays * 0.5);
        const attendancePercentage = monthMeta.totalWorkingDays > 0 
            ? Number(((paidDays / monthMeta.totalWorkingDays) * 100).toFixed(1)) 
            : 0;

        res.status(200).json({
            date: dateStr,
            isSunday: isSun,
            isSaturdayOff: isSatOff,
            workSchedule: empSchedule,
            holiday: todayHoliday ? todayHoliday.name : null,
            today: todayRecord ? {
                ...todayRecord,
                firstInFormatted: formatTimeIST(todayRecord.firstIn),
                lastOutFormatted: formatTimeIST(todayRecord.lastOut),
                currentWorkingHours: workingHours
            } : null,
            monthly: {
                totalWorkingDays: monthMeta.totalWorkingDays,
                presentDays,
                halfDays,
                absentDays,
                paidDays,
                attendancePercentage
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error loading employee dashboard', error: error.message });
    }
};
