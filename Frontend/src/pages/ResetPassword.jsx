import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, CheckCircle2 } from 'lucide-react';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Basic password strength validation
    const validations = {
        length: password.length >= 8,
        uppercase: /[A-Z]/.test(password),
        number: /[0-9]/.test(password),
        special: /[!@#$%^&*(),.?":{}|<>]/.test(password),
    };

    const strength = Object.values(validations).filter(Boolean).length;
    let strengthLabel = 'Weak';
    let strengthColor = 'bg-red-500';
    
    if (strength === 3) {
        strengthLabel = 'Good';
        strengthColor = 'bg-amber-500';
    } else if (strength === 4) {
        strengthLabel = 'Strong';
        strengthColor = 'bg-emerald-500';
    }

    const passwordsMatch = password && confirmPassword && password === confirmPassword;
    const isValid = strength === 4 && passwordsMatch;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!isValid) return;
        
        setLoading(true);
        // Simulate API call
        setTimeout(() => {
            setLoading(false);
            setIsSuccess(true);
        }, 1500);
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="w-full max-w-md bg-white p-10 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 text-center">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Password Updated!</h2>
                    <p className="text-slate-500 mb-8">
                        Your password has been changed successfully. You can now log in with your new password.
                    </p>
                    <Link to="/login" className="inline-block w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition-all shadow-md">
                        Proceed to Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col md:flex-row bg-white">
            
            {/* Left Side - Branding & Visuals (45%) */}
            <div className="hidden md:flex md:w-[45%] bg-slate-900 relative overflow-hidden flex-col p-12 lg:p-16 text-white justify-between">
                {/* Subtle animated gradient background effect */}
                <div className="absolute top-0 left-0 w-full h-full opacity-30">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[100px] animate-pulse"></div>
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-500 rounded-full blur-[100px] animate-pulse" style={{ animationDelay: '2s' }}></div>
                </div>

                <div className="relative z-10 flex-1 flex flex-col justify-center">
                    <div className="flex items-center gap-3 mb-12">
                        <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-xl flex items-center justify-center font-bold text-2xl shadow-lg">
                            W
                        </div>
                        <span className="text-2xl font-bold tracking-tight">WECICE Delhi</span>
                    </div>

                    <h1 className="text-4xl lg:text-5xl font-extrabold leading-tight mb-6">
                        Almost there,<br/>
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">
                            Set your key.
                        </span>
                    </h1>
                    
                    <p className="text-slate-300 text-lg max-w-md leading-relaxed">
                        Create a strong password to ensure your account remains secure.
                    </p>
                </div>

                <div className="relative z-10 text-slate-400 text-sm">
                    © {new Date().getFullYear()} WECICE Delhi Attendance System. All rights reserved.
                </div>
            </div>

            {/* Right Side - Reset Card (55%) */}
            <div className="flex-1 flex items-center justify-center p-6 md:p-12 bg-slate-50 overflow-y-auto">
                <div className="w-full max-w-md bg-white p-8 md:p-10 rounded-[20px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 my-auto">
                    
                    <div className="mb-8">
                        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">Create new password</h2>
                        <p className="text-slate-500">Choose a strong password for your account.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Confirm Password</label>
                            <div className="relative">
                                <input
                                    type={showConfirmPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:bg-white outline-none transition-all ${confirmPassword && !passwordsMatch ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' : 'border-slate-200 focus:ring-blue-500/20 focus:border-blue-500'}`}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                >
                                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                            {confirmPassword && !passwordsMatch && (
                                <p className="text-red-500 text-xs mt-1 font-medium">Passwords do not match</p>
                            )}
                        </div>

                        {/* Password Strength Indicator */}
                        {password && (
                            <div className="mt-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <div className="flex justify-between items-center mb-2">
                                    <span className="text-xs font-semibold text-slate-700">Password strength:</span>
                                    <span className={`text-xs font-bold ${strength === 4 ? 'text-emerald-600' : strength === 3 ? 'text-amber-600' : 'text-red-600'}`}>
                                        {strengthLabel}
                                    </span>
                                </div>
                                
                                <div className="flex gap-1 h-1.5 mb-4">
                                    <div className={`flex-1 rounded-full ${strength >= 1 ? strengthColor : 'bg-slate-200'}`}></div>
                                    <div className={`flex-1 rounded-full ${strength >= 2 ? strengthColor : 'bg-slate-200'}`}></div>
                                    <div className={`flex-1 rounded-full ${strength >= 3 ? strengthColor : 'bg-slate-200'}`}></div>
                                    <div className={`flex-1 rounded-full ${strength >= 4 ? strengthColor : 'bg-slate-200'}`}></div>
                                </div>

                                <ul className="space-y-1.5 text-xs font-medium">
                                    <li className={`flex items-center gap-2 ${validations.length ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={14} className={validations.length ? 'text-emerald-500' : 'text-slate-300'} /> At least 8 characters
                                    </li>
                                    <li className={`flex items-center gap-2 ${validations.uppercase ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={14} className={validations.uppercase ? 'text-emerald-500' : 'text-slate-300'} /> One uppercase letter
                                    </li>
                                    <li className={`flex items-center gap-2 ${validations.number ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={14} className={validations.number ? 'text-emerald-500' : 'text-slate-300'} /> One number
                                    </li>
                                    <li className={`flex items-center gap-2 ${validations.special ? 'text-emerald-600' : 'text-slate-500'}`}>
                                        <CheckCircle2 size={14} className={validations.special ? 'text-emerald-500' : 'text-slate-300'} /> One special character
                                    </li>
                                </ul>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading || !isValid}
                            className="w-full bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 active:scale-[0.98] transition-all disabled:opacity-70 disabled:active:scale-100 shadow-md shadow-slate-900/10 mt-6 flex justify-center items-center gap-2"
                        >
                            {loading ? 'Updating...' : 'Update Password →'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
