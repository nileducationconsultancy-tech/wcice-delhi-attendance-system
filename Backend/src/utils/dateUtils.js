/**
 * Centralized Date & Attendance Utility for WECICE Delhi Attendance System
 * Authoritative Timezone: Asia/Kolkata (IST, UTC+05:30)
 */

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

// Get current Date in ISO format string representing local IST date YYYY-MM-DD
const getISTDateString = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-CA', { timeZone: TIMEZONE }); // Returns YYYY-MM-DD
};

// Get IST hours and minutes
const getISTTimeParts = (dateInput = new Date()) => {
    const d = new Date(dateInput);
    const timeStr = d.toLocaleTimeString('en-GB', { 
        timeZone: TIMEZONE, 
        hour12: false, 
        hour: '2-digit', 
        minute: '2-digit',
        second: '2-digit'
    }); // e.g. "10:15:30"
    const [hours, minutes, seconds] = timeStr.split(':').map(Number);
    return { hours, minutes, seconds, totalMinutes: hours * 60 + minutes };
};

// Format time in readable 12-hour format: "10:15 AM"
const formatTimeIST = (dateInput) => {
    if (!dateInput) return null;
    const d = new Date(dateInput);
    return d.toLocaleTimeString('en-US', {
        timeZone: TIMEZONE,
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });
};

// Format date in readable format: "29 Aug 2026"
const formatDateReadable = (dateInput) => {
    if (!dateInput) return '';
    const d = new Date(dateInput);
    return d.toLocaleDateString('en-GB', {
        timeZone: TIMEZONE,
        day: 'numeric',
        month: 'short',
        year: 'numeric'
    });
};

// Check if a date is Sunday in IST
const isSunday = (dateInput) => {
    const d = new Date(dateInput);
    const dayStr = d.toLocaleDateString('en-US', { timeZone: TIMEZONE, weekday: 'short' });
    return dayStr === 'Sun';
};

// Check if a date is Saturday in IST
const isSaturday = (dateInput) => {
    const d = new Date(dateInput);
    const dayStr = d.toLocaleDateString('en-US', { timeZone: TIMEZONE, weekday: 'short' });
    return dayStr === 'Sat';
};

// Determine attendance status based on check-in time (Cutoff: 2:00 PM / 14:00 IST)
// Shift: 11:00 AM - 6:00 PM (No late charges)
// Check-in before 2:00 PM -> PRESENT (1.0 day)
// Check-in after 2:00 PM -> HALF_DAY (0.5 day)
const determineAttendanceStatus = (checkInDate = new Date(), cutoffTime = '14:00') => {
    const { totalMinutes } = getISTTimeParts(checkInDate);
    const [cutHour, cutMin] = (cutoffTime || '14:00').split(':').map(Number);
    const cutoffMinutes = cutHour * 60 + (cutMin || 0);

    if (totalMinutes <= cutoffMinutes) {
        return 'PRESENT';
    } else {
        return 'HALF_DAY';
    }
};

// Check if check-out was before 5:00 PM IST (17:00)
// Early checkout before 5:00 PM results in a Half-Day (0.5 day deduction)
const isEarlyCheckOutBefore5PM = (dateObj) => {
    if (!dateObj) return false;
    const { totalMinutes } = getISTTimeParts(dateObj);
    return totalMinutes < 17 * 60; // Before 17:00 (5:00 PM)
};

// Calculate duration between check-in and check-out
const calculateDuration = (firstIn, lastOut) => {
    if (!firstIn || !lastOut) return { minutes: 0, formatted: '0h 0m' };
    const inTime = new Date(firstIn).getTime();
    const outTime = new Date(lastOut).getTime();
    const diffMs = Math.max(0, outTime - inTime);
    
    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return {
        minutes: totalMinutes,
        formatted: `${hours}h ${minutes}m`
    };
};

// Normalize start and end of day in IST as UTC Date objects for querying
const getISTDayRange = (dateString) => {
    // dateString in YYYY-MM-DD
    // IST is UTC+5:30 -> midnight IST is 18:30 UTC of previous day
    const [year, month, day] = dateString.split('-').map(Number);
    const start = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0) - (5.5 * 60 * 60 * 1000));
    const end = new Date(Date.UTC(year, month - 1, day, 23, 59, 59, 999) - (5.5 * 60 * 60 * 1000));
    return { start, end };
};

// Calculate monthly working days (supporting 6_DAYS and 5_DAYS schedules)
const calculateMonthWorkingDays = (year, month, holidayDateStrings = [], schedule = '6_DAYS') => {
    // month is 1-indexed (1 = Jan, 12 = Dec)
    const daysInMonth = new Date(year, month, 0).getDate();
    let totalWorkingDays = 0;
    const workingDates = [];
    const sundayDates = [];
    const saturdayDates = [];
    const holidayDates = [];

    const holidaySet = new Set(holidayDateStrings);
    const isFiveDay = (schedule === '5_DAYS');

    for (let day = 1; day <= daysInMonth; day++) {
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        const d = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
        const dayOfWeek = d.toLocaleDateString('en-US', { timeZone: TIMEZONE, weekday: 'short' });

        if (dayOfWeek === 'Sun') {
            sundayDates.push(dateStr);
        } else if (dayOfWeek === 'Sat') {
            saturdayDates.push(dateStr);
            if (isFiveDay) {
                // Saturday is OFF for 5-day week employees
            } else if (holidaySet.has(dateStr)) {
                holidayDates.push(dateStr);
            } else {
                totalWorkingDays++;
                workingDates.push(dateStr);
            }
        } else if (holidaySet.has(dateStr)) {
            holidayDates.push(dateStr);
        } else {
            totalWorkingDays++;
            workingDates.push(dateStr);
        }
    }

    return {
        totalDaysInMonth: daysInMonth,
        totalWorkingDays,
        workingDates,
        sundayDates,
        saturdayDates,
        holidayDates,
        isFiveDaySchedule: isFiveDay
    };
};

module.exports = {
    TIMEZONE,
    getISTDateString,
    getISTTimeParts,
    formatTimeIST,
    formatDateReadable,
    isSunday,
    isSaturday,
    determineAttendanceStatus,
    isEarlyCheckOutBefore5PM,
    calculateDuration,
    getISTDayRange,
    calculateMonthWorkingDays
};
