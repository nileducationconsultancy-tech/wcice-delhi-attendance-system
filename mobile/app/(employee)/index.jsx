import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    Alert,
    Image,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    Bell,
    CheckCircle2,
    Clock,
    Calendar,
    FolderKanban,
    ReceiptText,
    Palmtree,
    User,
    Grid,
    ChevronRight,
    LogIn,
    LogOut,
    Sparkles,
    FileCheck2,
    Shield,
    Users,
    Activity,
    CheckCircle,
    XCircle,
    Building2,
    ArrowUpRight,
    UserPlus,
    Plus
} from 'lucide-react-native';
import { useAuthStore } from '../../src/store/authStore';
import { useAttendanceStore } from '../../src/store/attendanceStore';
import { colors } from '../../src/constants/colors';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import CheckOutModal from '../../src/components/CheckOutModal';
import Avatar from '../../src/components/Avatar';
import EmployeeAttendanceModal from '../../src/components/EmployeeAttendanceModal';
import { resolveMediaUrl } from '../../src/utils/media';
import { adminApi } from '../../src/api/adminApi';

export default function EmployeeDashboard() {
    const { user } = useAuthStore();
    const {
        todayData,
        fetchTodayStatus,
        performCheckOut,
        actionLoading
    } = useAttendanceStore();

    const router = useRouter();
    const [refreshing, setRefreshing] = useState(false);
    const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
    const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);
    const [adminStats, setAdminStats] = useState(null);
    const [adminOverview, setAdminOverview] = useState(null);
    const [loadingAdmin, setLoadingAdmin] = useState(false);

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    const loadAdminData = async () => {
        if (!isAdmin) return;
        try {
            setLoadingAdmin(true);
            const [statsRes, overviewRes] = await Promise.all([
                adminApi.getDashboardStats().catch(() => null),
                adminApi.getAttendanceOverview().catch(() => null)
            ]);
            if (statsRes) setAdminStats(statsRes);
            if (overviewRes) setAdminOverview(overviewRes);
        } catch (err) {
            console.error('Failed to load admin stats:', err);
        } finally {
            setLoadingAdmin(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            loadAdminData();
        } else {
            fetchTodayStatus();
        }
    }, [isAdmin]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (isAdmin) {
            await loadAdminData();
        } else {
            await fetchTodayStatus();
        }
        setRefreshing(false);
    }, [isAdmin]);

    const employee = user?.employee || {};
    const displayName = user?.name || employee?.name || 'Employee';
    const record = todayData?.record;
    const hasCheckedIn = !!record?.firstIn;
    const hasCheckedOut = !!record?.lastOut;

    const handleConfirmCheckOut = async (coords) => {
        const res = await performCheckOut(coords);
        setCheckOutModalVisible(false);
        if (res.success) {
            Alert.alert('Workday Completed 🎉', res.message || 'Check-out recorded successfully!');
            fetchTodayStatus();
        } else {
            Alert.alert('Notice', res.error || 'Could not complete check-out.');
        }
    };

    const quickActions = [
        {
            title: 'Attendance',
            icon: <Calendar size={22} color="#1E60FF" />,
            bgColor: '#EFF6FF',
            onPress: () => router.push('/(employee)/attendance')
        },
        {
            title: 'Documents',
            icon: <FolderKanban size={22} color="#10B981" />,
            bgColor: '#ECFDF5',
            onPress: () => router.push('/(employee)/documents')
        },
        {
            title: 'Payslips',
            icon: <ReceiptText size={22} color="#8B5CF6" />,
            bgColor: '#F5F3FF',
            onPress: () => router.push('/(employee)/payslips')
        },
        {
            title: 'Holidays',
            icon: <Palmtree size={22} color="#F59E0B" />,
            bgColor: '#FFFBEB',
            onPress: () => router.push('/(employee)/holidays')
        },
        {
            title: 'Profile',
            icon: <User size={22} color="#3B82F6" />,
            bgColor: '#EFF6FF',
            onPress: () => router.push('/(employee)/profile')
        },
        {
            title: 'More',
            icon: <Grid size={22} color="#64748B" />,
            bgColor: '#F1F5F9',
            onPress: () => router.push('/(employee)/settings')
        }
    ];

    const adminQuickActions = [
        {
            title: 'Add Employee',
            icon: <UserPlus size={22} color="#1E60FF" />,
            bgColor: '#EFF6FF',
            onPress: () => router.push('/(employee)/add-employee')
        },
        {
            title: 'Attendance',
            icon: <Calendar size={22} color="#1E60FF" />,
            bgColor: '#EFF6FF',
            onPress: () => router.push('/(employee)/attendance')
        },
        {
            title: 'Documents',
            icon: <FolderKanban size={22} color="#10B981" />,
            bgColor: '#ECFDF5',
            onPress: () => router.push('/(employee)/documents')
        },
        {
            title: 'Payslips',
            icon: <ReceiptText size={22} color="#8B5CF6" />,
            bgColor: '#F5F3FF',
            onPress: () => router.push('/(employee)/payslips')
        },
        {
            title: 'Holidays',
            icon: <Palmtree size={22} color="#F59E0B" />,
            bgColor: '#FFFBEB',
            onPress: () => router.push('/(employee)/holidays')
        },
        {
            title: 'Settings',
            icon: <Grid size={22} color="#64748B" />,
            bgColor: '#F1F5F9',
            onPress: () => router.push('/(employee)/settings')
        }
    ];

    const actionsToRender = isAdmin ? adminQuickActions : quickActions;

    const totalStaff = adminStats?.metrics?.totalEmployees ?? adminOverview?.totalEmployees ?? 0;
    const checkedInStaff = adminStats?.metrics?.checkedInTotal ?? adminOverview?.records?.filter(r => r.status === 'PRESENT' || r.status === 'HALF_DAY').length ?? 0;
    const absentStaff = adminStats?.metrics?.absentToday ?? adminOverview?.records?.filter(r => r.status === 'ABSENT').length ?? 0;
    const attendanceRate = adminStats?.metrics?.attendancePercentage ?? 0;
    const staffRecords = adminOverview?.records || [];

    return (
        <SafeAreaView style={styles.safeArea}>
            <ScrollView
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={onRefresh}
                        colors={[colors.primary]}
                        tintColor={colors.primary}
                    />
                }
            >
                {/* Header Profile Section */}
                <View style={styles.header}>
                    <View style={styles.headerUserRow}>
                        <TouchableOpacity
                            onPress={() => router.push('/(employee)/profile')}
                            activeOpacity={0.8}
                        >
                            <Avatar
                                uri={user?.profilePicture || employee?.profilePicture}
                                name={displayName}
                                size={44}
                                bgColor="#1E60FF"
                                textColor="#FFFFFF"
                                borderColor="#BFDBFE"
                                borderWidth={2}
                            />
                        </TouchableOpacity>

                        <View style={styles.headerTextCol}>
                            <View style={styles.nameRow}>
                                <Text style={styles.employeeName}>{displayName}</Text>
                                {isAdmin && (
                                    <View style={styles.adminBadge}>
                                        <Shield size={10} color="#1E60FF" />
                                        <Text style={styles.adminBadgeText}>SUPER ADMIN</Text>
                                    </View>
                                )}
                            </View>
                            <Text style={styles.mottoText}>
                                {isAdmin
                                    ? 'Company Live Attendance & Monitoring'
                                    : "Let's make today productive"}
                            </Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={() => router.push('/(employee)/notifications')}
                        style={styles.notificationBtn}
                        activeOpacity={0.7}
                    >
                        <Bell size={20} color={colors.textPrimary} />
                        <View style={styles.unreadDot} />
                    </TouchableOpacity>
                </View>

                {isAdmin ? (
                    /* SUPER ADMIN LIVE MONITORING HERO CARD */
                    <>
                        <Card style={styles.adminHeroCard}>
                            <View style={styles.adminHeroHeader}>
                                <View style={styles.adminHeroHeaderLeft}>
                                    <View style={styles.livePulseDot} />
                                    <Text style={styles.adminHeroTitle}>Live Attendance Monitor</Text>
                                </View>
                                <View style={styles.adminDatePill}>
                                    <Text style={styles.adminDatePillText}>
                                        {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </Text>
                                </View>
                            </View>

                            {/* 3 Monitoring Counter Tiles */}
                            <View style={styles.adminCountersRow}>
                                <View style={[styles.adminCounterTile, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                    <Text style={[styles.adminCounterVal, { color: '#059669' }]}>
                                        {checkedInStaff}
                                    </Text>
                                    <Text style={styles.adminCounterLabel}>Present Today</Text>
                                </View>

                                <View style={[styles.adminCounterTile, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                                    <Text style={[styles.adminCounterVal, { color: '#DC2626' }]}>
                                        {absentStaff}
                                    </Text>
                                    <Text style={styles.adminCounterLabel}>Absent Today</Text>
                                </View>

                                <View style={[styles.adminCounterTile, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                                    <Text style={[styles.adminCounterVal, { color: '#1E60FF' }]}>
                                        {attendanceRate > 0 ? `${attendanceRate}%` : `${totalStaff} Staff`}
                                    </Text>
                                    <Text style={styles.adminCounterLabel}>Attendance Rate</Text>
                                </View>
                            </View>

                            <TouchableOpacity
                                style={styles.adminViewRosterBtn}
                                onPress={() => router.push('/(employee)/attendance')}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.adminViewRosterBtnText}>Open Live Attendance Roster</Text>
                                <ChevronRight size={16} color="#FFFFFF" />
                            </TouchableOpacity>
                        </Card>
                    </>
                ) : (
                    /* REGULAR EMPLOYEE HERO CARD */
                    <>
                        <Card style={styles.heroAttendanceCard}>
                            <View style={styles.heroCardHeader}>
                                <View style={styles.heroHeaderLeft}>
                                    <View
                                        style={[
                                            styles.statusIconCircle,
                                            hasCheckedIn
                                                ? styles.statusIconCircleActive
                                                : styles.statusIconCirclePending
                                        ]}
                                    >
                                        <CheckCircle2
                                            size={20}
                                            color={hasCheckedIn ? colors.success : colors.textMuted}
                                        />
                                    </View>
                                    <View>
                                        <Text style={styles.heroCardTitle}>Today's Attendance</Text>
                                        <Text style={styles.heroCardSub}>
                                            {hasCheckedIn
                                                ? `Checked in at ${record?.firstInFormatted || 'Morning'}`
                                                : 'You have not checked in yet'}
                                        </Text>
                                    </View>
                                </View>

                                <View
                                    style={[
                                        styles.statusPill,
                                        hasCheckedIn
                                            ? styles.statusPillActive
                                            : styles.statusPillPending
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.statusPillText,
                                            hasCheckedIn
                                                ? styles.statusPillTextActive
                                                : styles.statusPillTextPending
                                        ]}
                                    >
                                        {hasCheckedOut
                                            ? 'Completed'
                                            : hasCheckedIn
                                            ? '✓ Present'
                                            : 'Pending'}
                                    </Text>
                                </View>
                            </View>

                            {/* Action Button: Check In -> opens Radar Check In screen | Check Out */}
                            <View style={styles.heroActionContainer}>
                                {!hasCheckedIn ? (
                                    <Button
                                        title="Check In"
                                        onPress={() => router.push('/(employee)/checkin')}
                                        icon={<LogIn size={18} color="#FFFFFF" />}
                                        style={styles.heroCheckInBtn}
                                    />
                                ) : !hasCheckedOut ? (
                                    <Button
                                        title="Check Out"
                                        onPress={() => setCheckOutModalVisible(true)}
                                        icon={<LogOut size={18} color="#FFFFFF" />}
                                        style={styles.heroCheckOutBtn}
                                    />
                                ) : (
                                    <View style={styles.completedBadge}>
                                        <CheckCircle2 size={16} color={colors.success} />
                                        <Text style={styles.completedBadgeText}>
                                            Attendance Recorded ({record?.workingHoursFormatted || 'Done'})
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </Card>

                        {/* 3 KPI Stat Pills */}
                        <View style={styles.kpiRow}>
                            <View style={[styles.kpiPill, { borderColor: colors.successBorder, backgroundColor: colors.successLight }]}>
                                <Text style={[styles.kpiNumber, { color: colors.success }]}>18</Text>
                                <Text style={styles.kpiTitle}>Present Days</Text>
                            </View>

                            <View style={[styles.kpiPill, { borderColor: colors.primarySubtle, backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.kpiNumber, { color: colors.primary }]}>
                                    {record?.workingHoursFormatted ? '8h' : '142h'}
                                </Text>
                                <Text style={styles.kpiTitle}>Working Hours</Text>
                            </View>

                            <View style={[styles.kpiPill, { borderColor: colors.warningBorder, backgroundColor: colors.warningLight }]}>
                                <Text style={[styles.kpiNumber, { color: colors.warning }]}>2</Text>
                                <Text style={styles.kpiTitle}>Pending Docs</Text>
                            </View>
                        </View>
                    </>
                )}

                {/* Quick Actions Grid */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                        {isAdmin ? 'Admin Management Hub' : 'Quick Actions'}
                    </Text>
                    {isAdmin && (
                        <TouchableOpacity
                            onPress={() => router.push('/(employee)/add-employee')}
                            style={styles.headerAddBtn}
                            activeOpacity={0.7}
                        >
                            <UserPlus size={13} color="#1E60FF" />
                            <Text style={styles.headerAddBtnText}>+ Add Employee</Text>
                        </TouchableOpacity>
                    )}
                </View>

                <View style={styles.quickGrid}>
                    {actionsToRender.map((action, index) => (
                        <TouchableOpacity
                            key={index}
                            style={styles.gridItem}
                            onPress={action.onPress}
                            activeOpacity={0.7}
                        >
                            <View style={[styles.gridIconCircle, { backgroundColor: action.bgColor }]}>
                                {action.icon}
                            </View>
                            <Text style={styles.gridItemText}>{action.title}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                {/* Real-Time Staff Status for Admin / Recent Activity for Regular Employee */}
                {isAdmin ? (
                    <>
                        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
                            <Text style={styles.sectionTitle}>Today's Staff Status</Text>
                            <TouchableOpacity
                                onPress={() => router.push('/(employee)/attendance')}
                                activeOpacity={0.7}
                            >
                                <Text style={styles.sectionActionText}>View All ({staffRecords.length})</Text>
                            </TouchableOpacity>
                        </View>

                        {loadingAdmin && !refreshing ? (
                            <ActivityIndicator size="small" color={colors.primary} style={{ marginVertical: 20 }} />
                        ) : staffRecords.length === 0 ? (
                            <View style={styles.emptyRosterCard}>
                                <Text style={styles.emptyRosterText}>No attendance punches recorded yet today.</Text>
                            </View>
                        ) : (
                            <View style={styles.staffListCard}>
                                {staffRecords.slice(0, 5).map((emp, idx) => {
                                    const isPresent = emp.status === 'PRESENT' || emp.status === 'HALF_DAY';
                                    return (
                                        <TouchableOpacity
                                            key={emp._id || idx}
                                            style={[
                                                styles.staffRow,
                                                idx === Math.min(staffRecords.length, 5) - 1 && { borderBottomWidth: 0 }
                                            ]}
                                            onPress={() => setSelectedEmployeeForHistory(emp)}
                                            activeOpacity={0.7}
                                        >
                                            <Avatar
                                                uri={emp.profilePicture}
                                                name={emp.name}
                                                size={38}
                                                bgColor="#EFF6FF"
                                                textColor="#1E60FF"
                                                borderColor="#BFDBFE"
                                                borderWidth={1}
                                            />

                                            <View style={styles.staffInfoCol}>
                                                <Text style={styles.staffName} numberOfLines={1}>
                                                    {emp.name}
                                                </Text>
                                                <Text style={styles.staffDesignation} numberOfLines={1}>
                                                    {emp.designation || 'Staff'} • Tap for History
                                                </Text>
                                            </View>

                                            <View style={styles.staffPunchCol}>
                                                <View
                                                    style={[
                                                        styles.staffStatusBadge,
                                                        isPresent
                                                            ? styles.staffStatusPresent
                                                            : styles.staffStatusAbsent
                                                    ]}
                                                >
                                                    <Text
                                                        style={[
                                                            styles.staffStatusText,
                                                            isPresent
                                                                ? styles.staffStatusTextPresent
                                                                : styles.staffStatusTextAbsent
                                                        ]}
                                                    >
                                                        {emp.status === 'PRESENT'
                                                            ? 'Present'
                                                            : emp.status === 'HALF_DAY'
                                                            ? 'Half-Day'
                                                            : 'Not In'}
                                                    </Text>
                                                </View>
                                                {emp.firstIn && emp.firstIn !== '--:--' && (
                                                    <Text style={styles.staffPunchTime}>
                                                        In: {emp.firstIn}
                                                    </Text>
                                                )}
                                            </View>

                                            <ChevronRight size={16} color={colors.textMuted} style={{ marginLeft: 4 }} />
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </>
                ) : (
                    <>
                        <View style={[styles.sectionHeaderRow, { marginTop: 22 }]}>
                            <Text style={styles.sectionTitle}>Recent Activity</Text>
                        </View>

                        <View style={styles.activityCard}>
                            {hasCheckedIn && (
                                <View style={styles.activityItem}>
                                    <View style={[styles.activityDot, { backgroundColor: colors.success }]} />
                                    <View style={styles.activityContent}>
                                        <Text style={styles.activityTitle}>
                                            Checked in at {record?.firstInFormatted || '09:32 AM'}
                                        </Text>
                                        <Text style={styles.activityTime}>Today</Text>
                                    </View>
                                </View>
                            )}

                            <View style={styles.activityItem}>
                                <View style={[styles.activityDot, { backgroundColor: colors.primary }]} />
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>September payslip generated</Text>
                                    <Text style={styles.activityTime}>Yesterday</Text>
                                </View>
                            </View>

                            <View style={[styles.activityItem, { borderBottomWidth: 0 }]}>
                                <View style={[styles.activityDot, { backgroundColor: colors.warning }]} />
                                <View style={styles.activityContent}>
                                    <Text style={styles.activityTitle}>Identity document submitted</Text>
                                    <Text style={styles.activityTime}>2 days ago</Text>
                                </View>
                            </View>
                        </View>
                    </>
                )}
            </ScrollView>

            {/* Super Admin Employee Attendance History Full Modal */}
            {isAdmin && (
                <EmployeeAttendanceModal
                    visible={!!selectedEmployeeForHistory}
                    employee={selectedEmployeeForHistory}
                    onClose={() => setSelectedEmployeeForHistory(null)}
                />
            )}

            {/* Custom Interactive Check-Out Confirmation Modal for regular employees */}
            {!isAdmin && (
                <CheckOutModal
                    visible={checkOutModalVisible}
                    onClose={() => setCheckOutModalVisible(false)}
                    onConfirm={handleConfirmCheckOut}
                    loading={actionLoading}
                    record={record}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    scrollContent: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 18
    },
    headerUserRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        flexWrap: 'wrap'
    },
    adminBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    adminBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#1E60FF',
        letterSpacing: 0.5
    },
    adminHeroCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderColor: colors.border,
        borderWidth: 1,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 10,
        elevation: 2
    },
    adminHeroHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    adminHeroHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8
    },
    livePulseDot: {
        width: 10,
        height: 10,
        borderRadius: 5,
        backgroundColor: colors.success
    },
    adminHeroTitle: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary
    },
    adminDatePill: {
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    adminDatePillText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary
    },
    adminCountersRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 14
    },
    adminCounterTile: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 14,
        borderWidth: 1,
        alignItems: 'center'
    },
    adminCounterVal: {
        fontSize: 18,
        fontWeight: '800',
        marginBottom: 2
    },
    adminCounterLabel: {
        fontSize: 10,
        color: colors.textSecondary,
        fontWeight: '600'
    },
    adminViewRosterBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingVertical: 12,
        borderRadius: 12
    },
    adminViewRosterBtnText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontWeight: '700'
    },
    staffListCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 14,
        borderColor: colors.border,
        borderWidth: 1
    },
    staffRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    staffAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    staffAvatarText: {
        color: '#1E60FF',
        fontSize: 14,
        fontWeight: '700'
    },
    staffInfoCol: {
        flex: 1
    },
    staffName: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary
    },
    staffDesignation: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 1
    },
    staffPunchCol: {
        alignItems: 'flex-end'
    },
    staffStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        marginBottom: 2
    },
    staffStatusPresent: {
        backgroundColor: '#ECFDF5'
    },
    staffStatusAbsent: {
        backgroundColor: '#FEF2F2'
    },
    staffStatusText: {
        fontSize: 11,
        fontWeight: '700'
    },
    staffStatusTextPresent: {
        color: '#059669'
    },
    staffStatusTextAbsent: {
        color: '#DC2626'
    },
    staffPunchTime: {
        fontSize: 10,
        color: colors.textMuted
    },
    emptyRosterCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 20,
        alignItems: 'center',
        borderColor: colors.border,
        borderWidth: 1
    },
    emptyRosterText: {
        fontSize: 13,
        color: colors.textSecondary
    },
    sectionActionText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '700'
    },
    avatarCircle: {
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
        elevation: 3,
        overflow: 'hidden'
    },
    avatarImg: {
        width: 46,
        height: 46,
        borderRadius: 23
    },
    avatarInitials: {
        color: '#FFFFFF',
        fontSize: 17,
        fontWeight: '800'
    },
    headerTextCol: {
        justifyContent: 'center'
    },
    greetingText: {
        fontSize: 12,
        color: colors.textSecondary,
        fontWeight: '500'
    },
    employeeName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 1
    },
    mottoText: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 1
    },
    notificationBtn: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative'
    },
    unreadDot: {
        position: 'absolute',
        top: 9,
        right: 9,
        width: 7,
        height: 7,
        borderRadius: 3.5,
        backgroundColor: colors.danger
    },
    heroAttendanceCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 18,
        marginBottom: 16,
        borderColor: colors.border,
        borderWidth: 1
    },
    heroCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    heroHeaderLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1
    },
    statusIconCircle: {
        width: 38,
        height: 38,
        borderRadius: 19,
        alignItems: 'center',
        justifyContent: 'center'
    },
    statusIconCircleActive: {
        backgroundColor: colors.successLight
    },
    statusIconCirclePending: {
        backgroundColor: colors.surfaceSubtle
    },
    heroCardTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary
    },
    heroCardSub: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    statusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12
    },
    statusPillActive: {
        backgroundColor: colors.successLight
    },
    statusPillPending: {
        backgroundColor: colors.surfaceSubtle
    },
    statusPillText: {
        fontSize: 11,
        fontWeight: '700'
    },
    statusPillTextActive: {
        color: colors.success
    },
    statusPillTextPending: {
        color: colors.textSecondary
    },
    heroActionContainer: {
        marginTop: 14
    },
    heroCheckInBtn: {
        backgroundColor: colors.primary,
        height: 44,
        borderRadius: 12
    },
    heroCheckOutBtn: {
        backgroundColor: colors.primary,
        height: 44,
        borderRadius: 12
    },
    completedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.successLight,
        paddingVertical: 10,
        borderRadius: 12,
        gap: 6,
        borderWidth: 1,
        borderColor: colors.successBorder
    },
    completedBadgeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.success
    },
    kpiRow: {
        flexDirection: 'row',
        gap: 10,
        marginBottom: 20
    },
    kpiPill: {
        flex: 1,
        borderRadius: 16,
        paddingVertical: 12,
        paddingHorizontal: 8,
        alignItems: 'center',
        borderWidth: 1
    },
    kpiNumber: {
        fontSize: 18,
        fontWeight: '800'
    },
    kpiTitle: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 2
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary
    },
    headerAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        paddingHorizontal: 10,
        paddingVertical: 5,
        borderRadius: 8
    },
    headerAddBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#1E60FF'
    },
    quickGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        gap: 10
    },
    gridItem: {
        width: '31%',
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingVertical: 14,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    gridIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 14,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 8
    },
    gridItemText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textPrimary
    },
    activityCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        paddingHorizontal: 16,
        borderWidth: 1,
        borderColor: colors.border
    },
    activityItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        gap: 12
    },
    activityDot: {
        width: 8,
        height: 8,
        borderRadius: 4
    },
    activityContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    activityTitle: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary
    },
    activityTime: {
        fontSize: 11,
        color: colors.textMuted
    }
});
