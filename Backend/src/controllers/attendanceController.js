const AttendanceRecord = require('../models/AttendanceRecordModel');
const AttendanceEvent = require('../models/AttendanceEventModel');
const Employee = require('../models/EmployeeModel');
const Holiday = require('../models/HolidayModel');
const Policy = require('../models/PolicyModel');
const { reverseGeocode } = require('../services/geoapifyService');
const {
    getISTDateString,
    formatTimeIST,
    isSunday,
    isSaturday,
    determineAttendanceStatus,
    isEarlyCheckOutBefore5PM,
    calculateDuration,
    calculateMonthWorkingDays
} = require('../utils/dateUtils');

// Haversine formula to calculate distance in meters
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3;
    const p1 = lat1 * Math.PI / 180;
    const p2 = lat2 * Math.PI / 180;
    const dp = (lat2 - lat1) * Math.PI / 180;
    const dl = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(dp / 2) * Math.sin(dp / 2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl / 2) * Math.sin(dl / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

// POST /api/attendance/check-in
const checkIn = async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        const clientIp = req.ip || req.connection.remoteAddress;

        if (!employeeId) {
            return res.status(400).json({ message: 'User is not associated with an employee profile.' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee || employee.status !== 'ACTIVE') {
            return res.status(403).json({ message: 'Employee profile is inactive or not found.' });
        }

        const now = new Date();
        const dateStr = getISTDateString(now);

        // 1. Check if Sunday
        if (isSunday(now)) {
            return res.status(400).json({ message: 'Today is Sunday. It is a scheduled weekly OFF.' });
        }

        // 2. Check if Holiday
        const holiday = await Holiday.findOne({ date: dateStr, isActive: { $ne: false } });
        const isFestivalWorkingDay = holiday && (holiday.type === 'Festival Working Day' || holiday.isWorkingDay === true);

        if (holiday && !isFestivalWorkingDay) {
            return res.status(400).json({ message: `Today is an official holiday: ${holiday.name}` });
        }

        // 3. Geofencing check (if enabled)
        let policy = await Policy.findOne();
        if (!policy) { policy = new Policy(); }

        let isVerifiedLocation = true;
        let distance = 0;
        let address = '';

        if (policy.geofenceEnabled) {
            if (!latitude || !longitude) {
                return res.status(400).json({ 
                    message: 'Location coordinates are required for check-in. Please enable GPS.' 
                });
            }

            if (accuracy && accuracy > policy.maxGpsAccuracy) {
                return res.status(403).json({ 
                    message: `GPS signal too weak (Accuracy: ${Math.round(accuracy)}m). Please move outside or connect to Wi-Fi.` 
                });
            }

            distance = calculateDistance(latitude, longitude, policy.officeLatitude, policy.officeLongitude);
            isVerifiedLocation = distance <= policy.attendanceRadius;

            if (!isVerifiedLocation) {
                return res.status(403).json({ 
                    message: `You are outside the office area. Distance: ${Math.round(distance)}m. Allowed: ${policy.attendanceRadius}m.` 
                });
            }

            try {
                address = await reverseGeocode(latitude, longitude);
            } catch (err) {
                console.warn('Geocoding failed:', err.message);
            }
        } else if (latitude && longitude) {
            distance = calculateDistance(latitude, longitude, policy.officeLatitude, policy.officeLongitude);
            isVerifiedLocation = distance <= policy.attendanceRadius;

            try {
                address = await reverseGeocode(latitude, longitude);
            } catch (err) {
                console.warn('Geocoding failed:', err.message);
            }
        }

        // 4. Duplicate Check
        const existingRecord = await AttendanceRecord.findOne({ employeeId, date: dateStr });
        if (existingRecord && existingRecord.firstIn) {
            return res.status(400).json({ 
                message: `Already checked in today at ${formatTimeIST(existingRecord.firstIn)}.` 
            });
        }

        // 5. Determine Attendance Status
        let status;
        if (isFestivalWorkingDay && (holiday.grantFullDayOnCheckIn !== false)) {
            // Special Festival / Occasion Day: Full Day Concession
            status = 'PRESENT';
        } else if (isFestivalWorkingDay && holiday.customCutoffTime) {
            status = determineAttendanceStatus(now, holiday.customCutoffTime);
        } else {
            status = determineAttendanceStatus(now, policy.halfDayCutoffTime || '11:00');
        }

        let checkInLocationObj = undefined;
        if (latitude && longitude) {
            checkInLocationObj = {
                latitude,
                longitude,
                accuracy: accuracy ? Math.round(accuracy) : null,
                distanceFromOffice: Math.round(distance)
            };
        }

        let record;
        if (existingRecord) {
            existingRecord.firstIn = now;
            existingRecord.status = status;
            existingRecord.checkInAddress = address;
            if (checkInLocationObj) {
                existingRecord.checkInLocation = checkInLocationObj;
            }
            record = await existingRecord.save();
        } else {
            record = await AttendanceRecord.create({
                employeeId,
                date: dateStr,
                firstIn: now,
                status,
                checkInAddress: address,
                checkInLocation: checkInLocationObj
            });
        }

        // Log audit event
        try {
            await AttendanceEvent.create({
                employeeId,
                date: dateStr,
                eventType: 'CHECK_IN',
                timestamp: now,
                ipAddress: clientIp,
                deviceInfo: req.headers['user-agent'],
                latitude,
                longitude,
                accuracy,
                distanceFromOffice: distance,
                isVerifiedLocation,
                address
            });
        } catch (e) {
            console.error('Audit event log error:', e);
        }

        let message = `Check-in successful. Marked as ${status === 'PRESENT' ? 'Present' : 'Half Day'}.`;
        if (isFestivalWorkingDay && status === 'PRESENT') {
            message = `Check-in successful. Marked as Full Day Present (${holiday.name} Festival Concession).`;
        }

        res.status(201).json({
            message,
            record: {
                ...record.toObject(),
                firstInFormatted: formatTimeIST(record.firstIn)
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ message: 'Already checked in for today.' });
        }
        res.status(500).json({ message: 'Server error during check-in', error: error.message });
    }
};

// POST /api/attendance/check-out
const checkOut = async (req, res) => {
    try {
        const { latitude, longitude, accuracy } = req.body;
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        const clientIp = req.ip || req.connection.remoteAddress;

        if (!employeeId) {
            return res.status(400).json({ message: 'User is not associated with an employee profile.' });
        }

        const now = new Date();
        const dateStr = getISTDateString(now);

        const record = await AttendanceRecord.findOne({ employeeId, date: dateStr });
        if (!record || !record.firstIn) {
            return res.status(400).json({ message: 'No check-in record found for today. Please check in first.' });
        }

        if (record.lastOut) {
            return res.status(400).json({ 
                message: `Already checked out today at ${formatTimeIST(record.lastOut)}.` 
            });
        }

        // Calculate working duration
        const duration = calculateDuration(record.firstIn, now);

        let policy = await Policy.findOne();
        if (!policy) { policy = new Policy(); }

        let isVerifiedLocation = true;
        let distance = 0;
        let address = '';

        if (policy.geofenceEnabled) {
            if (!latitude || !longitude) {
                return res.status(400).json({ 
                    message: 'Location coordinates are required for check-out. Please enable GPS location.' 
                });
            }

            if (accuracy && accuracy > policy.maxGpsAccuracy) {
                return res.status(403).json({ 
                    message: `GPS signal too weak (Accuracy: ${Math.round(accuracy)}m). Please move outside or connect to Wi-Fi.` 
                });
            }

            distance = calculateDistance(latitude, longitude, policy.officeLatitude, policy.officeLongitude);
            isVerifiedLocation = distance <= policy.attendanceRadius;

            if (!isVerifiedLocation) {
                return res.status(403).json({ 
                    message: `You are outside the office area. Distance: ${Math.round(distance)}m. Allowed: ${policy.attendanceRadius}m.` 
                });
            }

            try {
                address = await reverseGeocode(latitude, longitude);
            } catch (err) {
                console.warn('Checkout geocoding failed:', err.message);
            }
        } else if (latitude && longitude) {
            distance = calculateDistance(latitude, longitude, policy.officeLatitude, policy.officeLongitude);
            isVerifiedLocation = distance <= policy.attendanceRadius;

            try {
                address = await reverseGeocode(latitude, longitude);
            } catch (err) {
                console.warn('Checkout geocoding failed:', err.message);
            }
        }

        let checkOutLocationObj = undefined;
        if (latitude && longitude) {
            checkOutLocationObj = {
                latitude,
                longitude,
                accuracy: accuracy ? Math.round(accuracy) : null,
                distanceFromOffice: Math.round(distance)
            };
        }

        // If checking out before 5:00 PM (17:00 IST), mark day as HALF_DAY
        let finalStatus = record.status;
        let earlyCheckoutNote = '';
        if (isEarlyCheckOutBefore5PM(now)) {
            finalStatus = 'HALF_DAY';
            earlyCheckoutNote = ' (Checked out before 5:00 PM — Marked as Half Day)';
        }

        const updatedRecord = await AttendanceRecord.findOneAndUpdate(
            { _id: record._id, lastOut: null },
            { 
                $set: { 
                    lastOut: now,
                    status: finalStatus,
                    totalWorkingMinutes: duration.minutes,
                    workingHoursFormatted: duration.formatted,
                    checkOutAddress: address || '',
                    checkOutLocation: checkOutLocationObj
                } 
            },
            { new: true }
        );

        if (!updatedRecord) {
            return res.status(400).json({ message: 'Already checked out for today.' });
        }

        // Audit Event
        try {
            await AttendanceEvent.create({
                employeeId,
                date: dateStr,
                eventType: 'CHECK_OUT',
                timestamp: now,
                ipAddress: clientIp,
                deviceInfo: req.headers['user-agent'],
                latitude,
                longitude,
                accuracy: accuracy ? Math.round(accuracy) : null,
                distanceFromOffice: Math.round(distance),
                isVerifiedLocation,
                address
            });
        } catch (e) {
            console.error('Audit event log error:', e);
        }

        res.status(200).json({
            message: `Check-out successful at ${formatTimeIST(now)}. Total working time: ${duration.formatted}.${earlyCheckoutNote}`,
            record: {
                ...updatedRecord.toObject(),
                firstInFormatted: formatTimeIST(updatedRecord.firstIn),
                lastOutFormatted: formatTimeIST(updatedRecord.lastOut)
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error during check-out', error: error.message });
    }
};

// GET /api/attendance/today
const getTodayStatus = async (req, res) => {
    try {
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        const now = new Date();
        const dateStr = getISTDateString(now);
        const todayIsSunday = isSunday(now);

        const [holiday, record, policy] = await Promise.all([
            Holiday.findOne({ date: dateStr, isActive: { $ne: false } }).lean(),
            employeeId ? AttendanceRecord.findOne({ employeeId, date: dateStr }).lean() : null,
            Policy.findOne().lean()
        ]);

        let workingHoursFormatted = '0h 0m';
        if (record?.firstIn) {
            const duration = calculateDuration(record.firstIn, record.lastOut || now);
            workingHoursFormatted = duration.formatted;
        }

        const isFestivalWorkingDay = holiday ? (holiday.type === 'Festival Working Day' || holiday.isWorkingDay === true) : false;

        res.status(200).json({
            date: dateStr,
            isSunday: todayIsSunday,
            holiday: holiday ? holiday.name : null,
            holidayType: holiday ? holiday.type : null,
            isFestivalWorkingDay,
            policy: policy ? {
                companyName: policy.companyName,
                workStartTime: policy.workStartTime,
                workEndTime: policy.workEndTime,
                halfDayCutoffTime: policy.halfDayCutoffTime,
                geofenceEnabled: policy.geofenceEnabled,
                officeLatitude: policy.officeLatitude,
                officeLongitude: policy.officeLongitude,
                attendanceRadius: policy.attendanceRadius,
                maxGpsAccuracy: policy.maxGpsAccuracy
            } : null,
            record: record ? {
                ...record,
                firstInFormatted: formatTimeIST(record.firstIn),
                lastOutFormatted: formatTimeIST(record.lastOut),
                currentWorkingHours: workingHoursFormatted
            } : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/attendance/my
const getMyAttendance = async (req, res) => {
    try {
        const employeeId = req.user.employeeId?._id || req.user.employeeId;
        if (!employeeId) {
            return res.status(200).json({ history: [], summary: {} });
        }

        const now = new Date();
        const year = parseInt(req.query.year) || parseInt(getISTDateString(now).split('-')[0]);
        const month = parseInt(req.query.month) || parseInt(getISTDateString(now).split('-')[1]);
        const monthStr = String(month).padStart(2, '0');
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-31`;

        const [employee, holidays, records] = await Promise.all([
            Employee.findById(employeeId).lean(),
            Holiday.find({
                date: { $gte: startDateStr, $lte: endDateStr },
                isActive: { $ne: false }
            }).lean(),
            AttendanceRecord.find({
                employeeId,
                date: { $gte: startDateStr, $lte: endDateStr }
            }).lean()
        ]);

        const joiningDateStr = employee?.joiningDate ? getISTDateString(employee.joiningDate) : '2000-01-01';
        const empSchedule = employee?.workSchedule || '6_DAYS';

        const holidayMap = {};
        const closedHolidayDates = [];
        holidays.forEach(h => { 
            holidayMap[h.date] = { name: h.name, type: h.type, isWorkingDay: h.type === 'Festival Working Day' || h.isWorkingDay === true };
            if (h.type !== 'Festival Working Day' && !h.isWorkingDay) {
                closedHolidayDates.push(h.date);
            }
        });

        const monthMeta = calculateMonthWorkingDays(year, month, closedHolidayDates, empSchedule);

        const recordMap = {};
        records.forEach(r => { recordMap[r.date] = r; });

        const todayStr = getISTDateString(now);

        let presentDays = 0;
        let halfDays = 0;
        let absentDays = 0;
        let holidayCount = 0;
        let sundayCount = 0;
        let saturdayOffCount = 0;

        const history = [];

        for (let d = 1; d <= monthMeta.totalDaysInMonth; d++) {
            const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
            const rec = recordMap[dateStr];
            const isSun = monthMeta.sundayDates.includes(dateStr);
            const isSat = monthMeta.saturdayDates.includes(dateStr);
            const isSatOff = isSat && empSchedule === '5_DAYS';
            const holidayInfo = holidayMap[dateStr];

            let status = 'N/A';
            let checkInFormatted = null;
            let checkOutFormatted = null;
            let workingHours = '0h 0m';

            if (isSun) {
                status = 'SUNDAY';
                sundayCount++;
            } else if (rec && rec.firstIn) {
                const isEarlyOut = rec.lastOut && isEarlyCheckOutBefore5PM(rec.lastOut);
                if (isEarlyOut || rec.status === 'HALF_DAY') {
                    status = 'HALF_DAY';
                    halfDays++;
                } else if (rec.status === 'PRESENT') {
                    status = 'PRESENT';
                    presentDays++;
                } else {
                    status = rec.status;
                }
                checkInFormatted = formatTimeIST(rec.firstIn);
                checkOutFormatted = formatTimeIST(rec.lastOut);
                workingHours = rec.workingHoursFormatted || calculateDuration(rec.firstIn, rec.lastOut || rec.firstIn).formatted;
            } else if (isSatOff) {
                status = 'WEEKLY_OFF';
                saturdayOffCount++;
            } else if (holidayInfo && !holidayInfo.isWorkingDay) {
                status = 'HOLIDAY';
                holidayCount++;
            } else if (dateStr < todayStr && dateStr >= joiningDateStr) {
                status = 'ABSENT';
                absentDays++;
            } else if (dateStr === todayStr) {
                status = 'NOT_CHECKED_IN';
            }

            history.push({
                date: dateStr,
                dayOfWeek: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                status,
                holidayName: holidayInfo ? holidayInfo.name : null,
                holidayType: holidayInfo ? holidayInfo.type : null,
                isFestivalWorkingDay: holidayInfo ? holidayInfo.isWorkingDay : false,
                checkIn: checkInFormatted,
                checkOut: checkOutFormatted,
                workingHours,
                checkInAddress: rec?.checkInAddress || null,
                checkInLocation: rec?.checkInLocation || null,
                checkOutAddress: rec?.checkOutAddress || null,
                checkOutLocation: rec?.checkOutLocation || null
            });
        }

        const rawUnpaidDays = absentDays + (halfDays * 0.5);
        const paidLeaveUsed = Math.min(1, rawUnpaidDays);
        const paidDays = Math.min(monthMeta.totalWorkingDays, presentDays + (halfDays * 0.5) + paidLeaveUsed);
        const attendancePercentage = monthMeta.totalWorkingDays > 0 
            ? Math.min(100, Math.round((paidDays / monthMeta.totalWorkingDays) * 100)) 
            : 0;

        res.status(200).json({
            year,
            month,
            workSchedule: empSchedule,
            totalWorkingDays: monthMeta.totalWorkingDays,
            summary: {
                totalWorkingDays: monthMeta.totalWorkingDays,
                presentDays,
                halfDays,
                absentDays,
                paidLeaveQuota: 1,
                paidLeaveUsed,
                paidDays,
                holidayCount,
                sundayCount,
                saturdayOffCount,
                attendancePercentage
            },
            history: history.reverse()
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/attendance/employee/:id/history (Admin / HR)
const getEmployeeAttendanceHistory = async (req, res) => {
    try {
        const employeeId = req.params.id;
        const now = new Date();
        const year = parseInt(req.query.year) || parseInt(getISTDateString(now).split('-')[0]);
        const month = parseInt(req.query.month) || parseInt(getISTDateString(now).split('-')[1]);
        const monthStr = String(month).padStart(2, '0');
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-31`;

        const [employee, holidays, records] = await Promise.all([
            Employee.findById(employeeId).lean(),
            Holiday.find({
                date: { $gte: startDateStr, $lte: endDateStr },
                isActive: { $ne: false }
            }).lean(),
            AttendanceRecord.find({
                employeeId,
                date: { $gte: startDateStr, $lte: endDateStr }
            }).lean()
        ]);

        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const joiningDateStr = employee?.joiningDate ? getISTDateString(employee.joiningDate) : '2000-01-01';
        const empSchedule = employee?.workSchedule || '6_DAYS';

        const holidayMap = {};
        const closedHolidayDates = [];
        holidays.forEach(h => { 
            holidayMap[h.date] = { name: h.name, type: h.type, isWorkingDay: h.type === 'Festival Working Day' || h.isWorkingDay === true };
            if (h.type !== 'Festival Working Day' && !h.isWorkingDay) {
                closedHolidayDates.push(h.date);
            }
        });

        const monthMeta = calculateMonthWorkingDays(year, month, closedHolidayDates, empSchedule);

        const recordMap = {};
        records.forEach(r => { recordMap[r.date] = r; });

        const todayStr = getISTDateString(now);

        let presentDays = 0;
        let halfDays = 0;
        let absentDays = 0;
        let holidayCount = 0;
        let sundayCount = 0;
        let saturdayOffCount = 0;

        const history = [];

        for (let d = 1; d <= monthMeta.totalDaysInMonth; d++) {
            const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
            const rec = recordMap[dateStr];
            const isSun = monthMeta.sundayDates.includes(dateStr);
            const isSat = monthMeta.saturdayDates.includes(dateStr);
            const isSatOff = isSat && empSchedule === '5_DAYS';
            const holidayInfo = holidayMap[dateStr];

            let status = 'N/A';
            let checkInFormatted = null;
            let checkOutFormatted = null;
            let workingHours = '0h 0m';

            if (isSun) {
                status = 'SUNDAY';
                sundayCount++;
            } else if (rec && rec.firstIn) {
                const isEarlyOut = rec.lastOut && isEarlyCheckOutBefore5PM(rec.lastOut);
                if (isEarlyOut || rec.status === 'HALF_DAY') {
                    status = 'HALF_DAY';
                    halfDays++;
                } else if (rec.status === 'PRESENT') {
                    status = 'PRESENT';
                    presentDays++;
                } else {
                    status = rec.status;
                }
                checkInFormatted = formatTimeIST(rec.firstIn);
                checkOutFormatted = formatTimeIST(rec.lastOut);
                workingHours = rec.workingHoursFormatted || calculateDuration(rec.firstIn, rec.lastOut || rec.firstIn).formatted;
            } else if (isSatOff) {
                status = 'WEEKLY_OFF';
                saturdayOffCount++;
            } else if (holidayInfo && !holidayInfo.isWorkingDay) {
                status = 'HOLIDAY';
                holidayCount++;
            } else if (dateStr < todayStr && dateStr >= joiningDateStr) {
                status = 'ABSENT';
                absentDays++;
            } else if (dateStr === todayStr) {
                status = 'NOT_CHECKED_IN';
            }

            history.push({
                date: dateStr,
                dayOfWeek: new Date(dateStr).toLocaleDateString('en-US', { weekday: 'short' }),
                status,
                holidayName: holidayInfo ? holidayInfo.name : null,
                holidayType: holidayInfo ? holidayInfo.type : null,
                isFestivalWorkingDay: holidayInfo ? holidayInfo.isWorkingDay : false,
                checkIn: checkInFormatted,
                checkOut: checkOutFormatted,
                workingHours,
                checkInAddress: rec?.checkInAddress || null,
                checkInLocation: rec?.checkInLocation || null,
                checkOutAddress: rec?.checkOutAddress || null,
                checkOutLocation: rec?.checkOutLocation || null
            });
        }

        const rawUnpaidDays = absentDays + (halfDays * 0.5);
        const paidLeaveUsed = Math.min(1, rawUnpaidDays);
        const paidDays = Math.min(monthMeta.totalWorkingDays, presentDays + (halfDays * 0.5) + paidLeaveUsed);
        const attendancePercentage = monthMeta.totalWorkingDays > 0 
            ? Math.min(100, Math.round((paidDays / monthMeta.totalWorkingDays) * 100)) 
            : 0;

        res.status(200).json({
            employee: {
                _id: employee._id,
                employeeId: employee.employeeId || employee._id,
                name: employee.name,
                email: employee.email,
                designation: employee.designation || 'Staff',
                workSchedule: empSchedule,
                baseSalary: employee.baseSalary || 0
            },
            year,
            month,
            totalWorkingDays: monthMeta.totalWorkingDays,
            summary: {
                totalWorkingDays: monthMeta.totalWorkingDays,
                presentDays,
                halfDays,
                absentDays,
                paidLeaveQuota: 1,
                paidLeaveUsed,
                paidDays,
                holidayCount,
                sundayCount,
                saturdayOffCount,
                attendancePercentage
            },
            history: history
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

const adminFilter = {
    status: 'ACTIVE',
    ...(ADMIN_EMAIL ? { email: { $ne: ADMIN_EMAIL } } : {})
};

// GET /api/attendance/admin/overview
const getAdminAttendanceOverview = async (req, res) => {
    try {
        const dateStr = req.query.date || getISTDateString(new Date());

        const [employees, records, holiday] = await Promise.all([
            Employee.find(adminFilter)
                .select('name email employeeId designation baseSalary joiningDate workSchedule profilePicture')
                .lean(),
            AttendanceRecord.find({ date: dateStr }).lean(),
            Holiday.findOne({ date: dateStr, isActive: { $ne: false } }).lean()
        ]);

        const recordMap = {};
        records.forEach(r => { 
            if (r.employeeId) {
                recordMap[r.employeeId.toString()] = r; 
            }
        });

        const isFestivalWorkingDay = holiday && (holiday.type === 'Festival Working Day' || holiday.isWorkingDay === true);
        const isSun = isSunday(new Date(dateStr));
        const isSat = isSaturday(new Date(dateStr));

        const overview = employees.map(emp => {
            const rec = recordMap[emp._id.toString()];
            const isSatOff = isSat && emp.workSchedule === '5_DAYS';

            let status = 'ABSENT';
            if (isSun) status = 'SUNDAY';
            else if (rec && rec.firstIn) {
                const isEarlyOut = rec.lastOut && isEarlyCheckOutBefore5PM(rec.lastOut);
                if (isEarlyOut || rec.status === 'HALF_DAY') {
                    status = 'HALF_DAY';
                } else {
                    status = rec.status;
                }
            }
            else if (isSatOff) status = 'WEEKLY_OFF';
            else if (holiday && !isFestivalWorkingDay) status = 'HOLIDAY';
            else if (dateStr > getISTDateString(new Date())) status = 'FUTURE';

            let workingHoursStr = '0h 0m';
            if (rec && rec.firstIn && rec.lastOut) {
                if (rec.workingHoursFormatted && rec.workingHoursFormatted !== '0h 0m') {
                    workingHoursStr = rec.workingHoursFormatted;
                } else {
                    const dur = calculateDuration(rec.firstIn, rec.lastOut);
                    workingHoursStr = dur.formatted || '0h 0m';
                }
            } else if (rec && rec.workingHoursFormatted) {
                workingHoursStr = rec.workingHoursFormatted;
            }

            return {
                _id: emp._id,
                employeeId: emp.employeeId || emp._id,
                name: emp.name,
                email: emp.email,
                profilePicture: emp.profilePicture || null,
                designation: emp.designation,
                workSchedule: emp.workSchedule || '6_DAYS',
                status,
                firstIn: rec ? formatTimeIST(rec.firstIn) : '--:--',
                lastOut: rec ? formatTimeIST(rec.lastOut) : '--:--',
                workingHours: workingHoursStr,
                checkInAddress: rec?.checkInAddress || null,
                checkInLocation: rec?.checkInLocation || null,
                checkOutAddress: rec?.checkOutAddress || null,
                checkOutLocation: rec?.checkOutLocation || null,
                isManualEntry: rec?.isManualEntry || false,
                manualRemarks: rec?.manualRemarks || null
            };
        });

        res.status(200).json({
            date: dateStr,
            isSunday: isSun,
            holiday: holiday ? holiday.name : null,
            holidayType: holiday ? holiday.type : null,
            isFestivalWorkingDay: Boolean(isFestivalWorkingDay),
            totalEmployees: employees.length,
            records: overview
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// GET /api/attendance/reports
const getAttendanceReport = async (req, res) => {
    try {
        const now = new Date();
        const year = parseInt(req.query.year) || parseInt(getISTDateString(now).split('-')[0]);
        const month = parseInt(req.query.month) || parseInt(getISTDateString(now).split('-')[1]);
        const employeeIdFilter = req.query.employeeId;
        const monthStr = String(month).padStart(2, '0');
        const startDateStr = `${year}-${monthStr}-01`;
        const endDateStr = `${year}-${monthStr}-31`;

        let employeeQuery = { ...adminFilter };
        if (employeeIdFilter) employeeQuery._id = employeeIdFilter;

        const [holidays, employees, records] = await Promise.all([
            Holiday.find({
                date: { $gte: startDateStr, $lte: endDateStr },
                isActive: { $ne: false }
            }).lean(),
            Employee.find(employeeQuery)
                .select('name email employeeId designation baseSalary joiningDate workSchedule')
                .lean(),
            AttendanceRecord.find({
                date: { $gte: startDateStr, $lte: endDateStr }
            }).lean()
        ]);

        const holidayMap = {};
        const closedHolidayDates = [];
        holidays.forEach(h => { 
            holidayMap[h.date] = { name: h.name, type: h.type, isWorkingDay: h.type === 'Festival Working Day' || h.isWorkingDay === true };
            if (h.type !== 'Festival Working Day' && !h.isWorkingDay) {
                closedHolidayDates.push(h.date);
            }
        });

        // Default 6-day reference metadata for month overview card
        const defaultMonthMeta = calculateMonthWorkingDays(year, month, closedHolidayDates, '6_DAYS');

        const employeeRecordsMap = {};
        records.forEach(r => {
            if (!r.employeeId) return;
            const empKey = r.employeeId.toString();
            if (!employeeRecordsMap[empKey]) employeeRecordsMap[empKey] = {};
            employeeRecordsMap[empKey][r.date] = r;
        });

        const todayStr = getISTDateString(now);

        const reportData = employees.map(emp => {
            const empSchedule = emp.workSchedule || '6_DAYS';
            const empMonthMeta = calculateMonthWorkingDays(year, month, closedHolidayDates, empSchedule);
            const empRecMap = employeeRecordsMap[emp._id.toString()] || {};
            const joiningStr = emp.joiningDate ? getISTDateString(emp.joiningDate) : '2000-01-01';

            let present = 0;
            let halfDay = 0;
            let absent = 0;

            for (const workDate of empMonthMeta.workingDates) {
                if (workDate > todayStr) continue; // Skip future dates
                if (workDate < joiningStr) continue; // Skip dates before joining

                const rec = empRecMap[workDate];
                if (rec && rec.firstIn) {
                    const isEarlyOut = rec.lastOut && isEarlyCheckOutBefore5PM(rec.lastOut);
                    if (isEarlyOut || rec.status === 'HALF_DAY') {
                        halfDay++;
                    } else if (rec.status === 'PRESENT') {
                        present++;
                    } else {
                        absent++;
                    }
                } else {
                    absent++;
                }
            }

            const rawUnpaidDays = absent + (halfDay * 0.5);
            const paidLeaveUsed = Math.min(1, rawUnpaidDays);
            const paidDays = Math.min(empMonthMeta.totalWorkingDays, present + (halfDay * 0.5) + paidLeaveUsed);
            const attendancePercentage = empMonthMeta.totalWorkingDays > 0 
                ? Number(((paidDays / empMonthMeta.totalWorkingDays) * 100).toFixed(1)) 
                : 0;

            return {
                _id: emp._id,
                employeeId: emp.employeeId || emp._id,
                name: emp.name,
                designation: emp.designation,
                workSchedule: empSchedule,
                workingDays: empMonthMeta.totalWorkingDays,
                present,
                halfDay,
                absent,
                paidLeaveQuota: 1,
                paidLeaveUsed,
                paidDays,
                holidays: empMonthMeta.holidayDates.length,
                sundays: empMonthMeta.sundayDates.length,
                attendancePercentage
            };
        });

        res.status(200).json({
            year,
            month,
            totalWorkingDays: defaultMonthMeta.totalWorkingDays,
            totalHolidays: defaultMonthMeta.holidayDates.length,
            totalSundays: defaultMonthMeta.sundayDates.length,
            report: reportData
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Helper to parse manual time strings in 12-hour or 24-hour formats into IST Date
const parseManualTime = (dateStr, timeStr, defaultTime = '10:00', isCheckOut = false, firstInDate = null) => {
    if (!timeStr || typeof timeStr !== 'string') {
        timeStr = defaultTime;
    }
    const cleanStr = timeStr.trim().toUpperCase();

    const isPM = cleanStr.includes('PM');
    const isAM = cleanStr.includes('AM');

    const digitsOnly = cleanStr.replace(/[^0-9:]/g, '');
    const parts = digitsOnly.split(':');
    let hours = parseInt(parts[0] || '0', 10);
    let minutes = parseInt(parts[1] || '0', 10);
    let seconds = parseInt(parts[2] || '0', 10);

    if (isPM && hours < 12) {
        hours += 12;
    } else if (isAM && hours === 12) {
        hours = 0;
    } else if (!isPM && !isAM && isCheckOut && hours >= 1 && hours <= 11) {
        // If checkout is e.g. "06:00" without PM and checkIn was morning (e.g. 10:00), it's 18:00
        hours += 12;
    }

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    let resultDate = new Date(`${dateStr}T${hh}:${mm}:${ss}+05:30`);

    // If checkOut is still before firstIn and checkOut hours < 12, adjust to PM
    if (isCheckOut && firstInDate && resultDate < firstInDate) {
        if (hours < 12) {
            hours += 12;
            const newHh = String(hours).padStart(2, '0');
            resultDate = new Date(`${dateStr}T${newHh}:${mm}:${ss}+05:30`);
        }
    }

    return resultDate;
};

// POST /api/attendance/admin/manual-entry
const markManualAttendance = async (req, res) => {
    try {
        const { employeeId, date, status, checkInTime, checkOutTime, remarks, isCheckOutOnly } = req.body;

        if (!employeeId || !date) {
            return res.status(400).json({ message: 'Employee ID and date are required' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let policy = await Policy.findOne().lean();
        const officeLat = policy?.officeLatitude || 28.538089;
        const officeLng = policy?.officeLongitude || 77.286905;
        const tdiAddress = '12A, TDI Centre, Jasola, Jasola, Delhi - 110025, India';

        const existingRecord = await AttendanceRecord.findOne({ employeeId: employee._id, date });

        // If Admin only wants to punch out an employee (who already checked in)
        if (isCheckOutOnly) {
            const firstIn = existingRecord?.firstIn || parseManualTime(date, '10:00', '10:00', false);
            const lastOut = parseManualTime(date, checkOutTime || '18:00', '18:00', true, firstIn);

            const duration = calculateDuration(firstIn, lastOut);
            const workingMins = duration.minutes > 0 ? duration.minutes : 480;
            const workingFormatted = duration.minutes > 0 ? duration.formatted : '8h 0m';

            const updateData = {
                status: existingRecord?.status && existingRecord.status !== 'ABSENT' ? existingRecord.status : 'PRESENT',
                firstIn: firstIn,
                lastOut: lastOut,
                totalWorkingMinutes: workingMins,
                workingHoursFormatted: workingFormatted,
                checkOutAddress: tdiAddress,
                checkOutLocation: {
                    latitude: officeLat,
                    longitude: officeLng,
                    accuracy: 10,
                    distanceFromOffice: 0
                },
                isManualEntry: true,
                manualRemarks: remarks || 'Manual check-out recorded by Admin (Employee missed checkout)',
                markedBy: req.user?._id
            };

            if (!existingRecord || !existingRecord.checkInAddress) {
                updateData.checkInAddress = tdiAddress;
                updateData.checkInLocation = {
                    latitude: officeLat,
                    longitude: officeLng,
                    accuracy: 10,
                    distanceFromOffice: 0
                };
            }

            const record = await AttendanceRecord.findOneAndUpdate(
                { employeeId: employee._id, date },
                { $set: updateData },
                { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
            );

            return res.status(200).json({
                message: `Check-out for ${employee.name} on ${date} recorded successfully (${workingFormatted})`,
                record
            });
        }

        const finalStatus = status || 'PRESENT';
        let updateData = {
            status: finalStatus,
            isManualEntry: true,
            manualRemarks: remarks || 'Manual attendance override by Admin',
            markedBy: req.user?._id
        };

        if (finalStatus === 'ABSENT') {
            updateData.firstIn = null;
            updateData.lastOut = null;
            updateData.totalWorkingMinutes = 0;
            updateData.workingHoursFormatted = '0h 0m';
            updateData.checkInAddress = 'Marked Absent by Admin';
            updateData.checkOutAddress = 'Marked Absent by Admin';
        } else {
            const inTimeStr = checkInTime || '10:00';
            const outTimeStr = checkOutTime || '18:00';

            const firstIn = parseManualTime(date, inTimeStr, '10:00', false);
            const lastOut = parseManualTime(date, outTimeStr, '18:00', true, firstIn);

            updateData.firstIn = firstIn;
            updateData.lastOut = lastOut;
            const duration = calculateDuration(firstIn, lastOut);
            updateData.totalWorkingMinutes = duration.minutes > 0 ? duration.minutes : 480;
            updateData.workingHoursFormatted = duration.minutes > 0 ? duration.formatted : '8h 0m';
            updateData.checkInAddress = tdiAddress;
            updateData.checkOutAddress = tdiAddress;
            updateData.checkInLocation = {
                latitude: officeLat,
                longitude: officeLng,
                accuracy: 10,
                distanceFromOffice: 0
            };
            updateData.checkOutLocation = {
                latitude: officeLat,
                longitude: officeLng,
                accuracy: 10,
                distanceFromOffice: 0
            };
        }

        const record = await AttendanceRecord.findOneAndUpdate(
            { employeeId: employee._id, date },
            { $set: updateData },
            { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
        );

        res.status(200).json({
            message: `Attendance for ${employee.name} on ${date} marked as ${finalStatus} successfully`,
            record
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error marking manual attendance', error: error.message });
    }
};

module.exports = {
    checkIn,
    checkOut,
    getTodayStatus,
    getMyAttendance,
    getEmployeeAttendanceHistory,
    getAdminAttendanceOverview,
    getAttendanceReport,
    markManualAttendance
};
