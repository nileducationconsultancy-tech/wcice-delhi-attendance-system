import React, { useState, useEffect } from 'react';
import { 
    X, Download, ExternalLink, ShieldCheck, XCircle, CheckCircle2, 
    AlertCircle, FileText, Calendar, User, Mail, HardDrive, Loader2, Info
} from 'lucide-react';
import { documentApi } from '../../services/api/documentApi';

const DocumentPreviewModal = ({
    isOpen,
    onClose,
    document,
    isHR = false,
    onVerifySuccess,
    onRejectSuccess
}) => {
    const [fileUrl, setFileUrl] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Verification / Rejection state
    const [actionLoading, setActionLoading] = useState(false);
    const [showRejectInput, setShowRejectInput] = useState(false);
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        if (isOpen && document) {
            setLoading(true);
            setError('');
            setShowRejectInput(false);
            setRejectionReason('');
            setActionError('');
            
            const fetchSignedUrl = async () => {
                try {
                    const res = await documentApi.getDocumentSignedUrl(document._id);
                    if (res.data.signedUrl) {
                        setFileUrl(res.data.signedUrl);
                    } else if (res.data.streamUrl) {
                        setFileUrl(res.data.streamUrl);
                    }
                } catch (err) {
                    setError('Failed to load secure document preview.');
                } finally {
                    setLoading(false);
                }
            };
            fetchSignedUrl();
        }
    }, [isOpen, document]);

    if (!isOpen || !document) return null;

    const isPdf = document.fileType === 'application/pdf' || document.fileName?.toLowerCase().endsWith('.pdf');
    const isImage = document.fileType?.startsWith('image/') || /\.(jpg|jpeg|png)$/i.test(document.fileName || '');

    const handleVerify = async () => {
        setActionLoading(true);
        setActionError('');
        try {
            await documentApi.verifyDocument(document._id);
            if (onVerifySuccess) onVerifySuccess(document._id);
            onClose();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to verify document.');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReject = async (e) => {
        e.preventDefault();
        if (!rejectionReason.trim()) {
            setActionError('Please enter a rejection reason.');
            return;
        }

        setActionLoading(true);
        setActionError('');
        try {
            await documentApi.rejectDocument(document._id, rejectionReason.trim());
            if (onRejectSuccess) onRejectSuccess(document._id, rejectionReason.trim());
            onClose();
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to reject document.');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-5xl h-[92vh] flex flex-col overflow-hidden">
                
                {/* Header */}
                <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75 shrink-0">
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <FileText size={20} />
                        </div>
                        <div className="min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-base font-bold text-slate-900 truncate">
                                    {document.documentTypeName || 'Document Preview'}
                                </h2>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                    document.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                    document.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                    'bg-amber-100 text-amber-800'
                                }`}>
                                    {document.status === 'PENDING_VERIFICATION' ? 'Pending' : document.status}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 font-mono truncate mt-0.5">
                                {document.fileName} • {document.fileSize ? `${(document.fileSize / (1024 * 1024)).toFixed(2)} MB` : ''}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {fileUrl && (
                            <>
                                <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    download={document.fileName}
                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                    title="Open / Download"
                                >
                                    <Download size={18} />
                                </a>
                                <a 
                                    href={fileUrl} 
                                    target="_blank" 
                                    rel="noreferrer" 
                                    className="p-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                                    title="Open in new window"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </>
                        )}
                        <button 
                            onClick={onClose}
                            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Main Body: 2-column on desktop (Preview on Left, Metadata & Action on Right) */}
                <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                    
                    {/* Left Panel: Previewer */}
                    <div className="flex-1 bg-slate-900 flex items-center justify-center p-3 relative overflow-auto">
                        {loading ? (
                            <div className="flex flex-col items-center gap-3 text-slate-400">
                                <Loader2 size={32} className="animate-spin text-blue-500" />
                                <span className="text-xs font-semibold">Generating secure preview...</span>
                            </div>
                        ) : error ? (
                            <div className="text-center p-6 bg-slate-800/80 rounded-2xl max-w-sm text-slate-300">
                                <AlertCircle size={32} className="text-rose-400 mx-auto mb-2" />
                                <p className="text-xs font-semibold">{error}</p>
                            </div>
                        ) : isPdf ? (
                            <iframe 
                                src={`${fileUrl}#toolbar=1`}
                                title="PDF Preview"
                                className="w-full h-full rounded-xl bg-white border-0"
                            />
                        ) : isImage ? (
                            <img 
                                src={fileUrl} 
                                alt={document.fileName}
                                className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                            />
                        ) : (
                            <div className="text-center text-slate-400 p-6">
                                <FileText size={48} className="mx-auto mb-2 opacity-50" />
                                <p className="text-xs font-semibold">File format preview not supported directly.</p>
                                <a 
                                    href={fileUrl} 
                                    download 
                                    className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
                                >
                                    <Download size={14} /> Download File
                                </a>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Metadata & Verification Actions */}
                    <div className="w-full lg:w-80 bg-white border-t lg:border-t-0 lg:border-l border-slate-100 flex flex-col overflow-y-auto shrink-0 p-5 space-y-5">
                        
                        <div>
                            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                                Document Details
                            </h3>
                            
                            <div className="space-y-3 text-xs">
                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Category</span>
                                    <span className="font-semibold text-slate-800">{document.category || 'General'}</span>
                                </div>

                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Uploaded By</span>
                                    <div className="flex items-center gap-1.5 font-semibold text-slate-800 mt-0.5">
                                        <User size={13} className="text-slate-400" />
                                        <span>{document.uploadedByName || document.uploadedByRole || 'User'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Upload Source</span>
                                    <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-semibold text-[11px]">
                                        {document.uploadSource === 'EMAIL' ? (
                                            <>
                                                <Mail size={12} className="text-blue-600" />
                                                <span>Existing Email</span>
                                            </>
                                        ) : document.uploadSource === 'EMPLOYEE_PORTAL' ? (
                                            <>
                                                <User size={12} className="text-emerald-600" />
                                                <span>Employee Portal</span>
                                            </>
                                        ) : (
                                            <>
                                                <HardDrive size={12} className="text-indigo-600" />
                                                <span>Direct HR Upload</span>
                                            </>
                                        )}
                                    </span>
                                </div>

                                <div>
                                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Upload Date</span>
                                    <span className="font-mono text-slate-700">
                                        {document.uploadedAt ? new Date(document.uploadedAt).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '--'}
                                    </span>
                                </div>

                                {document.notes && (
                                    <div>
                                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Notes</span>
                                        <p className="text-slate-600 bg-slate-50 p-2 rounded-lg text-[11px] mt-0.5 border border-slate-100">
                                            {document.notes}
                                        </p>
                                    </div>
                                )}

                                {document.status === 'VERIFIED' && (
                                    <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <CheckCircle2 size={14} className="text-emerald-600" />
                                            <span>Verified Document</span>
                                        </div>
                                        <p className="text-[11px] text-emerald-700">
                                            Verified by {document.verifiedByName || 'HR/Admin'} on {document.verifiedAt ? new Date(document.verifiedAt).toLocaleDateString('en-GB') : '--'}
                                        </p>
                                    </div>
                                )}

                                {document.status === 'REJECTED' && (
                                    <div className="bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-900 space-y-1">
                                        <div className="flex items-center gap-1.5 font-bold">
                                            <XCircle size={14} className="text-rose-600" />
                                            <span>Rejected Document</span>
                                        </div>
                                        <p className="text-[11px] text-rose-700">
                                            <strong>Reason:</strong> {document.rejectionReason || 'Please upload a clearer copy.'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Error */}
                        {actionError && (
                            <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5">
                                <AlertCircle size={14} className="shrink-0" />
                                <span>{actionError}</span>
                            </div>
                        )}

                        {/* HR Verification Controls */}
                        {isHR && (
                            <div className="pt-4 border-t border-slate-100 space-y-3 mt-auto">
                                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                                    HR Verification
                                </h4>

                                {!showRejectInput ? (
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            disabled={actionLoading || document.status === 'VERIFIED'}
                                            onClick={handleVerify}
                                            className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                                        >
                                            {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <ShieldCheck size={14} />}
                                            <span>Verify</span>
                                        </button>
                                        <button
                                            type="button"
                                            disabled={actionLoading}
                                            onClick={() => setShowRejectInput(true)}
                                            className="flex-1 px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
                                        >
                                            <XCircle size={14} />
                                            <span>Reject</span>
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleReject} className="space-y-2.5">
                                        <div>
                                            <label className="block text-[11px] font-bold text-rose-700 uppercase mb-1">
                                                Rejection Reason *
                                            </label>
                                            <textarea
                                                rows={2}
                                                required
                                                value={rejectionReason}
                                                onChange={(e) => setRejectionReason(e.target.value)}
                                                placeholder="e.g. Please upload a clearer copy with all edges visible."
                                                className="w-full bg-slate-50 border border-rose-300 text-slate-900 text-xs rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-rose-500/20"
                                            />
                                        </div>
                                        <div className="flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => setShowRejectInput(false)}
                                                disabled={actionLoading}
                                                className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                                            >
                                                Cancel
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={actionLoading || !rejectionReason.trim()}
                                                className="flex-1 px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                                            >
                                                {actionLoading ? <Loader2 size={13} className="animate-spin" /> : <XCircle size={14} />}
                                                <span>Reject Document</span>
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}

                    </div>

                </div>

            </div>
        </div>
    );
};

export default DocumentPreviewModal;
