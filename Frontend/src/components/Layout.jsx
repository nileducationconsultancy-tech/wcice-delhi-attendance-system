import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import logoImg from '../assets/LOGO.png';
import { 
    LayoutDashboard, Clock, CalendarDays, Settings, LogOut, User,
    Users, BarChart3, Wallet, Menu, X, Building2, Sparkles, FileText, FolderCheck
} from 'lucide-react';

const Layout = ({ children }) => {
    const { user, logout } = useAuthStore();
    const location = useLocation();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

    const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

    const isActive = (path) => location.pathname === path;

    const navItemClass = (path) => {
        const active = isActive(path);
        return `group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium ${
            active 
                ? 'bg-gradient-to-r from-blue-700 via-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-950/50 border border-blue-400/20' 
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
        }`;
    };

    const handleNavClick = () => setIsMobileMenuOpen(false);

    const handleLogoutClick = () => {
        setIsLogoutModalOpen(true);
    };

    const confirmLogout = () => {
        setIsLogoutModalOpen(false);
        logout();
    };

    const cancelLogout = () => {
        setIsLogoutModalOpen(false);
    };

    const displayName = user?.name || (isAdmin ? 'Dr. Feroz' : (user?.email?.split('@')[0] || 'Employee'));
    const displayRole = isAdmin ? 'Administrator' : (user?.employee?.designation || 'Staff Member');

    return (
        <div className="h-screen w-full flex bg-[#f8fafc] font-sans relative overflow-hidden">
            {/* Mobile Sidebar Backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-slate-950/70 z-40 md:hidden backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0B1120] border-r border-slate-800/80 flex flex-col flex-shrink-0 transition-transform duration-300 ease-in-out md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                
                {/* Brand Header */}
                <div className="p-4 sm:p-5 border-b border-slate-800/80 flex-shrink-0 bg-[#080D1A]">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                            {/* Brand Logo */}
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 border border-white/10 p-1 flex-shrink-0 flex items-center justify-center shadow-md">
                                <img src={logoImg} alt="WECICE Delhi" className="w-full h-full object-contain" />
                            </div>

                            {/* Brand Title */}
                            <div className="min-w-0 flex-1">
                                <h1 className="font-extrabold text-white text-sm tracking-tight truncate leading-tight">
                                    WECICE Delhi
                                </h1>
                                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 truncate mt-0.5">
                                    <span>Attendance</span>
                                    <span className="w-1 h-1 rounded-full bg-blue-400"></span>
                                    <span className="text-blue-400 font-bold">{isAdmin ? 'Admin' : 'Staff'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Mobile Close Button */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(false)} 
                            className="md:hidden text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-800 transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Navigation Links Area */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 sidebar-scrollbar">
                    {isAdmin ? (
                        <>
                            {/* SECTION: MAIN */}
                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Main
                                </div>
                                <div className="space-y-1">
                                    <Link to="/admin/dashboard" onClick={handleNavClick} className={navItemClass('/admin/dashboard')}>
                                        <div className="flex items-center gap-3">
                                            <LayoutDashboard size={18} className={isActive('/admin/dashboard') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Dashboard</span>
                                        </div>
                                        {isActive('/admin/dashboard') && (
                                            <span className="w-1.5 h-1.5 rounded-full bg-blue-300 animate-pulse"></span>
                                        )}
                                    </Link>
                                </div>
                            </div>

                            {/* SECTION: WORKFORCE MANAGEMENT */}
                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Workforce
                                </div>
                                <div className="space-y-1">
                                    <Link to="/admin/employees" onClick={handleNavClick} className={navItemClass('/admin/employees')}>
                                        <div className="flex items-center gap-3">
                                            <Users size={18} className={isActive('/admin/employees') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Employees</span>
                                        </div>
                                        {isActive('/admin/employees') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/admin/attendance" onClick={handleNavClick} className={navItemClass('/admin/attendance')}>
                                        <div className="flex items-center gap-3">
                                            <Clock size={18} className={isActive('/admin/attendance') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Attendance Mgmt</span>
                                        </div>
                                        {isActive('/admin/attendance') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/admin/holidays" onClick={handleNavClick} className={navItemClass('/admin/holidays')}>
                                        <div className="flex items-center gap-3">
                                            <CalendarDays size={18} className={isActive('/admin/holidays') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Holidays</span>
                                        </div>
                                        {isActive('/admin/holidays') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/admin/payroll" onClick={handleNavClick} className={navItemClass('/admin/payroll')}>
                                        <div className="flex items-center gap-3">
                                            <Wallet size={18} className={isActive('/admin/payroll') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Payroll</span>
                                        </div>
                                        {isActive('/admin/payroll') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/admin/payslips" onClick={handleNavClick} className={navItemClass('/admin/payslips')}>
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className={isActive('/admin/payslips') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Payslips</span>
                                        </div>
                                        {isActive('/admin/payslips') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/admin/documents" onClick={handleNavClick} className={navItemClass('/admin/documents')}>
                                        <div className="flex items-center gap-3">
                                            <FolderCheck size={18} className={isActive('/admin/documents') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Documents</span>
                                        </div>
                                        {isActive('/admin/documents') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                </div>
                            </div>

                            {/* SECTION: REPORTS & SETTINGS */}
                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Analytics & Config
                                </div>
                                <div className="space-y-1">
                                    <Link to="/admin/reports/attendance" onClick={handleNavClick} className={navItemClass('/admin/reports/attendance')}>
                                        <div className="flex items-center gap-3">
                                            <BarChart3 size={18} className={isActive('/admin/reports/attendance') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Attendance Reports</span>
                                        </div>
                                        {isActive('/admin/reports/attendance') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/admin/settings" onClick={handleNavClick} className={navItemClass('/admin/settings')}>
                                        <div className="flex items-center gap-3">
                                            <Settings size={18} className={isActive('/admin/settings') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>System Settings</span>
                                        </div>
                                        {isActive('/admin/settings') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* EMPLOYEE NAVIGATION */}
                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Overview
                                </div>
                                <div className="space-y-1">
                                    <Link to="/" onClick={handleNavClick} className={navItemClass('/')}>
                                        <div className="flex items-center gap-3">
                                            <LayoutDashboard size={18} className={isActive('/') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Dashboard</span>
                                        </div>
                                        {isActive('/') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Time & Attendance
                                </div>
                                <div className="space-y-1">
                                    <Link to="/attendance" onClick={handleNavClick} className={navItemClass('/attendance')}>
                                        <div className="flex items-center gap-3">
                                            <Clock size={18} className={isActive('/attendance') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>My Attendance</span>
                                        </div>
                                        {isActive('/attendance') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/attendance/check-in" onClick={handleNavClick} className={navItemClass('/attendance/check-in')}>
                                        <div className="flex items-center gap-3">
                                            <CalendarDays size={18} className={isActive('/attendance/check-in') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Check In / Out</span>
                                        </div>
                                        {isActive('/attendance/check-in') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Self Service
                                </div>
                                <div className="space-y-1">
                                    <Link to="/my-payslips" onClick={handleNavClick} className={navItemClass('/my-payslips')}>
                                        <div className="flex items-center gap-3">
                                            <FileText size={18} className={isActive('/my-payslips') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>My Salary Slips</span>
                                        </div>
                                        {isActive('/my-payslips') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                    <Link to="/my-documents" onClick={handleNavClick} className={navItemClass('/my-documents')}>
                                        <div className="flex items-center gap-3">
                                            <FolderCheck size={18} className={isActive('/my-documents') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>My Documents</span>
                                        </div>
                                        {isActive('/my-documents') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                </div>
                            </div>

                            <div>
                                <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                    Account
                                </div>
                                <div className="space-y-1">
                                    <Link to="/profile" onClick={handleNavClick} className={navItemClass('/profile')}>
                                        <div className="flex items-center gap-3">
                                            <User size={18} className={isActive('/profile') ? 'text-blue-200' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                                            <span>Profile</span>
                                        </div>
                                        {isActive('/profile') && <span className="w-1.5 h-1.5 rounded-full bg-blue-300"></span>}
                                    </Link>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Aesthetic User Card & Logout Footer */}
                <div className="p-3.5 border-t border-slate-800/80 bg-[#080D1A]">
                    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 rounded-xl p-2.5 transition-all flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                            {/* User Avatar */}
                            <div className="relative flex-shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center font-bold text-white text-xs shadow-md shadow-blue-950/50">
                                    {displayName.charAt(0).toUpperCase()}
                                </div>
                                <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-blue-400 ring-2 ring-[#080D1A] rounded-full"></span>
                            </div>

                            {/* User Info */}
                            <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-200 truncate leading-tight">
                                    {displayName}
                                </p>
                                <p className="text-[10px] text-slate-400 truncate mt-0.5 font-medium">
                                    {displayRole}
                                </p>
                            </div>
                        </div>

                        {/* Logout Trigger */}
                        <button 
                            onClick={handleLogoutClick}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors flex-shrink-0"
                            title="Sign Out"
                        >
                            <LogOut size={16} />
                        </button>
                    </div>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-full min-w-0 overflow-hidden relative">
                {/* Top Bar Header */}
                <header className="bg-white border-b border-slate-200/80 px-3 sm:px-6 lg:px-8 py-3 sm:py-3.5 flex justify-between items-center flex-shrink-0 z-20 shadow-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <button 
                            onClick={() => setIsMobileMenuOpen(true)} 
                            className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors flex-shrink-0"
                            aria-label="Open Navigation Menu"
                        >
                            <Menu size={20} />
                        </button>
                        
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="inline-flex items-center gap-1.5 text-slate-800 uppercase tracking-wider text-[10px] sm:text-[11px] font-bold bg-slate-100 border border-slate-200 px-2.5 sm:px-3 py-1 rounded-lg truncate">
                                <Building2 size={12} className="text-blue-600 flex-shrink-0" />
                                <span className="truncate">WECICE DELHI</span>
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                        <div className="flex items-center gap-2 sm:gap-2.5 border-l border-slate-200 pl-3 sm:pl-4 py-0.5">
                            <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-100 text-blue-800 border border-blue-200 rounded-xl flex items-center justify-center font-bold text-xs shadow-xs flex-shrink-0">
                                {displayName.charAt(0).toUpperCase()}
                            </div>
                            <div className="hidden sm:block">
                                <p className="text-xs font-bold text-slate-900 leading-tight">
                                    {displayName}
                                </p>
                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider mt-0.5">
                                    {displayRole}
                                </p>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Scrollable Body */}
                <div className="flex-1 overflow-y-auto overflow-x-hidden w-full bg-[#f8fafc]">
                    {children}
                </div>
            </main>

            {/* Logout Confirmation Modal */}
            {isLogoutModalOpen && (
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center z-[100] p-4 transition-opacity animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in-95 duration-150">
                        <div className="w-14 h-14 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-rose-100 ring-4 ring-rose-50">
                            <LogOut size={24} />
                        </div>
                        <h2 className="text-lg font-bold text-slate-900 mb-1">Sign Out of WECICE Delhi Attendance?</h2>
                        <p className="text-xs text-slate-500 mb-6 font-medium leading-relaxed">
                            Are you sure you want to end your current session? You can sign back in anytime.
                        </p>
                        <div className="flex gap-3">
                            <button 
                                onClick={cancelLogout} 
                                className="flex-1 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl transition-colors text-xs"
                            >
                                Cancel
                            </button>
                            <button 
                                onClick={confirmLogout} 
                                className="flex-1 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-xl transition-colors shadow-md shadow-rose-600/20 text-xs"
                            >
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Layout;
