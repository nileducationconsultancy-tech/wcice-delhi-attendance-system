import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { colors } from '../../constants/colors';

/**
 * SplashLoader - Minimal 3-dot pulse loader with staggered easing
 */
export const SplashLoader = ({ opacityAnim }) => {
    const dot1 = useRef(new Animated.Value(0.3)).current;
    const dot2 = useRef(new Animated.Value(0.3)).current;
    const dot3 = useRef(new Animated.Value(0.3)).current;

    useEffect(() => {
        const createPulse = (dotAnim, delay) => {
            return Animated.loop(
                Animated.sequence([
                    Animated.delay(delay),
                    Animated.timing(dotAnim, {
                        toValue: 1,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    }),
                    Animated.timing(dotAnim, {
                        toValue: 0.3,
                        duration: 400,
                        easing: Easing.inOut(Easing.ease),
                        useNativeDriver: true
                    }),
                    Animated.delay(800 - delay)
                ])
            );
        };

        const pulse1 = createPulse(dot1, 0);
        const pulse2 = createPulse(dot2, 200);
        const pulse3 = createPulse(dot3, 400);

        pulse1.start();
        pulse2.start();
        pulse3.start();

        return () => {
            pulse1.stop();
            pulse2.stop();
            pulse3.stop();
        };
    }, [dot1, dot2, dot3]);

    return (
        <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
            {/* 3 Animated Staggered Dots */}
            <View style={styles.dotsRow}>
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            opacity: dot1,
                            transform: [
                                {
                                    scale: dot1.interpolate({
                                        inputRange: [0.3, 1],
                                        outputRange: [0.8, 1.25]
                                    })
                                }
                            ]
                        }
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            opacity: dot2,
                            transform: [
                                {
                                    scale: dot2.interpolate({
                                        inputRange: [0.3, 1],
                                        outputRange: [0.8, 1.25]
                                    })
                                }
                            ]
                        }
                    ]}
                />
                <Animated.View
                    style={[
                        styles.dot,
                        {
                            opacity: dot3,
                            transform: [
                                {
                                    scale: dot3.interpolate({
                                        inputRange: [0.3, 1],
                                        outputRange: [0.8, 1.25]
                                    })
                                }
                            ]
                        }
                    ]}
                />
            </View>

            <Text style={styles.loadingText}>Initializing...</Text>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 28
    },
    dotsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        height: 16
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: colors.primary
    },
    loadingText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textMuted,
        letterSpacing: 0.8,
        marginTop: 10,
        textTransform: 'uppercase'
    }
});

export default SplashLoader;
