import React, { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { 
    FileText, UploadCloud, ShieldCheck, Clock, XCircle, 
    AlertCircle, Eye, RefreshCw, Loader2, Sparkles, CheckCircle2, ChevronRight, Info
} from 'lucide-react';
import { documentApi } from '../services/api/documentApi';
import DocumentUploadModal from '../components/documents/DocumentUploadModal';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';

const STATUS_BADGES = {
    VERIFIED: {
        label: 'Verified',
        bg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        dot: 'bg-emerald-500',
        icon: ShieldCheck
    },
    PENDING_VERIFICATION: {
        label: 'Pending Verification',
        bg: 'bg-amber-100 text-amber-800 border-amber-200',
        dot: 'bg-amber-500',
        icon: Clock
    },
    REJECTED: {
        label: 'Rejected',
        bg: 'bg-rose-100 text-rose-800 border-rose-200',
        dot: 'bg-rose-500',
        icon: XCircle
    },
    MISSING: {
        label: 'Missing',
        bg: 'bg-slate-100 text-slate-600 border-slate-200',
        dot: 'bg-slate-400',
        icon: AlertCircle
    }
};

const CATEGORY_COLORS = {
    'Identity': 'from-blue-600 to-indigo-600',
    'Employment': 'from-emerald-600 to-teal-600',
    'Banking': 'from-amber-600 to-orange-600',
    'Education': 'from-purple-600 to-violet-600',
    'Other': 'from-slate-700 to-slate-800'
};

const MyDocuments = () => {
    const [data, setData] = useState(null);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDocTypeForUpload, setSelectedDocTypeForUpload] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);

    const fetchMyDocuments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [myDocsRes, typesRes] = await Promise.all([
                documentApi.getMyDocuments(),
                documentApi.getDocumentTypes()
            ]);
            setData(myDocsRes.data);
            setDocumentTypes(typesRes.data.documentTypes || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load your documents.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchMyDocuments();
    }, [fetchMyDocuments]);

    const handleOpenUpload = (docType) => {
        setSelectedDocTypeForUpload(docType);
        setIsUploadModalOpen(true);
    };

    if (loading && !data) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[calc(100vh-64px)]">
                    <Loader2 size={32} className="animate-spin text-blue-600" />
                </div>
            </Layout>
        );
    }

    const employee = data?.employee;
    const summary = data?.summary || {
        totalRequired: 0,
        verifiedRequired: 0,
        completionPercentage: 0,
        verifiedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        missingCount: 0
    };
    const categories = data?.categories || {};

    return (
        <Layout>
            <div className="p-3 sm:p-5 md:p-8 max-w-5xl mx-auto w-full space-y-6 pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FileText className="text-blue-600" size={26} />
                            My Documents
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Upload and track the verification of your identification, employment, and banking records
                        </p>
                    </div>

                    <button
                        onClick={fetchMyDocuments}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-stretch sm:self-auto justify-center"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {error && (
                    <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                        <AlertCircle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Completion Progress Card */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                        <div>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Document Completion</span>
                            <h2 className="text-xl font-bold text-slate-900 mt-0.5">
                                {summary.verifiedRequired} of {summary.totalRequired} Mandatory Documents Verified
                            </h2>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold ${
                            summary.completionPercentage === 100 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                                : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}>
                            {summary.completionPercentage}% Completed
                        </span>
                    </div>

                    <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                summary.completionPercentage === 100 
                                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600'
                            }`}
                            style={{ width: `${summary.completionPercentage}%` }}
                        />
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1 text-center">
                        <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                            <span className="text-[10px] font-bold text-emerald-800 uppercase">Verified</span>
                            <div className="text-xl font-black text-emerald-950 mt-0.5">{summary.verifiedCount}</div>
                        </div>
                        <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                            <span className="text-[10px] font-bold text-amber-800 uppercase">Pending</span>
                            <div className="text-xl font-black text-amber-950 mt-0.5">{summary.pendingCount}</div>
                        </div>
                        <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-xl">
                            <span className="text-[10px] font-bold text-rose-800 uppercase">Rejected</span>
                            <div className="text-xl font-black text-rose-950 mt-0.5">{summary.rejectedCount}</div>
                        </div>
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                            <span className="text-[10px] font-bold text-slate-600 uppercase">Missing</span>
                            <div className="text-xl font-black text-slate-800 mt-0.5">{summary.missingCount}</div>
                        </div>
                    </div>
                </div>

                {/* Categorized Document Checklists */}
                <div className="space-y-6">
                    {Object.entries(categories).map(([categoryName, items]) => {
                        if (!items || items.length === 0) return null;

                        return (
                            <div key={categoryName} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center gap-2.5 bg-slate-50/60">
                                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[categoryName] || 'from-slate-600 to-slate-800'}`} />
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        {categoryName}
                                    </h3>
                                </div>

                                <div className="divide-y divide-slate-100">
                                    {items.map((item) => {
                                        const docType = item.documentType;
                                        const uploaded = item.uploadedDocument;
                                        const status = item.status;
                                        const badge = STATUS_BADGES[status] || STATUS_BADGES.MISSING;
                                        const BadgeIcon = badge.icon;

                                        return (
                                            <div key={docType._id || docType.name} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                                
                                                <div className="flex items-start gap-3.5 min-w-0 flex-1">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                        status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-700' :
                                                        status === 'PENDING_VERIFICATION' ? 'bg-amber-100 text-amber-700' :
                                                        status === 'REJECTED' ? 'bg-rose-100 text-rose-700' :
                                                        'bg-slate-100 text-slate-400'
                                                    }`}>
                                                        <FileText size={20} />
                                                    </div>

                                                    <div className="min-w-0 space-y-1">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="text-sm font-bold text-slate-900 truncate">
                                                                {docType.name}
                                                            </h4>
                                                            {docType.isRequired ? (
                                                                <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-100">
                                                                    Required
                                                                </span>
                                                            ) : (
                                                                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                                                                    Optional
                                                                </span>
                                                            )}

                                                            <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${badge.bg}`}>
                                                                <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                                                                <span>{badge.label}</span>
                                                            </span>
                                                        </div>

                                                        {docType.description && (
                                                            <p className="text-xs text-slate-500">
                                                                {docType.description}
                                                            </p>
                                                        )}

                                                        {/* Rejection notice with reason & feedback */}
                                                        {status === 'REJECTED' && uploaded?.rejectionReason && (
                                                            <div className="mt-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-900 space-y-1">
                                                                <div className="font-bold flex items-center gap-1.5 text-rose-700">
                                                                    <XCircle size={14} /> Rejection Reason from HR:
                                                                </div>
                                                                <p className="text-rose-800 italic">
                                                                    "{uploaded.rejectionReason}"
                                                                </p>
                                                                <p className="text-[11px] text-rose-600 pt-0.5">
                                                                    Please click "Upload Again" to submit a corrected copy.
                                                                </p>
                                                            </div>
                                                        )}

                                                        {/* Upload details */}
                                                        {uploaded && (
                                                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono pt-1">
                                                                <span className="font-medium text-slate-700 truncate max-w-[200px]">
                                                                    {uploaded.fileName}
                                                                </span>
                                                                <span>•</span>
                                                                <span>{(uploaded.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                                                                <span>•</span>
                                                                <span>{new Date(uploaded.uploadedAt).toLocaleDateString('en-GB')}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                    {uploaded && (
                                                        <button
                                                            onClick={() => setPreviewDoc(uploaded)}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Eye size={14} />
                                                            <span>View</span>
                                                        </button>
                                                    )}

                                                    {status === 'REJECTED' ? (
                                                        <button
                                                            onClick={() => handleOpenUpload(docType)}
                                                            className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                                        >
                                                            <UploadCloud size={14} />
                                                            <span>Upload Again</span>
                                                        </button>
                                                    ) : !uploaded ? (
                                                        <button
                                                            onClick={() => handleOpenUpload(docType)}
                                                            className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                                        >
                                                            <UploadCloud size={14} />
                                                            <span>Upload</span>
                                                        </button>
                                                    ) : status === 'PENDING_VERIFICATION' ? (
                                                        <button
                                                            onClick={() => handleOpenUpload(docType)}
                                                            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-medium rounded-xl transition-colors"
                                                            title="Replace uploaded file"
                                                        >
                                                            <span>Replace</span>
                                                        </button>
                                                    ) : null}
                                                </div>

                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Modals */}
                <DocumentUploadModal
                    isOpen={isUploadModalOpen}
                    onClose={() => setIsUploadModalOpen(false)}
                    onSuccess={fetchMyDocuments}
                    employeeId={employee?._id}
                    employeeName={employee?.name}
                    documentTypes={documentTypes}
                    initialDocumentType={selectedDocTypeForUpload}
                    isHR={false}
                />

                <DocumentPreviewModal
                    isOpen={Boolean(previewDoc)}
                    onClose={() => setPreviewDoc(null)}
                    document={previewDoc}
                    isHR={false}
                />

            </div>
        </Layout>
    );
};

export default MyDocuments;
