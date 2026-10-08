import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { 
    FileText, Download, Calendar, IndianRupee, Clock, 
    ShieldCheck, AlertCircle, CheckCircle2, ChevronRight, Eye, RefreshCw, Loader2
} from 'lucide-react';
import { payslipApi } from '../services/api/payslipApi';
import { usePopupStore } from '../store/popupStore';

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const MyPayslips = () => {
    const [payslips, setPayslips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [downloadingId, setDownloadingId] = useState(null);
    const [selectedPayslip, setSelectedPayslip] = useState(null);
    const { showAlert } = usePopupStore();

    const fetchPayslips = async () => {
        setLoading(true);
        try {
            const res = await payslipApi.getMyHistory();
            setPayslips(res.data.payslips || []);
        } catch (err) {
            console.error('Error fetching my payslips:', err);
            await showAlert({
                title: 'Error',
                message: 'Failed to load your salary slips.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPayslips();
    }, []);

    const handleDownloadPDF = async (payslip) => {
        setDownloadingId(payslip._id);
        try {
            const res = await payslipApi.downloadMyPDF(payslip._id);
            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `Payslip_${payslip.employeeId}_${monthNames[payslip.month - 1]}_${payslip.year}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            await showAlert({
                title: 'Download Failed',
                message: 'Could not download the salary slip PDF.',
                type: 'error'
            });
        } finally {
            setDownloadingId(null);
        }
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <Loader2 size={32} className="animate-spin text-emerald-600" />
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-3 sm:p-5 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-16">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FileText className="text-emerald-600" size={26} />
                            My Salary Slips
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            View monthly salary statements, attendance deductions, and download signed PDF payslips
                        </p>
                    </div>

                    <button
                        onClick={fetchPayslips}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-stretch sm:self-auto justify-center"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Payslips List */}
                {payslips.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
                        <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto">
                            <FileText size={24} />
                        </div>
                        <h3 className="font-bold text-slate-800 text-base">No Payslips Generated Yet</h3>
                        <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Your monthly salary slip will appear here as soon as HR/Admin generates and processes the monthly payroll.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {payslips.map((slip) => {
                            const monthName = monthNames[slip.month - 1] || 'Month';
                            const totalCalDays = new Date(slip.year, slip.month, 0).getDate();

                            return (
                                <div 
                                    key={slip._id}
                                    className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-300 shadow-xs transition-all overflow-hidden"
                                >
                                    <div className="p-5 sm:p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
                                        
                                        {/* Month & Status */}
                                        <div className="flex items-start gap-4 min-w-0">
                                            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-700 border border-emerald-100 flex-shrink-0 flex items-center justify-center">
                                                <Calendar size={22} />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2.5">
                                                    <h3 className="font-extrabold text-slate-900 text-base sm:text-lg">
                                                        {monthName} {slip.year}
                                                    </h3>
                                                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                                                        slip.paymentStatus === 'Paid' ? 'bg-emerald-100 text-emerald-800' :
                                                        slip.paymentStatus === 'Processed' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {slip.paymentStatus || 'Pending'}
                                                    </span>
                                                </div>
                                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 mt-1 font-medium">
                                                    <span>Paid Days: <strong className="text-slate-800">{slip.paidDays}</strong> / {totalCalDays}</span>
                                                    <span>•</span>
                                                    <span>Present: <strong className="text-emerald-700">{slip.presentDays}d</strong></span>
                                                    {slip.halfDays > 0 && <span>• Half: <strong className="text-amber-700">{slip.halfDays}d</strong></span>}
                                                    {slip.absentDays > 0 && <span>• Absent: <strong className="text-rose-700">{slip.absentDays}d</strong></span>}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Financial Summary & Actions */}
                                        <div className="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                                            <div className="text-left md:text-right">
                                                <span className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Net Take-Home Pay</span>
                                                <div className="text-xl sm:text-2xl font-black text-emerald-800 font-mono">
                                                    ₹{Number(slip.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                                </div>
                                                {slip.totalDeduction > 0 && (
                                                    <div className="text-[11px] text-rose-600 font-medium">
                                                        -₹{Number(slip.totalDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })} deducted
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <button
                                                    onClick={() => setSelectedPayslip(selectedPayslip?._id === slip._id ? null : slip)}
                                                    className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5"
                                                >
                                                    <Eye size={14} />
                                                    <span>{selectedPayslip?._id === slip._id ? 'Hide' : 'Details'}</span>
                                                </button>

                                                <button
                                                    onClick={() => handleDownloadPDF(slip)}
                                                    disabled={downloadingId === slip._id}
                                                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs shadow-blue-600/20 flex items-center gap-1.5 disabled:opacity-50"
                                                >
                                                    {downloadingId === slip._id ? (
                                                        <Loader2 size={14} className="animate-spin" />
                                                    ) : (
                                                        <Download size={14} />
                                                    )}
                                                    <span>PDF</span>
                                                </button>
                                            </div>
                                        </div>

                                    </div>

                                    {/* Expanded Itemized Breakdown View */}
                                    {selectedPayslip?._id === slip._id && (
                                        <div className="bg-slate-50 p-5 sm:p-6 border-t border-slate-200/80 space-y-4 animate-in fade-in duration-150">
                                            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider">
                                                Itemized Salary & Deduction Breakdown
                                            </h4>

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                                                {/* Earnings Box */}
                                                <div className="bg-white p-4 rounded-xl border border-emerald-200 space-y-2.5">
                                                    <div className="font-bold text-emerald-900 border-b border-emerald-100 pb-1.5 flex justify-between">
                                                        <span>Earnings</span>
                                                        <span>Amount</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Monthly Base Salary</span>
                                                        <span className="font-bold text-slate-900">₹{Number(slip.monthlySalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    {slip.bonus > 0 && (
                                                        <div className="flex justify-between text-slate-600">
                                                            <span>Performance Bonus</span>
                                                            <span className="font-bold text-slate-900">₹{Number(slip.bonus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    )}
                                                    {slip.incentive > 0 && (
                                                        <div className="flex justify-between text-slate-600">
                                                            <span>Incentive / Allowance</span>
                                                            <span className="font-bold text-slate-900">₹{Number(slip.incentive).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-slate-400 text-[11px] pt-1 border-t border-slate-100">
                                                        <span>Per Day Rate (Base / {totalCalDays}d)</span>
                                                        <span>₹{Number(slip.perDaySalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/day</span>
                                                    </div>
                                                </div>

                                                {/* Deductions Box */}
                                                <div className="bg-white p-4 rounded-xl border border-rose-200 space-y-2.5">
                                                    <div className="font-bold text-rose-900 border-b border-rose-100 pb-1.5 flex justify-between">
                                                        <span>Deductions</span>
                                                        <span>Amount</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Absent Deduction ({slip.absentDays || 0}d - {slip.paidLeaveDays || 0} PL)</span>
                                                        <span className="font-bold text-rose-600">₹{Number(slip.absentDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    <div className="flex justify-between text-slate-600">
                                                        <span>Half-Day Deduction ({slip.halfDays || 0}d @ 50%)</span>
                                                        <span className="font-bold text-rose-600">₹{Number(slip.halfDayDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                    {slip.otherDeductions > 0 && (
                                                        <div className="flex justify-between text-slate-600">
                                                            <span>Other Deductions / Advance</span>
                                                            <span className="font-bold text-rose-600">₹{Number(slip.otherDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                        </div>
                                                    )}
                                                    <div className="flex justify-between text-slate-800 font-bold text-[11px] pt-1 border-t border-slate-100">
                                                        <span>Total Deductions</span>
                                                        <span className="text-rose-700">-₹{Number(slip.totalDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {slip.remarks && (
                                                <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-600">
                                                    <span className="font-bold text-slate-700">Remarks: </span>{slip.remarks}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                </div>
                            );
                        })}
                    </div>
                )}

            </div>
        </Layout>
    );
};

export default MyPayslips;
