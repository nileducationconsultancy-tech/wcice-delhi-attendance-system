import React from 'react';
import { usePopupStore } from '../store/popupStore';
import { CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

const PopupModal = () => {
    const { isOpen, type, title, message, confirmText, cancelText, onConfirm, onCancel, closePopup } = usePopupStore();

    if (!isOpen) return null;

    const iconMap = {
        success: {
            icon: <CheckCircle2 className="w-8 h-8 text-emerald-600" />,
            bg: 'bg-emerald-100/70 border-emerald-200 ring-4 ring-emerald-50',
            btn: 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20 text-white'
        },
        error: {
            icon: <XCircle className="w-8 h-8 text-rose-600" />,
            bg: 'bg-rose-100/70 border-rose-200 ring-4 ring-rose-50',
            btn: 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20 text-white'
        },
        warning: {
            icon: <AlertTriangle className="w-8 h-8 text-amber-600" />,
            bg: 'bg-amber-100/70 border-amber-200 ring-4 ring-amber-50',
            btn: 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20 text-white'
        },
        info: {
            icon: <Info className="w-8 h-8 text-blue-600" />,
            bg: 'bg-blue-100/70 border-blue-200 ring-4 ring-blue-50',
            btn: 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20 text-white'
        }
    };

    const currentStyle = iconMap[type] || iconMap.info;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
                onClick={cancelText ? onCancel : closePopup}
            />

            {/* Modal Dialog Card */}
            <div className="relative bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-sm w-full p-6 text-center z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
                
                {/* Close 'X' button if cancel not explicit */}
                <button 
                    onClick={cancelText ? onCancel : closePopup}
                    className="absolute top-4 right-4 p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>

                {/* Animated Icon Badge */}
                <div className={`w-16 h-16 mx-auto rounded-2xl border flex items-center justify-center mb-4 transition-transform ${currentStyle.bg}`}>
                    {currentStyle.icon}
                </div>

                {/* Title */}
                <h3 className="text-lg font-bold text-slate-900 tracking-tight mb-1.5">
                    {title}
                </h3>

                {/* Message Body */}
                <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                    {message}
                </p>

                {/* Action Buttons */}
                <div className="flex gap-3 justify-center">
                    {cancelText && (
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`flex-1 py-2.5 px-5 rounded-xl font-semibold text-sm shadow-md transition-all active:scale-98 ${currentStyle.btn}`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PopupModal;
