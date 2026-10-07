import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
    Mail, Phone, Calendar, Briefcase, Hash, Shield, 
    CheckCircle2, Copy, Check, AlertCircle, RefreshCw, XCircle, Clock, Lock, KeyRound, Eye, EyeOff, Loader2
} from 'lucide-react';
import useAuthStore from '../store/authStore';
import { usePopupStore } from '../store/popupStore';
import axios from 'axios';

const CopyText = ({ text, label }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = () => {
        if (!text || text === 'Not provided') return;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="flex items-center gap-2 group">
            <p className="font-medium text-slate-900">{text || 'Not provided'}</p>
            {text && text !== 'Not provided' && (
                <button 
                    onClick={handleCopy} 
                    title={`Copy ${label}`}
                    className="text-slate-400 hover:text-blue-600 transition-colors p-1 opacity-0 group-hover:opacity-100 focus:opacity-100"
                >
                    {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
            )}
        </div>
    );
};

const Profile = () => {
    const { user } = useAuthStore();
    const { showAlert } = usePopupStore();
    const [employee, setEmployee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Change Password Form State
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    const fetchProfile = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const { data } = await axios.get('/api/auth/me');
            setEmployee(data.employee || data);
        } catch (err) {
            console.error('Failed to load profile', err);
            setError('Unable to load your profile.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchProfile();
    }, [fetchProfile]);

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword.length < 4) {
            setPasswordError('New password must be at least 4 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setPasswordError('New password and confirm password do not match.');
            return;
        }

        setPasswordLoading(true);
        try {
            const res = await axios.put('/api/auth/change-password', {
                currentPassword,
                newPassword
            });

            setPasswordSuccess(res.data.message || 'Password changed successfully!');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            showAlert({
                title: 'Password Updated',
                message: 'Your password has been changed successfully. You can now use your new password next time you log in.',
                type: 'success'
            });
        } catch (err) {
            setPasswordError(err.response?.data?.message || 'Failed to update password.');
        } finally {
            setPasswordLoading(false);
        }
    };

    const fullName = employee?.name || user?.name || (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? 'Dr. Feroz' : 'Employee');
    const email = employee?.email || user?.email || 'Not provided';
    const phone = employee?.phone || 'Not provided';
    const role = employee?.role || user?.role || 'EMPLOYEE';
    const designation = employee?.designation || (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? 'Administrator' : 'Staff');
    const empId = employee?.employeeId || (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? 'ADMIN-01' : '--');
    
    const scheduleFormatted = employee?.workSchedule === '5_DAYS' 
        ? '5 Days (Mon–Fri, Sat–Sun OFF)' 
        : '6 Days (Mon–Sat, Sun OFF)';
    
    const salaryFormatted = employee?.baseSalary 
        ? `₹${Number(employee.baseSalary).toLocaleString('en-IN')}/mo` 
        : (['ADMIN', 'SUPER_ADMIN'].includes(user?.role) ? 'N/A' : '₹0/mo');

    const joinDate = employee?.joiningDate 
        ? new Date(employee.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) 
        : 'Not specified';

    const status = user?.status || employee?.status || 'ACTIVE';

    if (loading) {
        return (
            <Layout>
                <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-4xl mx-auto w-full space-y-6 pb-12">
                
                {/* Title */}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Account Profile</h1>
                    <p className="text-slate-500 text-sm mt-0.5">Your personal credentials, employment terms, and salary details</p>
                </div>

                {/* Profile Header */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 flex flex-col sm:flex-row items-center sm:items-start gap-6">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 border-2 border-blue-200 flex items-center justify-center text-2xl font-bold text-white shadow-md shadow-blue-500/20">
                        {fullName.charAt(0).toUpperCase()}
                    </div>

                    <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-1">
                            <h2 className="text-2xl font-bold text-slate-900">{fullName}</h2>
                            <span className="inline-flex px-2.5 py-0.5 bg-emerald-100 text-emerald-800 text-xs font-bold rounded-full w-fit mx-auto sm:mx-0">
                                {status}
                            </span>
                        </div>
                        <p className="text-slate-600 font-medium text-sm">
                            {designation} • <span className="font-mono text-slate-500">{empId}</span>
                        </p>
                    </div>
                </div>

                {/* 2-Column Grid: Contact & System | Employment & Salary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* Card 1: Contact & System */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                        <h3 className="font-bold text-slate-800 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
                            <Mail size={18} className="text-blue-600" /> Contact & System
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Email</p>
                                <CopyText text={email} label="Email" />
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Phone</p>
                                <CopyText text={phone} label="Phone" />
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Role</p>
                                <span className="inline-flex px-2.5 py-1 bg-slate-100 text-slate-800 text-xs font-bold rounded-lg font-mono">
                                    {role}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Card 2: Employment & Salary */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
                        <h3 className="font-bold text-slate-800 text-sm pb-3 border-b border-slate-100 flex items-center gap-2">
                            <Briefcase size={18} className="text-emerald-600" /> Employment & Salary
                        </h3>
                        
                        <div className="space-y-4">
                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Designation</p>
                                <p className="font-semibold text-slate-900 text-sm">{designation}</p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Schedule</p>
                                <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Clock size={15} className="text-blue-500" />
                                    {scheduleFormatted}
                                </p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Monthly Salary</p>
                                <p className="font-bold text-emerald-600 text-base font-mono">{salaryFormatted}</p>
                            </div>

                            <div>
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Joining Date</p>
                                <p className="font-semibold text-slate-800 text-sm flex items-center gap-1.5">
                                    <Calendar size={15} className="text-amber-500" />
                                    {joinDate}
                                </p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Card 3: Security & Change Password */}
                <div className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-4 border-b border-slate-100">
                        <div>
                            <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                                <KeyRound size={20} className="text-blue-600" /> Security & Change Password
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                                Set your own custom password for easier and faster daily punch-in.
                            </p>
                        </div>
                    </div>

                    {passwordError && (
                        <div className="p-4 bg-rose-50 text-rose-700 rounded-xl border border-rose-200 text-xs font-semibold flex items-center gap-2">
                            <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                            <span>{passwordError}</span>
                        </div>
                    )}

                    {passwordSuccess && (
                        <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-xs font-semibold flex items-center gap-2">
                            <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0" />
                            <span>{passwordSuccess}</span>
                        </div>
                    )}

                    <form onSubmit={handleChangePassword} className="space-y-4 max-w-xl">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Current Password <span className="text-slate-400 font-normal lowercase">(optional if default)</span>
                            </label>
                            <div className="relative">
                                <input
                                    type={showCurrentPassword ? "text" : "password"}
                                    placeholder="Enter current password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                    {showCurrentPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    New Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showNewPassword ? "text" : "password"}
                                        placeholder="Min. 4 characters"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        required
                                        className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1"
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                    Confirm New Password *
                                </label>
                                <input
                                    type={showNewPassword ? "text" : "password"}
                                    placeholder="Re-type new password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-900"
                                />
                            </div>
                        </div>

                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={passwordLoading || !newPassword || !confirmPassword}
                                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-600/20 transition-all disabled:opacity-50 flex items-center gap-2"
                            >
                                {passwordLoading ? (
                                    <>
                                        <Loader2 size={14} className="animate-spin" />
                                        <span>Updating Password...</span>
                                    </>
                                ) : (
                                    <>
                                        <Lock size={14} />
                                        <span>Update My Password</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

            </div>
        </Layout>
    );
};

export default Profile;
