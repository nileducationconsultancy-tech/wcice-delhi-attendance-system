import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
    FileText, Download, RefreshCw, ChevronLeft, ChevronRight, Search, 
    Plus, Eye, RotateCw, Edit3, Trash2, IndianRupee, Users, CheckCircle2, 
    AlertCircle, Clock, ShieldCheck, X, Sparkles, Filter
} from 'lucide-react';
import { payslipApi } from '../services/api/payslipApi';
import { employeeApi } from '../services/api/employeeApi';
import { usePopupStore } from '../store/popupStore';
import { useDebounce } from '../hooks/useDebounce';

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const AdminPayslips = () => {
    const today = new Date();
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [year, setYear] = useState(today.getFullYear());
    const [statusFilter, setStatusFilter] = useState('');
    const [search, setSearch] = useState('');
    const debouncedSearch = useDebounce(search, 300);

    const [payslipData, setPayslipData] = useState(null);
    const [activeEmployees, setActiveEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [bulkGenerating, setBulkGenerating] = useState(false);
    const [actionLoadingId, setActionLoadingId] = useState(null);

    // Modal state for Adjustments (Bonus/Incentive/Deduction/Status/Remarks)
    const [adjustmentModal, setAdjustmentModal] = useState({
        isOpen: false,
        payslip: null,
        bonus: 0,
        incentive: 0,
        otherDeductions: 0,
        remarks: '',
        paymentStatus: 'Pending'
    });

    // Modal state for Single Employee Generation
    const [generateModal, setGenerateModal] = useState({
        isOpen: false,
        employeeId: '',
        bonus: 0,
        incentive: 0,
        otherDeductions: 0,
        remarks: '',
        paymentStatus: 'Pending'
    });

    const { showAlert, showConfirm } = usePopupStore();

    const fetchPayslips = useCallback(async () => {
        setLoading(true);
        try {
            const res = await payslipApi.getAll({
                month,
                year,
                status: statusFilter,
                search: debouncedSearch
            });
            setPayslipData(res.data);
        } catch (err) {
            console.error('Error fetching payslips:', err);
        } finally {
            setLoading(false);
        }
    }, [month, year, statusFilter, debouncedSearch]);

    const fetchEmployeesList = useCallback(async () => {
        try {
            const res = await employeeApi.getAll({ limit: 200, status: 'ACTIVE' });
            setActiveEmployees(res.data.employees || []);
        } catch (err) {
            console.error('Error fetching employees list:', err);
        }
    }, []);

    useEffect(() => {
        fetchPayslips();
    }, [fetchPayslips]);

    useEffect(() => {
        fetchEmployeesList();
    }, [fetchEmployeesList]);

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

    // Bulk Generate for All Active Employees
    const handleGenerateAll = async () => {
        const confirmed = await showConfirm({
            title: `Generate All Payslips for ${monthNames[month - 1]} ${year}?`,
            message: 'This will calculate attendance records and generate or update payslips for all active employees.',
            type: 'info',
            confirmText: 'Generate All'
        });

        if (!confirmed) return;

        setBulkGenerating(true);
        try {
            const res = await payslipApi.generateAll({ month, year });
            await showAlert({
                title: 'Bulk Generation Complete',
                message: res.data.message || `Payslips generated successfully.`,
                type: 'success'
            });
            fetchPayslips();
        } catch (err) {
            await showAlert({
                title: 'Generation Failed',
                message: err.response?.data?.message || 'Failed to generate bulk payslips.',
                type: 'error'
            });
        } finally {
            setBulkGenerating(false);
        }
    };

    // Regenerate Single Payslip
    const handleRegenerate = async (id, empName) => {
        const confirmed = await showConfirm({
            title: `Regenerate Payslip for ${empName}?`,
            message: 'This will re-calculate attendance and salary from fresh records while preserving manual adjustments.',
            type: 'warning',
            confirmText: 'Regenerate'
        });

        if (!confirmed) return;

        setActionLoadingId(id);
        try {
            await payslipApi.regenerate(id);
            await showAlert({
                title: 'Payslip Regenerated',
                message: `Successfully recalculated payslip for ${empName}.`,
                type: 'success'
            });
            fetchPayslips();
        } catch (err) {
            await showAlert({
                title: 'Regeneration Error',
                message: err.response?.data?.message || 'Failed to regenerate payslip.',
                type: 'error'
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    // Delete Payslip
    const handleDelete = async (id, empName) => {
        const confirmed = await showConfirm({
            title: `Delete Payslip?`,
            message: `Are you sure you want to delete the payslip for ${empName}? You can regenerate it at any time.`,
            type: 'warning',
            confirmText: 'Delete'
        });

        if (!confirmed) return;

        setActionLoadingId(id);
        try {
            await payslipApi.delete(id);
            await showAlert({
                title: 'Deleted',
                message: 'Payslip removed successfully.',
                type: 'success'
            });
            fetchPayslips();
        } catch (err) {
            await showAlert({
                title: 'Error',
                message: err.response?.data?.message || 'Failed to delete payslip.',
                type: 'error'
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    // Download PDF
    const handleDownloadPDF = async (id, empId, empName) => {
        setActionLoadingId(id);
        try {
            const response = await payslipApi.downloadPDF(id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payslip_${empId}_${monthNames[month - 1]}_${year}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            await showAlert({
                title: 'Download Failed',
                message: 'Failed to download payslip PDF.',
                type: 'error'
            });
        } finally {
            setActionLoadingId(null);
        }
    };

    // Open Adjustment Modal
    const openAdjustmentModal = (payslip) => {
        setAdjustmentModal({
            isOpen: true,
            payslip,
            bonus: payslip.bonus || 0,
            incentive: payslip.incentive || 0,
            otherDeductions: payslip.otherDeductions || 0,
            remarks: payslip.remarks || '',
            paymentStatus: payslip.paymentStatus || 'Pending'
        });
    };

    // Submit Adjustments
    const handleSaveAdjustments = async (e) => {
        e.preventDefault();
        const { payslip, bonus, incentive, otherDeductions, remarks, paymentStatus } = adjustmentModal;
        if (!payslip) return;

        try {
            await payslipApi.update(payslip._id, {
                bonus,
                incentive,
                otherDeductions,
                remarks,
                paymentStatus
            });
            setAdjustmentModal({ isOpen: false, payslip: null, bonus: 0, incentive: 0, otherDeductions: 0, remarks: '', paymentStatus: 'Pending' });
            await showAlert({
                title: 'Adjustments Saved',
                message: 'Payslip financial adjustments updated successfully.',
                type: 'success'
            });
            fetchPayslips();
        } catch (err) {
            await showAlert({
                title: 'Save Failed',
                message: err.response?.data?.message || 'Failed to update adjustments.',
                type: 'error'
            });
        }
    };

    // Submit Single Employee Generation
    const handleGenerateSingleSubmit = async (e) => {
        e.preventDefault();
        const { employeeId, bonus, incentive, otherDeductions, remarks, paymentStatus } = generateModal;
        if (!employeeId) return;

        try {
            await payslipApi.generate({
                employeeId,
                month,
                year,
                bonus,
                incentive,
                otherDeductions,
                remarks,
                paymentStatus
            });
            setGenerateModal({ isOpen: false, employeeId: '', bonus: 0, incentive: 0, otherDeductions: 0, remarks: '', paymentStatus: 'Pending' });
            await showAlert({
                title: 'Payslip Created',
                message: 'Employee payslip calculated and generated successfully.',
                type: 'success'
            });
            fetchPayslips();
        } catch (err) {
            await showAlert({
                title: 'Generation Failed',
                message: err.response?.data?.message || 'Failed to generate payslip.',
                type: 'error'
            });
        }
    };

    const payslips = payslipData?.payslips || [];
    const summary = payslipData?.summary || {
        totalEmployees: 0,
        payslipsGenerated: 0,
        totalGrossSalary: 0,
        totalDeductions: 0,
        totalNetPayroll: 0
    };

    // Preview calculated net salary in Adjustment modal
    const modalGross = useMemo(() => {
        if (!adjustmentModal.payslip) return 0;
        return Number((adjustmentModal.payslip.monthlySalary + Number(adjustmentModal.bonus || 0) + Number(adjustmentModal.incentive || 0)).toFixed(2));
    }, [adjustmentModal]);

    const modalTotalDeduction = useMemo(() => {
        if (!adjustmentModal.payslip) return 0;
        return Number((adjustmentModal.payslip.absentDeduction + adjustmentModal.payslip.halfDayDeduction + Number(adjustmentModal.otherDeductions || 0)).toFixed(2));
    }, [adjustmentModal]);

    const modalNetSalary = useMemo(() => {
        return Math.max(0, Number((modalGross - modalTotalDeduction).toFixed(2)));
    }, [modalGross, modalTotalDeduction]);

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-12">
                
                {/* Top Header Card */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100 shadow-xs">
                                <FileText size={22} />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Payslip Management</h1>
                                <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
                                    Attendance-driven automated salary calculation & PDF payslips for {monthNames[month - 1]} {year}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Month Navigator & Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
                        <div className="flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200">
                            <button 
                                onClick={handlePrevMonth}
                                className="p-2 hover:bg-white hover:shadow-xs rounded-lg transition-all text-slate-600 hover:text-slate-900"
                                title="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="font-bold text-xs sm:text-sm text-slate-800 px-2 sm:px-3 min-w-[130px] text-center">
                                {monthNames[month - 1]} {year}
                            </span>
                            <button 
                                onClick={handleNextMonth}
                                className="p-2 hover:bg-white hover:shadow-xs rounded-lg transition-all text-slate-600 hover:text-slate-900"
                                title="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>

                        {/* Single Generate Button */}
                        <button 
                            onClick={() => setGenerateModal({ ...generateModal, isOpen: true })}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
                        >
                            <Plus size={16} /> Single Slip
                        </button>

                        {/* Bulk Generate Button */}
                        <button 
                            onClick={handleGenerateAll}
                            disabled={bulkGenerating}
                            className="bg-blue-600 hover:bg-blue-700 active:scale-98 text-white px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-600/25 transition-all disabled:opacity-50"
                        >
                            {bulkGenerating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Calculating...</span>
                                </>
                            ) : (
                                <>
                                    <Sparkles size={16} />
                                    <span>Generate All Payslips</span>
                                </>
                            )}
                        </button>

                        <button 
                            onClick={fetchPayslips}
                            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                            title="Refresh"
                        >
                            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </div>
                </div>

                {/* KPI Summary Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
                            <Users size={16} className="text-slate-400" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-slate-900">{summary.totalEmployees}</div>
                        <p className="text-[10px] text-slate-400 mt-1">Active staff on record</p>
                    </div>

                    <div className="bg-blue-50/70 p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Generated Slips</span>
                            <CheckCircle2 size={16} className="text-blue-600" />
                        </div>
                        <div className="text-2xl sm:text-3xl font-extrabold text-blue-900">
                            {summary.payslipsGenerated} <span className="text-xs font-semibold text-blue-600">/ {summary.totalEmployees}</span>
                        </div>
                        <p className="text-[10px] text-blue-700 mt-1">For {monthNames[month - 1]}</p>
                    </div>

                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Gross Payroll</span>
                            <IndianRupee size={16} className="text-slate-400" />
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-slate-900">₹{summary.totalGrossSalary.toLocaleString('en-IN')}</div>
                        <p className="text-[10px] text-slate-400 mt-1">Base + Bonuses</p>
                    </div>

                    <div className="bg-rose-50/70 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-rose-800 uppercase tracking-wider">Total Deductions</span>
                            <AlertCircle size={16} className="text-rose-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-rose-900">₹{summary.totalDeductions.toLocaleString('en-IN')}</div>
                        <p className="text-[10px] text-rose-700 mt-1">Absent + Half-day</p>
                    </div>

                    <div className="col-span-2 lg:col-span-1 bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <div className="flex items-center justify-between mb-1.5">
                            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Net Payable</span>
                            <IndianRupee size={16} className="text-emerald-600" />
                        </div>
                        <div className="text-xl sm:text-2xl font-extrabold text-emerald-900">₹{summary.totalNetPayroll.toLocaleString('en-IN')}</div>
                        <p className="text-[10px] text-emerald-700 mt-1">Total Net Disbursable</p>
                    </div>
                </div>

                {/* Filters & Payslips Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    {/* Filter Bar */}
                    <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-3 bg-slate-50/60">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            <input 
                                type="text" 
                                placeholder="Search by name, ID, designation..." 
                                className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex items-center gap-2">
                            <Filter size={15} className="text-slate-400" />
                            <select 
                                className="bg-white border border-slate-200 text-slate-700 text-xs sm:text-sm py-2 px-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium"
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                            >
                                <option value="">All Statuses</option>
                                <option value="Pending">Pending</option>
                                <option value="Processed">Processed</option>
                                <option value="Paid">Paid</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    {loading ? (
                        <div className="p-16 text-center">
                            <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
                            <p className="text-xs text-slate-400 mt-3 font-medium">Loading payslip records...</p>
                        </div>
                    ) : payslips.length === 0 ? (
                        <div className="p-12 text-center space-y-3">
                            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                                <FileText size={24} />
                            </div>
                            <h3 className="text-base font-bold text-slate-800">No Payslips Generated Yet</h3>
                            <p className="text-xs text-slate-500 max-w-sm mx-auto">
                                No payslips found for {monthNames[month - 1]} {year}. Click below to automatically generate payslips from attendance.
                            </p>
                            <button
                                onClick={handleGenerateAll}
                                disabled={bulkGenerating}
                                className="mt-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-xs transition-colors"
                            >
                                Generate All Payslips for {monthNames[month - 1]}
                            </button>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse text-xs sm:text-sm">
                                <thead>
                                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                        <th className="py-3.5 px-4">Employee</th>
                                        <th className="py-3.5 px-4">Base Salary</th>
                                        <th className="py-3.5 px-3 text-center">Work Days</th>
                                        <th className="py-3.5 px-3 text-center">Present</th>
                                        <th className="py-3.5 px-3 text-center">Paid Leave</th>
                                        <th className="py-3.5 px-3 text-center">Half Day</th>
                                        <th className="py-3.5 px-3 text-center">Absent</th>
                                        <th className="py-3.5 px-3 text-center">Paid Days</th>
                                        <th className="py-3.5 px-4">Deductions</th>
                                        <th className="py-3.5 px-4 font-extrabold text-slate-900">Net Salary</th>
                                        <th className="py-3.5 px-3 text-center">Status</th>
                                        <th className="py-3.5 px-4 text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {payslips.map((slip) => {
                                        const isActionBusy = actionLoadingId === slip._id;
                                        return (
                                            <tr key={slip._id} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-4">
                                                    <div className="font-bold text-slate-900 text-xs sm:text-sm">{slip.employeeName}</div>
                                                    <div className="text-[11px] text-slate-400 font-mono">
                                                        {slip.employeeId} • {slip.designation || 'Staff'}
                                                    </div>
                                                </td>
                                                <td className="py-3.5 px-4 font-medium text-slate-800">
                                                    ₹{Number(slip.monthlySalary || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-medium text-slate-700">
                                                    {slip.totalWorkingDays}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-bold text-emerald-700">
                                                    {slip.presentDays}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-bold text-purple-700 bg-purple-50/30">
                                                    +{slip.paidLeaveDays || 0} PL
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-bold text-amber-700">
                                                    {slip.halfDays}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-bold text-rose-700">
                                                    {slip.absentDays}
                                                </td>
                                                <td className="py-3.5 px-3 text-center font-extrabold text-blue-700 bg-blue-50/40">
                                                    {slip.paidDays}
                                                </td>
                                                <td className="py-3.5 px-4 font-semibold text-rose-600">
                                                    {slip.totalDeduction > 0 ? `-₹${Number(slip.totalDeduction).toLocaleString('en-IN')}` : '₹0'}
                                                </td>
                                                <td className="py-3.5 px-4 font-extrabold text-emerald-700 text-sm sm:text-base">
                                                    ₹{Number(slip.netSalary || 0).toLocaleString('en-IN')}
                                                </td>
                                                <td className="py-3.5 px-3 text-center">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                                        slip.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                                        slip.paymentStatus === 'Processed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {slip.paymentStatus || 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="py-3.5 px-4 text-right">
                                                    <div className="flex items-center justify-end gap-1 sm:gap-1.5">
                                                        {/* View Details */}
                                                        <Link 
                                                            to={`/admin/payslips/${slip._id}`}
                                                            className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                                                            title="View Payslip Details"
                                                        >
                                                            <Eye size={15} />
                                                        </Link>

                                                        {/* Download PDF */}
                                                        <button 
                                                            onClick={() => handleDownloadPDF(slip._id, slip.employeeId, slip.employeeName)}
                                                            disabled={isActionBusy}
                                                            className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Download PDF Payslip"
                                                        >
                                                            <Download size={15} />
                                                        </button>

                                                        {/* Edit Adjustments */}
                                                        <button 
                                                            onClick={() => openAdjustmentModal(slip)}
                                                            disabled={isActionBusy}
                                                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Adjust Bonus/Incentive/Deductions"
                                                        >
                                                            <Edit3 size={15} />
                                                        </button>

                                                        {/* Regenerate */}
                                                        <button 
                                                            onClick={() => handleRegenerate(slip._id, slip.employeeName)}
                                                            disabled={isActionBusy}
                                                            className="p-1.5 text-slate-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Regenerate from Live Attendance"
                                                        >
                                                            <RotateCw size={15} className={isActionBusy ? 'animate-spin' : ''} />
                                                        </button>

                                                        {/* Delete */}
                                                        <button 
                                                            onClick={() => handleDelete(slip._id, slip.employeeName)}
                                                            disabled={isActionBusy}
                                                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50"
                                                            title="Delete Payslip"
                                                        >
                                                            <Trash2 size={15} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                {/* MODAL 1: EDIT ADJUSTMENTS (Bonus / Incentive / Other Deductions / Status) */}
                {adjustmentModal.isOpen && adjustmentModal.payslip && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5">
                            <button 
                                onClick={() => setAdjustmentModal({ ...adjustmentModal, isOpen: false, payslip: null })}
                                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">
                                    Adjust Payslip: {adjustmentModal.payslip.employeeName}
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    {monthNames[month - 1]} {year} • Base Salary: ₹{adjustmentModal.payslip.monthlySalary.toLocaleString('en-IN')}
                                </p>
                            </div>

                            <form onSubmit={handleSaveAdjustments} className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Performance Bonus (₹)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            value={adjustmentModal.bonus}
                                            onChange={(e) => setAdjustmentModal({ ...adjustmentModal, bonus: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Incentive / Allowance (₹)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            value={adjustmentModal.incentive}
                                            onChange={(e) => setAdjustmentModal({ ...adjustmentModal, incentive: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Other Deductions (₹)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-rose-700"
                                            value={adjustmentModal.otherDeductions}
                                            onChange={(e) => setAdjustmentModal({ ...adjustmentModal, otherDeductions: Number(e.target.value) })}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Payment Status</label>
                                        <select 
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                            value={adjustmentModal.paymentStatus}
                                            onChange={(e) => setAdjustmentModal({ ...adjustmentModal, paymentStatus: e.target.value })}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processed">Processed</option>
                                            <option value="Paid">Paid</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Remarks (Optional)</label>
                                    <input 
                                        type="text"
                                        placeholder="e.g. Special festive bonus approved"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        value={adjustmentModal.remarks}
                                        onChange={(e) => setAdjustmentModal({ ...adjustmentModal, remarks: e.target.value })}
                                    />
                                </div>

                                {/* Real-time Preview Calculation */}
                                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-2 text-xs">
                                    <div className="flex justify-between text-slate-600">
                                        <span>Gross Earnings (Base + Bonus + Incentive):</span>
                                        <span className="font-bold text-slate-800">₹{modalGross.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-rose-600">
                                        <span>Total Deductions (Absent + Half-day + Other):</span>
                                        <span className="font-bold">-₹{modalTotalDeduction.toLocaleString('en-IN')}</span>
                                    </div>
                                    <div className="flex justify-between text-emerald-700 pt-2 border-t border-slate-200 font-extrabold text-sm">
                                        <span>Estimated Net Salary:</span>
                                        <span>₹{modalNetSalary.toLocaleString('en-IN')}</span>
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setAdjustmentModal({ ...adjustmentModal, isOpen: false, payslip: null })}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all"
                                    >
                                        Save Adjustments
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* MODAL 2: SINGLE EMPLOYEE GENERATION */}
                {generateModal.isOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
                        <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5">
                            <button 
                                onClick={() => setGenerateModal({ ...generateModal, isOpen: false })}
                                className="absolute right-5 top-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>

                            <div>
                                <h3 className="text-xl font-extrabold text-slate-900">
                                    Generate Single Payslip
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Period: {monthNames[month - 1]} {year}
                                </p>
                            </div>

                            <form onSubmit={handleGenerateSingleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Employee *</label>
                                    <select 
                                        required
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                                        value={generateModal.employeeId}
                                        onChange={(e) => setGenerateModal({ ...generateModal, employeeId: e.target.value })}
                                    >
                                        <option value="">-- Choose Active Employee --</option>
                                        {activeEmployees.map(emp => (
                                            <option key={emp._id} value={emp._id}>
                                                {emp.name} ({emp.employeeId || 'ID'}) - ₹{emp.baseSalary?.toLocaleString('en-IN')}/mo
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Bonus (₹)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                                            value={generateModal.bonus}
                                            onChange={(e) => setGenerateModal({ ...generateModal, bonus: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Incentive (₹)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                                            value={generateModal.incentive}
                                            onChange={(e) => setGenerateModal({ ...generateModal, incentive: Number(e.target.value) })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Other Deductions (₹)</label>
                                        <input 
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                                            value={generateModal.otherDeductions}
                                            onChange={(e) => setGenerateModal({ ...generateModal, otherDeductions: Number(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Status</label>
                                        <select 
                                            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none"
                                            value={generateModal.paymentStatus}
                                            onChange={(e) => setGenerateModal({ ...generateModal, paymentStatus: e.target.value })}
                                        >
                                            <option value="Pending">Pending</option>
                                            <option value="Processed">Processed</option>
                                            <option value="Paid">Paid</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Remarks</label>
                                    <input 
                                        type="text"
                                        placeholder="Optional notes"
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none"
                                        value={generateModal.remarks}
                                        onChange={(e) => setGenerateModal({ ...generateModal, remarks: e.target.value })}
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setGenerateModal({ ...generateModal, isOpen: false })}
                                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!generateModal.employeeId}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-lg shadow-blue-600/25 transition-all disabled:opacity-50"
                                    >
                                        Generate Slip
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

export default AdminPayslips;
