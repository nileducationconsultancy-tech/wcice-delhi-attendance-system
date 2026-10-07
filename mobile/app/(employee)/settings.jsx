import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Lock,
    Bell,
    MapPin,
    Globe,
    Info,
    Shield,
    LogOut,
    MessageCircle,
    Phone,
    Headphones,
    HelpCircle,
    UserPlus
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/constants/colors';
import { openWhatsAppHR, openCallHR, HR_PHONE_FORMATTED } from '../../src/utils/contactHr';
import ChangePasswordModal from '../../src/components/ChangePasswordModal';

export default function SettingsScreen() {
    const router = useRouter();
    const { user, logout } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR';
    const [changePasswordVisible, setChangePasswordVisible] = useState(false);

    const handleLogout = () => {
        Alert.alert(
            'Confirm Logout',
            'Are you sure you want to log out from WECICE Attendance?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Logout',
                    style: 'destructive',
                    onPress: async () => {
                        await logout();
                    }
                }
            ]
        );
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Settings</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Admin Management Section */}
                {isAdmin && (
                    <>
                        <Text style={styles.sectionHeader}>Staff & Administration</Text>
                        <View style={styles.card}>
                            <TouchableOpacity
                                style={[styles.rowItem, { borderBottomWidth: 0 }]}
                                onPress={() => router.push('/(employee)/add-employee')}
                                activeOpacity={0.7}
                            >
                                <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                                    <UserPlus size={18} color="#1E60FF" />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.rowTitle}>Add New Employee</Text>
                                    <Text style={styles.rowSub}>Create employee account & credentials</Text>
                                </View>
                                <ChevronRight size={18} color={colors.textMuted} />
                            </TouchableOpacity>
                        </View>
                    </>
                )}

                {/* Account Section matching Screen 16 */}
                <Text style={styles.sectionHeader}>Account</Text>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.rowItem}
                        onPress={() => setChangePasswordVisible(true)}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBox}>
                            <Lock size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>Change Password</Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.rowItem}
                        onPress={() => router.push('/(employee)/notifications')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBox}>
                            <Bell size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>Notifications</Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.rowItem, { borderBottomWidth: 0 }]}
                        onPress={() => router.push('/(employee)/checkin')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBox}>
                            <MapPin size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>Location Permission</Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* App Section matching Screen 16 */}
                <Text style={styles.sectionHeader}>App</Text>
                <View style={styles.card}>
                    <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
                        <View style={styles.iconBox}>
                            <Globe size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>Language</Text>
                        <Text style={styles.rowSub}>English</Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.rowItem} activeOpacity={0.7}>
                        <View style={styles.iconBox}>
                            <Info size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>About WECICE HR</Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.rowItem, { borderBottomWidth: 0 }]}
                        onPress={() => router.push('/(employee)/privacy')}
                        activeOpacity={0.7}
                    >
                        <View style={styles.iconBox}>
                            <Shield size={18} color={colors.primary} />
                        </View>
                        <Text style={styles.rowTitle}>Privacy Policy</Text>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Contact HR & Support */}
                <Text style={styles.sectionHeader}>Contact HR & Support</Text>
                <View style={styles.card}>
                    <TouchableOpacity
                        style={styles.rowItem}
                        onPress={() => openWhatsAppHR()}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
                            <MessageCircle size={18} color="#059669" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>WhatsApp HR</Text>
                            <Text style={styles.rowSub}>Chat on +91 8252584025</Text>
                        </View>
                        <View style={styles.whatsAppBadge}>
                            <Text style={styles.whatsAppBadgeText}>ONLINE</Text>
                        </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.rowItem, { borderBottomWidth: 0 }]}
                        onPress={() => openCallHR()}
                        activeOpacity={0.7}
                    >
                        <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
                            <Phone size={18} color="#1E60FF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.rowTitle}>Call HR Helpline</Text>
                            <Text style={styles.rowSub}>{HR_PHONE_FORMATTED}</Text>
                        </View>
                        <ChevronRight size={18} color={colors.textMuted} />
                    </TouchableOpacity>
                </View>

                {/* Logout Button matching Screen 16 */}
                <TouchableOpacity
                    style={styles.logoutBtn}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <LogOut size={18} color={colors.danger} />
                    <Text style={styles.logoutText}>Logout</Text>
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
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    backBtn: {
        padding: 4
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40
    },
    sectionHeader: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginTop: 12,
        marginLeft: 4
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16
    },
    rowItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12
    },
    iconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center'
    },
    rowTitle: {
        flex: 1,
        fontSize: 14,
        fontWeight: '600',
        color: colors.textPrimary
    },
    rowSub: {
        fontSize: 12,
        color: colors.textMuted,
        marginRight: 4
    },
    logoutBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.dangerLight,
        borderWidth: 1.5,
        borderColor: colors.dangerBorder,
        borderRadius: 14,
        paddingVertical: 14,
        marginTop: 16,
        gap: 8
    },
    logoutText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.danger
    },
    whatsAppBadge: {
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8
    },
    whatsAppBadgeText: {
        fontSize: 10,
        fontWeight: '800',
        color: '#059669',
        letterSpacing: 0.5
    }
});
