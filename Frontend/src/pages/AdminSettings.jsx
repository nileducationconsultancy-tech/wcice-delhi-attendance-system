import { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../components/Layout';
import { Loader2, Save, Settings, MapPin, Clock, ShieldCheck, Layers, Sliders } from 'lucide-react';
import DocumentTypeSettings from '../components/documents/DocumentTypeSettings';
import { usePopupStore } from '../store/popupStore';

const AdminSettings = () => {
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState('');
    const [activeTab, setActiveTab] = useState('general');
    const { showAlert } = usePopupStore();

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await axios.get('/api/settings');
            setSettings(res.data);
        } catch (error) {
            console.error('Error fetching settings', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const detectOfficeLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocation is not supported by your browser.');
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setSettings(prev => ({
                    ...prev,
                    officeLatitude: Number(position.coords.latitude.toFixed(6)),
                    officeLongitude: Number(position.coords.longitude.toFixed(6)),
                    maxGpsAccuracy: Math.max(300, Math.round(position.coords.accuracy * 2))
                }));
                showAlert({
                    title: 'Location Detected',
                    message: `Office coordinates updated to: ${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)} (Accuracy: ${Math.round(position.coords.accuracy)}m). Click "Save Settings" below to apply.`,
                    type: 'success'
                });
            },
            (error) => {
                alert(`Could not acquire GPS location: ${error.message}`);
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage('');
        try {
            const payload = {
                ...settings,
                officeLatitude: settings.officeLatitude !== '' ? Number(settings.officeLatitude) : 28.6139,
                officeLongitude: settings.officeLongitude !== '' ? Number(settings.officeLongitude) : 77.2090,
                attendanceRadius: settings.attendanceRadius !== '' ? Number(settings.attendanceRadius) : 500,
                maxGpsAccuracy: settings.maxGpsAccuracy !== '' ? Number(settings.maxGpsAccuracy) : 300
            };
            await axios.put('/api/settings', payload);
            setMessage('Settings saved successfully!');
            await showAlert({
                title: 'Settings Saved',
                message: 'System settings, working hours, and geofence parameters have been updated.',
                type: 'success'
            });
            setTimeout(() => setMessage(''), 4000);
        } catch (error) {
            await showAlert({
                title: 'Error',
                message: error.response?.data?.message || 'Error saving settings',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

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
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">System Settings</h1>
                        <p className="text-slate-500 text-sm mt-0.5">Configure attendance rules, office geofence, and document requirements</p>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex items-center gap-2 overflow-x-auto text-xs font-bold">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                            activeTab === 'general'
                                ? 'bg-slate-900 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        <Sliders size={15} />
                        <span>General & Geofence</span>
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all ${
                            activeTab === 'documents'
                                ? 'bg-blue-600 text-white shadow-xs'
                                : 'bg-white border border-slate-200 text-blue-700 hover:bg-blue-50'
                        }`}
                    >
                        <Layers size={15} />
                        <span>Document Types Configuration</span>
                    </button>
                </div>

                {activeTab === 'documents' ? (
                    <DocumentTypeSettings />
                ) : (
                    <>
                        {message && (
                            <div className="p-4 bg-emerald-50 text-emerald-800 rounded-xl border border-emerald-200 text-sm font-semibold flex items-center gap-2">
                                <ShieldCheck size={18} className="text-emerald-600" />
                                <span>{message}</span>
                            </div>
                        )}

                        <form onSubmit={handleSave} className="space-y-6">
                    
                    {/* Working Schedule Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <h2 className="text-base font-bold text-slate-800 pb-3 border-b border-slate-100 flex items-center gap-2">
                            <Clock size={18} className="text-blue-600" /> Attendance Timings & Cutoff Rules
                        </h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Shift Start Time</label>
                                <input 
                                    type="time" 
                                    name="shiftStartTime" 
                                    value={settings?.shiftStartTime ?? '10:00'} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Official work start time (10:00 AM)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Shift End Time</label>
                                <input 
                                    type="time" 
                                    name="shiftEndTime" 
                                    value={settings?.shiftEndTime ?? '18:00'} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Official work end time (06:00 PM)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Half-Day Cutoff Time</label>
                                <input 
                                    type="time" 
                                    name="halfDayCutoffTime" 
                                    value={settings?.halfDayCutoffTime ?? '11:00'} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Check-in at or after this time is marked Half Day (11:00 AM)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Working Days</label>
                                <input 
                                    type="text" 
                                    disabled
                                    value="Monday – Saturday (Sunday OFF)" 
                                    className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-700 font-medium cursor-not-allowed" 
                                />
                                <p className="text-[11px] text-slate-400 mt-1">System default schedule</p>
                            </div>
                        </div>
                    </div>

                    {/* Geofence Card */}
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 pb-3 border-b border-slate-100">
                            <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
                                <MapPin size={18} className="text-emerald-600" /> Office Geofencing Configuration
                            </h2>
                            <button
                                type="button"
                                onClick={detectOfficeLocation}
                                className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors"
                            >
                                📍 Set to My Current GPS Location
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Office Latitude</label>
                                <input 
                                    type="number" 
                                    step="any" 
                                    name="officeLatitude" 
                                    placeholder="e.g. 28.6139"
                                    value={settings?.officeLatitude ?? ''} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Office Longitude</label>
                                <input 
                                    type="number" 
                                    step="any" 
                                    name="officeLongitude" 
                                    placeholder="e.g. 77.2090"
                                    value={settings?.officeLongitude ?? ''} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Allowed Radius (Meters)</label>
                                <input 
                                    type="number" 
                                    name="attendanceRadius" 
                                    placeholder="e.g. 500"
                                    value={settings?.attendanceRadius ?? ''} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Check-in allowed within this radius (recommended: 500–1000m for offices/laptops)</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max GPS Accuracy Margin (Meters)</label>
                                <input 
                                    type="number" 
                                    name="maxGpsAccuracy" 
                                    placeholder="e.g. 300"
                                    value={settings?.maxGpsAccuracy ?? ''} 
                                    onChange={handleChange} 
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500" 
                                />
                                <p className="text-[11px] text-slate-400 mt-1">Acceptable device GPS reading tolerance (recommended: 300–500m)</p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" 
                            disabled={saving} 
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm flex items-center gap-2 shadow-sm transition-colors disabled:opacity-50"
                        >
                            {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                            {saving ? 'Saving...' : 'Save Settings'}
                        </button>
                    </div>

                </form>
                </>
                )}

            </div>
        </Layout>
    );
};

export default AdminSettings;
