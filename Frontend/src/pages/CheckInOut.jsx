import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { MapPin, Clock, Coffee, LogOut, CheckCircle2, AlertCircle, ShieldCheck, X, Loader2, Navigation } from 'lucide-react';
import axios from 'axios';

const CheckInOut = () => {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [attendanceStatus, setAttendanceStatus] = useState(null);
    const [todayMeta, setTodayMeta] = useState(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [locationData, setLocationData] = useState(null);

    // Confirmation Modal State
    const [confirmModal, setConfirmModal] = useState({
        isOpen: false,
        type: null, // 'CHECK_IN' or 'CHECK_OUT'
        loc: null
    });

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        fetchStatus();
        getCurrentGpsLocation(true).catch(() => {});
    }, []);

    const fetchStatus = async () => {
        try {
            const res = await axios.get('/api/attendance/today', { withCredentials: true });
            setAttendanceStatus(res.data.record);
            setTodayMeta(res.data);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getCurrentGpsLocation = (isSilent = false) => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                if (isSilent) return resolve(null);
                return reject(new Error('Geolocation is not supported by your browser.'));
            }
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const loc = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    };
                    setLocationData(loc);
                    resolve(loc);
                },
                (err) => {
                    console.warn('Geolocation error:', err.message);
                    if (isSilent) {
                        return resolve(null);
                    }
                    if (err.code === 1) {
                        reject(new Error('Location permission denied. Please allow location access in your browser to verify office attendance.'));
                    } else if (err.code === 2) {
                        reject(new Error('Unable to retrieve GPS position. Please ensure your device location is enabled.'));
                    } else if (err.code === 3) {
                        reject(new Error('GPS location request timed out. Please try again.'));
                    } else {
                        reject(new Error('Failed to acquire GPS location. Please enable location.'));
                    }
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
            );
        });
    };

    // Step 1: Click button -> Fetch live GPS -> Open confirmation modal
    const initiateAction = async (type) => {
        setActionLoading(true);
        setErrorMsg('');
        try {
            const loc = await getCurrentGpsLocation();
            setConfirmModal({
                isOpen: true,
                type,
                loc
            });
        } catch (error) {
            setErrorMsg(error.message || 'Failed to acquire GPS location.');
        } finally {
            setActionLoading(false);
        }
    };

    // Step 2: User clicks "Confirm" in modal -> Submit to API
    const handleConfirmedSubmit = async () => {
        setConfirmLoading(true);
        setErrorMsg('');
        try {
            const endpoint = confirmModal.type === 'CHECK_IN' ? '/api/attendance/check-in' : '/api/attendance/check-out';
            const res = await axios.post(endpoint, confirmModal.loc || locationData, { withCredentials: true });
            setAttendanceStatus(res.data.record);
            setConfirmModal({ isOpen: false, type: null, loc: null });
        } catch (error) {
            setErrorMsg(error.response?.data?.message || error.message || 'Action failed');
            setConfirmModal({ isOpen: false, type: null, loc: null });
        } finally {
            setConfirmLoading(false);
        }
    };

    const hasCheckedIn = !!attendanceStatus?.firstIn;
    const hasCheckedOut = !!attendanceStatus?.lastOut;

    let workingHours = '00 : 00';
    let progressPercentage = 0;
    
    if (hasCheckedIn && !hasCheckedOut) {
        const diffMs = currentTime.getTime() - new Date(attendanceStatus.firstIn).getTime();
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const mins = Math.floor((diffMs / (1000 * 60)) % 60);
        workingHours = `${String(hours).padStart(2, '0')} : ${String(mins).padStart(2, '0')}`;
        progressPercentage = Math.min((hours + mins/60) / 8 * 100, 100);
    }

    const formattedDate = new Intl.DateTimeFormat('en-GB', { 
        weekday: 'long', day: 'numeric', month: 'long' 
    }).format(currentTime);

    const formattedTime = new Intl.DateTimeFormat('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit'
    }).format(currentTime);

    if (loading) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
                
                {!hasCheckedIn ? (
                    // BEFORE CHECK IN
                    <div className="w-full max-w-md bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-slate-900"></div>
                        <div className="p-10 text-center flex flex-col items-center">
                            
                            <h1 className="text-xl font-bold text-slate-800 mb-2">Good Morning 👋</h1>
                            <p className="text-slate-500 font-medium">{formattedDate}</p>

                            {todayMeta?.isFestivalWorkingDay && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs flex items-center gap-2 text-left">
                                    <span className="text-lg">🎉</span>
                                    <span><strong>{todayMeta.holiday}</strong>: Festival timings active. Check-in today counts as a <strong>Full Day (PRESENT)</strong>.</span>
                                </div>
                            )}
                            
                            <div className="my-8">
                                <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Current Time</p>
                                <div className="text-5xl font-bold text-slate-900 tracking-tight font-mono">
                                    {formattedTime.split(' ')[0]} <span className="text-2xl text-slate-500 ml-1">{formattedTime.split(' ')[1]}</span>
                                </div>
                            </div>

                            {errorMsg && (
                                <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 text-left">
                                    <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <button 
                                onClick={() => initiateAction('CHECK_IN')}
                                disabled={actionLoading || loading}
                                className="w-full max-w-[280px] py-4 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 active:scale-[0.98] text-white rounded-2xl font-bold text-lg shadow-lg shadow-blue-500/25 transition-all flex justify-center items-center gap-3 disabled:opacity-50"
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 size={20} className="animate-spin" />
                                        <span>Locating GPS...</span>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                                        <span>CHECK IN</span>
                                    </>
                                )}
                            </button>

                            <div className="mt-10 space-y-2">
                                <p className="flex items-center justify-center gap-2 text-slate-600 font-medium">
                                    <MapPin size={18} className="text-blue-500" /> Office Location Verified
                                </p>
                            </div>

                            {locationData ? (
                                <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-full border border-blue-100">
                                    <CheckCircle2 size={16} /> GPS Ready (Accuracy: {Math.round(locationData.accuracy)}m)
                                </div>
                            ) : (
                                <div className="mt-8 flex items-center justify-center gap-2 text-sm font-semibold text-amber-600 bg-amber-50 px-4 py-2 rounded-full border border-amber-100">
                                    Acquiring GPS...
                                </div>
                            )}
                        </div>
                    </div>
                ) : !hasCheckedOut ? (
                    // AFTER CHECK IN (WORKING)
                    <div className="w-full max-w-md bg-white rounded-[24px] border border-emerald-200 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500"></div>
                        <div className="p-10 text-center flex flex-col items-center relative overflow-hidden">
                            
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-emerald-400/10 rounded-full blur-[80px] z-0"></div>

                            <div className="relative z-10 w-full flex flex-col items-center">
                                <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-700 font-bold px-4 py-1.5 rounded-full text-sm tracking-wide mb-8">
                                    <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse"></div>
                                    YOU ARE WORKING
                                </div>

                                <div className="flex justify-between items-start w-full mb-6 text-left px-4">
                                    <div>
                                        <p className="text-2xl font-bold text-slate-900">{new Date(attendanceStatus.firstIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        <p className="text-slate-500 font-medium text-sm">Checked In</p>
                                    </div>
                                    {attendanceStatus.checkInAddress && (
                                        <div className="max-w-[200px] text-right">
                                            <p className="text-xs text-slate-600 truncate font-medium flex items-center justify-end gap-1" title={attendanceStatus.checkInAddress}>
                                                <MapPin size={12} className="text-emerald-500 flex-shrink-0" />
                                                <span className="truncate">{attendanceStatus.checkInAddress}</span>
                                            </p>
                                            {attendanceStatus.checkInLocation?.latitude && (
                                                <a 
                                                    href={`https://maps.google.com/?q=${attendanceStatus.checkInLocation.latitude},${attendanceStatus.checkInLocation.longitude}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-600 hover:underline"
                                                >
                                                    View on Map
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="mb-10 w-full">
                                    <p className="text-sm font-semibold text-slate-400 uppercase tracking-widest mb-3">Working Time</p>
                                    <div className="text-6xl font-bold text-slate-900 tracking-tight font-mono">
                                        {workingHours}
                                    </div>
                                </div>

                                <div className="w-full px-4 mb-10">
                                    <div className="flex justify-between text-sm font-bold text-slate-500 mb-2">
                                        <span>Progress</span>
                                        <span>{Math.floor(progressPercentage)}%</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${progressPercentage}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {errorMsg && (
                                    <div className="mb-6 p-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-start gap-2 text-left w-full">
                                        <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                                        <span>{errorMsg}</span>
                                    </div>
                                )}

                                <div className="flex w-full gap-4 px-2">
                                    <button 
                                        onClick={() => initiateAction('CHECK_OUT')}
                                        disabled={actionLoading}
                                        className="flex-1 py-4 bg-red-500 hover:bg-red-600 active:scale-[0.98] text-white rounded-2xl font-bold shadow-lg shadow-red-500/25 transition-all flex justify-center items-center gap-2 disabled:opacity-50"
                                    >
                                        {actionLoading ? (
                                            <>
                                                <Loader2 size={20} className="animate-spin" />
                                                <span>Locating GPS...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogOut size={20} />
                                                <span>CHECK OUT</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    // CHECKED OUT
                    <div className="w-full max-w-md bg-white rounded-[24px] border border-slate-200 shadow-xl overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-2 bg-blue-500"></div>
                        <div className="p-10 text-center flex flex-col items-center">
                            
                            <div className="w-20 h-20 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            
                            <h1 className="text-2xl font-bold text-slate-900 mb-2">Day Completed!</h1>
                            <p className="text-slate-500 font-medium mb-8">You have successfully checked out.</p>

                            <div className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-6 text-left space-y-4">
                                <div className="border-b border-slate-200 pb-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium text-xs">Check In</span>
                                        <span className="font-bold text-slate-800 text-sm">{new Date(attendanceStatus.firstIn).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    {attendanceStatus.checkInAddress && (
                                        <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                                            <span className="truncate max-w-[220px]" title={attendanceStatus.checkInAddress}>📍 {attendanceStatus.checkInAddress}</span>
                                            {attendanceStatus.checkInLocation?.latitude && (
                                                <a 
                                                    href={`https://maps.google.com/?q=${attendanceStatus.checkInLocation.latitude},${attendanceStatus.checkInLocation.longitude}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-600 hover:underline flex-shrink-0"
                                                >
                                                    Map
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="border-b border-slate-200 pb-3">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500 font-medium text-xs">Check Out</span>
                                        <span className="font-bold text-slate-800 text-sm">{new Date(attendanceStatus.lastOut).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    </div>
                                    {attendanceStatus.checkOutAddress && (
                                        <div className="text-xs text-slate-600 mt-1 flex items-center justify-between">
                                            <span className="truncate max-w-[220px]" title={attendanceStatus.checkOutAddress}>📍 {attendanceStatus.checkOutAddress}</span>
                                            {attendanceStatus.checkOutLocation?.latitude && (
                                                <a 
                                                    href={`https://maps.google.com/?q=${attendanceStatus.checkOutLocation.latitude},${attendanceStatus.checkOutLocation.longitude}`} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-blue-600 hover:underline flex-shrink-0"
                                                >
                                                    Map
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div className="flex justify-between pt-1">
                                    <span className="text-slate-500 font-medium text-sm">Working Time</span>
                                    <span className="font-bold text-blue-600 text-sm">
                                        {Math.floor(attendanceStatus.totalWorkingMinutes / 60)}h {attendanceStatus.totalWorkingMinutes % 60}m
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

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
                                            ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/25'
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

export default CheckInOut;
