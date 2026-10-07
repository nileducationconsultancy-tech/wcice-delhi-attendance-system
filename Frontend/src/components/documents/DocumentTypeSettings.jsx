import React, { useState, useEffect, useCallback } from 'react';
import { 
    Plus, Edit2, Trash2, CheckCircle2, XCircle, AlertCircle, 
    FileText, Loader2, Save, X, ToggleLeft, ToggleRight, Layers 
} from 'lucide-react';
import { documentApi } from '../../services/api/documentApi';
import { usePopupStore } from '../../store/popupStore';

const CATEGORIES = ['Identity', 'Employment', 'Banking', 'Education', 'Other'];

const DocumentTypeSettings = () => {
    const { showAlert, showConfirm } = usePopupStore();
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Modal state for Add/Edit
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingType, setEditingType] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        category: 'Identity',
        isRequired: true,
        isActive: true,
        description: '',
        sortOrder: 0
    });
    const [modalError, setModalError] = useState('');

    const fetchTypes = useCallback(async () => {
        setLoading(true);
        try {
            const res = await documentApi.getDocumentTypes();
            setTypes(res.data.documentTypes || []);
        } catch (err) {
            console.error('Failed to load document types', err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchTypes();
    }, [fetchTypes]);

    const handleOpenAdd = () => {
        setEditingType(null);
        setFormData({
            name: '',
            category: 'Identity',
            isRequired: true,
            isActive: true,
            description: '',
            sortOrder: types.length + 1
        });
        setModalError('');
        setIsModalOpen(true);
    };

    const handleOpenEdit = (type) => {
        setEditingType(type);
        setFormData({
            name: type.name,
            category: type.category,
            isRequired: type.isRequired,
            isActive: type.isActive,
            description: type.description || '',
            sortOrder: type.sortOrder || 0
        });
        setModalError('');
        setIsModalOpen(true);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            setModalError('Document type name is required');
            return;
        }

        setSaving(true);
        setModalError('');
        try {
            if (editingType) {
                await documentApi.updateDocumentType(editingType._id, formData);
                showAlert({
                    title: 'Updated',
                    message: `Document type "${formData.name}" updated successfully.`,
                    type: 'success'
                });
            } else {
                await documentApi.createDocumentType(formData);
                showAlert({
                    title: 'Created',
                    message: `Document type "${formData.name}" created successfully.`,
                    type: 'success'
                });
            }
            setIsModalOpen(false);
            fetchTypes();
        } catch (err) {
            setModalError(err.response?.data?.message || 'Failed to save document type.');
        } finally {
            setSaving(false);
        }
    };

    const handleToggleActive = async (type) => {
        try {
            await documentApi.updateDocumentType(type._id, { isActive: !type.isActive });
            fetchTypes();
        } catch (err) {
            showAlert({
                title: 'Error',
                message: err.response?.data?.message || 'Failed to update status.',
                type: 'error'
            });
        }
    };

    const handleDelete = async (type) => {
        const confirmed = await showConfirm({
            title: 'Delete Document Type',
            message: `Are you sure you want to remove "${type.name}"? If documents exist for it, it will be safely deactivated instead.`,
            type: 'warning',
            confirmText: 'Delete'
        });

        if (confirmed) {
            try {
                const res = await documentApi.deleteDocumentType(type._id);
                showAlert({
                    title: 'Document Type Removed',
                    message: res.data.message || 'Deleted successfully',
                    type: 'success'
                });
                fetchTypes();
            } catch (err) {
                showAlert({
                    title: 'Error',
                    message: err.response?.data?.message || 'Failed to delete document type.',
                    type: 'error'
                });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
                <div>
                    <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                        <Layers className="text-blue-600" size={20} />
                        Configurable Document Types
                    </h2>
                    <p className="text-xs text-slate-500 mt-0.5">
                        Define required and optional employee onboarding documents and categories
                    </p>
                </div>
                <button
                    onClick={handleOpenAdd}
                    className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-colors flex items-center gap-2 shrink-0"
                >
                    <Plus size={16} />
                    <span>Add Document Type</span>
                </button>
            </div>

            {loading ? (
                <div className="p-12 text-center text-slate-400 bg-white rounded-2xl border border-slate-200">
                    <Loader2 size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
                    <span className="text-xs font-semibold">Loading document types...</span>
                </div>
            ) : types.length === 0 ? (
                <div className="p-8 text-center text-slate-500 bg-white rounded-2xl border border-slate-200">
                    No document types configured. Click "Add Document Type" to create one.
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/75 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                                    <th className="py-3.5 px-5">Document Name</th>
                                    <th className="py-3.5 px-5">Category</th>
                                    <th className="py-3.5 px-5">Requirement</th>
                                    <th className="py-3.5 px-5">Status</th>
                                    <th className="py-3.5 px-5 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs">
                                {types.map((type) => (
                                    <tr key={type._id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="py-3.5 px-5">
                                            <div className="font-bold text-slate-900">{type.name}</div>
                                            {type.description && (
                                                <div className="text-[11px] text-slate-500 mt-0.5 max-w-sm truncate">
                                                    {type.description}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <span className="inline-flex px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-semibold font-mono text-[11px]">
                                                {type.category}
                                            </span>
                                        </td>
                                        <td className="py-3.5 px-5">
                                            {type.isRequired ? (
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                    Required
                                                </span>
                                            ) : (
                                                <span className="inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                                                    Optional
                                                </span>
                                            )}
                                        </td>
                                        <td className="py-3.5 px-5">
                                            <button
                                                onClick={() => handleToggleActive(type)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                                                    type.isActive 
                                                        ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                }`}
                                                title="Click to toggle status"
                                            >
                                                <span className={`w-1.5 h-1.5 rounded-full ${type.isActive ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                                                <span>{type.isActive ? 'Active' : 'Inactive'}</span>
                                            </button>
                                        </td>
                                        <td className="py-3.5 px-5 text-right">
                                            <div className="flex items-center justify-end gap-1.5">
                                                <button
                                                    onClick={() => handleOpenEdit(type)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                    title="Edit"
                                                >
                                                    <Edit2 size={15} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(type)}
                                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Modal for Add / Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden">
                        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/75">
                            <h3 className="text-sm font-bold text-slate-900">
                                {editingType ? 'Edit Document Type' : 'Add Document Type'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-700">
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            {modalError && (
                                <div className="p-2.5 bg-rose-50 text-rose-700 text-xs font-semibold rounded-xl border border-rose-200">
                                    {modalError}
                                </div>
                            )}

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Document Name *
                                </label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Passport Copy"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Category *
                                </label>
                                <select
                                    value={formData.category}
                                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                >
                                    {CATEGORIES.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                                    Description / Instructions
                                </label>
                                <textarea
                                    rows={2}
                                    placeholder="e.g. Clear copy showing personal particulars & expiry"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                />
                            </div>

                            <div className="flex items-center gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isRequired}
                                        onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                                        className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                                    />
                                    <span>Mandatory / Required</span>
                                </label>

                                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                                    <input
                                        type="checkbox"
                                        checked={formData.isActive}
                                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                                        className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                                    />
                                    <span>Active Status</span>
                                </label>
                            </div>

                            <div className="pt-4 flex justify-end gap-2.5 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-2 disabled:opacity-50"
                                >
                                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                                    <span>{editingType ? 'Save Changes' : 'Create Type'}</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentTypeSettings;
