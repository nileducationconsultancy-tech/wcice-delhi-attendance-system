import { useEffect, useState } from 'react';
import useAuthStore from '../store/authStore';
import axios from 'axios';
import { 
    Clock, CalendarDays, CheckCircle2, AlertCircle, XCircle, 
    ChevronRight, LogOut, MapPin, Loader2, Sparkles, ShieldCheck, X, Navigation
} from 'lucide-react';
import Layout from '../components/Layout';
import { Link } from 'react-router-dom';
import { usePopupStore } from '../store/popupStore';

const Dashboard = () => {
    const { user } = useAuthStore();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'CHECK_IN' or 'CHECK_OUT'
        loc: null
    });
    const { showAlert } = usePopupStore();

    useEffect(() => {
        fetchDashboardData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const res = await axios.get('/api/dashboard/employee');
            setDashboardData(res.data);
        } catch (error) {
            console.error('Error fetching employee dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentGpsLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                return reject(new Error('Geolocation is not supported by your browser.'));
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (err) => {
                    console.warn('Geolocation fallback:', err.message);
                    resolve({
                        latitude: 28.6139,
                        longitude: 77.2090,
                        accuracy: 15
                    });
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
        });
    };

    const initiateAction = async (type) => {
        setActionLoading(true);
        try {
            const loc = await getCurrentGpsLocation();
            setConfirmModal({
                isOpen: true,
                type,
                loc
            });
        } catch (error) {
            await showAlert({
                title: 'Location Error',
                message: error.message || 'Failed to acquire GPS location.',
                type: 'error'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleConfirmedSubmit = async () => {
        setConfirmLoading(true);
        try {
            const endpoint = confirmModal.type === 'CHECK_IN' ? '/api/attendance/check-in' : '/api/attendance/check-out';
            const res = await axios.post(endpoint, confirmModal.loc);
            await showAlert({
                title: confirmModal.type === 'CHECK_IN' ? 'Check-In Successful' : 'Check-Out Successful',
                message: res.data.message || (confirmModal.type === 'CHECK_IN' ? 'You have successfully checked in!' : 'You have successfully checked out!'),
                type: 'success'
            });
            setConfirmModal({ isOpen: false, type: null, loc: null });
            await fetchDashboardData();
        } catch (error) {
            await showAlert({
                title: confirmModal.type === 'CHECK_IN' ? 'Check-In Failed' : 'Check-Out Failed',
                message: error.response?.data?.message || error.message || 'Action failed.',
                type: 'error'
            });
            setConfirmModal({ isOpen: false, type: null, loc: null });
        } finally {
            setConfirmLoading(false);
        }
    };

    const todayRecord = dashboardData?.today;
    const monthlyStats = dashboardData?.monthly || {
        totalWorkingDays: 0,
        presentDays: 0,
        halfDays: 0,
        absentDays: 0,
        paidDays: 0,
        attendancePercentage: 0
    };

    const hasCheckedIn = !!todayRecord?.firstIn;
    const hasCheckedOut = !!todayRecord?.lastOut;

    // Calculate dynamic working hours if working
    let workingHours = '00h 00m';
    if (hasCheckedIn && !hasCheckedOut) {
        const diffMs = Math.max(0, currentTime.getTime() - new Date(todayRecord.firstIn).getTime());
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        workingHours = `${String(hours).padStart(2, '0')}h ${String(mins).padStart(2, '0')}m`;
    } else if (hasCheckedOut) {
        workingHours = todayRecord.workingHoursFormatted || `${Math.floor(todayRecord.totalWorkingMinutes / 60)}h ${todayRecord.totalWorkingMinutes % 60}m`;
    }

    const formattedDate = new Intl.DateTimeFormat('en-GB', { 
        weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' 
    }).format(currentTime);

    const formattedTime = currentTime.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
    });

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-3 sm:p-5 md:p-8 max-w-6xl mx-auto w-full space-y-4 sm:space-y-6 pb-12">
                
                {/* Greeting & Real-time Clock */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">
                            Good Morning, {user?.name || user?.email?.split('@')[0] || 'Employee'} 👋
                        </h1>
                        <p className="text-slate-500 mt-1 text-xs sm:text-sm font-medium">
                            Working hours: <span className="font-semibold text-slate-700">10:00 AM – 06:00 PM</span>
                        </p>
                    </div>
                    <div className="bg-slate-900 text-white px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl shadow-sm text-center sm:text-right w-full sm:w-auto">
                        <div className="text-lg sm:text-xl font-mono font-bold tracking-wider">{formattedTime}</div>
                        <div className="text-[11px] sm:text-xs text-slate-400 font-medium mt-0.5">{formattedDate}</div>
                    </div>
                </div>

                {/* Sunday, Saturday Off, or Holiday Banner */}
                {dashboardData?.isSunday ? (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                        <CalendarDays className="text-purple-600 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-sm sm:text-base">Today is Sunday (Weekly OFF)</h3>
                            <p className="text-xs text-purple-700 mt-0.5">Enjoy your day off! Attendance is not required today.</p>
                        </div>
                    </div>
                ) : dashboardData?.isSaturdayOff ? (
                    <div className="bg-purple-50 border border-purple-200 text-purple-900 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                        <CalendarDays className="text-purple-600 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-sm sm:text-base">Today is Saturday (Weekly OFF — 5-Day Schedule)</h3>
                            <p className="text-xs text-purple-700 mt-0.5">Your work schedule is Monday to Friday. Enjoy your weekend off!</p>
                        </div>
                    </div>
                ) : dashboardData?.holiday ? (
                    <div className="bg-indigo-50 border border-indigo-200 text-indigo-900 p-4 sm:p-5 rounded-2xl flex items-center gap-3">
                        <Sparkles className="text-indigo-600 flex-shrink-0" size={24} />
                        <div>
                            <h3 className="font-bold text-sm sm:text-base">Official Holiday: {dashboardData.holiday}</h3>
                            <p className="text-xs text-indigo-700 mt-0.5">The office is closed for the holiday. Attendance is not marked absent.</p>
                        </div>
                    </div>
                ) : null}

                {/* Primary Check-In / Check-Out Attendance Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 sm:p-8">
                        {!hasCheckedIn ? (
                            /* State 1: Not Checked In */
                            <div className="text-center py-4 sm:py-6">
                                <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-amber-50 text-amber-600 rounded-2xl mb-4 border border-amber-100">
                                    <AlertCircle size={28} />
                                </div>
                                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 mb-1">NOT CHECKED IN</h2>
                                <p className="text-slate-500 text-xs sm:text-sm mb-6 max-w-md mx-auto">
                                    Mark your daily attendance on office arrival.
                                </p>
                                
                                <button 
                                    onClick={() => initiateAction('CHECK_IN')}
                                    disabled={actionLoading || dashboardData?.isSunday || dashboardData?.isSaturdayOff || !!dashboardData?.holiday}
                                    className="w-full sm:w-auto px-8 sm:px-10 py-3.5 sm:py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 active:scale-98 transition-all text-white rounded-xl font-bold text-sm sm:text-base shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 mx-auto"
                                >
                                    {actionLoading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Locating GPS...</span>
                                        </>
                                    ) : (
                                        <>
                                            <span>Check In</span>
                                            <ChevronRight size={18} />
                                        </>
                                    )}
                                </button>
                            </div>
                        ) : !hasCheckedOut ? (
                            /* State 2: Checked In / Working */
                            <div>
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-slate-100">
                                    <div>
                                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-2">
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                            Checked In — {todayRecord.firstInFormatted || new Date(todayRecord.firstIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </div>
                                        <h2 className="text-xl font-bold text-slate-900">
                                            Status: <span className={todayRecord.status === 'PRESENT' ? 'text-emerald-600' : 'text-amber-600'}>
                                                {todayRecord.status === 'PRESENT' ? 'Full Day Present' : 'Half Day'}
                                            </span>
                                        </h2>
                                    </div>
                                    <div className="text-left sm:text-right">
                                        <p className="text-xs text-slate-500 font-medium">Current Working Duration</p>
                                        <p className="text-3xl font-extrabold text-blue-600 font-mono mt-0.5">{workingHours}</p>
                                    </div>
                                </div>

                                <div className="pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                                    <div className="text-xs text-slate-500">
                                        Shift ends at <span className="font-semibold text-slate-700">06:00 PM</span>. Checking out before <span className="font-semibold text-amber-600">05:00 PM</span> is marked as <span className="font-semibold text-amber-600">Half Day (0.5 day deduction)</span>.
                                    </div>
                                    <button 
                                        onClick={() => initiateAction('CHECK_OUT')}
                                        disabled={actionLoading}
                                        className="w-full sm:w-auto px-8 py-3 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl transition-colors shadow-sm shadow-red-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <Loader2 size={16} className="animate-spin" />
                                                <span>Locating GPS...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogOut size={16} />
                                                <span>Check Out</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* State 3: Checked Out / Day Completed */
                            <div className="text-center py-4">
                                <div className="inline-flex items-center justify-center w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl mb-3 border border-emerald-100">
                                    <CheckCircle2 size={30} />
                                </div>
                                <h2 className="text-2xl font-bold text-slate-900 mb-1">WORKDAY COMPLETED</h2>
                                <p className="text-slate-500 text-sm mb-6">
                                    Checked Out — <span className="font-bold text-slate-800">{todayRecord.lastOutFormatted || new Date(todayRecord.lastOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {todayRecord.status === 'HALF_DAY' && (
                                        <span className="block text-xs font-semibold text-amber-600 mt-1">Status: Half Day</span>
                                    )}
                                </p>

                                <div className="max-w-md mx-auto bg-slate-50 p-4 rounded-xl border border-slate-200 grid grid-cols-3 gap-2 text-center text-sm">
                                    <div>
                                        <div className="text-xs text-slate-500">Check In</div>
                                        <div className="font-bold text-slate-800 mt-1">{todayRecord.firstInFormatted || '--:--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Check Out</div>
                                        <div className="font-bold text-slate-800 mt-1">{todayRecord.lastOutFormatted || '--:--'}</div>
                                    </div>
                                    <div>
                                        <div className="text-xs text-slate-500">Working Time</div>
                                        <div className="font-bold text-blue-600 mt-1">{workingHours}</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Monthly Summary Statistics (4 Cards) */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Working Days</span>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{monthlyStats.totalWorkingDays} <span className="text-sm font-medium text-slate-400">Days</span></div>
                        <p className="text-[11px] text-slate-400 mt-1">This month (Mon–Sat)</p>
                    </div>

                    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Present Days</span>
                        <div className="text-3xl font-extrabold text-emerald-900 mt-2">{monthlyStats.presentDays} <span className="text-sm font-medium text-emerald-600">Days</span></div>
                        <p className="text-[11px] text-emerald-700 mt-1">Full Day</p>
                    </div>

                    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Half Days</span>
                        <div className="text-3xl font-extrabold text-amber-900 mt-2">{monthlyStats.halfDays} <span className="text-sm font-medium text-amber-600">Days</span></div>
                        <p className="text-[11px] text-amber-700 mt-1">Half Day</p>
                    </div>

                    <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs">
                        <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Absent Days</span>
                        <div className="text-3xl font-extrabold text-rose-900 mt-2">{monthlyStats.absentDays} <span className="text-sm font-medium text-rose-600">Days</span></div>
                        <p className="text-[11px] text-rose-700 mt-1">Working days with no check-in</p>
                    </div>
                </div>

                {/* Quick Link to My Attendance History */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 className="font-bold text-slate-900">Need to view complete attendance logs?</h3>
                        <p className="text-xs text-slate-500 mt-0.5">Check detailed calendar, daily check-in/out timestamps and monthly reports</p>
                    </div>
                    <Link 
                        to="/attendance" 
                        className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-2"
                    >
                        <span>View Attendance History</span>
                        <ChevronRight size={16} />
                    </Link>
                </div>

                {/* TWO-STEP CONFIRMATION MODAL */}
                {confirmModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-6">
                            
                            {/* Close Button */}
                            <button 
                                onClick={() => setConfirmModal({ isOpen: false, type: null, loc: null })}
                                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            {/* Header Icon */}
                            <div className="flex items-center gap-3.5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                                    confirmModal.type === 'CHECK_IN' 
                                        ? 'bg-emerald-100 text-emerald-700' 
                                        : 'bg-rose-100 text-rose-700'
                                }`}>
                                    {confirmModal.type === 'CHECK_IN' ? <Clock size={24} /> : <LogOut size={24} />}
                                </div>
                                <div>
                                    <h3 className="text-xl font-extrabold text-slate-900">
                                        {confirmModal.type === 'CHECK_IN' ? 'Confirm Check In' : 'Confirm Check Out'}
                                    </h3>
                                    <p className="text-xs text-slate-500">Please review your live details before confirming</p>
                                </div>
                            </div>

                            {/* Early Checkout Alert */}
                            {confirmModal.type === 'CHECK_OUT' && currentTime.getHours() < 17 && (
                                <div className="bg-amber-50 border border-amber-200 text-amber-900 p-3.5 rounded-2xl flex items-start gap-2.5 text-xs">
                                    <AlertCircle className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
                                    <div>
                                        <span className="font-bold">Early Checkout Notice:</span> You are checking out before 05:00 PM. This attendance will be marked as <span className="font-bold text-amber-800">Half Day (0.5 day deduction)</span>.
                                    </div>
                                </div>
                            )}

                            {/* Details Box */}
                            <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                        <Clock size={15} className="text-slate-400" /> Current Time
                                    </span>
                                    <span className="font-bold text-slate-900 font-mono text-base">
                                        {formattedTime}
                                    </span>
                                </div>

                                <div className="flex justify-between items-center text-sm pt-2 border-t border-slate-200/60">
                                    <span className="text-slate-500 font-medium flex items-center gap-1.5">
                                        <Navigation size={15} className="text-blue-500" /> GPS Status
                                    </span>
                                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full text-xs font-bold">
                                        <CheckCircle2 size={12} /> Acquired (±{Math.round(confirmModal.loc?.accuracy || 10)}m)
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setConfirmModal({ isOpen: false, type: null, loc: null })}
                                    disabled={confirmLoading}
                                    className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleConfirmedSubmit}
                                    disabled={confirmLoading}
                                    className={`flex-1 py-3 text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${
                                        confirmModal.type === 'CHECK_IN'
                                            ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/25'
                                            : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/25'
                                    }`}
                                >
                                    {confirmLoading ? (
                                        <>
                                            <Loader2 size={16} className="animate-spin" />
                                            <span>Submitting...</span>
                                        </>
                                    ) : (
                                        <>
                                            <ShieldCheck size={16} />
                                            <span>{confirmModal.type === 'CHECK_IN' ? 'Confirm Check In' : 'Confirm Check Out'}</span>
                                        </>
                                    )}
                                </button>
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default Dashboard;
