import * as Location from 'expo-location';
import { Platform } from 'react-native';

export const locationService = {
    /**
     * Request GPS permissions and obtain current coordinates
     * @returns {Promise<{ latitude: number, longitude: number, accuracy: number }>}
     */
    getCurrentLocation: async () => {
        try {
            // Check if location services are enabled on the device
            const hasServices = await Location.hasServicesEnabledAsync();
            if (!hasServices) {
                throw new Error('GPS Location services are turned off. Please enable GPS in your device settings.');
            }

            // Request permission
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
                throw new Error('Location permission was denied. WECICE Attendance requires GPS access to verify check-in location.');
            }

            // Fetch current position with high accuracy
            const location = await Location.getCurrentPositionAsync({
                accuracy: Location.Accuracy.High,
                timeInterval: 5000,
                maxAge: 10000
            });

            return {
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                accuracy: location.coords.accuracy || 10
            };
        } catch (error) {
            // Provide informative error message
            if (error.message?.includes('denied') || error.message?.includes('permission')) {
                throw new Error('Location permission is required for attendance punch. Please grant location access in device settings.');
            } else if (error.message?.includes('turned off') || error.message?.includes('services')) {
                throw new Error('Please enable Location (GPS) on your phone before checking in.');
            }
            throw new Error(error.message || 'Failed to acquire GPS location. Please try again.');
        }
    }
};

export default locationService;
