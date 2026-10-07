import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import HolidayCalendar from '../components/HolidayCalendar';
import { Plus, Edit, Trash2, Calendar, Loader2 } from 'lucide-react';

import { usePopupStore } from '../store/popupStore';

const AdminHolidays = () => {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const { showAlert, showConfirm } = usePopupStore();
    
    // Calendar State
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        date: '',
        type: 'Company Holiday',
        description: '',
        isActive: true,
        isWorkingDay: false,
        grantFullDayOnCheckIn: true,
        customCutoffTime: ''
    });

    const fetchHolidays = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`/api/holidays?year=${currentYear}`);
            setHolidays(res.data);
        } catch (error) {
            console.error('Error fetching holidays', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [currentYear]);

    const handleOpenModal = (holiday = null, dateStr = null) => {
        if (holiday) {
            setEditMode(true);
            setSelectedId(holiday._id);
            setFormData({
                name: holiday.name,
                date: holiday.date,
                type: holiday.type || 'Company Holiday',
                description: holiday.description || '',
                isActive: holiday.isActive !== undefined ? holiday.isActive : true,
                isWorkingDay: holiday.isWorkingDay || holiday.type === 'Festival Working Day',
                grantFullDayOnCheckIn: holiday.grantFullDayOnCheckIn !== undefined ? holiday.grantFullDayOnCheckIn : true,
                customCutoffTime: holiday.customCutoffTime || ''
            });
        } else {
            setEditMode(false);
            setSelectedId(null);
            setFormData({ 
                name: '', 
                date: dateStr || '',
                type: 'Company Holiday', 
                description: '', 
                isActive: true,
                isWorkingDay: false,
                grantFullDayOnCheckIn: true,
                customCutoffTime: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editMode) {
                await axios.put(`/api/holidays/${selectedId}`, formData);
                await showAlert({
                    title: 'Holiday Updated',
                    message: `Holiday "${formData.name}" has been updated.`,
                    type: 'success'
                });
            } else {
                await axios.post('/api/holidays', formData);
                await showAlert({
                    title: 'Holiday Created',
                    message: `Holiday "${formData.name}" scheduled for ${formData.date}.`,
                    type: 'success'
                });
            }
            fetchHolidays();
            handleCloseModal();
        } catch (error) {
            await showAlert({
                title: 'Error',
                message: error.response?.data?.message || 'An error occurred saving holiday.',
                type: 'error'
            });
        }
    };

    const handleDelete = async (id, name = 'this holiday') => {
        const confirmed = await showConfirm({
            title: 'Delete Holiday',
            message: `Are you sure you want to remove "${name}" from company holidays?`,
            type: 'error',
            confirmText: 'Delete'
        });

        if (confirmed) {
            try {
                await axios.delete(`/api/holidays/${id}`);
                await showAlert({
                    title: 'Holiday Removed',
                    message: `Holiday "${name}" deleted.`,
                    type: 'success'
                });
                fetchHolidays();
                if (isModalOpen) handleCloseModal();
            } catch (error) {
                await showAlert({
                    title: 'Error',
                    message: error.response?.data?.message || 'Error deleting holiday.',
                    type: 'error'
                });
            }
        }
    };

    // Derived holidays for list view (optionally filter by month too, but let's show all for year)
    // Or let's filter the list view for the currently selected month so they stay in sync.
    const monthHolidays = holidays.filter(h => {
        const hMonth = parseInt(h.date.split('-')[1], 10) - 1;
        return hMonth === currentMonth;
    });

    return (
        <Layout>
            <div className="p-4 sm:p-8 max-w-7xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">Holidays</h1>
                        <p className="text-sm text-slate-500">Manage company holidays and observances</p>
                    </div>
                    <button onClick={() => handleOpenModal()} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center shadow-sm transition-colors">
                        <Plus className="w-5 h-5 mr-2" /> Add Holiday
                    </button>
                </div>

                {loading && holidays.length === 0 ? (
                    <div className="flex justify-center p-20"><Loader2 className="w-10 h-10 animate-spin text-blue-600" /></div>
                ) : (
                    <>
                        <HolidayCalendar 
                            holidays={holidays}
                            currentMonth={currentMonth}
                            currentYear={currentYear}
                            onMonthChange={setCurrentMonth}
                            onYearChange={setCurrentYear}
                            onDateClick={(dateStr) => handleOpenModal(null, dateStr)}
                            onHolidayClick={(holiday) => handleOpenModal(holiday)}
                        />

                        {/* List View */}
                        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 border-b border-slate-200 bg-slate-50">
                                <h3 className="text-lg font-bold text-slate-800 flex items-center">
                                    <Calendar className="w-5 h-5 mr-2 text-slate-500" /> 
                                    Holidays in {new Date(currentYear, currentMonth).toLocaleString('default', { month: 'long' })}
                                </h3>
                            </div>
                            
                            {monthHolidays.length === 0 ? (
                                <div className="p-8 text-center text-slate-500 flex flex-col items-center">
                                    <p className="mb-4">No holidays scheduled for this month.</p>
                                    <button onClick={() => handleOpenModal()} className="text-blue-600 hover:text-blue-800 font-medium">
                                        + Add Holiday
                                    </button>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left border-collapse min-w-[600px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-500 border-b border-slate-200">
                                                <th className="px-6 py-3 font-medium text-sm">Date</th>
                                                <th className="px-6 py-3 font-medium text-sm">Name</th>
                                                <th className="px-6 py-3 font-medium text-sm">Type</th>
                                                <th className="px-6 py-3 font-medium text-sm text-right">Actions</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {monthHolidays.map((holiday) => (
                                                <tr key={holiday._id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                    <td className="px-6 py-4 text-slate-700 font-medium">
                                                        {new Date(holiday.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-800">{holiday.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium inline-flex items-center gap-1 ${
                                                            holiday.type === 'National Holiday' ? 'bg-red-100 text-red-700' : 
                                                            holiday.type === 'Company Holiday' ? 'bg-green-100 text-green-700' : 
                                                            holiday.type === 'Festival Working Day' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                                                            'bg-purple-100 text-purple-700'
                                                        }`}>
                                                            {holiday.type === 'Festival Working Day' && '🎉 '}
                                                            {holiday.type}
                                                        </span>
                                                        {holiday.type === 'Festival Working Day' && (
                                                            <div className="text-[11px] text-amber-700 font-medium mt-0.5">
                                                                Full Day Concession Active
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button onClick={() => handleOpenModal(holiday)} className="text-slate-400 hover:text-blue-600 mr-3">
                                                            <Edit className="w-4 h-4" />
                                                        </button>
                                                        <button onClick={() => handleDelete(holiday._id, holiday.name)} className="text-slate-400 hover:text-red-600">
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden">
                        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
                            <h2 className="text-lg font-bold text-slate-800">{editMode ? 'Edit Holiday / Occasion' : 'Add Holiday / Occasion'}</h2>
                            {editMode && (
                                <button onClick={() => handleDelete(selectedId, formData.name)} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors" title="Delete Holiday">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <form onSubmit={handleSubmit} className="p-4 space-y-3">
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Occasion / Holiday Name</label>
                                <input type="text" required placeholder="e.g. Diwali Celebration, Eid, Independence Day" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                                <input type="date" required value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                                <select 
                                    value={formData.type} 
                                    onChange={(e) => {
                                        const newType = e.target.value;
                                        setFormData({
                                            ...formData, 
                                            type: newType,
                                            isWorkingDay: newType === 'Festival Working Day',
                                            grantFullDayOnCheckIn: newType === 'Festival Working Day' ? true : formData.grantFullDayOnCheckIn
                                        });
                                    }} 
                                    className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                                >
                                    <option value="National Holiday">National Holiday (Office Closed)</option>
                                    <option value="Company Holiday">Company Holiday (Office Closed)</option>
                                    <option value="Optional Holiday">Optional Holiday (Office Closed)</option>
                                    <option value="Festival Working Day">🎉 Festival / Special Occasion (Working Day - Full Day Credit)</option>
                                </select>
                            </div>

                            {/* Festival Specific Settings */}
                            {formData.type === 'Festival Working Day' && (
                                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 space-y-2">
                                    <div className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                                        <span>🎉</span> Festival Attendance Concession Rules
                                    </div>
                                    <p className="text-[11px] text-amber-800 leading-relaxed">
                                        The office remains open. Employees are allowed to check in, and even if they arrive late or leave early, they will be counted as a <strong>Full Day (PRESENT)</strong> with 0 salary deductions.
                                    </p>
                                    <div className="flex items-center pt-1">
                                        <input 
                                            type="checkbox" 
                                            id="grantFullDayOnCheckIn" 
                                            checked={formData.grantFullDayOnCheckIn} 
                                            onChange={(e) => setFormData({...formData, grantFullDayOnCheckIn: e.target.checked})} 
                                            className="rounded text-amber-600 w-3.5 h-3.5 mr-2" 
                                        />
                                        <label htmlFor="grantFullDayOnCheckIn" className="text-xs font-semibold text-amber-900">
                                            Grant Full Day (PRESENT) on check-in
                                        </label>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-medium text-amber-900 mb-0.5">
                                            Custom Late Cutoff Time (Optional, default: None)
                                        </label>
                                        <input 
                                            type="time" 
                                            value={formData.customCutoffTime} 
                                            onChange={(e) => setFormData({...formData, customCutoffTime: e.target.value})} 
                                            placeholder="e.g. 14:00"
                                            className="w-full bg-white border border-amber-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-none"
                                        />
                                        <span className="text-[10px] text-amber-700">Leave blank to grant full day regardless of arrival time.</span>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Notes</label>
                                <textarea placeholder="Optional notes for employees..." value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full border border-slate-300 rounded-md px-3 py-1.5 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows="2"></textarea>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="isActive" checked={formData.isActive} onChange={(e) => setFormData({...formData, isActive: e.target.checked})} className="rounded text-blue-600 w-3.5 h-3.5 mr-2" />
                                <label htmlFor="isActive" className="text-xs text-slate-700 font-medium">Active</label>
                            </div>
                            <div className="pt-3 flex justify-end space-x-2 border-t border-slate-100">
                                <button type="button" onClick={handleCloseModal} className="px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-md font-medium transition-colors">Cancel</button>
                                <button type="submit" className="px-3.5 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-md font-semibold transition-colors">Save</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
};

export default AdminHolidays;
