import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ShieldCheck,
    MapPin,
    Lock,
    Eye,
    Server,
    FileText,
    Mail,
    Phone,
    CheckCircle2
} from 'lucide-react-native';
import { colors } from '../../src/constants/colors';
import { HR_PHONE_FORMATTED } from '../../src/utils/contactHr';

export default function PrivacyPolicyScreen() {
    const router = useRouter();

    const sections = [
        {
            id: '1',
            icon: <Eye size={20} color="#1E60FF" />,
            iconBg: '#EFF6FF',
            title: '1. Information We Collect',
            content:
                'We collect information necessary to manage attendance, payroll, and HR operations efficiently:\n\n' +
                '• Personal Information: Name, email, contact number, employee ID, designation, and department.\n' +
                '• Attendance & Geolocation: Real-time GPS coordinates and timestamps during punch-in and punch-out to verify office geofence compliance.\n' +
                '• Documents & Verification: Government IDs (PAN, Aadhaar), educational certificates, and profile photos uploaded for HR verification.\n' +
                '• Device & Log Info: Device model, operating system, IP address, and app crash diagnostics.'
        },
        {
            id: '2',
            icon: <MapPin size={20} color="#059669" />,
            iconBg: '#ECFDF5',
            title: '2. Location Data & Geofencing',
            content:
                '• Precise Location: We access your device location only when you perform attendance check-in or check-out to ensure you are within designated office radius.\n' +
                '• No Background Tracking: The app does NOT continuously track your real-time location in the background once punch-in or check-out is complete.\n' +
                '• Permission Control: You can modify location permissions at any time through your device settings, though valid location is required for attendance marking.'
        },
        {
            id: '3',
            icon: <Server size={20} color="#7C3AED" />,
            iconBg: '#F5F3FF',
            title: '3. How We Use Your Data',
            content:
                'The collected data is exclusively used for organizational purposes:\n\n' +
                '• Recording and verifying daily staff attendance & working hours.\n' +
                '• Calculating monthly work days, leaves, and generating salary payslips.\n' +
                '• Verifying employee KYC documents and compliance records.\n' +
                '• Sending system notifications, holiday announcements, and payroll alerts.'
        },
        {
            id: '4',
            icon: <Lock size={20} color="#D97706" />,
            iconBg: '#FFFBEB',
            title: '4. Data Security & Storage',
            content:
                '• End-to-End Encryption: All communication between the app and our servers is secured using SSL/TLS 256-bit encryption.\n' +
                '• Secure Cloud Storage: Documents and media are stored in encrypted cloud buckets with restricted role-based access.\n' +
                '• Strict Access Control: Super Administrators and authorized HR personnel only have access to records strictly necessary for administrative duties.'
        },
        {
            id: '5',
            icon: <FileText size={20} color="#DC2626" />,
            iconBg: '#FEF2F2',
            title: '5. Data Retention & Employee Rights',
            content:
                '• Retention: Employee attendance and document records are retained as required by company policy and labor law regulations.\n' +
                '• Access & Review: Employees can view their attendance logs, uploaded documents, and payslips directly within the app.\n' +
                '• Correction Requests: Employees may request corrections to inaccurate personal records by contacting the HR department.'
        },
        {
            id: '6',
            icon: <Mail size={20} color="#0284C7" />,
            iconBg: '#F0F9FF',
            title: '6. Contact & Grievance Redressal',
            content:
                'If you have questions, concerns, or grievances regarding this Privacy Policy or your personal data handling, please contact:\n\n' +
                '• Organization: WECICE Delhi\n' +
                '• Email: hr@wecice.com\n' +
                `• HR Helpline: ${HR_PHONE_FORMATTED}\n` +
                '• Address: WECICE Delhi HQ, Delhi, India'
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Privacy Policy</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Hero Banner */}
                <View style={styles.heroBanner}>
                    <View style={styles.heroIconBox}>
                        <ShieldCheck size={28} color="#1E60FF" />
                    </View>
                    <Text style={styles.heroTitle}>Your Privacy & Data Protection</Text>
                    <Text style={styles.heroSubtitle}>
                        WECICE Attendance System is committed to safeguarding your personal information, location data, and organizational records.
                    </Text>
                    <View style={styles.badgeRow}>
                        <View style={styles.pill}>
                            <CheckCircle2 size={12} color="#059669" />
                            <Text style={styles.pillText}>Version 1.0</Text>
                        </View>
                        <View style={styles.pill}>
                            <Text style={styles.pillText}>Last Updated: 2026</Text>
                        </View>
                    </View>
                </View>

                {/* Policy Sections */}
                {sections.map((sec) => (
                    <View key={sec.id} style={styles.sectionCard}>
                        <View style={styles.sectionCardHeader}>
                            <View style={[styles.iconBox, { backgroundColor: sec.iconBg }]}>
                                {sec.icon}
                            </View>
                            <Text style={styles.sectionHeading}>{sec.title}</Text>
                        </View>
                        <Text style={styles.sectionBody}>{sec.content}</Text>
                    </View>
                ))}

                {/* Footer Notice */}
                <View style={styles.footerBox}>
                    <Text style={styles.footerText}>
                        © 2026 WECICE Delhi. All rights reserved.{'\n'}
                        WECICE Attendance & HRMS Platform
                    </Text>
                </View>
            </ScrollView>
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
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40
    },
    heroBanner: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        marginBottom: 16
    },
    heroIconBox: {
        width: 54,
        height: 54,
        borderRadius: 27,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 12,
        borderWidth: 1,
        borderColor: '#BFDBFE'
    },
    heroTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary,
        textAlign: 'center',
        marginBottom: 6
    },
    heroSubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18,
        marginBottom: 12
    },
    badgeRow: {
        flexDirection: 'row',
        gap: 8,
        flexWrap: 'wrap',
        justifyContent: 'center'
    },
    pill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8
    },
    pillText: {
        fontSize: 11,
        color: colors.textSecondary,
        fontWeight: '600'
    },
    sectionCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14
    },
    sectionCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center'
    },
    sectionHeading: {
        flex: 1,
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary
    },
    sectionBody: {
        fontSize: 13,
        color: colors.textSecondary,
        lineHeight: 20
    },
    footerBox: {
        alignItems: 'center',
        marginTop: 12,
        paddingVertical: 12
    },
    footerText: {
        fontSize: 11,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 16
    }
});
