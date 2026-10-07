import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    ActivityIndicator
} from 'react-native';
import {
    LogOut,
    Clock,
    CheckCircle2,
    MapPin,
    X,
    Sparkles,
    ArrowRight
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import locationService from '../services/locationService';
import Button from './Button';

export const CheckOutModal = ({
    visible,
    onClose,
    onConfirm,
    loading = false,
    record = null
}) => {
    const [gpsLocation, setGpsLocation] = useState(null);
    const [gpsLoading, setGpsLoading] = useState(false);
    const [gpsError, setGpsError] = useState(null);

    const fetchGps = () => {
        setGpsLoading(true);
        setGpsError(null);
        locationService.getCurrentLocation()
            .then(loc => {
                setGpsLocation(loc);
                setGpsError(null);
            })
            .catch(err => {
                console.warn('Checkout GPS capture note:', err.message);
                setGpsError(err.message || 'Unable to retrieve GPS location.');
            })
            .finally(() => setGpsLoading(false));
    };

    useEffect(() => {
        if (visible) {
            fetchGps();
        } else {
            setGpsLocation(null);
            setGpsError(null);
        }
    }, [visible]);

    const currentTimeFormatted = new Date().toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    const punchInTime = record?.firstInFormatted || 'Morning';

    const handleConfirm = () => {
        onConfirm(gpsLocation);
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.cardContainer}>
                    {/* Close 'X' Button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={onClose}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <X size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* Glowing Icon Badge */}
                    <View style={styles.iconRingOuter}>
                        <View style={styles.iconRingInner}>
                            <LogOut size={28} color={colors.primary} />
                        </View>
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={styles.title}>Ready to Check Out?</Text>
                    <Text style={styles.subtitle}>
                        Confirm your end of shift to save your total working hours and verified checkout location.
                    </Text>

                    {/* Today's Shift Summary Box */}
                    <View style={styles.shiftSummaryBox}>
                        <View style={styles.shiftTimesRow}>
                            <View style={styles.timeBlock}>
                                <Text style={styles.timeLabel}>PUNCH IN</Text>
                                <Text style={styles.timeValue}>{punchInTime}</Text>
                            </View>

                            <View style={styles.timeArrowBox}>
                                <ArrowRight size={16} color={colors.textMuted} />
                            </View>

                            <View style={styles.timeBlock}>
                                <Text style={styles.timeLabel}>PUNCH OUT</Text>
                                <Text style={[styles.timeValue, { color: colors.primary }]}>
                                    {currentTimeFormatted}
                                </Text>
                            </View>
                        </View>

                        {/* Location Verification Tag */}
                        <View style={styles.locationTag}>
                            {gpsLoading ? (
                                <>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={styles.locationTagText}>
                                        Verifying Office GPS location...
                                    </Text>
                                </>
                            ) : gpsError ? (
                                <View style={{ alignItems: 'center', gap: 4 }}>
                                    <Text style={[styles.locationTagText, { color: colors.danger || '#EF4444', textAlign: 'center' }]}>
                                        ⚠️ {gpsError}
                                    </Text>
                                    <TouchableOpacity onPress={fetchGps} style={{ marginTop: 2 }}>
                                        <Text style={{ fontSize: 11, fontWeight: '700', color: colors.primary }}>
                                            Tap to Retry GPS
                                        </Text>
                                    </TouchableOpacity>
                                </View>
                            ) : gpsLocation ? (
                                <>
                                    <CheckCircle2 size={13} color={colors.success} />
                                    <Text style={[styles.locationTagText, { color: colors.success, fontWeight: '700' }]}>
                                        Office Location Verified (±{Math.round(gpsLocation.accuracy)}m)
                                    </Text>
                                </>
                            ) : (
                                <>
                                    <MapPin size={13} color={colors.textSecondary} />
                                    <Text style={styles.locationTagText}>
                                        Office Geofencing Verification
                                    </Text>
                                </>
                            )}
                        </View>
                    </View>

                    {/* Action Buttons */}
                    <View style={styles.actionButtons}>
                        <Button
                            title={loading ? 'Checking Out...' : gpsLoading ? 'Acquiring GPS...' : 'Confirm & Check Out'}
                            onPress={handleConfirm}
                            loading={loading}
                            disabled={loading || gpsLoading}
                            icon={<LogOut size={18} color="#FFFFFF" />}
                            style={styles.confirmBtn}
                        />

                        <TouchableOpacity
                            style={styles.cancelBtn}
                            onPress={onClose}
                            disabled={loading}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.cancelBtnText}>Continue Working</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 24
    },
    cardContainer: {
        width: '100%',
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        position: 'relative',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 8,
        borderWidth: 1,
        borderColor: colors.border
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    iconRingOuter: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 8,
        marginBottom: 16
    },
    iconRingInner: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        color: colors.textPrimary,
        letterSpacing: -0.3,
        textAlign: 'center'
    },
    subtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 6,
        lineHeight: 18,
        paddingHorizontal: 12
    },
    shiftSummaryBox: {
        width: '100%',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 16,
        padding: 16,
        marginVertical: 18,
        borderWidth: 1,
        borderColor: colors.border
    },
    shiftTimesRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    timeBlock: {
        alignItems: 'center',
        flex: 1
    },
    timeArrowBox: {
        paddingHorizontal: 8
    },
    timeLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textMuted,
        letterSpacing: 0.5
    },
    timeValue: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 2
    },
    locationTag: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.border
    },
    locationTagText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary
    },
    actionButtons: {
        width: '100%',
        gap: 10
    },
    confirmBtn: {
        backgroundColor: colors.primary,
        height: 50,
        borderRadius: 14,
        width: '100%'
    },
    cancelBtn: {
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 12
    },
    cancelBtnText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary
    }
});

export default CheckOutModal;
