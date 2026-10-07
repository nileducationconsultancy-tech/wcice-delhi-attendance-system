import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Download, ChevronLeft, ChevronRight, Calendar, Users, Eye, X, FileSpreadsheet, Loader2 } from 'lucide-react';
import { usePopupStore } from '../store/popupStore';

const AdminReports = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [employeeId, setEmployeeId] = useState('');
    const [employees, setEmployees] = useState([]);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [error, setError] = useState('');
    const { showAlert } = usePopupStore();

    // Modal state for employee detailed preview
    const [previewEmployee, setPreviewEmployee] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    useEffect(() => {
        const fetchEmployeesList = async () => {
            try {
                const res = await axios.get('/api/employees?limit=1000');
                setEmployees(res.data.employees || []);
            } catch (e) {
                console.error('Error fetching employees list', e);
            }
        };
        fetchEmployeesList();
    }, []);

    const fetchReport = async () => {
        setLoading(true);
        setError('');
        try {
            const params = new URLSearchParams({ month, year });
            if (employeeId) params.append('employeeId', employeeId);

            const res = await axios.get(`/api/attendance/report?${params.toString()}`);
            setReportData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error generating report');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [month, year, employeeId]);

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

    const reportRows = reportData?.report || [];
    const totalWorkingDays = reportData?.totalWorkingDays || 0;
    const totalHolidays = reportData?.totalHolidays || 0;
    const totalSundays = reportData?.totalSundays || 0;

    // Export Summary CSV for all / filtered employees
    const exportSummaryCSV = () => {
        if (reportRows.length === 0) return;
        const headers = ["Employee ID", "Name", "Designation", "Working Days", "Present Days", "Half Days", "Absent Days", "Paid Days", "Attendance %"];
        const csvRows = [headers.join(",")];

        reportRows.forEach(r => {
            csvRows.push([
                `"${r.employeeId}"`,
                `"${r.name}"`,
                `"${r.designation || 'Staff'}"`,
                r.workingDays,
                r.present,
                r.halfDay,
                r.absent,
                r.paidDays,
                `"${r.attendancePercentage}%"`
            ].join(","));
        });

        const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `Attendance_Summary_${monthNames[month - 1]}_${year}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Download Detailed Individual Day-by-Day Attendance Report for an Employee
    const downloadEmployeeDetailedCSV = async (empId, empName) => {
        setDownloadingId(empId);
        try {
            const res = await axios.get(`/api/attendance/employee/${empId}/history?month=${month}&year=${year}`);
            const data = res.data;
            const emp = data.employee;
            const summary = data.summary;
            const history = data.history || [];

            const lines = [];
            lines.push(`WECICE DELHI ATTENDANCE SYSTEM - INDIVIDUAL ATTENDANCE REPORT`);
            lines.push(`Employee Name:,"${emp.name}"`);
            lines.push(`Employee ID:,"${emp.employeeId}"`);
            lines.push(`Designation:,"${emp.designation || 'Staff'}"`);
            lines.push(`Email:,"${emp.email || '--'}"`);
            lines.push(`Period:,"${monthNames[month - 1]} ${year}"`);
            lines.push(``);
            lines.push(`SUMMARY METRICS`);
            lines.push(`Scheduled Working Days,${summary.totalWorkingDays}`);
            lines.push(`Present Days (1.0),${summary.presentDays}`);
            lines.push(`Half Days (0.5),${summary.halfDays}`);
            lines.push(`Absent Days,${summary.absentDays}`);
            lines.push(`Paid Attendance Days,${summary.paidDays}`);
            lines.push(`Sundays,${summary.sundayCount}`);
            lines.push(`Holidays,${summary.holidayCount}`);
            lines.push(`Monthly Attendance %,${summary.attendancePercentage}%`);
            lines.push(``);
            lines.push(`DAILY ATTENDANCE LOGS`);
            lines.push(`Date,Day,Status,First Check In,Last Check Out,Working Hours,Location / Note`);

            history.forEach(day => {
                const note = day.holidayName ? `Holiday: ${day.holidayName}` : (day.checkInAddress || '');
                lines.push([
                    `"${day.date}"`,
                    `"${day.dayOfWeek}"`,
                    `"${day.status}"`,
                    `"${day.checkIn || '--:--'}"`,
                    `"${day.checkOut || '--:--'}"`,
                    `"${day.workingHours || '0h 0m'}"`,
                    `"${note.replace(/"/g, '""')}"`
                ].join(","));
            });

            const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            const cleanName = (empName || 'Employee').replace(/\s+/g, '_');
            link.setAttribute("href", url);
            link.setAttribute("download", `Attendance_${cleanName}_${monthNames[month - 1]}_${year}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await showAlert({
                title: 'Report Downloaded',
                message: `Detailed attendance report for ${emp.name} (${monthNames[month - 1]} ${year}) has been exported.`,
                type: 'success'
            });
        } catch (err) {
            await showAlert({
                title: 'Download Failed',
                message: err.response?.data?.message || 'Failed to download employee attendance report.',
                type: 'error'
            });
        } finally {
            setDownloadingId(null);
        }
    };

    // Open Modal to preview individual history
    const handlePreviewEmployee = async (empId) => {
        setPreviewLoading(true);
        setPreviewEmployee(null);
        try {
            const res = await axios.get(`/api/attendance/employee/${empId}/history?month=${month}&year=${year}`);
            setPreviewEmployee(res.data);
        } catch (err) {
            showAlert({
                title: 'Error',
                message: 'Failed to load employee details for preview.',
                type: 'error'
            });
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Reports</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Monthly attendance summary & individual employee report downloads for {monthNames[month - 1]} {year}
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Month Navigator */}
                        <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
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

                        {/* Employee Filter */}
                        <select 
                            value={employeeId} 
                            onChange={(e) => setEmployeeId(e.target.value)}
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-sm py-2 px-3 rounded-xl focus:outline-none"
                        >
                            <option value="">All Employees</option>
                            {employees.map(emp => (
                                <option key={emp._id} value={emp._id}>{emp.name} ({emp.employeeId})</option>
                            ))}
                        </select>

                        {/* Export Summary CSV */}
                        <button 
                            onClick={exportSummaryCSV} 
                            disabled={reportRows.length === 0}
                            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-xs"
                            title="Export Summary CSV for all displayed employees"
                        >
                            <Download size={16} /> Export Summary
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Monthly Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-xs">
                        <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Scheduled Work Days</span>
                        <div className="text-3xl font-extrabold text-blue-900 mt-2">{totalWorkingDays} <span className="text-xs font-medium text-blue-600">Days</span></div>
                        <p className="text-[11px] text-blue-700 mt-1">Mon–Sat schedule</p>
                    </div>

                    <div className="bg-purple-50/70 p-5 rounded-2xl border border-purple-200 shadow-xs">
                        <span className="text-xs font-bold text-purple-800 uppercase tracking-wider">Holidays</span>
                        <div className="text-3xl font-extrabold text-purple-900 mt-2">{totalHolidays} <span className="text-xs font-medium text-purple-600">Days</span></div>
                        <p className="text-[11px] text-purple-700 mt-1">Exempt from working days</p>
                    </div>

                    <div className="bg-slate-100 p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-600 uppercase tracking-wider">Sundays</span>
                        <div className="text-3xl font-extrabold text-slate-800 mt-2">{totalSundays} <span className="text-xs font-medium text-slate-500">Days</span></div>
                        <p className="text-[11px] text-slate-500 mt-1">Scheduled weekly OFF</p>
                    </div>

                    <div className="bg-emerald-50/70 p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Calculation Formula</span>
                        <div className="text-xs font-bold text-emerald-900 mt-2">
                            (Present + 0.5 × Half) / Work Days
                        </div>
                        <p className="text-[11px] text-emerald-700 mt-1">Single source of truth</p>
                    </div>
                </div>

                {/* Report Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 bg-slate-50/75 flex justify-between items-center">
                        <h2 className="text-base font-bold text-slate-800">Monthly Attendance Report Table</h2>
                        <span className="text-xs text-slate-500 font-medium">{reportRows.length} employees included</span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : reportRows.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No employee attendance data found for this period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="py-3.5 px-4">Employee</th>
                                        <th className="py-3.5 px-4">Designation</th>
                                        <th className="py-3.5 px-4 text-center">Work Days</th>
                                        <th className="py-3.5 px-4 text-center">Present</th>
                                        <th className="py-3.5 px-4 text-center">Half Day</th>
                                        <th className="py-3.5 px-4 text-center">Absent</th>
                                        <th className="py-3.5 px-4 text-center text-purple-700">Paid Leave</th>
                                        <th className="py-3.5 px-4 text-center">Paid Days</th>
                                        <th className="py-3.5 px-4 text-center">Attendance %</th>
                                        <th className="py-3.5 px-4 text-right">Individual Report</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {reportRows.map((r) => (
                                        <tr key={r._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{r.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{r.employeeId}</div>
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-700 text-xs">
                                                {r.designation || 'Staff'}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                                                {r.workingDays}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                                                {r.present}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                                                {r.halfDay}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-rose-700">
                                                {r.absent}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/40">
                                                +{r.paidLeaveUsed || 0} PL
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-extrabold text-blue-700 bg-blue-50/40">
                                                {r.paidDays}
                                            </td>
                                            <td className="py-3.5 px-4 text-center">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold ${
                                                    r.attendancePercentage >= 90 ? 'bg-emerald-100 text-emerald-800' :
                                                    r.attendancePercentage >= 75 ? 'bg-blue-100 text-blue-800' :
                                                    r.attendancePercentage >= 50 ? 'bg-amber-100 text-amber-800' :
                                                    'bg-rose-100 text-rose-800'
                                                }`}>
                                                    {r.attendancePercentage}%
                                                </span>
                                            </td>
                                            <td className="py-3.5 px-4 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {/* Preview Daily History */}
                                                    <button 
                                                        onClick={() => handlePreviewEmployee(r._id)}
                                                        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Preview Daily Attendance Logs"
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    
                                                    {/* Download Individual Employee Detailed CSV */}
                                                    <button 
                                                        onClick={() => downloadEmployeeDetailedCSV(r._id, r.name)}
                                                        disabled={downloadingId === r._id}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors disabled:opacity-50"
                                                        title={`Download ${r.name}'s detailed daily attendance CSV`}
                                                    >
                                                        {downloadingId === r._id ? (
                                                            <Loader2 size={13} className="animate-spin" />
                                                        ) : (
                                                            <FileSpreadsheet size={13} />
                                                        )}
                                                        <span>Download</span>
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

                {/* Employee Detailed Log Preview Modal */}
                {(previewEmployee || previewLoading) && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                            
                            {/* Modal Header */}
                            <div className="p-6 border-b border-slate-200 flex justify-between items-center bg-slate-50/75">
                                <div>
                                    <h3 className="text-xl font-bold text-slate-900">
                                        {previewEmployee?.employee?.name} — Attendance Breakdown
                                    </h3>
                                    <p className="text-xs text-slate-500 font-mono mt-0.5">
                                        {previewEmployee?.employee?.employeeId} • {previewEmployee?.employee?.designation} • {monthNames[month - 1]} {year}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    {previewEmployee && (
                                        <button 
                                            onClick={() => downloadEmployeeDetailedCSV(previewEmployee.employee._id, previewEmployee.employee.name)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                                        >
                                            <Download size={14} /> Download CSV
                                        </button>
                                    )}
                                    <button 
                                        onClick={() => setPreviewEmployee(null)}
                                        className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-xl transition-colors"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="p-6 overflow-y-auto space-y-6">
                                {previewLoading ? (
                                    <div className="py-16 text-center">
                                        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                                        <p className="text-xs text-slate-400 mt-2 font-medium">Loading employee logs...</p>
                                    </div>
                                ) : previewEmployee && (
                                    <>
                                        {/* Summary Cards */}
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-center">
                                                <span className="text-[11px] font-bold text-slate-500 uppercase">Work Days</span>
                                                <div className="text-2xl font-extrabold text-slate-800 mt-1">{previewEmployee.summary.totalWorkingDays}</div>
                                            </div>
                                            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-center">
                                                <span className="text-[11px] font-bold text-emerald-700 uppercase">Present</span>
                                                <div className="text-2xl font-extrabold text-emerald-800 mt-1">{previewEmployee.summary.presentDays}</div>
                                            </div>
                                            <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 text-center">
                                                <span className="text-[11px] font-bold text-amber-700 uppercase">Half Days</span>
                                                <div className="text-2xl font-extrabold text-amber-800 mt-1">{previewEmployee.summary.halfDays}</div>
                                            </div>
                                            <div className="bg-rose-50 p-4 rounded-xl border border-rose-200 text-center">
                                                <span className="text-[11px] font-bold text-rose-700 uppercase">Absent</span>
                                                <div className="text-2xl font-extrabold text-rose-800 mt-1">{previewEmployee.summary.absentDays}</div>
                                            </div>
                                        </div>

                                        {/* Day by Day Log Table */}
                                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                                            <table className="w-full text-left border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
                                                        <th className="py-2.5 px-3">Date</th>
                                                        <th className="py-2.5 px-3">Day</th>
                                                        <th className="py-2.5 px-3">Status</th>
                                                        <th className="py-2.5 px-3">Check In</th>
                                                        <th className="py-2.5 px-3">Check Out</th>
                                                        <th className="py-2.5 px-3">Working Hours</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {previewEmployee.history.map((day, idx) => (
                                                        <tr key={idx} className="hover:bg-slate-50/50">
                                                            <td className="py-2.5 px-3 font-mono font-medium text-slate-800">
                                                                {day.date}
                                                            </td>
                                                            <td className="py-2.5 px-3 text-slate-500 font-semibold">
                                                                {day.dayOfWeek}
                                                            </td>
                                                            <td className="py-2.5 px-3">
                                                                <span className={`inline-flex px-2 py-0.5 rounded-full font-bold text-[10px] ${
                                                                    day.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' :
                                                                    day.status === 'HALF_DAY' ? 'bg-amber-100 text-amber-800' :
                                                                    day.status === 'ABSENT' ? 'bg-rose-100 text-rose-800' :
                                                                    day.status === 'SUNDAY' ? 'bg-purple-100 text-purple-800' :
                                                                    day.status === 'HOLIDAY' ? 'bg-indigo-100 text-indigo-800' :
                                                                    'bg-slate-100 text-slate-600'
                                                                }`}>
                                                                    {day.holidayName ? `HOLIDAY (${day.holidayName})` : day.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-slate-700">
                                                                {day.checkIn || '--:--'}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono text-slate-700">
                                                                {day.checkOut || '--:--'}
                                                            </td>
                                                            <td className="py-2.5 px-3 font-mono font-semibold text-blue-600">
                                                                {day.workingHours}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </>
                                )}
                            </div>

                        </div>
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default AdminReports;
