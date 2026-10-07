import React, { useState, useEffect, useCallback } from 'react';
import { 
    FileText, UploadCloud, ShieldCheck, XCircle, Clock, 
    AlertCircle, CheckCircle2, Eye, Trash2, Mail, FolderUp, 
    User, History, RefreshCw, Loader2, Sparkles, Check, ChevronRight, Info
} from 'lucide-react';
import { documentApi } from '../../services/api/documentApi';
import DocumentUploadModal from './DocumentUploadModal';
import DocumentPreviewModal from './DocumentPreviewModal';
import { usePopupStore } from '../../store/popupStore';

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

const EmployeeDocumentsTab = ({ employeeId, employeeName, isHR = true }) => {
    const { showAlert, showConfirm } = usePopupStore();
    const [data, setData] = useState(null);
    const [documentTypes, setDocumentTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modals state
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedDocTypeForUpload, setSelectedDocTypeForUpload] = useState(null);
    const [previewDoc, setPreviewDoc] = useState(null);
    const [showAuditLogs, setShowAuditLogs] = useState(false);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const [docRes, typeRes] = await Promise.all([
                documentApi.getEmployeeDocuments(employeeId),
                documentApi.getDocumentTypes()
            ]);
            setData(docRes.data);
            setDocumentTypes(typeRes.data.documentTypes || []);
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load employee documents.');
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        if (employeeId) {
            fetchDocuments();
        }
    }, [employeeId, fetchDocuments]);

    const handleOpenUpload = (docType = null) => {
        setSelectedDocTypeForUpload(docType);
        setIsUploadModalOpen(true);
    };

    const handleVerify = async (docId, docName) => {
        try {
            await documentApi.verifyDocument(docId);
            await showAlert({
                title: 'Document Verified',
                message: `${docName} has been verified successfully.`,
                type: 'success'
            });
            fetchDocuments();
        } catch (err) {
            await showAlert({
                title: 'Verification Failed',
                message: err.response?.data?.message || 'Failed to verify document.',
                type: 'error'
            });
        }
    };

    const handleRejectPrompt = async (docId, docName) => {
        const reason = window.prompt(`Enter rejection reason for "${docName}":`, 'Please upload a clearer copy.');
        if (reason && reason.trim()) {
            try {
                await documentApi.rejectDocument(docId, reason.trim());
                await showAlert({
                    title: 'Document Rejected',
                    message: `${docName} has been rejected. The employee will see your feedback.`,
                    type: 'info'
                });
                fetchDocuments();
            } catch (err) {
                await showAlert({
                    title: 'Error',
                    message: err.response?.data?.message || 'Failed to reject document.',
                    type: 'error'
                });
            }
        }
    };

    const handleDelete = async (docId, docName) => {
        const confirmed = await showConfirm({
            title: 'Delete Document',
            message: `Are you sure you want to remove the uploaded file for "${docName}"?`,
            type: 'error',
            confirmText: 'Delete'
        });

        if (confirmed) {
            try {
                await documentApi.deleteDocument(docId);
                await showAlert({
                    title: 'Document Deleted',
                    message: `${docName} has been removed.`,
                    type: 'success'
                });
                fetchDocuments();
            } catch (err) {
                await showAlert({
                    title: 'Error',
                    message: err.response?.data?.message || 'Failed to delete document.',
                    type: 'error'
                });
            }
        }
    };

    if (loading && !data) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 flex flex-col items-center justify-center text-slate-400">
                <Loader2 size={32} className="animate-spin text-blue-600 mb-3" />
                <span className="text-xs font-semibold">Loading employee documents...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-rose-600">
                <AlertCircle size={32} className="mx-auto mb-2 text-rose-500" />
                <p className="text-sm font-bold">{error}</p>
                <button 
                    onClick={fetchDocuments} 
                    className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                >
                    Retry
                </button>
            </div>
        );
    }

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
    const auditLogs = data?.auditLogs || [];

    return (
        <div className="space-y-6">
            
            {/* Completion & KPI Banner */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 md:p-8 space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-bold text-slate-900">Document Verification Status</h2>
                            <span className="text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full">
                                {summary.verifiedRequired} / {summary.totalRequired} Required Verified
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            Track, upload from emails, and verify required onboarding documents
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5 w-full sm:w-auto">
                        <button
                            onClick={fetchDocuments}
                            className="p-2.5 text-slate-600 hover:bg-slate-100 rounded-xl transition-colors border border-slate-200 shrink-0"
                            title="Refresh Documents"
                        >
                            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        </button>
                        <button
                            onClick={() => handleOpenUpload(null)}
                            className="flex-1 sm:flex-none px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center justify-center gap-2"
                        >
                            <UploadCloud size={16} />
                            <span>Upload Document</span>
                        </button>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                        <span className="text-slate-700 uppercase tracking-wider">Overall Completion</span>
                        <span className="text-blue-600 font-extrabold">{summary.completionPercentage}% Complete</span>
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
                </div>

                {/* 4 Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800">Verified</span>
                            <p className="text-2xl font-black text-emerald-950 mt-0.5">{summary.verifiedCount}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                            <ShieldCheck size={18} />
                        </div>
                    </div>

                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-800">Pending</span>
                            <p className="text-2xl font-black text-amber-950 mt-0.5">{summary.pendingCount}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
                            <Clock size={18} />
                        </div>
                    </div>

                    <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-rose-800">Rejected</span>
                            <p className="text-2xl font-black text-rose-950 mt-0.5">{summary.rejectedCount}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                            <XCircle size={18} />
                        </div>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                        <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Missing</span>
                            <p className="text-2xl font-black text-slate-800 mt-0.5">{summary.missingCount}</p>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-slate-200/70 text-slate-600 flex items-center justify-center">
                            <AlertCircle size={18} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Document Categories List */}
            <div className="space-y-6">
                {Object.entries(categories).map(([categoryName, items]) => {
                    if (!items || items.length === 0) return null;

                    return (
                        <div key={categoryName} className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                            {/* Category Header */}
                            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
                                <div className="flex items-center gap-2.5">
                                    <span className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${CATEGORY_COLORS[categoryName] || 'from-slate-600 to-slate-800'}`} />
                                    <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                                        {categoryName} Documents
                                    </h3>
                                    <span className="text-xs font-semibold text-slate-400">({items.length})</span>
                                </div>
                            </div>

                            {/* Documents Grid / List */}
                            <div className="divide-y divide-slate-100">
                                {items.map((item) => {
                                    const docType = item.documentType;
                                    const uploaded = item.uploadedDocument;
                                    const status = item.status;
                                    const badge = STATUS_BADGES[status] || STATUS_BADGES.MISSING;
                                    const BadgeIcon = badge.icon;

                                    return (
                                        <div key={docType._id || docType.name} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                                            
                                            {/* Left: Document Info */}
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

                                                    {/* Upload Details if file exists */}
                                                    {uploaded && (
                                                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 font-mono pt-1">
                                                            <span className="font-semibold text-slate-700 truncate max-w-[200px]">
                                                                {uploaded.fileName}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{(uploaded.fileSize / (1024 * 1024)).toFixed(2)} MB</span>
                                                            <span>•</span>
                                                            <span className="flex items-center gap-1 font-sans">
                                                                {uploaded.uploadSource === 'EMAIL' ? (
                                                                    <span className="text-blue-600 font-semibold flex items-center gap-0.5">
                                                                        <Mail size={11} /> Via Email
                                                                    </span>
                                                                ) : uploaded.uploadSource === 'EMPLOYEE_PORTAL' ? (
                                                                    <span className="text-emerald-600 font-semibold flex items-center gap-0.5">
                                                                        <User size={11} /> By Employee
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-slate-600 font-medium">HR Upload</span>
                                                                )}
                                                            </span>
                                                            <span>•</span>
                                                            <span>{new Date(uploaded.uploadedAt).toLocaleDateString('en-GB')}</span>
                                                        </div>
                                                    )}

                                                    {/* Rejection notice if rejected */}
                                                    {status === 'REJECTED' && uploaded?.rejectionReason && (
                                                        <div className="mt-2 p-2 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
                                                            <span className="font-bold">Rejection Note: </span>
                                                            <span>{uploaded.rejectionReason}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Right: Actions */}
                                            <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                                                {uploaded ? (
                                                    <>
                                                        <button
                                                            onClick={() => setPreviewDoc(uploaded)}
                                                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1.5"
                                                        >
                                                            <Eye size={14} />
                                                            <span>View</span>
                                                        </button>

                                                        {isHR && status === 'PENDING_VERIFICATION' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVerify(uploaded._id, docType.name)}
                                                                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center gap-1 shadow-xs"
                                                                >
                                                                    <ShieldCheck size={14} />
                                                                    <span>Verify</span>
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectPrompt(uploaded._id, docType.name)}
                                                                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center gap-1"
                                                                >
                                                                    <XCircle size={14} />
                                                                    <span>Reject</span>
                                                                </button>
                                                            </>
                                                        )}

                                                        <button
                                                            onClick={() => handleOpenUpload(docType)}
                                                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
                                                            title="Replace / Re-upload"
                                                        >
                                                            <UploadCloud size={14} />
                                                            <span>{status === 'REJECTED' ? 'Upload Again' : 'Replace'}</span>
                                                        </button>

                                                        {isHR && (
                                                            <button
                                                                onClick={() => handleDelete(uploaded._id, docType.name)}
                                                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                title="Delete file"
                                                            >
                                                                <Trash2 size={15} />
                                                            </button>
                                                        )}
                                                    </>
                                                ) : (
                                                    <button
                                                        onClick={() => handleOpenUpload(docType)}
                                                        className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
                                                    >
                                                        <UploadCloud size={14} />
                                                        <span>Upload</span>
                                                    </button>
                                                )}
                                            </div>

                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Audit Trail Section */}
            {auditLogs.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <button
                        onClick={() => setShowAuditLogs(!showAuditLogs)}
                        className="w-full p-4 sm:p-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                    >
                        <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                            <History size={18} className="text-blue-600" />
                            <span>Document Action History ({auditLogs.length} Events)</span>
                        </div>
                        <span className="text-xs font-semibold text-blue-600">
                            {showAuditLogs ? 'Hide History' : 'View Audit Trail'}
                        </span>
                    </button>

                    {showAuditLogs && (
                        <div className="p-5 border-t border-slate-100 bg-slate-50/30 space-y-3">
                            {auditLogs.map((log) => (
                                <div key={log._id} className="p-3 bg-white rounded-xl border border-slate-200/80 flex flex-col sm:flex-row justify-between sm:items-center gap-2 text-xs">
                                    <div className="flex items-center gap-2.5">
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${
                                            log.action === 'VERIFY' ? 'bg-emerald-500' :
                                            log.action === 'REJECT' ? 'bg-rose-500' :
                                            log.action === 'UPLOAD' ? 'bg-blue-500' :
                                            log.action === 'RE_UPLOAD' ? 'bg-indigo-500' : 'bg-slate-400'
                                        }`} />
                                        <span className="font-bold text-slate-900">{log.performedByName || 'User'}</span>
                                        <span className="text-slate-500">
                                            {log.action === 'VERIFY' ? 'verified' :
                                             log.action === 'REJECT' ? 'rejected' :
                                             log.action === 'UPLOAD' ? 'uploaded' :
                                             log.action === 'RE_UPLOAD' ? 're-uploaded' : log.action.toLowerCase()}
                                        </span>
                                        <span className="font-bold text-slate-800">"{log.documentTypeName}"</span>
                                        {log.details?.rejectionReason && (
                                            <span className="text-rose-600 italic">({log.details.rejectionReason})</span>
                                        )}
                                    </div>
                                    <span className="text-slate-400 font-mono text-[11px]">
                                        {new Date(log.timestamp).toLocaleString('en-GB')}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Modals */}
            <DocumentUploadModal
                isOpen={isUploadModalOpen}
                onClose={() => setIsUploadModalOpen(false)}
                onSuccess={fetchDocuments}
                employeeId={employeeId}
                employeeName={employeeName}
                documentTypes={documentTypes}
                initialDocumentType={selectedDocTypeForUpload}
                isHR={isHR}
            />

            <DocumentPreviewModal
                isOpen={Boolean(previewDoc)}
                onClose={() => setPreviewDoc(null)}
                document={previewDoc}
                isHR={isHR}
                onVerifySuccess={() => {
                    fetchDocuments();
                }}
                onRejectSuccess={() => {
                    fetchDocuments();
                }}
            />

        </div>
    );
};

export default EmployeeDocumentsTab;
