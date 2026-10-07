import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import useAuthStore from './store/authStore';
import PopupModal from './components/PopupModal';

// Direct Page Imports (Eliminates dynamic chunk loading 404s on live deployments)
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

import Dashboard from './pages/Dashboard';
import MyAttendance from './pages/MyAttendance';
import CheckInOut from './pages/CheckInOut';
import Profile from './pages/Profile';
import MyDocuments from './pages/MyDocuments';
import MyPayslips from './pages/MyPayslips';

import AdminDashboard from './pages/AdminDashboard';
import EmployeeManagement from './pages/EmployeeManagement';
import AddEditEmployee from './pages/AddEditEmployee';
import EmployeeDetails from './pages/EmployeeDetails';
import AdminDocuments from './pages/AdminDocuments';
import AdminAttendance from './pages/AdminAttendance';
import AdminHolidays from './pages/AdminHolidays';
import AdminPayroll from './pages/AdminPayroll';
import AdminPayslips from './pages/AdminPayslips';
import PayslipDetails from './pages/PayslipDetails';
import AdminReports from './pages/AdminReports';
import AdminSettings from './pages/AdminSettings';

function App() {
  const { user, loading, checkAuth } = useAuthStore();

  useEffect(() => {
    checkAuth();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const isAdmin = ['ADMIN', 'SUPER_ADMIN'].includes(user?.role);

  return (
    <Router>
      <PopupModal />
      <Routes>
        {/* Public Auth Routes */}
        <Route path="/login" element={!user ? <Login /> : <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />} />
        <Route path="/forgot-password" element={!user ? <ForgotPassword /> : <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />} />
        <Route path="/reset-password" element={!user ? <ResetPassword /> : <Navigate to={isAdmin ? "/admin/dashboard" : "/"} replace />} />
        
        {/* Employee Portal Routes */}
        <Route path="/" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <Dashboard />) : <Navigate to="/login" replace />} />
        <Route path="/attendance" element={user ? (isAdmin ? <Navigate to="/admin/attendance" replace /> : <MyAttendance />) : <Navigate to="/login" replace />} />
        <Route path="/attendance/check-in" element={user ? (isAdmin ? <Navigate to="/admin/dashboard" replace /> : <CheckInOut />) : <Navigate to="/login" replace />} />
        <Route path="/my-payslips" element={user ? <MyPayslips /> : <Navigate to="/login" replace />} />
        <Route path="/my-documents" element={user ? <MyDocuments /> : <Navigate to="/login" replace />} />
        <Route path="/profile" element={user ? <Profile /> : <Navigate to="/login" replace />} />
        
        {/* Admin Portal Routes */}
        <Route path="/admin/dashboard" element={user ? (isAdmin ? <AdminDashboard /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/employees" element={user ? (isAdmin ? <EmployeeManagement /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/employees/new" element={user ? (isAdmin ? <AddEditEmployee /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/employees/edit/:id" element={user ? (isAdmin ? <AddEditEmployee /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/employees/:id" element={user ? (isAdmin ? <EmployeeDetails /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/documents" element={user ? (isAdmin ? <AdminDocuments /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        
        <Route path="/admin/attendance" element={user ? (isAdmin ? <AdminAttendance /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/holidays" element={user ? (isAdmin ? <AdminHolidays /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/payroll" element={user ? (isAdmin ? <AdminPayroll /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/payslips" element={user ? (isAdmin ? <AdminPayslips /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/payslips/:id" element={user ? (isAdmin ? <PayslipDetails /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/reports/attendance" element={user ? (isAdmin ? <AdminReports /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />
        <Route path="/admin/settings" element={user ? (isAdmin ? <AdminSettings /> : <Navigate to="/" replace />) : <Navigate to="/login" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to={user ? (isAdmin ? "/admin/dashboard" : "/") : "/login"} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
