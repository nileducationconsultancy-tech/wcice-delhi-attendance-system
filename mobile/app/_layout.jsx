import React, { useState } from 'react';
import { View, StyleSheet, LogBox } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useAuthStore } from '../src/store/authStore';
import { colors } from '../src/constants/colors';
import { AnimatedSplash } from '../src/components/splash';
import { useAppInitialization } from '../src/hooks/useAppInitialization';

// Suppress non-critical development warning modals from blocking the mobile screen
LogBox.ignoreLogs([
    'Cannot connect to Expo CLI',
    'Auth verification note',
    'Network Error',
    'metro-runtime',
    'Running "main" with'
]);
LogBox.ignoreAllLogs(true);

function RootNavigation() {
    const { user, isLoading } = useAuthStore();
    const segments = useSegments();
    const router = useRouter();
    const { isAppReady, initError, retry } = useAppInitialization();
    const [splashVisible, setSplashVisible] = useState(true);

    React.useEffect(() => {
        if (!isAppReady || isLoading || splashVisible) return;

        const currentSegment = segments[0];

        if (!user) {
            // Redirect to login if user is not authenticated
            if (currentSegment !== '(auth)') {
                router.replace('/(auth)/login');
            }
        } else {
            // Redirect to employee dashboard if user is authenticated
            if (currentSegment !== '(employee)') {
                router.replace('/(employee)');
            }
        }
    }, [user, isLoading, isAppReady, splashVisible, segments]);

    return (
        <View style={styles.rootContainer}>
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" options={{ headerShown: false }} />
                <Stack.Screen name="(employee)" options={{ headerShown: false }} />
            </Stack>

            {/* Premium 3D Animated Splash Screen (Only on app launch) */}
            {splashVisible && (
                <AnimatedSplash
                    isReady={isAppReady && !isLoading}
                    initError={initError}
                    onRetry={retry}
                    onFinish={() => setSplashVisible(false)}
                />
            )}
        </View>
    );
}

export default function RootLayout() {
    return (
        <SafeAreaProvider>
            <StatusBar style="dark" backgroundColor={colors.background} />
            <RootNavigation />
        </SafeAreaProvider>
    );
}

const styles = StyleSheet.create({
    rootContainer: {
        flex: 1,
        backgroundColor: colors.background
    }
});
