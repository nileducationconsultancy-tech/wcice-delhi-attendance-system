import React, { useEffect, useRef } from 'react';
import {
    View,
    Image,
    StyleSheet,
    Animated,
    Easing,
    Platform
} from 'react-native';

/**
 * NileLogo3D - Corporate 3D presentation layer for Nile Education logo
 * Features realistic soft extrusion, multi-stage depth shadow, subtle ambient glow, and micro-tilt
 */
export const NileLogo3D = ({ scaleAnim, opacityAnim }) => {
    // Micro-float / tilt subtle loop
    const floatAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        const floatLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(floatAnim, {
                    toValue: 1,
                    duration: 2400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                }),
                Animated.timing(floatAnim, {
                    toValue: 0,
                    duration: 2400,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true
                })
            ])
        );

        floatLoop.start();
        return () => floatLoop.stop();
    }, [floatAnim]);

    // Subtly interpolate floating motion and micro 3D tilt
    const translateY = floatAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -6]
    });

    const rotateX = floatAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['1.5deg', '-1.5deg', '1.5deg']
    });

    const rotateY = floatAnim.interpolate({
        inputRange: [0, 0.5, 1],
        outputRange: ['-2deg', '2deg', '-2deg']
    });

    return (
        <Animated.View
            style={[
                styles.container,
                {
                    opacity: opacityAnim,
                    transform: [
                        { scale: scaleAnim },
                        { translateY },
                        { perspective: 1000 },
                        { rotateX },
                        { rotateY }
                    ]
                }
            ]}
        >
            {/* Ambient Soft Blue Halo */}
            <View style={styles.ambientHalo} />

            {/* Soft Ambient Depth Shadow (3D Base) */}
            <View style={styles.depthShadowLayer} />

            {/* 3D Glass Embossed Plinth */}
            <View style={styles.plinthCard}>
                {/* Top specular highlight reflection */}
                <View style={styles.specularHighlight} />

                {/* Nile Education Official Logo Asset */}
                <Image
                    source={require('../../../assets/nile-logo.png')}
                    style={styles.logoImage}
                    resizeMode="contain"
                />
            </View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    ambientHalo: {
        position: 'absolute',
        width: 240,
        height: 240,
        borderRadius: 120,
        backgroundColor: 'rgba(30, 96, 255, 0.08)',
        transform: [{ scale: 1.2 }]
    },
    depthShadowLayer: {
        position: 'absolute',
        width: 170,
        height: 170,
        borderRadius: 36,
        backgroundColor: 'rgba(15, 23, 42, 0.07)',
        transform: [{ translateY: 14 }, { scale: 0.96 }],
        ...Platform.select({
            ios: {
                shadowColor: '#0F172A',
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.12,
                shadowRadius: 20
            },
            android: {
                elevation: 10
            }
        })
    },
    plinthCard: {
        width: 180,
        height: 180,
        borderRadius: 38,
        backgroundColor: '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        borderWidth: 1.5,
        borderColor: 'rgba(255, 255, 255, 0.95)',
        ...Platform.select({
            ios: {
                shadowColor: '#1E3A8A',
                shadowOffset: { width: 0, height: 12 },
                shadowOpacity: 0.14,
                shadowRadius: 24
            },
            android: {
                elevation: 14
            }
        }),
        overflow: 'hidden'
    },
    specularHighlight: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: 50,
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        borderTopLeftRadius: 36,
        borderTopRightRadius: 36,
        transform: [{ skewY: '-12deg' }, { translateY: -20 }]
    },
    logoImage: {
        width: 135,
        height: 75
    }
});

export default NileLogo3D;
