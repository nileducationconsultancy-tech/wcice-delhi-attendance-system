import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    ArrowLeft, Edit, Mail, Phone, Calendar, IndianRupee, 
    ShieldCheck, Briefcase, Download, Loader2, FileSpreadsheet, FileText, User 
} from 'lucide-react';
import { Link, useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { usePopupStore } from '../store/popupStore';
import EmployeeDocumentsTab from '../components/documents/EmployeeDocumentsTab';

const EmployeeDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') === 'documents' ? 'documents' : 'overview';
    const [activeTab, setActiveTab] = useState(initialTab);
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { showAlert } = usePopupStore();

    const today = new Date();
    const [downloadMonth, setDownloadMonth] = useState(today.getMonth() + 1);
    const [downloadYear, setDownloadYear] = useState(today.getFullYear());
    const [downloading, setDownloading] = useState(false);

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    useEffect(() => {
        const fetchDetails = async () => {
            try {
                const { data } = await axios.get(`/api/employees/${id}`);
                setEmployee(data.employee);
            } catch (err) {
                setError('Failed to fetch employee details');
            } finally {
                setLoading(false);
            }
        };
        fetchDetails();
    }, [id]);

    const handleDownloadReport = async () => {
        if (!employee) return;
        setDownloading(true);
        try {
            const res = await axios.get(`/api/attendance/employee/${employee._id}/history?month=${downloadMonth}&year=${downloadYear}`);
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
            lines.push(`Period:,"${monthNames[downloadMonth - 1]} ${downloadYear}"`);
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
            const cleanName = (emp.name || 'Employee').replace(/\s+/g, '_');
            link.setAttribute("href", url);
            link.setAttribute("download", `Attendance_${cleanName}_${monthNames[downloadMonth - 1]}_${downloadYear}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            await showAlert({
                title: 'Report Downloaded',
                message: `Attendance report for ${emp.name} (${monthNames[downloadMonth - 1]} ${downloadYear}) downloaded successfully.`,
                type: 'success'
            });
        } catch (err) {
            await showAlert({
                title: 'Download Failed',
                message: err.response?.data?.message || 'Failed to download attendance report.',
                type: 'error'
            });
        } finally {
            setDownloading(false);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    if (error || !employee) {
        return (
            <Layout>
                <div className="p-8 text-center text-red-600 font-bold">{error || 'Employee not found'}</div>
            </Layout>
        );
    }

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        if (tab === 'documents') {
            setSearchParams({ tab: 'documents' });
        } else {
            setSearchParams({});
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-12">
                
                <div className="flex items-center justify-between">
                    <Link to="/admin/employees" className="inline-flex items-center gap-2 text-slate-500 hover:text-blue-600 font-semibold text-sm transition">
                        <ArrowLeft size={18} /> Back to Employees
                    </Link>
                    <Link 
                        to={`/admin/employees/edit/${employee._id}`} 
                        className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-xs transition"
                    >
                        <Edit size={15} /> Edit Profile
                    </Link>
                </div>

                {/* Profile Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 relative overflow-hidden">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 border-2 border-blue-200 shadow-sm flex items-center justify-center text-2xl font-bold text-blue-700 shrink-0">
                            {employee.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-bold text-slate-900">{employee.name}</h1>
                                <span className={`font-bold px-2.5 py-0.5 rounded-full text-xs ${
                                    employee.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                }`}>
                                    {employee.status}
                                </span>
                            </div>
                            <p className="text-slate-600 font-medium text-sm mt-0.5">{employee.designation || 'Staff'} • <span className="font-mono text-slate-500">{employee.employeeId}</span></p>
                        </div>
                    </div>

                    {/* Tab Navigation Pill Bar */}
                    <div className="flex items-center gap-2 mt-6 pt-5 border-t border-slate-100 text-xs font-bold">
                        <button
                            onClick={() => handleTabChange('overview')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                activeTab === 'overview'
                                    ? 'bg-slate-900 text-white shadow-xs'
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                        >
                            <User size={15} />
                            <span>Overview & Contact</span>
                        </button>
                        <button
                            onClick={() => handleTabChange('documents')}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                                activeTab === 'documents'
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                            }`}
                        >
                            <FileText size={15} />
                            <span>Documents & Verification</span>
                        </button>
                    </div>
                </div>

                {/* Conditional Tab Rendering */}
                {activeTab === 'documents' ? (
                    <EmployeeDocumentsTab
                        employeeId={employee._id}
                        employeeName={employee.name}
                        isHR={true}
                    />
                ) : (
                    <>
                        {/* Info Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Contact & System</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Mail size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-24">Email:</span>
                                <span className="font-medium text-slate-900 font-mono text-xs">{employee.email || '--'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <Phone size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-24">Phone:</span>
                                <span className="font-medium text-slate-900 font-mono text-xs">{employee.phone || '--'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <ShieldCheck size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-24">Role:</span>
                                <span className="font-semibold text-slate-900">{employee.userId?.role || employee.role || 'EMPLOYEE'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">Employment & Salary</h2>
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center gap-3 text-slate-700">
                                <Briefcase size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-28">Designation:</span>
                                <span className="font-semibold text-slate-900">{employee.designation || 'Staff'}</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <Calendar size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-28">Schedule:</span>
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                    employee.workSchedule === '5_DAYS' 
                                        ? 'bg-purple-100 text-purple-800 border border-purple-200' 
                                        : 'bg-blue-100 text-blue-800 border border-blue-200'
                                }`}>
                                    {employee.workSchedule === '5_DAYS' ? '5 Days (Mon–Fri, Sat/Sun OFF)' : '6 Days (Mon–Sat, Sun OFF)'}
                                </span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <IndianRupee size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-28">Monthly Salary:</span>
                                <span className="font-extrabold text-slate-900">₹{(employee.baseSalary || 0).toLocaleString('en-IN')}/mo</span>
                            </div>
                            <div className="flex items-center gap-3 text-slate-700">
                                <Calendar size={16} className="text-slate-400" />
                                <span className="text-slate-500 w-28">Joining Date:</span>
                                <span className="font-medium text-slate-900 font-mono text-xs">
                                    {employee.joiningDate ? new Date(employee.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Download Attendance Section */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileSpreadsheet className="text-blue-600" size={20} />
                            Download Monthly Attendance Report
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Export full day-by-day attendance sheet for this employee with punch times & working duration
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        <select 
                            value={downloadMonth} 
                            onChange={(e) => setDownloadMonth(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-xl focus:outline-none font-medium"
                        >
                            {monthNames.map((m, idx) => (
                                <option key={idx} value={idx + 1}>{m}</option>
                            ))}
                        </select>

                        <select 
                            value={downloadYear} 
                            onChange={(e) => setDownloadYear(Number(e.target.value))}
                            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs py-2 px-3 rounded-xl focus:outline-none font-medium"
                        >
                            {[2025, 2026, 2027, 2028].map(y => (
                                <option key={y} value={y}>{y}</option>
                            ))}
                        </select>

                        <button 
                            onClick={handleDownloadReport}
                            disabled={downloading}
                            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs transition-colors disabled:opacity-50"
                        >
                            {downloading ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
                            <span>Download CSV</span>
                        </button>
                    </div>
                </div>
                </>
                )}

            </div>
        </Layout>
    );
};

export default EmployeeDetails;
