import React, { useState, useRef, useEffect } from 'react';
import { 
    X, UploadCloud, FileText, Image as ImageIcon, AlertCircle, 
    CheckCircle2, Loader2, Mail, FolderUp, Info 
} from 'lucide-react';
import { documentApi } from '../../services/api/documentApi';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_EXTS = ['.pdf', '.jpg', '.jpeg', '.png'];
const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];

const DocumentUploadModal = ({
    isOpen,
    onClose,
    onSuccess,
    employeeId,
    employeeName,
    documentTypes = [],
    initialDocumentType = null,
    isHR = false
}) => {
    const fileInputRef = useRef(null);
    const [selectedTypeId, setSelectedTypeId] = useState('');
    const [uploadSource, setUploadSource] = useState('EMAIL'); // 'EMAIL' or 'MANUAL_HR' or 'EMPLOYEE_PORTAL'
    const [notes, setNotes] = useState('');
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
            setError('');
            setFile(null);
            setFilePreview(null);
            setUploadProgress(0);
            setNotes('');
            if (initialDocumentType) {
                setSelectedTypeId(initialDocumentType._id || initialDocumentType.id || '');
            } else if (documentTypes.length > 0) {
                setSelectedTypeId(documentTypes[0]._id || documentTypes[0].id || '');
            }
            if (isHR) {
                setUploadSource('EMAIL');
            } else {
                setUploadSource('EMPLOYEE_PORTAL');
            }
        }
    }, [isOpen, initialDocumentType, documentTypes, isHR]);

    if (!isOpen) return null;

    const handleFileValidation = (selectedFile) => {
        setError('');
        if (!selectedFile) return;

        if (selectedFile.size > MAX_FILE_SIZE) {
            setError(`File size (${(selectedFile.size / (1024 * 1024)).toFixed(2)} MB) exceeds 10MB limit.`);
            return;
        }

        const ext = '.' + selectedFile.name.split('.').pop().toLowerCase();
        if (!ALLOWED_EXTS.includes(ext) && !ALLOWED_MIME.includes(selectedFile.type)) {
            setError('Unsupported format. Only PDF, JPG, JPEG, and PNG files are allowed.');
            return;
        }

        setFile(selectedFile);

        if (selectedFile.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = (e) => setFilePreview(e.target.result);
            reader.readAsDataURL(selectedFile);
        } else {
            setFilePreview(null);
        }
    };

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFileValidation(e.dataTransfer.files[0]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFileValidation(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!file) {
            setError('Please choose a file to upload.');
            return;
        }
        if (!selectedTypeId) {
            setError('Please select a document type.');
            return;
        }

        setError('');
        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('employeeId', employeeId);
            formData.append('documentTypeId', selectedTypeId);
            formData.append('uploadSource', isHR ? uploadSource : 'EMPLOYEE_PORTAL');
            if (notes.trim()) {
                formData.append('notes', notes.trim());
            }

            await documentApi.uploadDocument(formData, (progressEvent) => {
                if (progressEvent.total) {
                    const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
                    setUploadProgress(percent);
                }
            });

            if (onSuccess) onSuccess();
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to upload document. Please try again.');
        } finally {
            setUploading(false);
        }
    };

    const selectedDocTypeObj = documentTypes.find(d => String(d._id) === String(selectedTypeId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
                
                {/* Header */}
                <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <div>
                        <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <UploadCloud className="text-blue-600" size={20} />
                            Upload Employee Document
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Uploading document for <span className="font-semibold text-slate-700">{employeeName || 'Employee'}</span>
                        </p>
                    </div>
                    <button 
                        onClick={onClose}
                        disabled={uploading}
                        className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form Body */}
                <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto flex-1">
                    {error && (
                        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2">
                            <AlertCircle size={16} className="shrink-0 text-rose-600" />
                            <span>{error}</span>
                        </div>
                    )}

                    {/* Document Type Selector */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Document Type *
                        </label>
                        <select
                            value={selectedTypeId}
                            onChange={(e) => setSelectedTypeId(e.target.value)}
                            disabled={uploading}
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs font-medium rounded-xl py-2.5 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        >
                            {documentTypes.map((dt) => (
                                <option key={dt._id} value={dt._id}>
                                    [{dt.category}] {dt.name} {dt.isRequired ? '• (Required)' : '• (Optional)'}
                                </option>
                            ))}
                        </select>
                        {selectedDocTypeObj?.description && (
                            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
                                <Info size={12} className="text-blue-500" /> {selectedDocTypeObj.description}
                            </p>
                        )}
                    </div>

                    {/* Upload Source (Only visible for HR/Admin) */}
                    {isHR && (
                        <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                                Document Source
                            </label>
                            <div className="grid grid-cols-2 gap-2.5">
                                <button
                                    type="button"
                                    onClick={() => setUploadSource('EMAIL')}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                        uploadSource === 'EMAIL'
                                            ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <Mail size={15} className={uploadSource === 'EMAIL' ? 'text-blue-600' : 'text-slate-400'} />
                                    <span>Existing Email</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setUploadSource('MANUAL_HR')}
                                    className={`flex items-center gap-2 p-2.5 rounded-xl border text-xs font-semibold transition-all ${
                                        uploadSource === 'MANUAL_HR'
                                            ? 'bg-blue-50 border-blue-300 text-blue-800 shadow-xs'
                                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                                    }`}
                                >
                                    <FolderUp size={15} className={uploadSource === 'MANUAL_HR' ? 'text-blue-600' : 'text-slate-400'} />
                                    <span>Direct HR Upload</span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Drag and Drop Zone */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Select File * (PDF, JPG, PNG up to 10MB)
                        </label>

                        <div
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={() => fileInputRef.current?.click()}
                            className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-all ${
                                dragActive 
                                    ? 'border-blue-500 bg-blue-50/50' 
                                    : file 
                                        ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400' 
                                        : 'border-slate-200 bg-slate-50/50 hover:bg-slate-100/70 hover:border-slate-300'
                            }`}
                        >
                            <input 
                                ref={fileInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={handleFileChange}
                                className="hidden"
                            />

                            {file ? (
                                <div className="flex items-center justify-between gap-3 text-left">
                                    <div className="flex items-center gap-3 min-w-0">
                                        {filePreview ? (
                                            <img src={filePreview} alt="Preview" className="w-12 h-12 rounded-xl object-cover border border-slate-200 shadow-xs shrink-0" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                                <FileText size={24} />
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="text-xs font-bold text-slate-900 truncate">{file.name}</p>
                                            <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                                                {(file.size / (1024 * 1024)).toFixed(2)} MB • {file.type || 'Document'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setFile(null);
                                            setFilePreview(null);
                                        }}
                                        className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                                        title="Remove file"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-1.5 py-2">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
                                        <UploadCloud size={20} />
                                    </div>
                                    <p className="text-xs font-bold text-slate-700">
                                        Click to browse or drag & drop file here
                                    </p>
                                    <p className="text-[11px] text-slate-400">
                                        Supports PDF, JPG, JPEG, PNG (Max 10MB)
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Notes / Description */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                            Description / Internal Note <span className="text-slate-400 font-normal lowercase">(optional)</span>
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="e.g. Received via onboarding email dated 15 Sep 2026"
                            className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-xs rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                        />
                    </div>

                    {/* Upload Progress Bar */}
                    {uploading && (
                        <div className="space-y-1.5 pt-1">
                            <div className="flex justify-between text-[11px] font-semibold text-slate-600">
                                <span>Uploading securely...</span>
                                <span>{uploadProgress}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 transition-all duration-300"
                                    style={{ width: `${uploadProgress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Action Buttons */}
                    <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl transition-colors disabled:opacity-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {uploading ? (
                                <>
                                    <Loader2 size={14} className="animate-spin" />
                                    <span>Uploading...</span>
                                </>
                            ) : (
                                <>
                                    <UploadCloud size={14} />
                                    <span>Upload Document</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>

            </div>
        </div>
    );
};

export default DocumentUploadModal;
