import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Image,
    ActivityIndicator,
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import {
    ChevronRight,
    User,
    FolderKanban,
    ReceiptText,
    Settings as SettingsIcon,
    Camera,
    ShieldCheck,
    Calendar,
    Users,
    Bell,
    LogOut,
    Lock,
    CheckCircle2,
    Sparkles,
    Building2,
    Mail,
    KeyRound,
    UserPlus
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { authApi } from '../../src/api/authApi';
import { colors } from '../../src/constants/colors';
import { resolveMediaUrl } from '../../src/utils/media';
import Button from '../../src/components/Button';
import ChangePasswordModal from '../../src/components/ChangePasswordModal';

export default function ProfileScreen() {
    const router = useRouter();
    const { user, setProfilePicture, logout } = useAuthStore();
    const [uploading, setUploading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';
    const employee = user?.employee || {};
    const displayName = user?.name || employee?.name || (isAdmin ? 'Administrator' : 'Employee');
    const designation = isAdmin
        ? (user?.role === 'SUPER_ADMIN' ? 'Super Administrator' : 'Administrator')
        : (employee?.designation || 'Staff Member');
    const employeeId = isAdmin ? 'ADMIN-ROOT-001' : (employee?.employeeId || 'WECICE-EMP-001');
    const email = user?.email || employee?.email || 'admin@wecice.com';
    const rawPictureUrl = user?.profilePicture || employee?.profilePicture || null;
    const resolvedAvatarUrl = resolveMediaUrl(rawPictureUrl);

    const handleUploadImage = async (uri) => {
        setUploading(true);
        setImageError(false);
        try {
            const formData = new FormData();
            const filename = uri.split('/').pop() || 'profile.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1].toLowerCase()}` : 'image/jpeg';

            formData.append('file', {
                uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
                name: filename,
                type
            });

            const res = await authApi.uploadProfilePicture(formData);
            const newUrl = res.data?.profilePicture;

            if (newUrl) {
                setProfilePicture(newUrl);
                Alert.alert('Success 🎉', 'Profile picture updated and stored in Supabase!');
            }
        } catch (error) {
            console.error('Failed to upload avatar:', error);
            Alert.alert('Upload Error', error.response?.data?.message || error.message || 'Failed to upload photo.');
        } finally {
            setUploading(false);
        }
    };

    const handleSelectProfilePicture = () => {
        Alert.alert(
            'Update Profile Photo',
            'Choose an option to upload your photo to Supabase:',
            [
                {
                    text: 'Choose from Gallery',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Required', 'Gallery access is needed to select a profile picture.');
                            return;
                        }

                        const result = await ImagePicker.launchImageLibraryAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8
                        });

                        if (!result.canceled && result.assets && result.assets.length > 0) {
                            handleUploadImage(result.assets[0].uri);
                        }
                    }
                },
                {
                    text: 'Take Photo',
                    onPress: async () => {
                        const { status } = await ImagePicker.requestCameraPermissionsAsync();
                        if (status !== 'granted') {
                            Alert.alert('Permission Required', 'Camera access is needed to take a profile picture.');
                            return;
                        }

                        const result = await ImagePicker.launchCameraAsync({
                            mediaTypes: ['images'],
                            allowsEditing: true,
                            aspect: [1, 1],
                            quality: 0.8
                        });

                        if (!result.canceled && result.assets && result.assets.length > 0) {
                            handleUploadImage(result.assets[0].uri);
                        }
                    }
                },
                { text: 'Cancel', style: 'cancel' }
            ]
        );
    };

    const handleLogout = () => {
        Alert.alert('Log Out', 'Are you sure you want to log out from this session?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Log Out',
                style: 'destructive',
                onPress: async () => {
                    await logout();
                    router.replace('/(auth)/login');
                }
            }
        ]);
    };

    // Super Admin Quick Tools
    const adminTools = [
        {
            title: 'Add New Employee',
            sub: 'Register staff member & setup mobile app credentials',
            icon: <UserPlus size={20} color="#1E60FF" />,
            iconBg: '#EFF6FF',
            border: '#BFDBFE',
            onPress: () => router.push('/(employee)/add-employee')
        },
        {
            title: 'Holiday & Calendar Management',
            sub: 'Create & edit company holidays and working days',
            icon: <Calendar size={20} color="#D97706" />,
            iconBg: '#FFFBEB',
            border: '#FDE68A',
            onPress: () => router.push('/(employee)/holidays')
        },
        {
            title: 'Live Attendance Monitor',
            sub: 'Real-time staff punch logs & GPS verification',
            icon: <Users size={20} color="#1E60FF" />,
            iconBg: '#EFF6FF',
            border: '#BFDBFE',
            onPress: () => router.push('/(employee)/attendance')
        },
        {
            title: 'Document Verification Hub',
            sub: 'Review, verify & reject staff uploaded documents',
            icon: <FolderKanban size={20} color="#059669" />,
            iconBg: '#ECFDF5',
            border: '#A7F3D0',
            onPress: () => router.push('/(employee)/documents')
        },
        {
            title: 'Payroll & Payslip Engine',
            sub: 'Generate bulk payslips & adjust attendance figures',
            icon: <ReceiptText size={20} color="#7C3AED" />,
            iconBg: '#F5F3FF',
            border: '#DDD6FE',
            onPress: () => router.push('/(employee)/payslips')
        },
        {
            title: 'Company & App Settings',
            sub: 'Configure office location, radius & working hours',
            icon: <SettingsIcon size={20} color={colors.textPrimary} />,
            iconBg: colors.surfaceSubtle,
            border: colors.border,
            onPress: () => router.push('/(employee)/settings')
        },
        {
            title: 'Notification Center',
            sub: 'System broadcasts & attendance alerts',
            icon: <Bell size={20} color="#F59E0B" />,
            iconBg: '#FFFBEB',
            border: '#FDE68A',
            onPress: () => router.push('/(employee)/notifications')
        },
        {
            title: 'Privacy & Security Policy',
            sub: 'View data privacy terms, GPS & compliance standards',
            icon: <ShieldCheck size={20} color="#0284C7" />,
            iconBg: '#F0F9FF',
            border: '#BAE6FD',
            onPress: () => router.push('/(employee)/privacy')
        },
        {
            title: 'Change Password',
            sub: 'Update Super Admin account login password',
            icon: <KeyRound size={20} color="#059669" />,
            iconBg: '#ECFDF5',
            border: '#A7F3D0',
            onPress: () => setChangePasswordVisible(true)
        }
    ];

    // Regular Employee Menu Items
    const employeeMenuItems = [
        {
            title: 'Personal Information',
            sub: 'View registered employee details',
            icon: <User size={20} color={colors.primary} />,
            onPress: () => {}
        },
        {
            title: 'Change Password',
            sub: 'Update your account login password',
            icon: <KeyRound size={20} color={colors.primary} />,
            onPress: () => setChangePasswordVisible(true)
        },
        {
            title: 'My Documents',
            sub: 'Upload KYC, PAN & Degree certificates',
            icon: <FolderKanban size={20} color={colors.primary} />,
            onPress: () => router.push('/(employee)/documents')
        },
        {
            title: 'Salary & Payslips',
            sub: 'View and download monthly payslips',
            icon: <ReceiptText size={20} color={colors.primary} />,
            onPress: () => router.push('/(employee)/payslips')
        },
        {
            title: 'App Settings',
            sub: 'Notifications and preferences',
            icon: <SettingsIcon size={20} color={colors.primary} />,
            onPress: () => router.push('/(employee)/settings')
        },
        {
            title: 'Privacy Policy',
            sub: 'Data protection and employee terms',
            icon: <ShieldCheck size={20} color={colors.primary} />,
            onPress: () => router.push('/(employee)/privacy')
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>
                    {isAdmin ? 'Super Admin Profile' : 'My Profile'}
                </Text>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Profile Card */}
                <View style={styles.avatarSection}>
                    <TouchableOpacity
                        style={styles.avatarWrapper}
                        onPress={handleSelectProfilePicture}
                        activeOpacity={0.8}
                        disabled={uploading}
                    >
                        <View style={styles.avatarCircle}>
                            {uploading ? (
                                <ActivityIndicator size="small" color="#FFFFFF" />
                            ) : resolvedAvatarUrl && !imageError ? (
                                <Image
                                    key={resolvedAvatarUrl}
                                    source={{ uri: resolvedAvatarUrl }}
                                    style={styles.avatarImg}
                                    resizeMode="cover"
                                    onError={() => setImageError(true)}
                                />
                            ) : (
                                <Text style={styles.avatarText}>
                                    {displayName.charAt(0).toUpperCase()}
                                </Text>
                            )}
                        </View>

                        <View style={styles.cameraBadge}>
                            <Camera size={12} color="#FFFFFF" />
                        </View>
                    </TouchableOpacity>

                    <Text style={styles.userName}>{displayName}</Text>
                    <Text style={styles.userTitle}>{designation}</Text>

                    {isAdmin ? (
                        <View style={styles.superAdminPill}>
                            <ShieldCheck size={13} color="#FFFFFF" />
                            <Text style={styles.superAdminPillText}>ROOT ACCESS • SUPER ADMIN</Text>
                        </View>
                    ) : (
                        <View style={styles.employeePill}>
                            <Building2 size={12} color={colors.textSecondary} />
                            <Text style={styles.employeePillText}>WECICE Delhi Staff</Text>
                        </View>
                    )}
                </View>

                {/* Account Details Box */}
                <View style={styles.infoBox}>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Account ID</Text>
                        <Text style={styles.infoValue}>{employeeId}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Email</Text>
                        <Text style={styles.infoValue}>{email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                        <Text style={styles.infoLabel}>Organization</Text>
                        <Text style={styles.infoValue}>WECICE Delhi</Text>
                    </View>
                    <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
                        <Text style={styles.infoLabel}>System Status</Text>
                        <View style={styles.activeDotRow}>
                            <View style={styles.activeDot} />
                            <Text style={styles.activeText}>Active</Text>
                        </View>
                    </View>
                </View>

                {/* Admin Command Hub */}
                {isAdmin ? (
                    <>
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Executive Management Hub</Text>
                        </View>

                        <View style={styles.adminGrid}>
                            {adminTools.map((tool, idx) => (
                                <TouchableOpacity
                                    key={idx}
                                    style={[styles.adminToolCard, { borderColor: tool.border }]}
                                    onPress={tool.onPress}
                                    activeOpacity={0.7}
                                >
                                    <View style={[styles.adminToolIconBox, { backgroundColor: tool.iconBg }]}>
                                        {tool.icon}
                                    </View>
                                    <View style={styles.adminToolTextCol}>
                                        <Text style={styles.adminToolTitle}>{tool.title}</Text>
                                        <Text style={styles.adminToolSub}>{tool.sub}</Text>
                                    </View>
                                    <ChevronRight size={18} color={colors.textMuted} />
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Privileges Summary Box */}
                        <View style={styles.privilegeBox}>
                            <View style={styles.privilegeHeader}>
                                <Lock size={15} color="#1E60FF" />
                                <Text style={styles.privilegeHeaderText}>Administrator System Privileges</Text>
                            </View>
                            <View style={styles.privilegeGrid}>
                                <View style={styles.privilegeItem}>
                                    <CheckCircle2 size={13} color="#059669" />
                                    <Text style={styles.privilegeItemText}>Bypass Daily Punch In</Text>
                                </View>
                                <View style={styles.privilegeItem}>
                                    <CheckCircle2 size={13} color="#059669" />
                                    <Text style={styles.privilegeItemText}>Live GPS Roster Access</Text>
                                </View>
                                <View style={styles.privilegeItem}>
                                    <CheckCircle2 size={13} color="#059669" />
                                    <Text style={styles.privilegeItemText}>Verify / Reject Staff Docs</Text>
                                </View>
                                <View style={styles.privilegeItem}>
                                    <CheckCircle2 size={13} color="#059669" />
                                    <Text style={styles.privilegeItemText}>Bulk Payroll Engine</Text>
                                </View>
                            </View>
                        </View>
                    </>
                ) : (
                    /* Regular Employee Menu */
                    <View style={styles.menuContainer}>
                        {employeeMenuItems.map((item, idx) => (
                            <TouchableOpacity
                                key={idx}
                                style={styles.menuItemRow}
                                onPress={item.onPress}
                                activeOpacity={0.7}
                            >
                                <View style={styles.menuIconBox}>{item.icon}</View>
                                <View style={styles.menuTextCol}>
                                    <Text style={styles.menuItemTitle}>{item.title}</Text>
                                    <Text style={styles.menuItemSub}>{item.sub}</Text>
                                </View>
                                <ChevronRight size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Log Out CTA */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <LogOut size={18} color="#DC2626" />
                    <Text style={styles.logoutBtnText}>Log Out of Account</Text>
                </TouchableOpacity>
            </ScrollView>

            {/* Change Password Modal */}
            <ChangePasswordModal
                visible={changePasswordVisible}
                onClose={() => setChangePasswordVisible(false)}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 36
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 16
    },
    avatarWrapper: {
        position: 'relative',
        marginBottom: 12
    },
    avatarCircle: {
        width: 86,
        height: 86,
        borderRadius: 43,
        backgroundColor: '#1E60FF',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        borderWidth: 3,
        borderColor: '#BFDBFE'
    },
    avatarImg: {
        width: '100%',
        height: '100%'
    },
    avatarText: {
        fontSize: 32,
        fontWeight: '800',
        color: '#FFFFFF'
    },
    cameraBadge: {
        position: 'absolute',
        bottom: 2,
        right: 2,
        backgroundColor: '#1E60FF',
        borderRadius: 12,
        padding: 5,
        borderWidth: 2,
        borderColor: '#FFFFFF'
    },
    userName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 2
    },
    userTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textSecondary,
        marginBottom: 8
    },
    superAdminPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#1E60FF',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 10
    },
    superAdminPillText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#FFFFFF',
        letterSpacing: 0.5
    },
    employeePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    employeePillText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600'
    },
    infoBox: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 4,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16
    },
    infoRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 11,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceSubtle
    },
    infoLabel: {
        fontSize: 12,
        color: colors.textSecondary
    },
    infoValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    activeDotRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    activeDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: '#059669'
    },
    activeText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#059669'
    },
    sectionHeaderRow: {
        marginBottom: 10,
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textPrimary
    },
    adminGrid: {
        gap: 10,
        marginBottom: 16
    },
    adminToolCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 12,
        borderWidth: 1,
        gap: 12
    },
    adminToolIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center'
    },
    adminToolTextCol: {
        flex: 1
    },
    adminToolTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    adminToolSub: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2
    },
    privilegeBox: {
        backgroundColor: '#EFF6FF',
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: '#BFDBFE',
        marginBottom: 16
    },
    privilegeHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 10
    },
    privilegeHeaderText: {
        fontSize: 12,
        fontWeight: '800',
        color: '#1E60FF'
    },
    privilegeGrid: {
        gap: 6
    },
    privilegeItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    privilegeItemText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textPrimary
    },
    menuContainer: {
        gap: 10,
        marginBottom: 16
    },
    menuItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12
    },
    menuIconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    menuTextCol: {
        flex: 1
    },
    menuItemTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    menuItemSub: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 1
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        paddingVertical: 14,
        borderRadius: 14,
        gap: 8,
        marginTop: 6
    },
    logoutBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: '#DC2626'
    }
});
