const AttendanceRecord = require('../models/AttendanceRecordModel');
const Holiday = require('../models/HolidayModel');
const Employee = require('../models/EmployeeModel');
const Payslip = require('../models/PayslipModel');
const { calculateMonthWorkingDays, getISTDateString, isSunday, isSaturday, isEarlyCheckOutBefore5PM } = require('../utils/dateUtils');

const ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || process.env.ADMIN_EMAIL;

const adminFilter = {
    status: 'ACTIVE',
    ...(ADMIN_EMAIL ? { email: { $ne: ADMIN_EMAIL } } : {})
};

// Check if check-in was after 10:30 AM IST (Late threshold)
const isLateCheckInAfter1030 = (dateObj) => {
    if (!dateObj) return false;
    const istString = new Date(dateObj).toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false });
    const [hours, minutes] = istString.split(':').map(Number);
    // Late if after 10:30:00 AM
    return hours > 10 || (hours === 10 && minutes > 30);
};

// Exemption check for specific designated leadership staff (Exact Match Only)
const isLateDeductionExempt = (emp) => {
    if (!emp) return false;
    const role = String(emp.role || '').toUpperCase();
    if (['ADMIN', 'SUPER_ADMIN'].includes(role)) return true;
    
    const empId = String(emp.employeeId || '').toUpperCase().trim();
    const name = String(emp.name || '').toLowerCase().trim();
    
    // Only exact ID matches for authorized directors/admins
    return empId === 'WECICE-EMP-001' || empId === 'NILE-EMP-001' || name === 'administrator';
};

/**
 * Calculates raw attendance breakdown for an employee in a given month/year using Method 1 (Calendar Days Basis)
 */
const getEmployeeAttendanceSummary = (employee, month, year, closedHolidayDates, empRecMap) => {
    const monthStr = String(month).padStart(2, '0');
    const empSchedule = employee.workSchedule || '6_DAYS';
    const empMonthMeta = calculateMonthWorkingDays(year, month, closedHolidayDates, empSchedule);
    const totalDaysInMonth = empMonthMeta.totalDaysInMonth;
    const empWorkingDays = empMonthMeta.totalWorkingDays;
    
    const now = new Date();
    const todayStr = getISTDateString(now);
    const currentYear = parseInt(todayStr.split('-')[0]);
    const currentMonth = parseInt(todayStr.split('-')[1]);
    const isCurrentMonth = (year === currentYear && month === currentMonth);
    const joiningStr = employee.joiningDate ? getISTDateString(employee.joiningDate) : '2000-01-01';

    let presentDays = 0;
    let halfDays = 0;
    let absentDays = 0;
    let lateDays = 0;
    let onTimeDays = 0;
    let preJoiningDays = 0;

    // Count any calendar days before joining date in this month
    for (let d = 1; d <= totalDaysInMonth; d++) {
        const dateStr = `${year}-${monthStr}-${String(d).padStart(2, '0')}`;
        if (dateStr < joiningStr) {
            preJoiningDays++;
        }
    }

    for (const workDate of empMonthMeta.workingDates) {
        if (isCurrentMonth && workDate > todayStr) {
            continue; // Skip future dates in current month
        }
        if (workDate < joiningStr) {
            continue; // Already counted in preJoiningDays
        }

        const rec = empRecMap[workDate];
        if (rec && rec.firstIn) {
            const isHalfDay = rec.status === 'HALF_DAY' || (rec.lastOut && isEarlyCheckOutBefore5PM(rec.lastOut));
            if (isHalfDay) {
                halfDays++;
            } else if (rec.status === 'PRESENT') {
                presentDays++;
                onTimeDays++;
            } else {
                absentDays++;
            }
        } else {
            absentDays++;
        }
    }

    const sundaysCount = empMonthMeta.sundayDates.length;
    const saturdaysOffCount = (empSchedule === '5_DAYS' ? empMonthMeta.saturdayDates.length : 0);
    const holidaysCount = empMonthMeta.holidayDates.length;
    const weeklyOffDays = sundaysCount + saturdaysOffCount;

    const paidLeaveQuota = 1;
    const rawUnpaidDays = absentDays + (halfDays * 0.5);
    const paidLeaveUsed = Math.min(paidLeaveQuota, rawUnpaidDays);
    const unpaidWorkingDays = Math.max(0, rawUnpaidDays - paidLeaveUsed);
    const totalUnpaidDays = unpaidWorkingDays + preJoiningDays;

    // Method 1 (Calendar Days Basis): Total Calendar Days - Total Unpaid Days
    const paidDays = Math.max(0, Number((totalDaysInMonth - totalUnpaidDays).toFixed(1)));

    return {
        month,
        year,
        workSchedule: empSchedule,
        totalDaysInMonth,
        totalWorkingDays: empWorkingDays,
        presentDays,
        halfDays,
        absentDays,
        paidLeaveDays: paidLeaveUsed,
        unpaidLeaveDays: totalUnpaidDays,
        holidayDays: holidaysCount,
        weeklyOffDays,
        lateDays,
        onTimeDays,
        paidDays
    };
};

