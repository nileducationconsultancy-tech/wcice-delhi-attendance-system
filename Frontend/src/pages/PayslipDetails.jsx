import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
    ChevronLeft, Download, Printer, RotateCw, FileText, 
    Calendar, User, Building, Clock, IndianRupee, ShieldCheck, CheckCircle2, AlertCircle
} from 'lucide-react';
import { payslipApi } from '../services/api/payslipApi';
import { usePopupStore } from '../store/popupStore';
import logoImg from '../assets/LOGO.png';
import signatureImg from '../assets/signature.png';

const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const PayslipDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [payslip, setPayslip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const { showAlert, showConfirm } = usePopupStore();

    const fetchDetails = async () => {
        setLoading(true);
        try {
            const res = await payslipApi.getById(id);
            setPayslip(res.data);
        } catch (err) {
            console.error('Error fetching payslip details:', err);
            await showAlert({
                title: 'Error',
                message: 'Failed to load payslip details.',
                type: 'error'
            });
            navigate('/admin/payslips');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetails();
    }, [id]);

    const handleDownloadPDF = async () => {
        if (!payslip) return;
        setDownloading(true);
        try {
            const response = await payslipApi.downloadPDF(payslip._id);
            const blob = new Blob([response.data], { type: 'application/pdf' });
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
                message: 'Failed to download PDF.',
                type: 'error'
            });
        } finally {
            setDownloading(false);
        }
    };

    const handleRegenerate = async () => {
        if (!payslip) return;
        const confirmed = await showConfirm({
            title: 'Regenerate Payslip?',
            message: 'This will re-calculate attendance and salary figures from live records.',
            type: 'warning',
            confirmText: 'Regenerate'
        });

        if (!confirmed) return;

        setRegenerating(true);
        try {
            const res = await payslipApi.regenerate(payslip._id);
            setPayslip(res.data.payslip);
            await showAlert({
                title: 'Recalculation Complete',
                message: 'Payslip regenerated successfully.',
                type: 'success'
            });
        } catch (err) {
            await showAlert({
                title: 'Error',
                message: err.response?.data?.message || 'Failed to regenerate payslip.',
                type: 'error'
            });
        } finally {
            setRegenerating(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <Layout>
                <div className="min-h-[calc(100vh-64px)] flex items-center justify-center">
                    <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    if (!payslip) return null;

    const monthName = monthNames[payslip.month - 1] || 'Month';
    const year = payslip.year;

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6 pb-16">
                
                {/* Top Action Controls (Hidden when printing) */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs print:hidden">
                    <Link 
                        to="/admin/payslips"
                        className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors"
                    >
                        <ChevronLeft size={18} /> Back to Payslips
                    </Link>

                    <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                        <button 
                            onClick={handleRegenerate}
                            disabled={regenerating}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors disabled:opacity-50"
                        >
                            <RotateCw size={15} className={regenerating ? 'animate-spin' : ''} />
                            <span>Recalculate</span>
                        </button>

                        <button 
                            onClick={handlePrint}
                            className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
                        >
                            <Printer size={15} />
                            <span>Print</span>
                        </button>

                        <button 
                            onClick={handleDownloadPDF}
                            disabled={downloading}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 shadow-md shadow-blue-600/20 transition-all disabled:opacity-50"
                        >
                            {downloading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Generating PDF...</span>
                                </>
                            ) : (
                                <>
                                    <Download size={15} />
                                    <span>Download PDF</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* MAIN PAYSLIP CARD (Printable Document) */}
                <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none">
                    
                    {/* Header Banner */}
                    <div className="bg-slate-900 text-white p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-2xl bg-white/10 p-1.5 border border-white/20 flex-shrink-0 flex items-center justify-center">
                                <img src={logoImg} alt="WECICE Delhi Logo" className="w-full h-full object-contain" />
                            </div>
                            <div>
                                <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight">WECICE Delhi</h1>
                                <p className="text-xs text-slate-400 mt-0.5">Automated Attendance & Salary Payslip</p>
                            </div>
                        </div>

                        <div className="text-left sm:text-right">
                            <span className="inline-block px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-bold uppercase tracking-wider mb-1">
                                Salary Payslip
                            </span>
                            <div className="text-lg font-bold text-white font-mono">{monthName} {year}</div>
                        </div>
                    </div>

                    <div className="p-6 sm:p-8 space-y-6">
                        
                        {/* Employee Details Grid */}
                        <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs sm:text-sm">
                            <div>
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Employee Name</span>
                                <p className="font-extrabold text-slate-900 mt-0.5">{payslip.employeeName}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Employee ID</span>
                                <p className="font-extrabold text-slate-900 font-mono mt-0.5">{payslip.employeeId}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Designation</span>
                                <p className="font-extrabold text-slate-900 mt-0.5">{payslip.designation || 'Staff'}</p>
                            </div>
                            <div>
                                <span className="text-slate-400 text-[11px] font-bold uppercase tracking-wider">Work Schedule</span>
                                <p className="font-extrabold text-slate-900 mt-0.5">
                                    {payslip.workSchedule === '5_DAYS' ? '5 Days (Mon-Fri)' : '6 Days (Mon-Sat)'}
                                </p>
                            </div>
                        </div>

                        {/* Attendance Summary Grid */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance Breakdown ({monthName} {year})</h3>
                                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                                    Method: Calendar Days Basis ({new Date(payslip.year, payslip.month, 0).getDate()} Days)
                                </span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 text-center">
                                {/* 1. Calendar Days in Month */}
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Month Days</div>
                                    <div className="text-base font-extrabold text-slate-900 mt-0.5">{new Date(payslip.year, payslip.month, 0).getDate()}</div>
                                    <div className="text-[9px] text-slate-400">Total Calendar</div>
                                </div>

                                {/* 2. Office Work Days */}
                                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-500 uppercase">Office Days</div>
                                    <div className="text-base font-extrabold text-slate-800 mt-0.5">{payslip.totalWorkingDays}</div>
                                    <div className="text-[9px] text-slate-400">{payslip.workSchedule === '5_DAYS' ? 'Mon-Fri (5-Day)' : 'Mon-Sat (6-Day)'}</div>
                                </div>

                                {/* 3. Weekends & Holidays (Paid) */}
                                <div className="p-2.5 bg-indigo-50/70 rounded-xl border border-indigo-100">
                                    <div className="text-[10px] font-bold text-indigo-800 uppercase">Off / Holidays</div>
                                    <div className="text-base font-extrabold text-indigo-900 mt-0.5">{(payslip.weeklyOffDays || 0) + (payslip.holidayDays || 0)}</div>
                                    <div className="text-[9px] text-indigo-600 font-semibold">Paid Weekends</div>
                                </div>

                                {/* 4. Present */}
                                <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-100">
                                    <div className="text-[10px] font-bold text-emerald-800 uppercase">Present</div>
                                    <div className="text-base font-extrabold text-emerald-900 mt-0.5">{payslip.presentDays}</div>
                                    <div className="text-[9px] text-emerald-600 font-semibold">Office Attended</div>
                                </div>

                                {/* 5. Paid Leave */}
                                <div className="p-2.5 bg-purple-50/70 rounded-xl border border-purple-100">
                                    <div className="text-[10px] font-bold text-purple-800 uppercase">Paid Leave</div>
                                    <div className="text-base font-extrabold text-purple-900 mt-0.5">+{payslip.paidLeaveDays || 0} PL</div>
                                    <div className="text-[9px] text-purple-600 font-semibold">CL Covered</div>
                                </div>

                                {/* 6. Half Days */}
                                <div className="p-2.5 bg-amber-50/70 rounded-xl border border-amber-100">
                                    <div className="text-[10px] font-bold text-amber-800 uppercase">Half Days</div>
                                    <div className="text-base font-extrabold text-amber-900 mt-0.5">{payslip.halfDays}</div>
                                    <div className="text-[9px] text-amber-600 font-semibold">@ 50% Pay</div>
                                </div>

                                {/* 7. Absent Days */}
                                <div className="p-2.5 bg-rose-50/70 rounded-xl border border-rose-100">
                                    <div className="text-[10px] font-bold text-rose-800 uppercase">Absent</div>
                                    <div className="text-base font-extrabold text-rose-900 mt-0.5">{payslip.absentDays}</div>
                                    <div className="text-[9px] text-rose-600 font-semibold">Unpaid: {Math.max(0, (payslip.absentDays || 0) - (payslip.paidLeaveDays || 0))}d</div>
                                </div>

                                {/* 8. Total Paid Days */}
                                <div className="p-2.5 bg-blue-50/90 rounded-xl border border-blue-200 shadow-xs">
                                    <div className="text-[10px] font-extrabold text-blue-900 uppercase">Total Paid Days</div>
                                    <div className="text-base font-black text-blue-950 mt-0.5">{payslip.paidDays} <span className="text-[11px] font-normal text-blue-700">/ {new Date(payslip.year, payslip.month, 0).getDate()}</span></div>
                                    <div className="text-[9px] text-blue-700 font-bold">Salary Credited</div>
                                </div>
                            </div>

                            {/* Clear explanatory formula tag */}
                            <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 text-xs text-slate-600 space-y-1">
                                <div className="flex items-center gap-1.5 font-bold text-slate-800">
                                    <span>💡 How Paid Days ({payslip.paidDays}) is calculated:</span>
                                </div>
                                <div className="text-[11px] leading-relaxed text-slate-600">
                                    {payslip.presentDays} Present + {(payslip.weeklyOffDays || 0) + (payslip.holidayDays || 0)} Paid Weekends/Holidays + {payslip.paidLeaveDays || 0} Paid Leave (CL) {payslip.halfDays > 0 ? `+ ${payslip.halfDays * 0.5} Half Days` : ''} = <strong className="text-emerald-700 font-bold">{payslip.paidDays} Days (out of {new Date(payslip.year, payslip.month, 0).getDate()} calendar days)</strong>
                                </div>
                            </div>
                        </div>

                        {/* Earnings vs Deductions Table */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            
                            {/* Left Box: Earnings */}
                            <div className="border border-emerald-200/80 rounded-2xl overflow-hidden shadow-xs">
                                <div className="bg-emerald-50 p-3.5 border-b border-emerald-200/80 flex justify-between items-center text-xs font-bold text-emerald-900 uppercase tracking-wider">
                                    <span>Earnings Description</span>
                                    <span>Amount</span>
                                </div>
                                <div className="p-4 space-y-3 text-xs sm:text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Basic Monthly Base Salary</span>
                                        <span className="font-semibold text-slate-900">₹{Number(payslip.monthlySalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Performance Bonus</span>
                                        <span className="font-semibold text-slate-900">₹{Number(payslip.bonus || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Incentive / Allowance</span>
                                        <span className="font-semibold text-slate-900">₹{Number(payslip.incentive || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-slate-400 text-xs pt-1 border-t border-slate-100">
                                        <span>Daily Salary Rate (Base / {new Date(payslip.year, payslip.month, 0).getDate()} days)</span>
                                        <span>₹{Number(payslip.perDaySalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/day</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                                    <span>Total Gross Earnings</span>
                                    <span className="text-emerald-700 font-mono">₹{Number(payslip.grossSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                            {/* Right Box: Deductions */}
                            <div className="border border-rose-200/80 rounded-2xl overflow-hidden shadow-xs">
                                <div className="bg-rose-50 p-3.5 border-b border-rose-200/80 flex justify-between items-center text-xs font-bold text-rose-900 uppercase tracking-wider">
                                    <span>Deduction Description</span>
                                    <span>Amount</span>
                                </div>
                                <div className="p-4 space-y-3 text-xs sm:text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Absent Deduction ({payslip.absentDays || 0} Days - PL)</span>
                                        <span className="font-semibold text-rose-600">₹{Number(payslip.absentDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Half-Day Deduction ({payslip.halfDays || 0} Days @ 50%)</span>
                                        <span className="font-semibold text-rose-600">₹{Number(payslip.halfDayDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-slate-600">Other Deductions / Advance</span>
                                        <span className="font-semibold text-rose-600">₹{Number(payslip.otherDeductions || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-3.5 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold text-slate-900">
                                    <span>Total Deductions</span>
                                    <span className="text-rose-700 font-mono">-₹{Number(payslip.totalDeduction).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>

                        </div>

                        {/* Large Net Salary Highlight Banner */}
                        <div className="bg-emerald-900 text-white rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-lg shadow-emerald-950/20">
                            <div>
                                <span className="text-emerald-300 text-xs font-bold uppercase tracking-wider">Net Take-Home Pay</span>
                                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mt-1 font-mono tracking-tight">
                                    ₹{Number(payslip.netSalary).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                </h2>
                                <p className="text-emerald-200 text-xs mt-1">
                                    Calculated for {payslip.paidDays} Paid Days ({payslip.presentDays} Present + {payslip.paidLeaveDays || 0} PL + {payslip.halfDays * 0.5} Half-day)
                                </p>
                            </div>

                            <div className="text-left sm:text-right">
                                <span className={`inline-block px-3.5 py-1 rounded-full text-xs font-extrabold uppercase tracking-wide ${
                                    payslip.paymentStatus === 'Paid' ? 'bg-emerald-400 text-emerald-950' :
                                    payslip.paymentStatus === 'Processed' ? 'bg-blue-400 text-blue-950' :
                                    'bg-amber-400 text-amber-950'
                                }`}>
                                    {payslip.paymentStatus || 'Pending'}
                                </span>
                            </div>
                        </div>

                        {/* Remarks if any */}
                        {payslip.remarks && (
                            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs">
                                <span className="font-bold text-slate-600 uppercase tracking-wider">Remarks: </span>
                                <span className="text-slate-800">{payslip.remarks}</span>
                            </div>
                        )}

                        {/* Signatures Section */}
                        <div className="pt-8 pb-4 flex justify-between items-end gap-6">
                            <div className="text-center w-48">
                                <div className="border-b border-slate-300 w-full mb-1.5 h-12"></div>
                                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Employee Signature</span>
                            </div>

                            <div className="text-center w-56">
                                <div className="flex justify-center mb-1">
                                    <img src={signatureImg} alt="Authorised Signatory" className="h-14 sm:h-16 object-contain" />
                                </div>
                                <div className="text-[10px] text-slate-400 font-medium">Verified by WECICE Delhi</div>
                            </div>
                        </div>

                        {/* Document Footer */}
                        <div className="pt-4 border-t border-slate-100 text-center text-slate-400 text-xs space-y-1">
                            <p>This is a computer-generated payslip verified by WECICE Delhi.</p>
                            <p className="text-[11px]">Generated on {new Date(payslip.generatedAt || Date.now()).toLocaleDateString('en-IN')} • WECICE Delhi Attendance & Payroll System</p>
                        </div>

                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default PayslipDetails;
