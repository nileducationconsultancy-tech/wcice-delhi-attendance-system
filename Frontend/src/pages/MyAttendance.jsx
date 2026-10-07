import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Calendar, Clock, CheckCircle2, AlertCircle, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';

const MyAttendance = () => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchMyAttendance();
    }, [year, month]);

    const fetchMyAttendance = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/attendance/my?year=${year}&month=${month}`);
            setAttendanceData(res.data);
        } catch (error) {
            console.error('Error fetching attendance history:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(year - 1);
        } else {
            setMonth(month - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(year + 1);
        } else {
            setMonth(month + 1);
        }
    };

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    const summary = attendanceData?.summary || {
        totalWorkingDays: 0,
        presentDays: 0,
        halfDays: 0,
        absentDays: 0,
        paidDays: 0,
        holidayCount: 0,
        sundayCount: 0,
        attendancePercentage: 0
    };

    const history = attendanceData?.history || [];

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-6xl mx-auto w-full space-y-6 pb-12">
                
                {/* Header & Month Selector */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">My Attendance History</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Review your daily punch logs and working hours</p>
                    </div>

                    <div className="flex items-center gap-3 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                        <button 
                            onClick={handlePrevMonth}
                            className="p-2 hover:bg-white hover:shadow-xs rounded-lg transition-all text-slate-600 hover:text-slate-900"
                            title="Previous Month"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <span className="font-bold text-sm text-slate-800 px-3 min-w-[140px] text-center">
                            {monthNames[month - 1]} {year}
                        </span>
                        <button 
                            onClick={handleNextMonth}
                            className="p-2 hover:bg-white hover:shadow-xs rounded-lg transition-all text-slate-600 hover:text-slate-900"
                            title="Next Month"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>

                {/* Summary KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working Days</span>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{summary.totalWorkingDays} <span className="text-xs font-medium text-slate-400">Days</span></div>
                        <p className="text-[11px] text-slate-400 mt-1">Excluding Sundays & Holidays</p>
                    </div>

                    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Present</span>
                        <div className="text-3xl font-extrabold text-emerald-900 mt-2">{summary.presentDays} <span className="text-xs font-medium text-emerald-600">Days</span></div>
                        <p className="text-[11px] text-emerald-700 mt-1">Full Day</p>
                    </div>

                    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Half Days</span>
                        <div className="text-3xl font-extrabold text-amber-900 mt-2">{summary.halfDays} <span className="text-xs font-medium text-amber-600">Days</span></div>
                        <p className="text-[11px] text-amber-700 mt-1">Half Day</p>
                    </div>

                    <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs">
                        <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Absent</span>
                        <div className="text-3xl font-extrabold text-rose-900 mt-2">{summary.absentDays} <span className="text-xs font-medium text-rose-600">Days</span></div>
                        <p className="text-[11px] text-rose-700 mt-1">Scheduled working days</p>
                    </div>
                </div>

                {/* Daily Punch Logs Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <h2 className="text-base font-bold text-slate-800">Daily Punch Logs</h2>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
                            Attendance: {summary.attendancePercentage}%
                        </span>
                    </div>

                    {loading ? (
                        <div className="p-12 flex items-center justify-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    ) : history.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No attendance records found for this period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="py-3.5 px-4">Date</th>
                                        <th className="py-3.5 px-4">Day</th>
                                        <th className="py-3.5 px-4">Check In</th>
                                        <th className="py-3.5 px-4">Check Out</th>
                                        <th className="py-3.5 px-4">Working Hours</th>
                                        <th className="py-3.5 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {history.map((row) => {
                                        return (
                                            <tr key={row.date} className="hover:bg-slate-50/50 transition-colors">
                                                <td className="py-3.5 px-4 font-semibold text-slate-900 font-mono text-xs">
                                                    {row.date}
                                                </td>
                                                <td className="py-3.5 px-4 text-slate-600 text-xs">
                                                    {row.dayOfWeek}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                                                    {row.checkIn || '--:--'}
                                                </td>
                                                <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">
                                                    {row.checkOut || '--:--'}
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-slate-700 text-xs">
                                                    {row.workingHours}
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    {row.status === 'PRESENT' ? (
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                                                            Present
                                                        </span>
                                                    ) : row.status === 'HALF_DAY' ? (
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800">
                                                            Half Day
                                                        </span>
                                                    ) : row.status === 'ABSENT' ? (
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                                                            Absent
                                                        </span>
                                                    ) : row.status === 'HOLIDAY' ? (
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800">
                                                            Holiday ({row.holidayName || 'OFF'})
                                                        </span>
                                                    ) : row.status === 'SUNDAY' ? (
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                                                            Sunday OFF
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-400">
                                                            --
                                                        </span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
};

export default MyAttendance;
