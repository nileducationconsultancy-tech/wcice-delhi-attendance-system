import React from 'react';
import { View, StyleSheet, Dimensions, Animated } from 'react-native';

const { width, height } = Dimensions.get('window');

/**
 * SplashBackground - Minimal luxury atmosphere with soft radial glow and subtle corporate accents
 */
export const SplashBackground = ({ opacityAnim }) => {
    return (
        <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
            {/* Soft Ambient Radial Orb 1 - Top Center */}
            <View style={styles.topOrb} />

            {/* Soft Ambient Radial Orb 2 - Center (Behind Logo) */}
            <View style={styles.centerGlow} />

            {/* Soft Ambient Radial Orb 3 - Bottom Accent */}
            <View style={styles.bottomOrb} />

            {/* Subtle Geometric Decorative Lines */}
            <View style={styles.decorCircleLarge} />
            <View style={styles.decorCircleMedium} />
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: '#F8FAFC',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden'
    },
    topOrb: {
        position: 'absolute',
        top: -height * 0.12,
        width: width * 1.1,
        height: width * 1.1,
        borderRadius: (width * 1.1) / 2,
        backgroundColor: 'rgba(239, 246, 255, 0.85)'
    },
    centerGlow: {
        position: 'absolute',
        width: 320,
        height: 320,
        borderRadius: 160,
        backgroundColor: 'rgba(224, 238, 255, 0.65)',
        transform: [{ scale: 1.1 }]
    },
    bottomOrb: {
        position: 'absolute',
        bottom: -height * 0.15,
        width: width * 1.2,
        height: width * 1.2,
        borderRadius: (width * 1.2) / 2,
        backgroundColor: 'rgba(241, 245, 249, 0.7)'
    },
    decorCircleLarge: {
        position: 'absolute',
        width: 460,
        height: 460,
        borderRadius: 230,
        borderWidth: 1,
        borderColor: 'rgba(226, 232, 240, 0.45)',
        top: height * 0.2
    },
    decorCircleMedium: {
        position: 'absolute',
        width: 340,
        height: 340,
        borderRadius: 170,
        borderWidth: 1,
        borderColor: 'rgba(219, 234, 254, 0.5)',
        top: height * 0.26
    }
});

export default SplashBackground;
