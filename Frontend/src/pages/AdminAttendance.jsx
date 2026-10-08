import { useState, useEffect, useCallback, useMemo } from 'react';
import Layout from '../components/Layout';
import { Search, Calendar, UserCheck, Clock, UserX, RefreshCw, PlusCircle, Edit3, X, CheckCircle2, AlertCircle, Sparkles, LogOut } from 'lucide-react';
import axios from 'axios';
import { attendanceApi } from '../services/api/attendanceApi';
import { employeeApi } from '../services/api/employeeApi';
import { usePopupStore } from '../store/popupStore';

const AdminAttendance = () => {
    const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD
    const [selectedDate, setSelectedDate] = useState(todayStr);
    const [overviewData, setOverviewData] = useState(null);
    const [activeEmployees, setActiveEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    // Manual Entry Modal State
    const [manualModal, setManualModal] = useState({
        isOpen: false,
        employeeId: '',
        employeeName: '',
        date: todayStr,
        status: 'PRESENT',
        checkInTime: '11:00',
        checkOutTime: '18:00',
        remarks: 'GPS issue override approved by Admin'
    });

    // Quick Punch Out Modal State (for employees who checked in but missed checkout)
    const [punchOutModal, setPunchOutModal] = useState({
        isOpen: false,
        employeeId: '',
        employeeName: '',
        date: todayStr,
        checkInFormatted: '',
        checkOutTime: '18:00',
        remarks: 'Employee forgot check-out, manual out recorded by Admin'
    });
    const [submitting, setSubmitting] = useState(false);

    const { showAlert } = usePopupStore();

    const fetchAttendance = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/attendance/admin/overview?date=${selectedDate}`);
            setOverviewData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to fetch attendance data');
        } finally {
            setLoading(false);
        }
    }, [selectedDate]);

    const fetchEmployees = useCallback(async () => {
        try {
            const res = await employeeApi.getAll({ limit: 200, status: 'ACTIVE' });
            setActiveEmployees(res.data.employees || []);
        } catch (err) {
            console.error('Failed to fetch employees list:', err);
        }
    }, []);

    useEffect(() => {
        fetchAttendance();
    }, [fetchAttendance]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const records = useMemo(() => overviewData?.records || [], [overviewData]);
    
    const filteredRecords = useMemo(() => {
        if (!searchTerm.trim()) return records;
        const term = searchTerm.toLowerCase();
        return records.filter(r => 
            r.name?.toLowerCase().includes(term) ||
            r.employeeId?.toString().toLowerCase().includes(term) ||
            r.designation?.toLowerCase().includes(term)
        );
    }, [records, searchTerm]);

    const { total, present, halfDay, absent } = useMemo(() => {
        return {
            total: records.length,
            present: records.filter(r => r.status === 'PRESENT').length,
            halfDay: records.filter(r => r.status === 'HALF_DAY').length,
            absent: records.filter(r => r.status === 'ABSENT').length
        };
    }, [records]);

    const formatTimeTo24Hour = (timeStr, defaultTime = '11:00') => {
        if (!timeStr || timeStr === '--:--') return defaultTime;
        const clean = timeStr.trim();
        if (/^\d{2}:\d{2}$/.test(clean)) return clean;
        const match = clean.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/i);
        if (!match) return defaultTime;
        let hours = parseInt(match[1], 10);
        const minutes = match[2];
        const ampm = match[3]?.toUpperCase();
        if (ampm === 'PM' && hours < 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        return `${String(hours).padStart(2, '0')}:${minutes}`;
    };

    const calculateLiveDuration = (checkIn, checkOut, status) => {
        if (status === 'ABSENT') return '0h 0m';
        if (!checkIn || !checkOut) return '7h 0m';
        const inParts = checkIn.split(':').map(Number);
        let outParts = checkOut.split(':').map(Number);
        let inMins = (inParts[0] || 0) * 60 + (inParts[1] || 0);
        let outMins = (outParts[0] || 0) * 60 + (outParts[1] || 0);
        if (outMins <= inMins && outParts[0] < 12) {
            outMins += 12 * 60;
        }
        const diff = Math.max(0, outMins - inMins);
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        return `${h}h ${m}m`;
    };

    // Open Manual Entry Modal for a specific employee
    const handleOpenManualForEmp = (emp) => {
        setManualModal({
            isOpen: true,
            employeeId: emp._id,
            employeeName: emp.name,
            date: selectedDate,
            status: emp.status === 'HALF_DAY' ? 'PRESENT' : (emp.status === 'ABSENT' ? 'PRESENT' : emp.status || 'PRESENT'),
            checkInTime: formatTimeTo24Hour(emp.firstIn, '11:00'),
            checkOutTime: formatTimeTo24Hour(emp.lastOut, '18:00'),
            remarks: 'Manual attendance override approved by Admin'
        });
    };

    // Open Manual Entry Modal from top bar
    const handleOpenGenericManual = () => {
        setManualModal({
            isOpen: true,
            employeeId: activeEmployees[0]?._id || '',
            employeeName: activeEmployees[0]?.name || '',
            date: selectedDate,
            status: 'PRESENT',
            checkInTime: '11:00',
            checkOutTime: '18:00',
            remarks: 'GPS issue / Technical trouble override'
        });
    };

    // Submit Manual Entry
    const handleManualSubmit = async (e) => {
        e.preventDefault();
        if (!manualModal.employeeId) {
            await showAlert({
                title: 'Validation Error',
                message: 'Please select an employee.',
                type: 'warning'
            });
            return;
        }

        setSubmitting(true);
        try {
            const res = await attendanceApi.markManual({
                employeeId: manualModal.employeeId,
                date: manualModal.date,
                status: manualModal.status,
                checkInTime: manualModal.checkInTime,
                checkOutTime: manualModal.checkOutTime,
                remarks: manualModal.remarks
            });

            setManualModal({ ...manualModal, isOpen: false });
            await showAlert({
                title: 'Attendance Overridden',
                message: res.data.message || 'Attendance marked successfully.',
                type: 'success'
            });
            fetchAttendance();
        } catch (err) {
            await showAlert({
                title: 'Error',
                message: err.response?.data?.message || 'Failed to mark manual attendance.',
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    // Open Quick Punch Out Modal for employee who checked in but missed checkout
    const handleOpenPunchOutForEmp = (emp) => {
        setPunchOutModal({
            isOpen: true,
            employeeId: emp._id,
            employeeName: emp.name,
            date: selectedDate,
            checkInFormatted: emp.firstIn !== '--:--' ? emp.firstIn : '11:00 AM',
            checkOutTime: '18:00',
            remarks: 'Employee forgot check-out, manual out recorded by Admin'
        });
    };

    // Submit Quick Punch Out
    const handlePunchOutSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await attendanceApi.markManual({
                employeeId: punchOutModal.employeeId,
                date: punchOutModal.date,
                checkOutTime: punchOutModal.checkOutTime,
                remarks: punchOutModal.remarks,
                isCheckOutOnly: true
            });

            setPunchOutModal({ ...punchOutModal, isOpen: false });
            await showAlert({
                title: 'Punch-Out Recorded',
                message: res.data.message || 'Check-out recorded successfully.',
                type: 'success'
            });
            fetchAttendance();
        } catch (err) {
            await showAlert({
                title: 'Error',
                message: err.response?.data?.message || 'Failed to record check-out.',
                type: 'error'
            });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Management</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            {overviewData?.isFestivalWorkingDay ? (
                                <span className="text-amber-700 font-semibold flex items-center gap-1">
                                    <span>🎉</span> Special Occasion: {overviewData.holiday} (Full Day Concession Active)
                                </span>
                            ) : overviewData?.holiday ? (
                                `Holiday: ${overviewData.holiday}`
                            ) : overviewData?.isSunday ? (
                                'Sunday (Weekly OFF)'
                            ) : (
                                'Live daily punch logs'
                            )}
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3.5 py-2 rounded-xl">
                            <Calendar size={16} className="text-slate-500" />
                            <input 
                                type="date" 
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="bg-transparent text-sm font-semibold text-slate-800 outline-none cursor-pointer"
                            />
                        </div>

                        {/* Manual Attendance Override Button */}
                        <button
                            onClick={handleOpenGenericManual}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm px-3.5 py-2.5 rounded-xl shadow-xs flex items-center gap-2 transition-all active:scale-98"
                            title="Manually mark or correct attendance for any employee"
                        >
                            <PlusCircle size={16} />
                            <span>Manual Entry</span>
                        </button>

                        <button 
                            onClick={fetchAttendance}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* Festival Day Banner */}
                {overviewData?.isFestivalWorkingDay && (
                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 text-amber-900 px-5 py-3.5 rounded-2xl flex items-center justify-between shadow-xs">
                        <div className="flex items-center gap-3">
                            <span className="text-2xl">🎉</span>
                            <div>
                                <h3 className="font-bold text-sm">Special Festival Concession Active Today</h3>
                                <p className="text-xs text-amber-700 mt-0.5">
                                    Today is <strong>{overviewData.holiday}</strong>. Any employee who checks in today gets <strong>Full Day Present (1.0 day)</strong> marked regardless of check-in time.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Error Banner */}
                {error && (
                    <div className="bg-rose-50 border border-rose-200 text-rose-700 p-4 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Metrics Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active</span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">{total}</div>
                    </div>
                    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Present</span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1">{present}</div>
                    </div>
                    <div className="bg-amber-50/70 p-5 rounded-2xl border border-amber-200 shadow-xs">
                        <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">Half Day</span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-amber-900 mt-1">{halfDay}</div>
                    </div>
                    <div className="bg-rose-50/70 p-5 rounded-2xl border border-rose-200 shadow-xs">
                        <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Absent</span>
                        <div className="text-2xl sm:text-3xl font-extrabold text-rose-900 mt-1">{absent}</div>
                    </div>
                </div>

                {/* Attendance Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <h2 className="text-base font-bold text-slate-800">
                            Daily Punch Overview <span className="text-xs font-normal text-slate-400 font-mono">({selectedDate})</span>
                        </h2>
                        
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                            <input 
                                type="text"
                                placeholder="Search employees..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No employee attendance records found for this date.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="px-5 py-3.5">Employee</th>
                                        <th className="px-4 py-3.5">Designation</th>
                                        <th className="px-4 py-3.5">Check In</th>
                                        <th className="px-4 py-3.5">Check Out</th>
                                        <th className="px-4 py-3.5">Working Duration</th>
                                        <th className="px-4 py-3.5 text-center">Status</th>
                                        <th className="px-5 py-3.5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 text-sm">
                                    {filteredRecords.map((rec) => (
                                        <tr key={rec._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <div className="font-bold text-slate-900">{rec.name}</div>
                                                <div className="text-xs text-slate-400 font-mono flex items-center gap-1.5 mt-0.5">
                                                    <span>{rec.employeeId}</span>
                                                    {rec.isManualEntry && (
                                                        <span className="inline-block px-1.5 py-0.2 bg-purple-100 text-purple-700 rounded text-[10px] font-bold" title={rec.manualRemarks || 'Manual Override by Admin'}>
                                                            Admin Override
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-700 text-xs">{rec.designation || 'Staff'}</td>
                                            <td className="px-4 py-4 font-mono text-slate-700 text-xs">
                                                <div className="font-bold text-slate-800">{rec.firstIn || '--:--'}</div>
                                                {rec.checkInAddress && (
                                                    <div className="mt-1 flex items-center gap-1 font-sans text-[11px] text-slate-500">
                                                        <span className="truncate max-w-[140px]" title={rec.checkInAddress}>📍 {rec.checkInAddress}</span>
                                                        {rec.checkInLocation?.latitude && (
                                                            <a 
                                                                href={`https://maps.google.com/?q=${rec.checkInLocation.latitude},${rec.checkInLocation.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline text-[10px] font-semibold flex-shrink-0"
                                                                title="Open in Google Maps"
                                                            >
                                                                Map
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-mono text-slate-700 text-xs">
                                                <div className="font-bold text-slate-800">{rec.lastOut || '--:--'}</div>
                                                {rec.checkOutAddress && (
                                                    <div className="mt-1 flex items-center gap-1 font-sans text-[11px] text-slate-500">
                                                        <span className="truncate max-w-[140px]" title={rec.checkOutAddress}>📍 {rec.checkOutAddress}</span>
                                                        {rec.checkOutLocation?.latitude && (
                                                            <a 
                                                                href={`https://maps.google.com/?q=${rec.checkOutLocation.latitude},${rec.checkOutLocation.longitude}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="text-blue-600 hover:underline text-[10px] font-semibold flex-shrink-0"
                                                                title="Open in Google Maps"
                                                            >
                                                                Map
                                                            </a>
                                                        )}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4 font-medium text-slate-800 text-xs">{rec.workingHours}</td>
                                            <td className="px-4 py-4 text-center">
                                                {rec.status === 'PRESENT' ? (
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-emerald-100 text-emerald-800">
                                                        Present
                                                    </span>
                                                ) : rec.status === 'HALF_DAY' ? (
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-amber-100 text-amber-800">
                                                        Half Day
                                                    </span>
                                                ) : rec.status === 'ABSENT' ? (
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-rose-100 text-rose-800">
                                                        Absent
                                                    </span>
                                                ) : rec.status === 'HOLIDAY' ? (
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-purple-100 text-purple-800">
                                                        Holiday
                                                    </span>
                                                ) : rec.status === 'SUNDAY' ? (
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-600">
                                                        Sunday OFF
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex px-2.5 py-1 text-xs font-bold rounded-full bg-slate-100 text-slate-400">
                                                        --
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    {rec.firstIn && rec.firstIn !== '--:--' && (!rec.lastOut || rec.lastOut === '--:--') && (
                                                        <button
                                                            onClick={() => handleOpenPunchOutForEmp(rec)}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-xs shadow-blue-600/20 transition-all active:scale-[0.97]"
                                                            title={`Quick Punch Out for ${rec.name}`}
                                                        >
                                                            <LogOut size={12} />
                                                            <span>Punch Out</span>
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenManualForEmp(rec)}
                                                        className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 font-bold text-xs rounded-lg transition-colors border border-slate-200/80"
                                                        title={`Override attendance for ${rec.name}`}
                                                    >
                                                        <Edit3 size={12} />
                                                        <span>Override</span>
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MANUAL ATTENDANCE OVERRIDE MODAL */}
                {manualModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5">
                            <button 
                                onClick={() => setManualModal({ ...manualModal, isOpen: false })}
                                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div>
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
                                        <Sparkles size={16} />
                                    </div>
                                    <h3 className="text-xl font-extrabold text-slate-900">
                                        Admin Attendance Override
                                    </h3>
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Manually mark or correct employee attendance in case of GPS glitch, mobile issue, or forgot punch.
                                </p>
                            </div>

                            <form onSubmit={handleManualSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
                                    <select
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        value={manualModal.employeeId}
                                        onChange={(e) => setManualModal({ ...manualModal, employeeId: e.target.value })}
                                    >
                                        <option value="">-- Choose Employee --</option>
                                        {activeEmployees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.employeeId || 'ID'}) - {emp.designation || 'Staff'}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Attendance Date *</label>
                                        <input
                                            type="date"
                                            required
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            value={manualModal.date}
                                            onChange={(e) => setManualModal({ ...manualModal, date: e.target.value })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Status *</label>
                                        <select
                                            required
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-emerald-800"
                                            value={manualModal.status}
                                            onChange={(e) => setManualModal({ ...manualModal, status: e.target.value })}
                                        >
                                            <option value="PRESENT">✅ PRESENT (Full Day - No Salary Cut)</option>
                                            <option value="HALF_DAY">⚠️ HALF_DAY (0.5 Day)</option>
                                            <option value="ABSENT">❌ ABSENT (Unpaid)</option>
                                        </select>
                                    </div>
                                </div>

                                {manualModal.status !== 'ABSENT' && (
                                    <div className="space-y-2">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Check-In Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                                                    value={manualModal.checkInTime}
                                                    onChange={(e) => setManualModal({ ...manualModal, checkInTime: e.target.value })}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-xs font-bold text-slate-700 mb-1">Check-Out Time</label>
                                                <input
                                                    type="time"
                                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                                                    value={manualModal.checkOutTime}
                                                    onChange={(e) => setManualModal({ ...manualModal, checkOutTime: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between bg-slate-100 rounded-xl px-3.5 py-2 text-xs text-slate-600 font-semibold border border-slate-200">
                                            <span>Calculated Working Hours:</span>
                                            <span className="font-bold text-emerald-700 bg-white px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs">
                                                {calculateLiveDuration(manualModal.checkInTime, manualModal.checkOutTime, manualModal.status)}
                                            </span>
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Admin Reason / Remarks *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. GPS error on site / Mobile network glitch approved"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        value={manualModal.remarks}
                                        onChange={(e) => setManualModal({ ...manualModal, remarks: e.target.value })}
                                    />
                                </div>

                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-900 flex items-start gap-2">
                                    <CheckCircle2 size={16} className="text-emerald-700 flex-shrink-0 mt-0.5" />
                                    <span>
                                        Marking as <strong>{manualModal.status}</strong> will update monthly payroll and attendance reports immediately so employee salary is protected.
                                    </span>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setManualModal({ ...manualModal, isOpen: false })}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <span>Save Override</span>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* QUICK MANUAL PUNCH-OUT MODAL */}
                {punchOutModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-7 shadow-2xl border border-slate-100 relative space-y-5">
                            <button 
                                onClick={() => setPunchOutModal({ ...punchOutModal, isOpen: false })}
                                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                                    <LogOut size={18} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-slate-900">
                                        Manual Punch Out
                                    </h3>
                                    <p className="text-xs text-slate-500">
                                        Record check-out without changing check-in
                                    </p>
                                </div>
                            </div>

                            <form onSubmit={handlePunchOutSubmit} className="space-y-4">
                                <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200/70 space-y-1.5">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Employee</span>
                                        <span className="text-xs font-semibold text-slate-400 font-mono">{punchOutModal.date}</span>
                                    </div>
                                    <div className="text-sm font-bold text-slate-900">{punchOutModal.employeeName}</div>
                                    <div className="flex items-center justify-between pt-2 border-t border-slate-200/60 text-xs">
                                        <span className="text-slate-600 font-medium">Punch-In Time (Preserved):</span>
                                        <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                                            {punchOutModal.checkInFormatted}
                                        </span>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Check-Out Time *</label>
                                    <input
                                        type="time"
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={punchOutModal.checkOutTime}
                                        onChange={(e) => setPunchOutModal({ ...punchOutModal, checkOutTime: e.target.value })}
                                    />
                                </div>

                                <div className="flex items-center justify-between bg-blue-50 rounded-xl px-3.5 py-2 text-xs text-blue-900 font-semibold border border-blue-200">
                                    <span>Calculated Working Hours:</span>
                                    <span className="font-bold text-blue-700 bg-white px-2 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                                        {calculateLiveDuration(formatTimeTo24Hour(punchOutModal.checkInFormatted, '11:00'), punchOutModal.checkOutTime, 'PRESENT')}
                                    </span>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Reason / Remarks *</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Employee forgot checkout before leaving"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                        value={punchOutModal.remarks}
                                        onChange={(e) => setPunchOutModal({ ...punchOutModal, remarks: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setPunchOutModal({ ...punchOutModal, isOpen: false })}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={submitting}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                    >
                                        {submitting ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>Saving...</span>
                                            </>
                                        ) : (
                                            <>
                                                <LogOut size={16} />
                                                <span>Confirm Punch Out</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default AdminAttendance;
