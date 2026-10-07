import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import useAuthStore from '../store/authStore';
import { 
    Users, UserCheck, Clock, UserX, 
    Calendar, CalendarCheck, Percent, IndianRupee, RefreshCw 
} from 'lucide-react';
import axios from 'axios';
import AdminDocumentStatsCard from '../components/documents/AdminDocumentStatsCard';

const AdminDashboard = () => {
    const { user } = useAuthStore();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchDashboardStats = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get('/api/dashboard/admin');
            setDashboardData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load dashboard statistics.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const todayFormatted = new Intl.DateTimeFormat('en-GB', { 
        weekday: 'long', 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
    }).format(new Date());

    const stats = dashboardData?.stats || {
        totalEmployees: 0,
        presentToday: 0,
        halfDayToday: 0,
        absentToday: 0,
        monthWorkingDays: 0,
        monthAttendancePercentage: 0,
        monthTotalPayroll: 0
    };

    const recentActivity = dashboardData?.recentActivity || [];

    return (
        <Layout>
            <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full space-y-4 sm:space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Good Morning, {user?.name || 'Dr. Feroz'} 👋
                        </h1>
                        <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
                            Attendance & Workforce Overview for {todayFormatted}
                        </p>
                    </div>
                    <button 
                        onClick={fetchDashboardStats} 
                        className="flex items-center gap-2 px-3.5 sm:px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs sm:text-sm transition-colors w-full sm:w-auto justify-center"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs sm:text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* 8 Clean KPI Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {/* 1. Total Employees */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Employees</span>
                            <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                                <Users size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900">{stats.totalEmployees}</div>
                        <div className="text-[11px] text-slate-400 font-medium mt-1">Active workforce</div>
                    </div>

                    {/* 2. Present Today */}
                    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Present Today</span>
                            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                                <UserCheck size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-emerald-900">{stats.presentToday}</div>
                        <div className="text-[11px] text-emerald-700 font-medium mt-1">Full day attendance</div>
                    </div>

                    {/* 3. Half Day Today */}
                    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Half Day Today</span>
                            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                                <Clock size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-amber-900">{stats.halfDayToday}</div>
                        <div className="text-[11px] text-amber-700 font-medium mt-1">Half day attendance</div>
                    </div>

                    {/* 4. Absent Today */}
                    <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Absent Today</span>
                            <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center">
                                <UserX size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-rose-900">{stats.absentToday}</div>
                        <div className="text-[11px] text-rose-700 font-medium mt-1">No check-in on working day</div>
                    </div>

                    {/* 5. Today's Holiday */}
                    <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Today's Holiday</span>
                            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                                <Calendar size={18} />
                            </div>
                        </div>
                        <div className="text-xl font-bold text-purple-900 truncate">
                            {dashboardData?.holidayToday || (dashboardData?.isSunday ? 'Sunday (Weekly OFF)' : 'Regular Working Day')}
                        </div>
                        <div className="text-[11px] text-purple-700 font-medium mt-1">
                            {dashboardData?.holidayToday ? 'Company Holiday' : (dashboardData?.isSunday ? 'Office Closed' : 'Mon - Sat schedule')}
                        </div>
                    </div>

                    {/* 6. Current Month Working Days */}
                    <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Month Working Days</span>
                            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                                <CalendarCheck size={18} />
                            </div>
                        </div>
                        <div className="text-3xl font-extrabold text-blue-900">{stats.monthWorkingDays} Days</div>
                        <div className="text-[11px] text-blue-700 font-medium mt-1">Excludes Sundays & Holidays</div>
                    </div>

                    {/* 7. Current Month Attendance % */}
                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md flex flex-col justify-between">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Month Attendance %</span>
                            <div className="w-8 h-8 rounded-xl bg-slate-800 text-cyan-400 flex items-center justify-center">
                                <Percent size={18} />
                            </div>
                        </div>
                        <div>
                            <div className="text-3xl font-extrabold text-white">{stats.monthAttendancePercentage}%</div>
                            <div className="text-[11px] text-slate-400 font-medium mt-1">Based on active working days</div>
                        </div>
                    </div>

                    {/* 8. Current Month Payroll */}
                    <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 shadow-xs">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Month Payroll</span>
                            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                                <IndianRupee size={18} />
                            </div>
                        </div>
                        <div className="text-2xl font-extrabold text-indigo-900">₹{stats.monthTotalPayroll.toLocaleString('en-IN')}</div>
                        <div className="text-[11px] text-indigo-700 font-medium mt-1">Attendance-adjusted payout</div>
                    </div>
                </div>

                {/* Employee Document Management Overview */}
                <AdminDocumentStatsCard />

                {/* Today's Live Attendance Feed */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex justify-between items-center">
                        <div>
                            <h2 className="text-base font-bold text-slate-800">Today's Live Attendance Activity</h2>
                            <p className="text-xs text-slate-500 mt-0.5">Real-time check-in and checkout logs for today</p>
                        </div>
                    </div>

                    {recentActivity.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No employee check-ins recorded yet for today.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="py-3 px-4">Employee</th>
                                        <th className="py-3 px-4">Designation</th>
                                        <th className="py-3 px-4">Check In</th>
                                        <th className="py-3 px-4">Check Out</th>
                                        <th className="py-3 px-4">Working Hours</th>
                                        <th className="py-3 px-4 text-right">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {recentActivity.map((rec) => (
                                        <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4 font-semibold text-slate-900">{rec.employeeName}</td>
                                            <td className="py-3.5 px-4 text-slate-600">{rec.designation || 'Staff'}</td>
                                            <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">{rec.firstIn || '--:--'}</td>
                                            <td className="py-3.5 px-4 font-mono text-slate-700 text-xs">{rec.lastOut || '--:--'}</td>
                                            <td className="py-3.5 px-4 font-medium text-blue-600 text-xs">{rec.workingHours}</td>
                                            <td className="py-3.5 px-4 text-right">
                                                <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                                                    rec.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                                                    rec.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {rec.status === 'PRESENT' ? 'Present' : (rec.status === 'HALF_DAY' ? 'Half Day' : rec.status)}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

            </div>
        </Layout>
    );
};

export default AdminDashboard;
