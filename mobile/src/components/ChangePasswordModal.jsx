import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView
} from 'react-native';
import {
    Lock,
    X,
    KeyRound,
    CheckCircle2,
    ShieldAlert
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import Input from './Input';
import Button from './Button';
import { authApi } from '../api/authApi';

export const ChangePasswordModal = ({ visible, onClose }) => {
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const resetForm = () => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrorMsg('');
    };

    const handleClose = () => {
        if (loading) return;
        resetForm();
        onClose();
    };

    const handleSubmit = async () => {
        setErrorMsg('');

        if (!currentPassword.trim()) {
            setErrorMsg('Please enter your current password.');
            return;
        }

        if (!newPassword.trim()) {
            setErrorMsg('Please enter a new password.');
            return;
        }

        if (newPassword.trim().length < 4) {
            setErrorMsg('New password must be at least 4 characters long.');
            return;
        }

        if (newPassword !== confirmPassword) {
            setErrorMsg('New passwords do not match.');
            return;
        }

        if (currentPassword === newPassword) {
            setErrorMsg('New password must be different from current password.');
            return;
        }

        setLoading(true);
        try {
            const response = await authApi.changePassword({
                currentPassword: currentPassword.trim(),
                newPassword: newPassword.trim()
            });

            const msg = response.data?.message || 'Password changed successfully!';
            resetForm();
            onClose();

            Alert.alert('Success 🎉', msg);
        } catch (error) {
            console.error('Change password failed:', error);
            const serverMsg =
                error.response?.data?.message ||
                error.message ||
                'Failed to update password. Please check your current password.';
            setErrorMsg(serverMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            visible={visible}
            transparent={true}
            animationType="fade"
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                style={styles.overlay}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <View style={styles.cardContainer}>
                    {/* Close 'X' Button */}
                    <TouchableOpacity
                        style={styles.closeBtn}
                        onPress={handleClose}
                        disabled={loading}
                        activeOpacity={0.7}
                    >
                        <X size={20} color={colors.textMuted} />
                    </TouchableOpacity>

                    {/* Icon Badge */}
                    <View style={styles.iconRingOuter}>
                        <View style={styles.iconRingInner}>
                            <KeyRound size={26} color={colors.primary} />
                        </View>
                    </View>

                    {/* Title & Subtitle */}
                    <Text style={styles.title}>Change Password</Text>
                    <Text style={styles.subtitle}>
                        Enter your current password and set a new secure password for your account.
                    </Text>

                    {/* Error Banner */}
                    {Boolean(errorMsg) && (
                        <View style={styles.errorBanner}>
                            <ShieldAlert size={16} color={colors.danger} />
                            <Text style={styles.errorBannerText}>{errorMsg}</Text>
                        </View>
                    )}

                    {/* Form Fields */}
                    <ScrollView
                        style={styles.formContainer}
                        showsVerticalScrollIndicator={false}
                        keyboardShouldPersistTaps="handled"
                    >
                        <Input
                            label="Current Password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChangeText={(text) => {
                                setCurrentPassword(text);
                                if (errorMsg) setErrorMsg('');
                            }}
                            secureTextEntry
                            icon={Lock}
                        />

                        <Input
                            label="New Password"
                            placeholder="At least 4 characters"
                            value={newPassword}
                            onChangeText={(text) => {
                                setNewPassword(text);
                                if (errorMsg) setErrorMsg('');
                            }}
                            secureTextEntry
                            icon={Lock}
                        />

                        <Input
                            label="Confirm New Password"
                            placeholder="Re-enter new password"
                            value={confirmPassword}
                            onChangeText={(text) => {
                                setConfirmPassword(text);
                                if (errorMsg) setErrorMsg('');
                            }}
                            secureTextEntry
                            icon={Lock}
                        />

                        {/* Action Buttons */}
                        <View style={styles.actionButtons}>
                            <Button
                                title={loading ? 'Updating Password...' : 'Update Password'}
                                onPress={handleSubmit}
                                loading={loading}
                                icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                                style={styles.submitBtn}
                            />

                            <TouchableOpacity
                                style={styles.cancelBtn}
                                onPress={handleClose}
                                disabled={loading}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.cancelBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </View>
                    </ScrollView>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: 20
    },
    cardContainer: {
        width: '100%',
        maxHeight: '90%',
        backgroundColor: colors.surface,
        borderRadius: 24,
        padding: 22,
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
        justifyContent: 'center',
        zIndex: 10
    },
    iconRingOuter: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        alignSelf: 'center',
        marginTop: 4,
        marginBottom: 12
    },
    iconRingInner: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center'
    },
    title: {
        fontSize: 19,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        letterSpacing: -0.3
    },
    subtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginTop: 4,
        lineHeight: 17,
        marginBottom: 16,
        paddingHorizontal: 10
    },
    errorBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.roseLight,
        borderRadius: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        marginBottom: 14,
        gap: 8
    },
    errorBannerText: {
        flex: 1,
        fontSize: 12,
        color: colors.danger,
        fontWeight: '600'
    },
    formContainer: {
        width: '100%'
    },
    actionButtons: {
        marginTop: 6,
        marginBottom: 4,
        gap: 10
    },
    submitBtn: {
        backgroundColor: colors.primary,
        height: 50,
        borderRadius: 14,
        width: '100%'
    },
    cancelBtn: {
        height: 40,
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

export default ChangePasswordModal;