/**
 * Calculates financial figures (per day salary, deductions, net) from attendance and adjustments using Method 1
 */
const calculatePayslipFigures = (employee, summary, manualAdjustments = {}) => {
    const monthlySalary = Number(employee.baseSalary || 0);
    // Method 1: Divisor is total calendar days in the month (e.g. 28, 30, 31)
    const totalCalendarDays = summary.totalDaysInMonth || 30;
    const perDaySalary = totalCalendarDays > 0 ? Number((monthlySalary / totalCalendarDays).toFixed(2)) : 0;

    // Apply 1 Paid Leave benefit: reduce absent days first, then half days
    let remainingPaidLeave = summary.paidLeaveDays || 0;
    let netAbsentDays = summary.absentDays || 0;
    if (remainingPaidLeave > 0 && netAbsentDays > 0) {
        const offset = Math.min(remainingPaidLeave, netAbsentDays);
        netAbsentDays -= offset;
        remainingPaidLeave -= offset;
    }

    let netHalfDays = summary.halfDays || 0;
    if (remainingPaidLeave > 0 && netHalfDays > 0) {
        const offset = Math.min(remainingPaidLeave / 0.5, netHalfDays);
        netHalfDays -= offset;
        remainingPaidLeave = 0;
    }

    // Days before joining date in the month
    const preJoiningDays = Math.max(0, (summary.unpaidLeaveDays || 0) - ((summary.absentDays || 0) + (summary.halfDays || 0) * 0.5 - (summary.paidLeaveDays || 0)));

    // 1. Absent Deduction (Full day rate * unpaid absent days)
    const absentDeduction = Number(((netAbsentDays + preJoiningDays) * perDaySalary).toFixed(2));
    
    // 2. Half Day Deduction (50% of day rate for each half day)
    const halfDayDeduction = Number(((netHalfDays * 0.5) * perDaySalary).toFixed(2));
    
    // 3. Late Deduction: None (Timing is 11:00 AM - 6:00 PM with no late charges)
    const lateDeduction = 0;

    // 4. Other Manual Deductions & Adjustments
    const otherDeductions = Number(Math.max(0, Number(manualAdjustments.otherDeductions || 0)).toFixed(2));
    const bonus = Number(Math.max(0, Number(manualAdjustments.bonus || 0)).toFixed(2));
    const incentive = Number(Math.max(0, Number(manualAdjustments.incentive || 0)).toFixed(2));
    const remarks = manualAdjustments.remarks || '';
    const paymentStatus = manualAdjustments.paymentStatus || 'Pending';

    const grossSalary = Number((monthlySalary + bonus + incentive).toFixed(2));
    const totalDeduction = Number((absentDeduction + halfDayDeduction + otherDeductions).toFixed(2));
    const netSalary = Number(Math.max(0, Number((grossSalary - totalDeduction).toFixed(2))));

    return {
        monthlySalary,
        perDaySalary,
        absentDeduction,
        halfDayDeduction,
        lateDeduction,
        otherDeductions,
        bonus,
        incentive,
        remarks,
        grossSalary,
        totalDeduction,
        netSalary,
        paymentStatus
    };
};

/**
 * Calculates in-memory payroll overview data for all employees (read-only for payroll screen)
 */
