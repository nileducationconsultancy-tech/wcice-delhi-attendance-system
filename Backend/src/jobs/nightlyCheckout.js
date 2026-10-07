const cron = require('node-cron');
const AttendanceRecord = require('../models/AttendanceRecordModel');
const { getISTDateString } = require('../utils/dateUtils');

const TIME_ZONE = 'Asia/Kolkata';

const startNightlyCheckoutJob = () => {
    // Run at 23:59 (11:59 PM) every day
    cron.schedule('59 23 * * *', async () => {
        try {
            const now = new Date();
            const dateStr = getISTDateString(now);

            // Find all records from today where they checked in but never checked out
            const openRecords = await AttendanceRecord.find({
                date: dateStr,
                firstIn: { $ne: null },
                lastOut: null
            });

            for (const record of openRecords) {
                // If totalWorkingMinutes not calculated, keep duration up to end of working hours or checkin
                record.workingHoursFormatted = record.workingHoursFormatted || '0h 0m';
                await record.save();
            }
        } catch (error) {
            console.error('Error in nightly cleanup job:', error);
        }
    }, {
        scheduled: true,
        timezone: TIME_ZONE
    });
};

module.exports = startNightlyCheckoutJob;
