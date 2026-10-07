import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Layout from '../components/Layout';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { usePopupStore } from '../store/popupStore';

const AddEditEmployee = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEdit = Boolean(id);
    const [loading, setLoading] = useState(false);
    const { showAlert } = usePopupStore();
    
    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        designation: '',
        role: 'EMPLOYEE',
        workSchedule: '6_DAYS',
        baseSalary: '',
        joiningDate: new Date().toISOString().split('T')[0]
    });

    useEffect(() => {
        if (isEdit) {
            fetchEmployee();
        } else {
            fetchNextId();
        }
    }, [id]);

    const fetchNextId = async () => {
        try {
            const res = await axios.get('/api/employees/next-id');
            if (res.data?.nextEmployeeId) {
                setFormData(prev => ({ ...prev, employeeId: res.data.nextEmployeeId }));
            }
        } catch (error) {
            console.error('Failed to fetch next employee id:', error);
        }
    };

    const fetchEmployee = async () => {
        try {
            const res = await axios.get(`/api/employees/${id}`);
            const emp = res.data.employee;
            setFormData({
                employeeId: emp.employeeId || '',
                name: emp.name || '',
                email: emp.email || emp.userId?.email || '',
                phone: emp.phone || '',
                designation: emp.designation || '',
                role: emp.userId?.role || emp.role || 'EMPLOYEE',
                workSchedule: emp.workSchedule || '6_DAYS',
                baseSalary: emp.baseSalary || '',
                joiningDate: emp.joiningDate ? emp.joiningDate.split('T')[0] : ''
            });
        } catch (error) {
            console.error('Failed to fetch employee details:', error);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (isEdit) {
                await axios.put(`/api/employees/${id}`, formData);
                await showAlert({
                    title: 'Employee Updated',
                    message: `Profile for ${formData.name} has been successfully updated.`,
                    type: 'success'
                });
            } else {
                await axios.post('/api/employees', formData);
                const defaultPass = formData.phone ? formData.phone.trim().replace(/\s+/g, '') : '123456';
                await showAlert({
                    title: 'Employee Created',
                    message: `New employee ${formData.name} was successfully registered. Default login password is: ${defaultPass}`,
                    type: 'success'
                });
            }
            navigate('/admin/employees');
        } catch (error) {
            await showAlert({
                title: 'Error',
                message: error.response?.data?.message || 'Something went wrong while saving employee.',
                type: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="p-4 md:p-8 max-w-3xl mx-auto w-full space-y-6 pb-12">
                
                {/* Top Navigation */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => navigate('/admin/employees')} 
                        className="p-2 hover:bg-slate-200 text-slate-600 rounded-xl transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">{isEdit ? 'Edit Employee' : 'Add New Employee'}</h1>
                        <p className="text-slate-500 text-sm mt-0.5">{isEdit ? 'Update employee designation, work schedule, and compensation' : 'Add employee to company roster and create credentials'}</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Info Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Personal & Account Information</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Employee ID *</label>
                                <input 
                                    type="text" 
                                    name="employeeId" 
                                    required 
                                    value={formData.employeeId} 
                                    onChange={handleChange} 
                                    disabled={isEdit} 
                                    placeholder="e.g. WECICE-001" 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Full Name *</label>
                                <input 
                                    type="text" 
                                    name="name" 
                                    required 
                                    value={formData.name} 
                                    onChange={handleChange} 
                                    placeholder="e.g. John Doe"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Email Address *</label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    required 
                                    value={formData.email} 
                                    onChange={handleChange} 
                                    disabled={isEdit} 
                                    placeholder="employee@wecice.com"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 disabled:opacity-60" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Phone Number</label>
                                <input 
                                    type="tel" 
                                    name="phone" 
                                    value={formData.phone} 
                                    onChange={handleChange} 
                                    placeholder="+91 9876543210"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Job & Salary Info */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100">Job, Schedule & Salary Details</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Designation</label>
                                <input 
                                    type="text" 
                                    name="designation" 
                                    value={formData.designation} 
                                    onChange={handleChange} 
                                    placeholder="e.g. Academic Counselor / Developer"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">System Role *</label>
                                <select 
                                    name="role" 
                                    required 
                                    value={formData.role} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="EMPLOYEE">Employee</option>
                                    <option value="ADMIN">Admin</option>
                                    <option value="HR">HR</option>
                                </select>
                            </div>

                            {/* Work Schedule (6 Days vs 5 Days) */}
                            <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                <label className="block text-xs font-bold text-blue-900 uppercase tracking-wider mb-1.5">Work Schedule (Weekly Working Days) *</label>
                                <select 
                                    name="workSchedule" 
                                    required 
                                    value={formData.workSchedule} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-white border border-blue-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                >
                                    <option value="6_DAYS">6 Days Week (Mon – Sat, Sunday OFF) — Standard / Default</option>
                                    <option value="5_DAYS">5 Days Week (Mon – Fri, Saturday & Sunday OFF)</option>
                                </select>
                                <p className="text-[11px] text-blue-700 mt-1.5">
                                    {formData.workSchedule === '5_DAYS' 
                                        ? '✨ For this employee, Saturdays & Sundays are both non-working OFF days and salary will be calculated based on 5 working days per week.' 
                                        : 'Standard company policy: Monday to Saturday working with Sundays off.'}
                                </p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Monthly Base Salary (₹) *</label>
                                <input 
                                    type="number" 
                                    name="baseSalary" 
                                    required 
                                    min="0" 
                                    value={formData.baseSalary} 
                                    onChange={handleChange} 
                                    placeholder="30000"
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Joining Date *</label>
                                <input 
                                    type="date" 
                                    name="joiningDate" 
                                    required 
                                    value={formData.joiningDate} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-3 pt-2">
                        <button 
                            type="button" 
                            onClick={() => navigate('/admin/employees')} 
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            disabled={loading} 
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {isEdit ? 'Update Employee' : 'Create Employee'}
                        </button>
                    </div>
                </form>

            </div>
        </Layout>
    );
};

export default AddEditEmployee;
