import { create } from 'zustand';

export const usePopupStore = create((set) => ({
    isOpen: false,
    type: 'success', // 'success', 'error', 'warning', 'info'
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: null,
    onConfirm: null,
    onCancel: null,

    showAlert: ({ title = 'Notification', message = '', type = 'success', confirmText = 'OK', onConfirm = null }) => {
        return new Promise((resolve) => {
            set({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText: null,
                onConfirm: () => {
                    if (onConfirm) onConfirm();
                    set({ isOpen: false });
                    resolve(true);
                },
                onCancel: null
            });
        });
    },

    showConfirm: ({ title = 'Are you sure?', message = '', type = 'warning', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
        return new Promise((resolve) => {
            set({
                isOpen: true,
                title,
                message,
                type,
                confirmText,
                cancelText,
                onConfirm: () => {
                    set({ isOpen: false });
                    resolve(true);
                },
                onCancel: () => {
                    set({ isOpen: false });
                    resolve(false);
                }
            });
        });
    },

    closePopup: () => set({ isOpen: false })
}));
