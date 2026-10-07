import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { 
    FileText, Search, Filter, ShieldCheck, Clock, XCircle, 
    AlertCircle, Eye, Mail, User, HardDrive, RefreshCw, Loader2, ArrowRight
} from 'lucide-react';
import { documentApi } from '../services/api/documentApi';
import DocumentPreviewModal from '../components/documents/DocumentPreviewModal';
import { usePopupStore } from '../store/popupStore';
import { useDebounce } from '../hooks/useDebounce';

const AdminDocuments = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const { showAlert } = usePopupStore();
    
    const initialStatus = searchParams.get('status') || '';
    const [statusFilter, setStatusFilter] = useState(initialStatus);
    const [categoryFilter, setCategoryFilter] = useState('');
    const [search, setSearch] = useState('');
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalDocs, setTotalDocs] = useState(0);

    const [previewDoc, setPreviewDoc] = useState(null);

    const debouncedSearch = useDebounce(search, 350);

    const fetchDocuments = useCallback(async () => {
        setLoading(true);
        try {
            const res = await documentApi.getAllCompanyDocuments({
                status: statusFilter,
                category: categoryFilter,
                search: debouncedSearch,
                page,
                limit: 20
            });
            setDocuments(res.data.documents || []);
            setTotalPages(res.data.pages || 1);
            setTotalDocs(res.data.total || 0);
        } catch (err) {
            console.error('Failed to load company documents', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, categoryFilter, debouncedSearch, page]);

    useEffect(() => {
        fetchDocuments();
    }, [fetchDocuments]);

    const handleStatusTabClick = (newStatus) => {
        setStatusFilter(newStatus);
        setPage(1);
        if (newStatus) {
            setSearchParams({ status: newStatus });
        } else {
            setSearchParams({});
        }
    };

    const handleVerify = async (docId, docName) => {
        try {
            await documentApi.verifyDocument(docId);
            showAlert({
                title: 'Verified',
                message: `${docName} verified successfully.`,
                type: 'success'
            });
            fetchDocuments();
        } catch (err) {
            showAlert({
                title: 'Error',
                message: err.response?.data?.message || 'Failed to verify.',
                type: 'error'
            });
        }
    };

    const handleRejectPrompt = async (docId, docName) => {
        const reason = window.prompt(`Enter rejection reason for "${docName}":`, 'Please upload a clearer copy.');
        if (reason && reason.trim()) {
            try {
                await documentApi.rejectDocument(docId, reason.trim());
                showAlert({
                    title: 'Rejected',
                    message: `${docName} marked as rejected.`,
                    type: 'info'
                });
                fetchDocuments();
            } catch (err) {
                showAlert({
                    title: 'Error',
                    message: err.response?.data?.message || 'Failed to reject document.',
                    type: 'error'
                });
            }
        }
    };

    return (
        <Layout>
            <div className="p-3 sm:p-5 md:p-8 max-w-7xl mx-auto w-full space-y-5 pb-12">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            <FileText className="text-blue-600" size={26} />
                            Document Verification Queue
                        </h1>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Review, verify, and track all employee documents across the organization
                        </p>
                    </div>

                    <button
                        onClick={fetchDocuments}
                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 transition-colors self-stretch sm:self-auto justify-center"
                    >
                        <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                        <span>Refresh</span>
                    </button>
                </div>

                {/* Status Navigation Filter Tabs */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold scrollbar-none">
                    <button
                        onClick={() => handleStatusTabClick('')}
                        className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap ${
                            statusFilter === '' 
                                ? 'bg-slate-900 text-white shadow-xs' 
                                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                        }`}
                    >
                        All Documents
                    </button>
                    <button
                        onClick={() => handleStatusTabClick('PENDING_VERIFICATION')}
                        className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            statusFilter === 'PENDING_VERIFICATION' 
                                ? 'bg-amber-600 text-white shadow-xs' 
                                : 'bg-white border border-slate-200 text-amber-700 hover:bg-amber-50'
                        }`}
                    >
                        <Clock size={14} />
                        <span>Pending Verification</span>
                    </button>
                    <button
                        onClick={() => handleStatusTabClick('VERIFIED')}
                        className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            statusFilter === 'VERIFIED' 
                                ? 'bg-emerald-600 text-white shadow-xs' 
                                : 'bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50'
                        }`}
                    >
                        <ShieldCheck size={14} />
                        <span>Verified</span>
                    </button>
                    <button
                        onClick={() => handleStatusTabClick('REJECTED')}
                        className={`px-4 py-2 rounded-xl transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            statusFilter === 'REJECTED' 
                                ? 'bg-rose-600 text-white shadow-xs' 
                                : 'bg-white border border-slate-200 text-rose-700 hover:bg-rose-50'
                        }`}
                    >
                        <XCircle size={14} />
                        <span>Rejected</span>
                    </button>
                </div>

                {/* Filter and Search Bar */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 flex flex-col sm:flex-row justify-between gap-3">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                        <input
                            type="text"
                            placeholder="Search by employee name, ID, or file name..."
                            value={search}
                            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    <div className="flex items-center gap-2.5">
                        <select
                            value={categoryFilter}
                            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
                            className="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-semibold py-2 px-3 rounded-xl focus:outline-none"
                        >
                            <option value="">All Categories</option>
                            <option value="Identity">Identity</option>
                            <option value="Employment">Employment</option>
                            <option value="Banking">Banking</option>
                            <option value="Education">Education</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>
                </div>

                {/* Document Table */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="py-3.5 px-4 sm:px-6">Employee</th>
                                    <th className="py-3.5 px-4 sm:px-6">Document Type</th>
                                    <th className="py-3.5 px-4 sm:px-6">File Details</th>
                                    <th className="py-3.5 px-4 sm:px-6">Source</th>
                                    <th className="py-3.5 px-4 sm:px-6">Status</th>
                                    <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {loading ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-slate-400">
                                            <Loader2 size={24} className="animate-spin text-blue-600 mx-auto mb-2" />
                                            <span>Loading verification queue...</span>
                                        </td>
                                    </tr>
                                ) : documents.length === 0 ? (
                                    <tr>
                                        <td colSpan="6" className="p-12 text-center text-slate-500">
                                            No documents found matching the filter criteria.
                                        </td>
                                    </tr>
                                ) : (
                                    documents.map((doc) => {
                                        const emp = doc.employeeId;
                                        return (
                                            <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                                                
                                                {/* Employee */}
                                                <td className="py-3.5 px-4 sm:px-6">
                                                    {emp ? (
                                                        <Link 
                                                            to={`/admin/employees/${emp._id}`}
                                                            className="group block"
                                                        >
                                                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                                                                {emp.name}
                                                            </div>
                                                            <div className="text-[11px] text-slate-500 font-mono">
                                                                {emp.employeeId} • {emp.designation || 'Staff'}
                                                            </div>
                                                        </Link>
                                                    ) : (
                                                        <span className="text-slate-400 italic">Unknown Employee</span>
                                                    )}
                                                </td>

                                                {/* Document Type & Category */}
                                                <td className="py-3.5 px-4 sm:px-6">
                                                    <div className="font-bold text-slate-900">{doc.documentTypeName}</div>
                                                    <span className="inline-flex mt-0.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-medium text-[10px]">
                                                        {doc.category}
                                                    </span>
                                                </td>

                                                {/* File Name & Size */}
                                                <td className="py-3.5 px-4 sm:px-6">
                                                    <div className="font-medium text-slate-800 truncate max-w-[180px]" title={doc.fileName}>
                                                        {doc.fileName}
                                                    </div>
                                                    <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                                                        {(doc.fileSize / (1024 * 1024)).toFixed(2)} MB • {new Date(doc.uploadedAt).toLocaleDateString('en-GB')}
                                                    </div>
                                                </td>

                                                {/* Upload Source */}
                                                <td className="py-3.5 px-4 sm:px-6">
                                                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700">
                                                        {doc.uploadSource === 'EMAIL' ? (
                                                            <span className="text-blue-600 flex items-center gap-1">
                                                                <Mail size={12} /> Email
                                                            </span>
                                                        ) : doc.uploadSource === 'EMPLOYEE_PORTAL' ? (
                                                            <span className="text-emerald-600 flex items-center gap-1">
                                                                <User size={12} /> Employee
                                                            </span>
                                                        ) : (
                                                            <span className="text-slate-600 flex items-center gap-1">
                                                                <HardDrive size={12} /> HR Upload
                                                            </span>
                                                        )}
                                                    </span>
                                                </td>

                                                {/* Status */}
                                                <td className="py-3.5 px-4 sm:px-6">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                                        doc.status === 'VERIFIED' ? 'bg-emerald-100 text-emerald-800' :
                                                        doc.status === 'REJECTED' ? 'bg-rose-100 text-rose-800' :
                                                        'bg-amber-100 text-amber-800'
                                                    }`}>
                                                        {doc.status === 'PENDING_VERIFICATION' ? 'Pending' : doc.status}
                                                    </span>
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3.5 px-4 sm:px-6 text-right">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => setPreviewDoc(doc)}
                                                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="View Document"
                                                        >
                                                            <Eye size={16} />
                                                        </button>

                                                        {doc.status === 'PENDING_VERIFICATION' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleVerify(doc._id, doc.documentTypeName)}
                                                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                                                    title="Verify"
                                                                >
                                                                    <ShieldCheck size={16} />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleRejectPrompt(doc._id, doc.documentTypeName)}
                                                                    className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                                    title="Reject"
                                                                >
                                                                    <XCircle size={16} />
                                                                </button>
                                                            </>
                                                        )}

                                                        {emp && (
                                                            <Link
                                                                to={`/admin/employees/${emp._id}`}
                                                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                                                                title="Go to Employee Profile"
                                                            >
                                                                <ArrowRight size={16} />
                                                            </Link>
                                                        )}
                                                    </div>
                                                </td>

                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
                            <span>Showing {documents.length} of {totalDocs} records</span>
                            <div className="flex gap-2">
                                <button
                                    disabled={page === 1}
                                    onClick={() => setPage(page - 1)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium"
                                >
                                    Prev
                                </button>
                                <span className="px-3 py-1.5 font-semibold text-slate-700">Page {page} of {totalPages}</span>
                                <button
                                    disabled={page === totalPages}
                                    onClick={() => setPage(page + 1)}
                                    className="px-3 py-1.5 border border-slate-200 rounded-lg disabled:opacity-40 hover:bg-slate-50 font-medium"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Preview Modal */}
                <DocumentPreviewModal
                    isOpen={Boolean(previewDoc)}
                    onClose={() => setPreviewDoc(null)}
                    document={previewDoc}
                    isHR={true}
                    onVerifySuccess={() => fetchDocuments()}
                    onRejectSuccess={() => fetchDocuments()}
                />

            </div>
        </Layout>
    );
};

export default AdminDocuments;
