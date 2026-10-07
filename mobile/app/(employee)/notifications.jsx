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
    FileCheck,
    Receipt,
    Clock,
    XCircle,
    Calendar
} from 'lucide-react-native';
import { colors } from '../../src/constants/colors';

export default function NotificationsScreen() {
    const router = useRouter();

    const todayNotifications = [
        {
            id: '1',
            title: 'Document Verified',
            desc: 'Your PAN card has been verified by HR.',
            time: '10 min ago',
            icon: <FileCheck size={18} color={colors.success} />,
            bg: colors.successLight
        },
        {
            id: '2',
            title: 'Payslip Generated',
            desc: 'September payslip is available.',
            time: '2 hours ago',
            icon: <Receipt size={18} color={colors.primary} />,
            bg: colors.primaryLight
        },
        {
            id: '3',
            title: 'Attendance Reminder',
            desc: "Don't forget to check out.",
            time: '5 hours ago',
            icon: <Clock size={18} color={colors.warning} />,
            bg: colors.warningLight
        }
    ];

    const yesterdayNotifications = [
        {
            id: '4',
            title: 'Document Rejected',
            desc: 'Your experience certificate has been rejected.',
            time: '1 day ago',
            icon: <XCircle size={18} color={colors.danger} />,
            bg: colors.dangerLight
        },
        {
            id: '5',
            title: 'Holiday Announcement',
            desc: 'Office will remain closed on 2nd Oct (Gandhi Jayanti).',
            time: '1 day ago',
            icon: <Calendar size={18} color={colors.success} />,
            bg: colors.successLight
        }
    ];

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Notifications</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Today Section */}
                <Text style={styles.sectionTitle}>Today</Text>
                <View style={styles.card}>
                    {todayNotifications.map((n, i) => (
                        <View
                            key={n.id}
                            style={[
                                styles.itemRow,
                                i === todayNotifications.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            <View style={[styles.iconBox, { backgroundColor: n.bg }]}>
                                {n.icon}
                            </View>
                            <View style={styles.textCol}>
                                <Text style={styles.itemTitle}>{n.title}</Text>
                                <Text style={styles.itemDesc}>{n.desc}</Text>
                                <Text style={styles.itemTime}>{n.time}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Yesterday Section */}
                <Text style={[styles.sectionTitle, { marginTop: 18 }]}>Yesterday</Text>
                <View style={styles.card}>
                    {yesterdayNotifications.map((n, i) => (
                        <View
                            key={n.id}
                            style={[
                                styles.itemRow,
                                i === yesterdayNotifications.length - 1 && { borderBottomWidth: 0 }
                            ]}
                        >
                            <View style={[styles.iconBox, { backgroundColor: n.bg }]}>
                                {n.icon}
                            </View>
                            <View style={styles.textCol}>
                                <Text style={styles.itemTitle}>{n.title}</Text>
                                <Text style={styles.itemDesc}>{n.desc}</Text>
                                <Text style={styles.itemTime}>{n.time}</Text>
                            </View>
                        </View>
                    ))}
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
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32
    },
    sectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textSecondary,
        marginBottom: 8,
        marginLeft: 4
    },
    card: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border
    },
    itemRow: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12
    },
    iconBox: {
        width: 38,
        height: 38,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2
    },
    textCol: {
        flex: 1
    },
    itemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary
    },
    itemDesc: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2,
        lineHeight: 16
    },
    itemTime: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 4,
        fontWeight: '500'
    }
});