const calculatePayrollData = async (month, year) => {
    const monthStr = String(month).padStart(2, '0');
    const startDateStr = `${year}-${monthStr}-01`;
    const endDateStr = `${year}-${monthStr}-31`;

    const [holidays, employees, records] = await Promise.all([
        Holiday.find({
            date: { $gte: startDateStr, $lte: endDateStr },
            isActive: { $ne: false }
        }).lean(),
        Employee.find(adminFilter)
            .select('name email employeeId designation department baseSalary joiningDate workSchedule')
            .lean(),
        AttendanceRecord.find({
            date: { $gte: startDateStr, $lte: endDateStr }
        }).lean()
    ]);

    const closedHolidayDates = holidays
        .filter(h => h.type !== 'Festival Working Day' && !h.isWorkingDay)
        .map(h => h.date);

    const defaultMonthMeta = calculateMonthWorkingDays(year, month, closedHolidayDates, '6_DAYS');

    const employeeRecordsMap = {};
    records.forEach(r => {
        if (!r.employeeId) return;
        const empKey = r.employeeId.toString();
        if (!employeeRecordsMap[empKey]) employeeRecordsMap[empKey] = {};
        employeeRecordsMap[empKey][r.date] = r;
    });

    let totalPayrollExpense = 0;
    const employeeBreakdown = [];

    for (const employee of employees) {
        const empRecMap = employeeRecordsMap[employee._id.toString()] || {};
        const summary = getEmployeeAttendanceSummary(employee, month, year, closedHolidayDates, empRecMap);
        const figures = calculatePayslipFigures(employee, summary);

        totalPayrollExpense += figures.netSalary;

        employeeBreakdown.push({
            employeeId: employee.employeeId || employee._id,
            _id: employee._id,
            name: employee.name,
            designation: employee.designation,
            department: employee.department || 'General',
            workSchedule: summary.workSchedule,
            monthlySalary: figures.monthlySalary,
            workingDays: summary.totalWorkingDays,
            totalDaysInMonth: summary.totalDaysInMonth,
            presentDays: summary.presentDays,
            halfDays: summary.halfDays,
            absentDays: summary.absentDays,
            paidLeaveQuota: 1,
            paidLeaveUsed: summary.paidLeaveDays,
            unpaidLeaveDays: summary.unpaidLeaveDays,
            lateDays: summary.lateDays,
            onTimeDays: summary.onTimeDays,
            paidDays: summary.paidDays,
            perDaySalary: figures.perDaySalary,
            absentDeduction: figures.absentDeduction,
            halfDayDeduction: figures.halfDayDeduction,
            lateDeduction: figures.lateDeduction,
            deduction: figures.totalDeduction,
            netSalary: figures.netSalary
        });
    }

    return {
        month,
        year,
        totalDaysInMonth: defaultMonthMeta.totalDaysInMonth,
        totalWorkingDays: defaultMonthMeta.totalWorkingDays,
        totalSundays: defaultMonthMeta.sundayDates.length,
        totalHolidays: defaultMonthMeta.holidayDates.length,
        totalEmployees: employees.length,
        totalExpense: totalPayrollExpense,
        employees: employeeBreakdown
    };
};

/**
 * Generates or recalculates a single employee payslip and saves to DB
 */
const generateSinglePayslip = async (employeeId, month, year, manualAdjustments = {}, adminUserId = null) => {
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
        throw new Error('Employee not found');
    }

    const closedHolidayDates = holidays
        .filter(h => h.type !== 'Festival Working Day' && !h.isWorkingDay)
        .map(h => h.date);

    const empRecMap = {};
    records.forEach(r => { empRecMap[r.date] = r; });

    const summary = getEmployeeAttendanceSummary(employee, month, year, closedHolidayDates, empRecMap);
    const figures = calculatePayslipFigures(employee, summary, manualAdjustments);

    const payslipData = {
        employee: employee._id,
        employeeId: employee.employeeId || employee._id.toString(),
        month: parseInt(month),
        year: parseInt(year),
        employeeName: employee.name,
        designation: employee.designation || 'Staff',
        department: employee.department || 'General',
        workSchedule: summary.workSchedule,
        monthlySalary: figures.monthlySalary,
        totalWorkingDays: summary.totalWorkingDays,
        presentDays: summary.presentDays,
        absentDays: summary.absentDays,
        paidLeaveDays: summary.paidLeaveDays,
        halfDays: summary.halfDays,
        holidayDays: summary.holidayDays,
        weeklyOffDays: summary.weeklyOffDays,
        lateDays: summary.lateDays,
        onTimeDays: summary.onTimeDays,
        paidDays: summary.paidDays,
        perDaySalary: figures.perDaySalary,
        absentDeduction: figures.absentDeduction,
        halfDayDeduction: figures.halfDayDeduction,
        lateDeduction: figures.lateDeduction,
        otherDeductions: figures.otherDeductions,
        bonus: figures.bonus,
        incentive: figures.incentive,
        remarks: figures.remarks,
        grossSalary: figures.grossSalary,
        totalDeduction: figures.totalDeduction,
        netSalary: figures.netSalary,
        paymentStatus: figures.paymentStatus,
        generatedAt: new Date(),
        generatedBy: adminUserId
    };

    const savedPayslip = await Payslip.findOneAndUpdate(
        { employee: employee._id, month: parseInt(month), year: parseInt(year) },
        payslipData,
        { upsert: true, returnDocument: 'after', setDefaultsOnInsert: true }
    );

    return savedPayslip;
};

