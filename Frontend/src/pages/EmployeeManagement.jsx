import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { Search, Plus, Edit, UserCheck, UserX, Trash2, Eye } from 'lucide-react';
import { usePopupStore } from '../store/popupStore';
import { useDebounce } from '../hooks/useDebounce';

const EmployeeManagement = () => {
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [totalCount, setTotalCount] = useState(0);
    const { showAlert, showConfirm } = usePopupStore();

    const debouncedSearch = useDebounce(search, 350);

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/employees?page=${page}&search=${encodeURIComponent(debouncedSearch)}&status=${statusFilter}`);
            setEmployees(res.data.employees || []);
            setTotalPages(res.data.pages || 1);
            setTotalCount(res.data.total || 0);
        } catch (error) {
            console.error('Error fetching employees:', error);
        } finally {
            setLoading(false);
        }
    }, [page, debouncedSearch, statusFilter]);

    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    const handleSearchKeyDown = (e) => {
        if (e.key === 'Enter') {
            setPage(1);
            fetchEmployees();
        }
    };

    const handleStatusToggle = async (id, currentStatus) => {
        const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
        const confirmed = await showConfirm({
            title: `${newStatus === 'ACTIVE' ? 'Activate' : 'Deactivate'} Employee?`,
            message: `Are you sure you want to set this employee's status to ${newStatus}?`,
            type: newStatus === 'ACTIVE' ? 'info' : 'warning',
            confirmText: `Set ${newStatus}`
        });

        if (confirmed) {
            try {
                await axios.patch(`/api/employees/${id}/status`, { status: newStatus });
                await showAlert({
                    title: 'Status Updated',
                    message: `Employee status changed to ${newStatus}.`,
                    type: 'success'
                });
                fetchEmployees();
            } catch (error) {
                await showAlert({
                    title: 'Error',
                    message: error.response?.data?.message || 'Failed to update employee status.',
                    type: 'error'
                });
            }
        }
    };

    const handleDeleteEmployee = async (id, name) => {
        const confirmed = await showConfirm({
            title: 'Delete Employee',
            message: `Are you sure you want to permanently delete "${name}"? This action cannot be undone.`,
            type: 'error',
            confirmText: 'Delete'
        });

        if (confirmed) {
            try {
                await axios.delete(`/api/employees/${id}`);
                await showAlert({
                    title: 'Employee Deleted',
                    message: `${name} has been permanently deleted.`,
                    type: 'success'
                });
                fetchEmployees();
            } catch (error) {
                await showAlert({
                    title: 'Error',
                    message: error.response?.data?.message || 'Failed to delete employee.',
                    type: 'error'
                });
            }
        }
    };

    const activeCount = employees.filter(e => e.status === 'ACTIVE').length;

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-7xl mx-auto w-full space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employees</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Manage employee records, designations, and salary details</p>
                    </div>
                    <Link 
                        to="/admin/employees/new" 
                        className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 shadow-sm transition-colors"
                    >
                        <Plus size={18} /> Add Employee
                    </Link>
                </div>

                {/* KPI Summary */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Employees</span>
                        <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 sm:mt-2">{totalCount}</p>
                    </div>
                    <div className="bg-emerald-50/70 p-4 sm:p-5 rounded-2xl border border-emerald-200 shadow-xs">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Active</span>
                        <p className="text-2xl sm:text-3xl font-extrabold text-emerald-900 mt-1 sm:mt-2">{activeCount}</p>
                    </div>
                    <div className="bg-rose-50/70 p-4 sm:p-5 rounded-2xl border border-rose-200 shadow-xs">
                        <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">Inactive</span>
                        <p className="text-2xl sm:text-3xl font-extrabold text-rose-900 mt-1 sm:mt-2">{totalCount - activeCount}</p>
                    </div>
                </div>

                {/* Filter and Employee Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row justify-between gap-4">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="text" 
                                placeholder="Search by name, email, ID..." 
                                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                onKeyDown={handleSearchKeyDown}
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <select 
                                className="bg-slate-50 border border-slate-200 text-slate-700 text-sm py-2 px-4 rounded-xl focus:outline-none"
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                            >
                                <option value="">All Status</option>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="px-6 py-3.5">Employee</th>
                                    <th className="px-6 py-3.5">Designation & Role</th>
                                    <th className="px-6 py-3.5">Monthly Salary</th>
                                    <th className="px-6 py-3.5">Joining Date</th>
                                    <th className="px-6 py-3.5">Status</th>
                                    <th className="px-6 py-3.5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-sm">
                                {loading ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500">Loading employees...</td></tr>
                                ) : employees.length === 0 ? (
                                    <tr><td colSpan="6" className="p-8 text-center text-slate-500">No employees found.</td></tr>
                                ) : (
                                    employees.map((emp) => (
                                        <tr key={emp._id} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center text-sm">
                                                        {emp.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <Link to={`/admin/employees/${emp._id}`} className="font-semibold text-slate-900 hover:text-blue-600">
                                                            {emp.name}
                                                        </Link>
                                                        <p className="text-xs text-slate-500 font-mono">{emp.employeeId} • {emp.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <p className="font-medium text-slate-800">{emp.designation || 'Staff'}</p>
                                                <p className="text-xs text-slate-500">{emp.userId?.role || emp.role || 'EMPLOYEE'}</p>
                                            </td>
                                            <td className="px-6 py-4 font-semibold text-slate-900">
                                                ₹{(emp.baseSalary || 0).toLocaleString('en-IN')}<span className="text-xs font-normal text-slate-500">/mo</span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 text-xs font-mono">
                                                {emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '--'}
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`inline-flex px-2.5 py-1 text-xs font-bold rounded-full ${emp.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                                                    {emp.status}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link to={`/admin/employees/${emp._id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="View Details">
                                                        <Eye size={16} />
                                                    </Link>
                                                    <Link to={`/admin/employees/edit/${emp._id}`} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Edit">
                                                        <Edit size={16} />
                                                    </Link>
                                                    <button onClick={() => handleStatusToggle(emp._id, emp.status)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title={emp.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}>
                                                        {emp.status === 'ACTIVE' ? <UserX size={16} /> : <UserCheck size={16} />}
                                                    </button>
                                                    <button onClick={() => handleDeleteEmployee(emp._id, emp.name)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                        <span>Page {page} of {totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(page-1)} className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium">Prev</button>
                            <button disabled={page === totalPages} onClick={() => setPage(page+1)} className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium">Next</button>
                        </div>
                    </div>
                </div>

            </div>
        </Layout>
    );
};

export default EmployeeManagement;
