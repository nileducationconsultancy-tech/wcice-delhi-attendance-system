import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, ShieldCheck, Clock, XCircle, AlertCircle, ArrowRight, Loader2 } from 'lucide-react';
import { documentApi } from '../../services/api/documentApi';

const AdminDocumentStatsCard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await documentApi.getDocumentStatsOverview();
                setStats(res.data.stats);
            } catch (err) {
                console.error('Failed to load document stats overview', err);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex items-center justify-center min-h-[120px]">
                <Loader2 size={24} className="animate-spin text-blue-600" />
            </div>
        );
    }

    const verified = stats?.verifiedCount || 0;
    const pending = stats?.pendingCount || 0;
    const rejected = stats?.rejectedCount || 0;
    const missing = stats?.missingCount || 0;

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                        <FileText size={18} />
                    </div>
                    <div>
                        <h2 className="text-base font-bold text-slate-900">Employee Documents Overview</h2>
                        <p className="text-xs text-slate-500">Onboarding files, verification status, and pending reviews</p>
                    </div>
                </div>

                <Link
                    to="/admin/documents"
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 group transition-colors"
                >
                    <span>Open Documents Center</span>
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* 4 Interactive Status Blocks */}
            <div className="p-4 sm:p-5 grid grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. Verified */}
                <Link
                    to="/admin/documents?status=VERIFIED"
                    className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 transition-all group"
                >
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-800 uppercase tracking-wider">
                        <span>Verified</span>
                        <ShieldCheck size={16} className="text-emerald-600" />
                    </div>
                    <div className="text-2xl font-black text-emerald-950 mt-1">{verified}</div>
                    <span className="text-[11px] text-emerald-700 font-medium group-hover:underline">View verified →</span>
                </Link>

                {/* 2. Pending Verification */}
                <Link
                    to="/admin/documents?status=PENDING_VERIFICATION"
                    className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/50 hover:bg-amber-50 transition-all group"
                >
                    <div className="flex items-center justify-between text-xs font-bold text-amber-800 uppercase tracking-wider">
                        <span>Pending</span>
                        <Clock size={16} className="text-amber-600" />
                    </div>
                    <div className="text-2xl font-black text-amber-950 mt-1">{pending}</div>
                    <span className="text-[11px] text-amber-700 font-medium group-hover:underline">Review pending →</span>
                </Link>

                {/* 3. Rejected */}
                <Link
                    to="/admin/documents?status=REJECTED"
                    className="p-3.5 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-50 transition-all group"
                >
                    <div className="flex items-center justify-between text-xs font-bold text-rose-800 uppercase tracking-wider">
                        <span>Rejected</span>
                        <XCircle size={16} className="text-rose-600" />
                    </div>
                    <div className="text-2xl font-black text-rose-950 mt-1">{rejected}</div>
                    <span className="text-[11px] text-rose-700 font-medium group-hover:underline">View rejected →</span>
                </Link>

                {/* 4. Missing */}
                <Link
                    to="/admin/documents?status=MISSING"
                    className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100/80 transition-all group"
                >
                    <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase tracking-wider">
                        <span>Missing</span>
                        <AlertCircle size={16} className="text-slate-400" />
                    </div>
                    <div className="text-2xl font-black text-slate-900 mt-1">{missing}</div>
                    <span className="text-[11px] text-slate-500 font-medium group-hover:underline">View missing →</span>
                </Link>
            </div>
        </div>
    );
};

export default AdminDocumentStatsCard;