/**
 * Bulk generates payslips for all active employees for a selected month/year
 */
const generateBulkPayslips = async (month, year, adminUserId = null) => {
    const monthStr = String(month).padStart(2, '0');
    const startDateStr = `${year}-${monthStr}-01`;
    const endDateStr = `${year}-${monthStr}-31`;

    const [holidays, employees, records, existingPayslips] = await Promise.all([
        Holiday.find({
            date: { $gte: startDateStr, $lte: endDateStr },
            isActive: { $ne: false }
        }).lean(),
        Employee.find(adminFilter).lean(),
        AttendanceRecord.find({
            date: { $gte: startDateStr, $lte: endDateStr }
        }).lean(),
        Payslip.find({ month: parseInt(month), year: parseInt(year) }).lean()
    ]);

    const closedHolidayDates = holidays
        .filter(h => h.type !== 'Festival Working Day' && !h.isWorkingDay)
        .map(h => h.date);

    const employeeRecordsMap = {};
    records.forEach(r => {
        if (!r.employeeId) return;
        const empKey = r.employeeId.toString();
        if (!employeeRecordsMap[empKey]) employeeRecordsMap[empKey] = {};
        employeeRecordsMap[empKey][r.date] = r;
    });

    const existingMap = {};
    existingPayslips.forEach(p => {
        existingMap[p.employee.toString()] = p;
    });

    const bulkOps = [];

    for (const employee of employees) {
        const empRecMap = employeeRecordsMap[employee._id.toString()] || {};
        const summary = getEmployeeAttendanceSummary(employee, month, year, closedHolidayDates, empRecMap);
        
        // Preserve any manual adjustments if payslip already existed
        const existing = existingMap[employee._id.toString()];
        const manualAdjustments = {
            bonus: existing?.bonus || 0,
            incentive: existing?.incentive || 0,
            otherDeductions: existing?.otherDeductions || 0,
            remarks: existing?.remarks || '',
            paymentStatus: existing?.paymentStatus || 'Pending'
        };

        const figures = calculatePayslipFigures(employee, summary, manualAdjustments);

        const payslipDoc = {
            employee: employee._id,
            employeeId: employee.employeeId || employee._id.toString(),
            month: parseInt(month),
            year: parseInt(year),
            employeeName: employee.name,
            designation: employee.designation || 'Staff',
            department: employee.department || 'General',
            workSchedule: summary.workSchedule,
            monthlySalary: figures.monthlySalary,
            totalWorkingDays: summary.totalWorkingDays,
            presentDays: summary.presentDays,
            absentDays: summary.absentDays,
            paidLeaveDays: summary.paidLeaveDays,
            halfDays: summary.halfDays,
            holidayDays: summary.holidayDays,
            weeklyOffDays: summary.weeklyOffDays,
            lateDays: summary.lateDays,
            onTimeDays: summary.onTimeDays,
            paidDays: summary.paidDays,
            perDaySalary: figures.perDaySalary,
            absentDeduction: figures.absentDeduction,
            halfDayDeduction: figures.halfDayDeduction,
            lateDeduction: figures.lateDeduction,
            otherDeductions: figures.otherDeductions,
            bonus: figures.bonus,
            incentive: figures.incentive,
            remarks: figures.remarks,
            grossSalary: figures.grossSalary,
            totalDeduction: figures.totalDeduction,
            netSalary: figures.netSalary,
            paymentStatus: figures.paymentStatus,
            generatedAt: new Date(),
            generatedBy: adminUserId
        };

        bulkOps.push({
            updateOne: {
                filter: { employee: employee._id, month: parseInt(month), year: parseInt(year) },
                update: { $set: payslipDoc },
                upsert: true
            }
        });
    }

    if (bulkOps.length > 0) {
        await Payslip.bulkWrite(bulkOps);
    }

    return {
        totalGenerated: bulkOps.length,
        month: parseInt(month),
        year: parseInt(year)
    };
};

module.exports = {
    calculatePayrollData,
    getEmployeeAttendanceSummary,
    calculatePayslipFigures,
    generateSinglePayslip,
    generateBulkPayslips
};
