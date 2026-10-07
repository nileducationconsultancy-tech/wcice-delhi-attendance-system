import React, { useEffect, useRef } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NileLogo3D } from './NileLogo3D';
import { SplashBackground } from './SplashBackground';
import { SplashLoader } from './SplashLoader';
import { colors } from '../../constants/colors';

const { height } = Dimensions.get('window');

/**
 * AnimatedSplash - Premium 3D Splash Screen for Nile Education Employee Portal
 * Orchestrates entrance animation timeline and smooth exit transition
 */
export const AnimatedSplash = ({ isReady, onFinish, initError, onRetry }) => {
    // Animation driver values
    const bgOpacity = useRef(new Animated.Value(0)).current;
    const logoScale = useRef(new Animated.Value(0.85)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const titleOpacity = useRef(new Animated.Value(0)).current;
    const titleTranslateY = useRef(new Animated.Value(12)).current;
    const subtitleOpacity = useRef(new Animated.Value(0)).current;
    const subtitleTranslateY = useRef(new Animated.Value(10)).current;
    const loaderOpacity = useRef(new Animated.Value(0)).current;
    const containerOpacity = useRef(new Animated.Value(1)).current;

    useEffect(() => {
        // Step 1: 0–300ms Background fades in
        Animated.timing(bgOpacity, {
            toValue: 1,
            duration: 300,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true
        }).start();

        // Step 2: 300–900ms 3D Logo scales 0.85 -> 1.0 + fades in
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(logoScale, {
                    toValue: 1,
                    duration: 600,
                    easing: Easing.out(Easing.back(1.2)),
                    useNativeDriver: true
                }),
                Animated.timing(logoOpacity, {
                    toValue: 1,
                    duration: 500,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                })
            ]).start();
        }, 300);

        // Step 3: 1400–1800ms "NILE EDUCATION" brand title fades in + subtle slide up
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(titleOpacity, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(titleTranslateY, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                })
            ]).start();
        }, 1400);

        // Step 4: 1800–2200ms "Employee Portal" subtitle fades in
        setTimeout(() => {
            Animated.parallel([
                Animated.timing(subtitleOpacity, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(subtitleTranslateY, {
                    toValue: 0,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                }),
                Animated.timing(loaderOpacity, {
                    toValue: 1,
                    duration: 400,
                    easing: Easing.out(Easing.ease),
                    useNativeDriver: true
                })
            ]).start();
        }, 1800);
    }, []);

    // Smooth exit transition once application initialization is ready
    useEffect(() => {
        if (isReady && !initError) {
            Animated.timing(containerOpacity, {
                toValue: 0,
                duration: 400,
                easing: Easing.inOut(Easing.ease),
                useNativeDriver: true
            }).start(() => {
                if (onFinish) onFinish();
            });
        }
    }, [isReady, initError, onFinish]);

    return (
        <Animated.View style={[styles.fullScreen, { opacity: containerOpacity }]}>
            {/* Minimal Luxury Background Atmosphere */}
            <SplashBackground opacityAnim={bgOpacity} />

            <SafeAreaView style={styles.safeArea}>
                <View style={styles.mainContent}>
                    {/* 3D Nile Education Logo */}
                    <NileLogo3D scaleAnim={logoScale} opacityAnim={logoOpacity} />

                    {/* Branding Titles */}
                    <View style={styles.textSection}>
                        {/* Primary Brand Title */}
                        <Animated.View
                            style={{
                                opacity: titleOpacity,
                                transform: [{ translateY: titleTranslateY }]
                            }}
                        >
                            <Text style={styles.brandTitle}>WECICE DELHI</Text>
                        </Animated.View>

                        {/* Subtitle / Portal Name */}
                        <Animated.View
                            style={{
                                opacity: subtitleOpacity,
                                transform: [{ translateY: subtitleTranslateY }]
                            }}
                        >
                            <Text style={styles.portalSubtitle}>Employee Portal</Text>
                        </Animated.View>
                    </View>

                    {/* Error State or Minimal Loader */}
                    {initError ? (
                        <View style={styles.errorContainer}>
                            <Text style={styles.errorText}>{initError}</Text>
                            <TouchableOpacity
                                style={styles.retryBtn}
                                onPress={onRetry}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.retryBtnText}>Try Again</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <SplashLoader opacityAnim={loaderOpacity} />
                    )}
                </View>

                {/* Footer Enterprise Watermark */}
                <Animated.View style={[styles.footer, { opacity: subtitleOpacity }]}>
                    <Text style={styles.footerBrand}>WECICE Delhi</Text>
                    <Text style={styles.footerVersion}>v1.0 • Enterprise Edition</Text>
                </Animated.View>
            </SafeAreaView>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    fullScreen: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 9999,
        elevation: 9999,
        backgroundColor: '#F8FAFC'
    },
    safeArea: {
        flex: 1,
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 20
    },
    mainContent: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        width: '100%',
        paddingHorizontal: 24,
        marginTop: height * 0.04
    },
    textSection: {
        alignItems: 'center',
        marginTop: 32
    },
    brandTitle: {
        fontSize: 24,
        fontWeight: '900',
        color: '#0F172A',
        letterSpacing: 3,
        textAlign: 'center'
    },
    portalSubtitle: {
        fontSize: 14,
        fontWeight: '600',
        color: '#64748B',
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        marginTop: 6,
        textAlign: 'center'
    },
    errorContainer: {
        marginTop: 24,
        alignItems: 'center'
    },
    errorText: {
        fontSize: 13,
        color: colors.danger,
        marginBottom: 12,
        fontWeight: '500'
    },
    retryBtn: {
        backgroundColor: colors.primary,
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 12
    },
    retryBtnText: {
        color: '#FFFFFF',
        fontWeight: '700',
        fontSize: 13
    },
    footer: {
        alignItems: 'center',
        marginBottom: 12
    },
    footerBrand: {
        fontSize: 12,
        fontWeight: '600',
        color: '#94A3B8',
        letterSpacing: 0.5
    },
    footerVersion: {
        fontSize: 10,
        fontWeight: '500',
        color: '#CBD5E1',
        marginTop: 2
    }
});

export default AnimatedSplash;
