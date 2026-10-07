import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import logoImg from '../assets/LOGO.png';
import { Eye, EyeOff, Loader2, MapPin, CalendarCheck, ShieldCheck, Lock, Mail, Sparkles } from 'lucide-react';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // Client-side validation state
    const [validationErrors, setValidationErrors] = useState({ email: '', password: '' });
    
    const { login, error, loading, user } = useAuthStore();

    if (user) {
        return <Navigate to="/" replace />;
    }

    const validateForm = () => {
        let isValid = true;
        const newErrors = { email: '', password: '' };

        if (!email.trim()) {
            newErrors.email = 'Email address is required';
            isValid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            newErrors.email = 'Please enter a valid email address';
            isValid = false;
        }

        if (!password) {
            newErrors.password = 'Password is required';
            isValid = false;
        }

        setValidationErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (validateForm()) {
            await login(email, password);
        }
    };

    return (
        <div className="min-h-screen flex flex-col lg:flex-row bg-[#070B14] font-sans text-slate-100 relative overflow-hidden">
            
            {/* Ambient Background Glows */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[15%] -left-[10%] w-[550px] h-[550px] bg-blue-600/15 rounded-full blur-[140px]"></div>
                <div className="absolute top-[40%] right-[-10%] w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[160px]"></div>
                <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] bg-blue-700/10 rounded-full blur-[140px]"></div>
                {/* Subtle Grid */}
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+CjxjaXJjbGUgY3g9IjEiIGN5PSIxIiByPSIxIiBmaWxsPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDMpIi8+Cjwvc3ZnPg==')]"></div>
            </div>

            {/* Left Side - Brand & Visual Area (Desktop only) */}
            <div className="hidden lg:flex lg:w-1/2 relative z-10 flex-col justify-between p-12 xl:p-20 border-r border-white/[0.06]">
                <div>
                    {/* Brand Header */}
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
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-semibold mb-6">
                            <Sparkles size={13} />
                            <span>Workforce & Attendance System</span>
                        </div>

                        <h1 className="text-4xl xl:text-5xl font-extrabold leading-[1.15] mb-6 tracking-tight text-white">
                            Intelligent attendance & payroll management.
                        </h1>
                        
                        <p className="text-slate-400 text-base mb-12 leading-relaxed">
                            A unified enterprise portal for real-time employee check-ins, automated salary calculation, and accurate attendance tracking.
                        </p>

                        <div className="space-y-5">
                            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                                <div className="w-11 h-11 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center flex-shrink-0 text-blue-400">
                                    <MapPin size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Geofenced Check-In</h3>
                                    <p className="text-xs text-slate-400">Office location verification and accurate logs</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] backdrop-blur-sm">
                                <div className="w-11 h-11 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center flex-shrink-0 text-indigo-400">
                                    <CalendarCheck size={20} />
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-white">Flexible Schedules</h3>
                                    <p className="text-xs text-slate-400">5-Day & 6-Day week automatic salary calculation</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex items-center justify-between text-xs text-slate-500 font-medium w-full max-w-md">
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1 text-slate-400"><ShieldCheck size={14} className="text-blue-400" /> Secure 256-bit</span>
                        <span>•</span>
                        <span>Official Portal</span>
                    </div>
                    <span>© {new Date().getFullYear()} WECICE Delhi</span>
                </div>
            </div>

            {/* Right Side - Login Form Card (Responsive for Mobile & Desktop) */}
            <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-8 lg:p-12 relative z-10 min-h-screen overflow-y-auto">
                
                {/* Mobile Brand Header */}
                <div className="lg:hidden flex flex-col items-center text-center mb-6 pt-4">
                    <div className="w-16 h-16 bg-white/5 p-2 rounded-2xl border border-white/10 shadow-xl shadow-blue-950/40 flex items-center justify-center mb-3">
                        <img src={logoImg} alt="WECICE Delhi Logo" className="w-full h-full object-contain" />
                    </div>
                    <h1 className="text-xl font-extrabold tracking-tight text-white">WECICE Delhi</h1>
                    <p className="text-xs text-blue-400 font-semibold uppercase tracking-wider mt-0.5">Attendance & Payroll System</p>
                </div>

                {/* Login Glass Card */}
                <div className="w-full max-w-[420px] bg-[#0E1526]/80 backdrop-blur-xl border border-white/[0.08] p-6 sm:p-9 rounded-3xl shadow-2xl shadow-black/80">
                    
                    <div className="mb-6 text-center sm:text-left">
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Sign In</h2>
                        <p className="text-slate-400 text-xs sm:text-sm mt-1">Enter your credentials to access your portal</p>
                    </div>
                    
                    {/* Backend Error Message */}
                    {error && (
                        <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-xl text-xs font-medium flex items-start gap-2.5">
                            <div className="mt-0.5 flex-shrink-0 text-rose-400">
                                <ShieldCheck size={16} />
                            </div>
                            <span className="leading-snug">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                        {/* Email Field */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-1.5">
                                Email Address
                            </label>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Mail size={16} />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    autoComplete="email"
                                    placeholder="yourname@wecice.com"
                                    className={`w-full pl-10 pr-4 py-3 bg-white/[0.04] border ${
                                         validationErrors.email ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-white/[0.1] focus:border-blue-500 focus:ring-blue-500/20'
                                     } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all`}
                                     value={email}
                                     onChange={(e) => {
                                         setEmail(e.target.value);
                                         if (validationErrors.email) setValidationErrors({...validationErrors, email: ''});
                                     }}
                                 />
                            </div>
                            {validationErrors.email && (
                                <p className="text-rose-400 text-xs font-medium mt-1 ml-1">{validationErrors.email}</p>
                            )}
                        </div>
                        
                        {/* Password Field */}
                        <div>
                            <div className="flex items-center justify-between mb-1.5">
                                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                                    Password
                                </label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <Lock size={16} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••••••"
                                    className={`w-full pl-10 pr-11 py-3 bg-white/[0.04] border ${
                                        validationErrors.password ? 'border-rose-500/50 focus:ring-rose-500/20' : 'border-white/[0.1] focus:border-blue-500 focus:ring-blue-500/20'
                                    } rounded-xl text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 transition-all`}
                                    value={password}
                                    onChange={(e) => {
                                        setPassword(e.target.value);
                                        if (validationErrors.password) setValidationErrors({...validationErrors, password: ''});
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 text-slate-400 hover:text-white transition-colors rounded-lg"
                                    aria-label={showPassword ? "Hide password" : "Show password"}
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {validationErrors.password && (
                                <p className="text-rose-400 text-xs font-medium mt-1 ml-1">{validationErrors.password}</p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-blue-950/60 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2 text-sm"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    <span>Signing in...</span>
                                </>
                            ) : (
                                'Sign In to Portal'
                            )}
                        </button>
                    </form>

                </div>

                {/* Mobile Footer */}
                <div className="mt-8 pb-4 text-center lg:hidden">
                    <p className="text-xs text-slate-400 font-medium flex items-center justify-center gap-1.5">
                        <ShieldCheck size={14} className="text-blue-400" /> Secure employee access
                    </p>
                    <p className="text-[10px] text-slate-500 mt-1">© {new Date().getFullYear()} WECICE Delhi</p>
                </div>
            </div>
        </div>
    );
};

export default Login;
