import { create } from 'zustand';
import attendanceApi from '../api/attendanceApi';
import locationService from '../services/locationService';

export const useAttendanceStore = create((set, get) => ({
    todayData: null,
    loading: false,
    actionLoading: false,
    gpsLoading: false,
    error: null,
    successMessage: null,

    clearMessages: () => set({ error: null, successMessage: null }),

    /**
     * Fetch today's attendance status and active record
     */
    fetchTodayStatus: async () => {
        set({ loading: true, error: null });
        try {
            const data = await attendanceApi.getTodayStatus();
            set({ todayData: data, loading: false });
            return data;
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Failed to load attendance status';
            set({ error: errorMsg, loading: false });
            return null;
        }
    },

    /**
     * Perform GPS Check-In
     */
    performCheckIn: async (customCoords) => {
        set({ actionLoading: true, gpsLoading: !customCoords, error: null, successMessage: null });
        try {
            // 1. Acquire Device GPS coordinates if not passed
            const coords = customCoords || await locationService.getCurrentLocation();
            set({ gpsLoading: false });

            // 2. Submit check-in to existing Backend API
            const result = await attendanceApi.checkIn(coords);

            // 3. Update local state
            const currentData = get().todayData || {};
            set({
                todayData: {
                    ...currentData,
                    record: result.record
                },
                successMessage: result.message || 'Check-in recorded successfully!',
                actionLoading: false,
                gpsLoading: false
            });

            return { success: true, message: result.message, record: result.record };
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Check-in failed';
            set({
                error: errorMsg,
                actionLoading: false,
                gpsLoading: false
            });
            return { success: false, error: errorMsg };
        }
    },

    /**
     * Perform GPS Check-Out
     */
    performCheckOut: async (customCoords) => {
        set({ actionLoading: true, gpsLoading: !customCoords, error: null, successMessage: null });
        try {
            // 1. Acquire Device GPS coordinates if not passed
            const coords = customCoords || await locationService.getCurrentLocation();
            set({ gpsLoading: false });

            // 2. Submit check-out to existing Backend API
            const result = await attendanceApi.checkOut(coords);

            // 3. Update local state
            const currentData = get().todayData || {};
            set({
                todayData: {
                    ...currentData,
                    record: result.record
                },
                successMessage: result.message || 'Check-out recorded successfully!',
                actionLoading: false,
                gpsLoading: false
            });

            return { success: true, message: result.message, record: result.record };
        } catch (error) {
            const errorMsg = error.response?.data?.message || error.message || 'Check-out failed';
            set({
                error: errorMsg,
                actionLoading: false,
                gpsLoading: false
            });
            return { success: false, error: errorMsg };
        }
    }
}));

export default useAttendanceStore;
