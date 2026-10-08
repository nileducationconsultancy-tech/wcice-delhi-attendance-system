import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { IndianRupee, CalendarCheck, Users, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const AdminPayroll = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [payrollData, setPayrollData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchPayroll = async () => {
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`/api/payroll?month=${month}&year=${year}`);
            setPayrollData(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Error loading payroll details');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayroll();
    }, [month, year]);

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

    const employees = payrollData?.employees || [];
    const totalExpense = payrollData?.totalExpense || 0;
    const totalWorkingDays = payrollData?.totalWorkingDays || 0;
    const totalEmployees = payrollData?.totalEmployees || 0;

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payroll Management</h1>
                        <p className="text-slate-500 text-sm mt-0.5">
                            Real-time attendance-based salary calculations for {monthNames[month - 1]} {year}
                        </p>
                    </div>

                    <div className="flex items-center gap-3">
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
                        <button 
                            onClick={fetchPayroll}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm font-medium">
                        {error}
                    </div>
                )}

                {/* Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-blue-50/70 p-5 rounded-2xl border border-blue-200 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">Working Days (Mon–Sat)</span>
                            <CalendarCheck size={18} className="text-blue-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-blue-900">{totalWorkingDays} <span className="text-sm font-medium text-blue-600">Days</span></div>
                        <p className="text-[11px] text-blue-700 mt-1">Excludes {payrollData?.totalSundays || 0} Sundays & {payrollData?.totalHolidays || 0} Holidays</p>
                    </div>

                    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Active Employees</span>
                            <Users size={18} className="text-slate-500" />
                        </div>
                        <div className="text-3xl font-extrabold text-slate-900">{totalEmployees}</div>
                        <p className="text-[11px] text-slate-400 mt-1">Enrolled on payroll</p>
                    </div>

                    <div className="bg-indigo-50/70 p-5 rounded-2xl border border-indigo-200 shadow-xs">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-indigo-800 uppercase tracking-wider">Total Net Payroll</span>
                            <IndianRupee size={18} className="text-indigo-600" />
                        </div>
                        <div className="text-3xl font-extrabold text-indigo-900">₹{totalExpense.toLocaleString('en-IN')}</div>
                        <p className="text-[11px] text-indigo-700 mt-1">Calculated by paid attendance days</p>
                    </div>
                </div>

                {/* Payroll Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 bg-slate-50/75">
                        <h2 className="text-base font-bold text-slate-800">Employee Salary Breakdown</h2>
                        <span className="text-xs text-slate-500">Per Day Rate = Monthly Salary / {payrollData?.totalDaysInMonth || 30} Days (Calendar Basis) • <strong>1 Paid Leave / Month Active</strong></span>
                    </div>

                    {loading ? (
                        <div className="p-12 text-center">
                            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">
                            No active employees found for this payroll period.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-sm">
                                <thead>
                                    <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="py-3.5 px-4">Employee</th>
                                        <th className="py-3.5 px-4">Monthly Base</th>
                                        <th className="py-3.5 px-4 text-center">Calendar Days</th>
                                        <th className="py-3.5 px-4 text-center">Present</th>
                                        <th className="py-3.5 px-4 text-center">Half Day</th>
                                        <th className="py-3.5 px-4 text-center">Absent</th>
                                        <th className="py-3.5 px-4 text-center text-purple-700">Paid Leave</th>
                                        <th className="py-3.5 px-4 text-center">Paid Days</th>
                                        <th className="py-3.5 px-4">Per Day Rate</th>
                                        <th className="py-3.5 px-4">Deduction</th>
                                        <th className="py-3.5 px-4 text-right font-extrabold text-slate-900">Net Salary</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {employees.map((emp) => (
                                        <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="py-3.5 px-4">
                                                <div className="font-bold text-slate-900">{emp.name}</div>
                                                <div className="text-xs text-slate-400 font-mono">{emp.employeeId} • {emp.designation || 'Staff'}</div>
                                            </td>
                                            <td className="py-3.5 px-4 font-medium text-slate-800">
                                                ₹{emp.monthlySalary.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-medium text-slate-700">
                                                {emp.totalDaysInMonth || payrollData?.totalDaysInMonth || 30}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                                                {emp.presentDays}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-amber-700">
                                                {emp.halfDays}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-rose-700">
                                                {emp.absentDays}
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-bold text-purple-700 bg-purple-50/40">
                                                +{emp.paidLeaveUsed || 0} PL
                                            </td>
                                            <td className="py-3.5 px-4 text-center font-extrabold text-blue-700 bg-blue-50/40">
                                                {emp.paidDays}
                                            </td>
                                            <td className="py-3.5 px-4 text-slate-600 font-mono text-xs">
                                                ₹{emp.perDaySalary.toLocaleString('en-IN')}
                                            </td>
                                            <td className="py-3.5 px-4 font-semibold text-rose-600">
                                                {emp.deduction > 0 ? `-₹${emp.deduction.toLocaleString('en-IN')}` : '₹0'}
                                            </td>
                                            <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-base">
                                                ₹{emp.netSalary.toLocaleString('en-IN')}
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

export default AdminPayroll;
