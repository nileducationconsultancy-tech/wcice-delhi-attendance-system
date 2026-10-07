import { useState } from 'react';
import { Link } from 'react-router-dom';
import logoImg from '../assets/LOGO.png';
import { Mail, Lock, Phone, ArrowLeft, CheckCircle2, AlertCircle, ShieldCheck, Loader2, Eye, EyeOff } from 'lucide-react';
import axios from 'axios';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');

        if (newPassword && newPassword.length < 4) {
            setErrorMsg('Password must be at least 4 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('New password and confirm password do not match.');
            return;
        }

        setLoading(true);
        try {
            await axios.post('/api/auth/reset-password', {
                email,
                phone,
                newPassword
            });
            setIsSubmitted(true);
        } catch (err) {
            setErrorMsg(err.response?.data?.message || 'Password reset failed. Please check your email and phone.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#070B14] font-sans text-slate-100 relative overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px]"></div>
                <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px]"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[140px]"></div>
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+Cjwvc3ZnPg==')]"></div>
            </div>

            {/* Left Side - Brand & Visual Area (Desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 xl:p-20 border-r border-white/[0.06]">
                <div>
                    <div className="flex items-center gap-3.5 mb-16">
                        <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl p-1.5 flex items-center justify-center shadow-xl shadow-black/40">
                            <img src={logoImg} alt="WECICE Delhi" className="w-full h-full object-contain" />
                        </div>
                        <div>
                            <span className="text-xl font-black tracking-tight text-white block">WECICE Delhi</span>
                            <span className="text-xs font-bold text-blue-400 uppercase tracking-widest">Attendance Portal</span>
                        </div>
                    </div>

                    <div className="max-w-md">
                        <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight text-white">
                            Recover your account password.
                        </h1>
                        <p className="text-slate-400 text-base mb-12 leading-relaxed">
                            Verify your registered email and mobile number to quickly reset your account password.
                        </p>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-between text-xs text-slate-500 font-medium w-full max-w-md">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-400"><ShieldCheck size={14} className="text-blue-400" /> Instant Self-Service Reset</span>
                    </div>
                    <span>© {new Date().getFullYear()} WECICE Delhi</span>
                </div>
            </div>

            {/* Right Side - Recovery Card */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative z-10 min-h-screen overflow-y-auto">
                
                {/* Mobile Header */}
                <div className="lg:hidden flex flex-col items-center text-center mb-6 pt-4">
                    <div className="w-16 h-16 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-xl shadow-blue-950/40 flex items-center justify-center mb-3">
                        <img src={logoImg} alt="WECICE Delhi Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white">WECICE Delhi</h1>
                    <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mt-0.5">Password Recovery</p>
                </div>

                {/* Card */}
                <div className="w-full max-w-[420px] bg-[#0E1526]/80 backdrop-blur-xl border border-white/[0.08] p-6 sm:p-9 rounded-3xl shadow-2xl shadow-black/80">
                    {!isSubmitted ? (
                        <>
                            <div className="mb-6 text-center sm:text-left">
                                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Reset Password</h2>
                                <p className="text-slate-400 text-xs sm:text-sm mt-1">Verify your details and set a new password.</p>
                            </div>

                            {errorMsg && (
                                <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-medium flex items-start gap-2.5">
                                    <AlertCircle size={16} className="text-rose-400 mt-0.5 flex-shrink-0" />
                                    <span>{errorMsg}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Registered Email *</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        <input
                                            type="email"
                                            placeholder="employee@wecice.com"
                                            className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Registered Mobile Number *</label>
                                    <div className="relative">
                                        <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        <input
                                            type="tel"
                                            placeholder="e.g. 8252584025"
                                            className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">New Password *</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Min. 4 characters"
                                            className="w-full pl-10 pr-11 py-3 bg-white/[0.04] border border-white/[0.1] focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            required
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-1"
                                        >
                                            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">Confirm New Password *</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            placeholder="Re-type new password"
                                            className="w-full pl-10 pr-4 py-3 bg-white/[0.04] border border-white/[0.1] focus:border-blue-500 focus:ring-blue-500/20 rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            required
                                        />
                                    </div>
                                </div>
                                
                                <button
                                    type="submit"
                                    disabled={loading || !email || !phone || !newPassword || !confirmPassword}
                                    className="w-full mt-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-950/60 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={18} className="animate-spin" />
                                            <span>Resetting password...</span>
                                        </>
                                    ) : (
                                        'Reset Password'
                                    )}
                                </button>
                            </form>
                        </>
                    ) : (
                        <div className="text-center py-4">
                            <div className="w-14 h-14 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <CheckCircle2 size={28} />
                            </div>
                            <h2 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h2>
                            <p className="text-slate-400 text-xs sm:text-sm mb-6">
                                Your password has been updated. You can now sign in to your portal.
                            </p>
                            
                            <Link
                                to="/login"
                                className="inline-flex justify-center items-center w-full bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg shadow-blue-950/60 transition-all text-xs"
                            >
                                Proceed to Sign In
                            </Link>
                        </div>
                    )}

                    <div className="mt-6 text-center">
                        <Link to="/login" className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-blue-400 transition-colors">
                            <ArrowLeft size={14} />
                            Back to Sign In
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
