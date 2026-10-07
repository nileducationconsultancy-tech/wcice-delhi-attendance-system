import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
    Calendar as CalendarIcon,
    CheckCircle2,
    Clock,
    ChevronLeft,
    ChevronRight,
    SlidersHorizontal,
    LogIn,
    LogOut,
    CalendarDays,
    Search,
    Shield,
    MapPin,
    Users,
    X,
    Building2,
    Sparkles,
    UserPlus
} from 'lucide-react-native';
import { colors } from '../../src/constants/colors';
import { useAttendanceStore } from '../../src/store/attendanceStore';
import { useAuthStore } from '../../src/store/authStore';
import attendanceApi from '../../src/api/attendanceApi';
import adminApi from '../../src/api/adminApi';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import CheckOutModal from '../../src/components/CheckOutModal';
import EmployeeAttendanceModal from '../../src/components/EmployeeAttendanceModal';
import Avatar from '../../src/components/Avatar';
import { TextInput } from 'react-native';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEK_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function AttendanceScreen() {
    const router = useRouter();
    const params = useLocalSearchParams();
    const { user } = useAuthStore();
    const { todayData, fetchTodayStatus, performCheckOut, actionLoading } = useAttendanceStore();

    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const [selectedDate, setSelectedDate] = useState(today.getDate());
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [attendanceData, setAttendanceData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [viewMode, setViewMode] = useState('weekly'); // 'weekly' or 'monthly'
    const [checkOutModalVisible, setCheckOutModalVisible] = useState(false);
    const [selectedEmployeeForHistory, setSelectedEmployeeForHistory] = useState(null);

    // Employee Specific State
    const [empFilterTab, setEmpFilterTab] = useState('ALL'); // 'ALL' | 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'HOLIDAY_OFF'
    const [empSearchQuery, setEmpSearchQuery] = useState('');

    // Admin Specific State
    const [adminDate, setAdminDate] = useState(todayStr);
    const [adminOverview, setAdminOverview] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT' | 'HALF_DAY'

    const handlePrevMonth = () => {
        if (month === 1) {
            setMonth(12);
            setYear(prev => prev - 1);
        } else {
            setMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            setMonth(1);
            setYear(prev => prev + 1);
        } else {
            setMonth(prev => prev + 1);
        }
    };

    const handleConfirmCheckOut = async (coords) => {
        const res = await performCheckOut(coords);
        setCheckOutModalVisible(false);
        if (res.success) {
            Alert.alert('Workday Completed 🎉', res.message || 'Check-out completed!');
            fetchTodayStatus();
            fetchHistory();
        } else {
            Alert.alert('Notice', res.error || 'Could not complete check-out.');
        }
    };

    const fetchAdminOverview = async (date) => {
        try {
            setLoading(true);
            const data = await adminApi.getAttendanceOverview(date);
            setAdminOverview(data);
        } catch (err) {
            console.error('Failed to load admin attendance overview:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const data = await attendanceApi.getMyAttendance(year, month);
            setAttendanceData(data);
        } catch (error) {
            console.error('Failed to load attendance:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (params.employeeId) {
            setSelectedEmployeeForHistory({
                _id: params.employeeId,
                name: params.employeeName || 'Employee'
            });
        }
    }, [params.employeeId, params.employeeName]);

    useEffect(() => {
        if (isAdmin) {
            fetchAdminOverview(adminDate);
        } else {
            fetchTodayStatus();
            fetchHistory();
        }
    }, [isAdmin, adminDate, year, month]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        if (isAdmin) {
            await fetchAdminOverview(adminDate);
        } else {
            await Promise.all([fetchTodayStatus(), fetchHistory()]);
        }
        setRefreshing(false);
    }, [isAdmin, adminDate, year, month]);

    const changeAdminDate = (daysOffset) => {
        const current = new Date(adminDate);
        current.setDate(current.getDate() + daysOffset);
        setAdminDate(current.toISOString().split('T')[0]);
    };

    const record = todayData?.record;
    const hasCheckedIn = !!record?.firstIn;
    const hasCheckedOut = !!record?.lastOut;

    // Admin filtering
    const rawRecords = adminOverview?.records || [];
    const presentCount = rawRecords.filter(r => r.status === 'PRESENT').length;
    const halfDayCount = rawRecords.filter(r => r.status === 'HALF_DAY').length;
    const absentCount = rawRecords.filter(r => r.status === 'ABSENT' || r.status === 'NOT_CHECKED_IN').length;

    const filteredAdminRecords = rawRecords.filter(emp => {
        const query = searchQuery.toLowerCase().trim();
        const matchSearch =
            query === '' ||
            emp.name?.toLowerCase().includes(query) ||
            emp.designation?.toLowerCase().includes(query) ||
            String(emp.employeeId || '').toLowerCase().includes(query);

        if (!matchSearch) return false;

        if (filterTab === 'PRESENT') return emp.status === 'PRESENT';
        if (filterTab === 'HALF_DAY') return emp.status === 'HALF_DAY';
        if (filterTab === 'ABSENT') return emp.status === 'ABSENT' || emp.status === 'NOT_CHECKED_IN';
        return true;
    });

    // Generate weekly date strip around today
    const currentDayOfWeek = today.getDay(); // 0 is Sunday
    const startOfWeek = new Date(today);
    const dayDiff = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    startOfWeek.setDate(today.getDate() + dayDiff);

    const weekDaysArray = Array.from({ length: 7 }).map((_, index) => {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + index);
        return {
            dayName: WEEK_DAYS[index],
            dayNumber: d.getDate(),
            isToday: d.toDateString() === today.toDateString(),
            dateString: d.toISOString().split('T')[0]
        };
    });

    const summary = attendanceData?.summary || {
        presentDays: 18,
        absentDays: 1,
        halfDays: 1,
        totalWorkingDays: 22
    };

    const history = attendanceData?.history || [];

    const empPresentCount = history.filter(h => h.status === 'PRESENT').length;
    const empHalfDayCount = history.filter(h => h.status === 'HALF_DAY' || h.status === 'LATE').length;
    const empAbsentCount = history.filter(h => h.status === 'ABSENT' || h.status === 'NOT_CHECKED_IN').length;
    const empOffCount = history.filter(h => h.status === 'HOLIDAY' || h.status === 'SUNDAY' || h.status === 'WEEKLY_OFF').length;

    const filteredEmployeeHistory = history.filter(item => {
        const query = empSearchQuery.toLowerCase().trim();
        const matchQuery =
            query === '' ||
            (item.date && item.date.toLowerCase().includes(query)) ||
            (item.dayOfWeek && item.dayOfWeek.toLowerCase().includes(query)) ||
            (item.holidayName && item.holidayName.toLowerCase().includes(query)) ||
            (item.status && item.status.toLowerCase().includes(query));

        if (!matchQuery) return false;

        if (empFilterTab === 'PRESENT') return item.status === 'PRESENT';
        if (empFilterTab === 'HALF_DAY') return item.status === 'HALF_DAY' || item.status === 'LATE';
        if (empFilterTab === 'ABSENT') return item.status === 'ABSENT' || item.status === 'NOT_CHECKED_IN';
        if (empFilterTab === 'HOLIDAY_OFF') return item.status === 'HOLIDAY' || item.status === 'SUNDAY' || item.status === 'WEEKLY_OFF';
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PRESENT':
                return { label: 'Present', bg: colors.successLight, text: colors.success };
            case 'HALF_DAY':
            case 'LATE':
                return { label: 'Half-Day', bg: colors.warningLight, text: colors.warning };
            case 'ABSENT':
            case 'NOT_CHECKED_IN':
                return { label: 'Absent', bg: colors.dangerLight, text: colors.danger };
            case 'HOLIDAY':
                return { label: 'Holiday', bg: colors.purpleLight, text: colors.purple };
            case 'SUNDAY':
            case 'WEEKLY_OFF':
                return { label: 'Off Day', bg: colors.surfaceSubtle, text: colors.textSecondary };
            default:
                return { label: status || 'Pending', bg: colors.surfaceSubtle, text: colors.textSecondary };
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View style={styles.headerLeftCol}>
                    <Text style={styles.headerTitle}>
                        {isAdmin ? 'Attendance Monitor' : 'Attendance'}
                    </Text>
                    {isAdmin && (
                        <View style={styles.adminLiveIndicator}>
                            <View style={styles.liveGreenDot} />
                            <Text style={styles.adminLiveText}>Live Company Monitor</Text>
                        </View>
                    )}
                </View>

                {isAdmin ? (
                    <TouchableOpacity
                        onPress={() => router.push('/(employee)/add-employee')}
                        style={styles.adminAddEmployeeHeaderBtn}
                        activeOpacity={0.7}
                    >
                        <UserPlus size={14} color="#FFFFFF" />
                        <Text style={styles.adminAddEmployeeHeaderBtnText}>+ Add Employee</Text>
                    </TouchableOpacity>
                ) : (
                    <TouchableOpacity
                        onPress={() => setViewMode(viewMode === 'weekly' ? 'monthly' : 'weekly')}
                        style={styles.toggleModeBtn}
                        activeOpacity={0.7}
                    >
                        <CalendarDays size={18} color={colors.primary} />
                        <Text style={styles.toggleModeText}>
                            {viewMode === 'weekly' ? 'Month View' : 'Week View'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
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
                {isAdmin ? (
                    /* ================= SUPER ADMIN LIVE MONITOR VIEW ================= */
                    <>
                        {/* Date Navigation Bar */}
                        <View style={styles.adminDateBar}>
                            <TouchableOpacity
                                onPress={() => changeAdminDate(-1)}
                                style={styles.adminNavBtn}
                                activeOpacity={0.7}
                            >
                                <ChevronLeft size={18} color={colors.textPrimary} />
                            </TouchableOpacity>

                            <View style={styles.adminDateCenter}>
                                <Text style={styles.adminDateCenterText}>
                                    {new Date(adminDate).toLocaleDateString('en-US', {
                                        weekday: 'short',
                                        month: 'short',
                                        day: 'numeric',
                                        year: 'numeric'
                                    })}
                                </Text>
                            </View>

                            <TouchableOpacity
                                onPress={() => changeAdminDate(1)}
                                style={styles.adminNavBtn}
                                activeOpacity={0.7}
                            >
                                <ChevronRight size={18} color={colors.textPrimary} />
                            </TouchableOpacity>

                            {adminDate !== todayStr && (
                                <TouchableOpacity
                                    onPress={() => setAdminDate(todayStr)}
                                    style={styles.todayQuickBtn}
                                    activeOpacity={0.7}
                                >
                                    <Text style={styles.todayQuickBtnText}>Today</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* 4 Stats Cards Strip */}
                        <View style={styles.adminSummaryStrip}>
                            <View style={[styles.adminStatBox, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE' }]}>
                                <Text style={[styles.adminStatVal, { color: '#1E60FF' }]}>
                                    {rawRecords.length}
                                </Text>
                                <Text style={styles.adminStatLbl}>Total Staff</Text>
                            </View>

                            <View style={[styles.adminStatBox, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}>
                                <Text style={[styles.adminStatVal, { color: '#059669' }]}>
                                    {presentCount}
                                </Text>
                                <Text style={styles.adminStatLbl}>Present</Text>
                            </View>

                            <View style={[styles.adminStatBox, { backgroundColor: '#FEF2F2', borderColor: '#FECACA' }]}>
                                <Text style={[styles.adminStatVal, { color: '#DC2626' }]}>
                                    {absentCount}
                                </Text>
                                <Text style={styles.adminStatLbl}>Absent</Text>
                            </View>

                            <View style={[styles.adminStatBox, { backgroundColor: '#FFFBEB', borderColor: '#FDE68A' }]}>
                                <Text style={[styles.adminStatVal, { color: '#D97706' }]}>
                                    {halfDayCount}
                                </Text>
                                <Text style={styles.adminStatLbl}>Half-Day</Text>
                            </View>
                        </View>

                        {/* Search Input */}
                        <View style={styles.searchContainer}>
                            <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by staff name or ID..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                            />
                        </View>

                        {/* Filter Tabs */}
                        <View style={styles.filterTabsRow}>
                            {[
                                { id: 'ALL', label: `All (${rawRecords.length})` },
                                { id: 'PRESENT', label: `Present (${presentCount})` },
                                { id: 'ABSENT', label: `Absent (${absentCount})` },
                                { id: 'HALF_DAY', label: `Half-Day (${halfDayCount})` }
                            ].map(tab => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[
                                        styles.filterPill,
                                        filterTab === tab.id && styles.filterPillActive
                                    ]}
                                    onPress={() => setFilterTab(tab.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.filterPillText,
                                            filterTab === tab.id && styles.filterPillTextActive
                                        ]}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* Staff Roster Cards */}
                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
                        ) : filteredAdminRecords.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <Users size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyCardText}>No staff records found for this filter.</Text>
                            </View>
                        ) : (
                            <View style={styles.adminRosterList}>
                                {filteredAdminRecords.map((emp, index) => {
                                    const badge = getStatusBadge(emp.status);
                                    const hasIn = emp.firstIn && emp.firstIn !== '--:--';
                                    const hasOut = emp.lastOut && emp.lastOut !== '--:--';

                                    return (
                                        <TouchableOpacity
                                            key={emp._id || index}
                                            onPress={() => setSelectedEmployeeForHistory(emp)}
                                            activeOpacity={0.7}
                                        >
                                            <Card style={styles.adminEmpCard}>
                                                {/* Top Employee Row */}
                                                <View style={styles.adminEmpTopRow}>
                                                    <Avatar
                                                        uri={emp.profilePicture}
                                                        name={emp.name}
                                                        size={40}
                                                        bgColor="#EFF6FF"
                                                        textColor="#1E60FF"
                                                        borderColor="#BFDBFE"
                                                        borderWidth={1}
                                                    />

                                                    <View style={styles.adminEmpMeta}>
                                                        <Text style={styles.adminEmpName}>{emp.name}</Text>
                                                        <Text style={styles.adminEmpSub}>
                                                            {emp.designation || 'Staff'} • {emp.employeeId || 'ID'}
                                                        </Text>
                                                    </View>

                                                    <View style={[styles.adminStatusBadge, { backgroundColor: badge.bg }]}>
                                                        <Text style={[styles.adminStatusBadgeText, { color: badge.text }]}>
                                                            {badge.label}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Punch Details Strip */}
                                                <View style={styles.adminPunchStrip}>
                                                    <View style={styles.adminPunchCol}>
                                                        <Text style={styles.adminPunchLabel}>PUNCH IN</Text>
                                                        <Text style={[styles.adminPunchVal, hasIn && { color: colors.success }]}>
                                                            {hasIn ? emp.firstIn : '--:--'}
                                                        </Text>
                                                        {emp.checkInAddress ? (
                                                            <Text style={styles.adminAddressText} numberOfLines={1}>
                                                                📍 {emp.checkInAddress}
                                                            </Text>
                                                        ) : null}
                                                    </View>

                                                    <View style={styles.adminPunchDivider} />

                                                    <View style={styles.adminPunchCol}>
                                                        <Text style={styles.adminPunchLabel}>PUNCH OUT</Text>
                                                        <Text style={[styles.adminPunchVal, hasOut && { color: colors.primary }]}>
                                                            {hasOut ? emp.lastOut : '--:--'}
                                                        </Text>
                                                        {emp.checkOutAddress ? (
                                                            <Text style={styles.adminAddressText} numberOfLines={1}>
                                                                📍 {emp.checkOutAddress}
                                                            </Text>
                                                        ) : null}
                                                    </View>

                                                    <View style={styles.adminPunchDivider} />

                                                    <View style={styles.adminPunchCol}>
                                                        <Text style={styles.adminPunchLabel}>TOTAL</Text>
                                                        <Text style={styles.adminPunchVal}>
                                                            {emp.workingHours || '0h 0m'}
                                                        </Text>
                                                    </View>
                                                </View>

                                                {/* Action Bar Footer */}
                                                <View style={styles.adminCardActionFooter}>
                                                    <Text style={styles.adminCardActionText}>Tap to view complete attendance history</Text>
                                                    <ChevronRight size={14} color="#1E60FF" />
                                                </View>
                                            </Card>
                                        </TouchableOpacity>
                                    );
                                })}
                            </View>
                        )}
                    </>
                ) : (
                    /* ================= REGULAR EMPLOYEE VIEW ================= */
                    <>
                        {/* Month Selector Title */}
                        <View style={styles.monthHeaderRow}>
                            <TouchableOpacity
                                onPress={handlePrevMonth}
                                style={styles.navBtn}
                                activeOpacity={0.7}
                            >
                                <ChevronLeft size={18} color={colors.textPrimary} />
                            </TouchableOpacity>

                            <View style={styles.monthCenterCol}>
                                <Text style={styles.monthTitle}>
                                    {MONTH_NAMES[month - 1]} {year}
                                </Text>
                                {(year !== today.getFullYear() || month !== today.getMonth() + 1) && (
                                    <TouchableOpacity
                                        onPress={() => {
                                            setYear(today.getFullYear());
                                            setMonth(today.getMonth() + 1);
                                        }}
                                        style={styles.jumpCurrentMonthBtn}
                                    >
                                        <Text style={styles.jumpCurrentMonthText}>Current Month</Text>
                                    </TouchableOpacity>
                                )}
                            </View>

                            <TouchableOpacity
                                onPress={handleNextMonth}
                                style={styles.navBtn}
                                activeOpacity={0.7}
                            >
                                <ChevronRight size={18} color={colors.textPrimary} />
                            </TouchableOpacity>
                        </View>

                        {/* Summary KPI Cards Grid */}
                        <View style={styles.monthlySummaryGrid}>
                            <View style={[styles.summaryItem, { borderColor: colors.successBorder, backgroundColor: colors.successLight }]}>
                                <Text style={[styles.summaryVal, { color: colors.success }]}>
                                    {summary.presentDays || 0}
                                </Text>
                                <Text style={styles.summaryLbl}>Present</Text>
                            </View>
                            <View style={[styles.summaryItem, { borderColor: colors.warningBorder, backgroundColor: colors.warningLight }]}>
                                <Text style={[styles.summaryVal, { color: colors.warning }]}>
                                    {summary.halfDays || 0}
                                </Text>
                                <Text style={styles.summaryLbl}>Half-Day</Text>
                            </View>
                            <View style={[styles.summaryItem, { borderColor: colors.dangerBorder, backgroundColor: colors.dangerLight }]}>
                                <Text style={[styles.summaryVal, { color: colors.danger }]}>
                                    {summary.absentDays || 0}
                                </Text>
                                <Text style={styles.summaryLbl}>Absent</Text>
                            </View>
                            <View style={[styles.summaryItem, { borderColor: colors.primarySubtle, backgroundColor: colors.primaryLight }]}>
                                <Text style={[styles.summaryVal, { color: colors.primary }]}>
                                    {summary.paidDays || summary.presentDays || 0} / {summary.totalWorkingDays || 22}
                                </Text>
                                <Text style={styles.summaryLbl}>Paid Days</Text>
                            </View>
                        </View>

                        {/* Today Live Punch Card with GPS Location */}
                        <Card style={styles.todayCard}>
                            <View style={styles.todayHeaderRow}>
                                <Text style={styles.todayCardTitle}>Today's Shift & Punch</Text>
                                <View
                                    style={[
                                        styles.todayStatusPill,
                                        hasCheckedOut
                                            ? styles.paidBadge
                                            : hasCheckedIn
                                            ? styles.generatedBadge
                                            : styles.absentPill
                                    ]}
                                >
                                    <Text
                                        style={[
                                            styles.todayStatusPillText,
                                            hasCheckedOut
                                                ? styles.paidBadgeText
                                                : hasCheckedIn
                                                ? styles.generatedBadgeText
                                                : styles.absentPillText
                                        ]}
                                    >
                                        {hasCheckedOut
                                            ? 'Workday Completed ✓'
                                            : hasCheckedIn
                                            ? 'Checked In ⚡'
                                            : 'Not Checked In'}
                                    </Text>
                                </View>
                            </View>

                            {/* Punch in/out details strip */}
                            <View style={styles.todayPunchStrip}>
                                <View style={styles.todayPunchCol}>
                                    <Text style={styles.todayPunchColLabel}>PUNCH IN</Text>
                                    <Text style={[styles.todayPunchColVal, hasCheckedIn && { color: colors.success }]}>
                                        {record?.firstInFormatted || '--:--'}
                                    </Text>
                                    {record?.checkInAddress ? (
                                        <Text style={styles.todayAddressText} numberOfLines={1}>
                                            📍 {record.checkInAddress}
                                        </Text>
                                    ) : null}
                                </View>

                                <View style={styles.adminPunchDivider} />

                                <View style={styles.todayPunchCol}>
                                    <Text style={styles.todayPunchColLabel}>PUNCH OUT</Text>
                                    <Text style={[styles.todayPunchColVal, hasCheckedOut && { color: colors.primary }]}>
                                        {record?.lastOutFormatted || '--:--'}
                                    </Text>
                                    {record?.checkOutAddress ? (
                                        <Text style={styles.todayAddressText} numberOfLines={1}>
                                            📍 {record.checkOutAddress}
                                        </Text>
                                    ) : null}
                                </View>

                                <View style={styles.adminPunchDivider} />

                                <View style={styles.todayPunchCol}>
                                    <Text style={styles.todayPunchColLabel}>WORKING TIME</Text>
                                    <Text style={styles.todayPunchColVal}>
                                        {record?.workingHoursFormatted || '0h 0m'}
                                    </Text>
                                </View>
                            </View>

                            {/* Check In / Out CTA */}
                            <View style={styles.todayActionRow}>
                                {!hasCheckedIn ? (
                                    <Button
                                        title="Check In with GPS"
                                        onPress={() => router.push('/(employee)/checkin')}
                                        icon={<LogIn size={18} color="#FFFFFF" />}
                                        style={styles.todayCta}
                                    />
                                ) : !hasCheckedOut ? (
                                    <Button
                                        title="Check Out & Complete Shift"
                                        onPress={() => setCheckOutModalVisible(true)}
                                        icon={<LogOut size={18} color="#FFFFFF" />}
                                        style={[styles.todayCta, { backgroundColor: '#2563EB' }]}
                                    />
                                ) : (
                                    <View style={styles.doneBadge}>
                                        <CheckCircle2 size={16} color={colors.success} />
                                        <Text style={styles.doneBadgeText}>
                                            Today's Shift Successfully Completed ({record?.workingHoursFormatted || 'Done'})
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </Card>

                        {/* Full Monthly Breakdown Section */}
                        <View style={styles.sectionHeaderRow}>
                            <Text style={styles.sectionTitle}>Monthly Attendance Log</Text>
                            <Text style={styles.sectionCount}>
                                {filteredEmployeeHistory.length} of {history.length} days
                            </Text>
                        </View>

                        {/* Search Input for Employee History */}
                        <View style={styles.searchContainer}>
                            <Search size={18} color={colors.textMuted} style={styles.searchIcon} />
                            <TextInput
                                style={styles.searchInput}
                                placeholder="Search by date, day, or holiday..."
                                placeholderTextColor={colors.textMuted}
                                value={empSearchQuery}
                                onChangeText={setEmpSearchQuery}
                            />
                            {empSearchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setEmpSearchQuery('')}>
                                    <X size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Filter Tabs Row for Employee */}
                        <View style={styles.filterTabsRow}>
                            {[
                                { id: 'ALL', label: `All (${history.length})` },
                                { id: 'PRESENT', label: `Present (${empPresentCount})` },
                                { id: 'HALF_DAY', label: `Half-Day (${empHalfDayCount})` },
                                { id: 'ABSENT', label: `Absent (${empAbsentCount})` },
                                { id: 'HOLIDAY_OFF', label: `Off/Holidays (${empOffCount})` }
                            ].map(tab => (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[
                                        styles.filterPill,
                                        empFilterTab === tab.id && styles.filterPillActive
                                    ]}
                                    onPress={() => setEmpFilterTab(tab.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.filterPillText,
                                            empFilterTab === tab.id && styles.filterPillTextActive
                                        ]}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        {/* All Monthly Days History Cards */}
                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
                        ) : filteredEmployeeHistory.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <CalendarDays size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyCardText}>No attendance records matching this filter.</Text>
                            </View>
                        ) : (
                            <View style={styles.empHistoryList}>
                                {filteredEmployeeHistory.map((log, index) => {
                                    const badge = getStatusBadge(log.status);
                                    const hasIn = log.checkIn && log.checkIn !== '--:--';
                                    const hasOut = log.checkOut && log.checkOut !== '--:--';
                                    const dateObj = log.date ? new Date(log.date) : null;
                                    const dayNum = dateObj ? dateObj.getDate() : '';
                                    const monthShort = dateObj ? dateObj.toLocaleDateString('en-US', { month: 'short' }) : '';

                                    return (
                                        <Card key={log.date || index} style={styles.empDayCard}>
                                            <View style={styles.empDayTopRow}>
                                                {/* Date Circle */}
                                                <View style={styles.empDateBox}>
                                                    <Text style={styles.empDateDayNum}>{dayNum}</Text>
                                                    <Text style={styles.empDateMonthStr}>{monthShort}</Text>
                                                </View>

                                                {/* Middle Meta */}
                                                <View style={styles.empDayMeta}>
                                                    <View style={styles.empDayTitleRow}>
                                                        <Text style={styles.empDayWeekday}>
                                                            {log.dayOfWeek || (dateObj ? dateObj.toLocaleDateString('en-US', { weekday: 'short' }) : 'Day')}
                                                        </Text>
                                                        <View style={[styles.empStatusPill, { backgroundColor: badge.bg }]}>
                                                            <Text style={[styles.empStatusPillText, { color: badge.text }]}>
                                                                {badge.label}
                                                            </Text>
                                                        </View>
                                                    </View>

                                                    {log.holidayName ? (
                                                        <Text style={styles.empHolidayTagText} numberOfLines={1}>
                                                            🎉 {log.holidayName} {log.isFestivalWorkingDay ? '• Working Day' : ''}
                                                        </Text>
                                                    ) : (
                                                        <Text style={styles.empPunchTimesSummary}>
                                                            {hasIn ? `In: ${log.checkIn}` : 'No punch in'} {hasOut ? `• Out: ${log.checkOut}` : ''}
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* Right: Working Hours */}
                                                <View style={styles.empDurationCol}>
                                                    <Text style={styles.empDurationLabel}>HOURS</Text>
                                                    <Text style={styles.empDurationVal}>
                                                        {log.workingHours || '0h 0m'}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Location Details (if present) */}
                                            {(log.checkInAddress || log.checkOutAddress) && (
                                                <View style={styles.empLocationDetailsBox}>
                                                    {log.checkInAddress ? (
                                                        <Text style={styles.empLocationText} numberOfLines={1}>
                                                            📍 In: {log.checkInAddress}
                                                        </Text>
                                                    ) : null}
                                                    {log.checkOutAddress ? (
                                                        <Text style={styles.empLocationText} numberOfLines={1}>
                                                            📍 Out: {log.checkOutAddress}
                                                        </Text>
                                                    ) : null}
                                                </View>
                                            )}
                                        </Card>
                                    );
                                })}
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            {/* Modal for Super Admin to view specific employee full attendance history */}
            {isAdmin && (
                <EmployeeAttendanceModal
                    visible={!!selectedEmployeeForHistory}
                    employee={selectedEmployeeForHistory}
                    onClose={() => setSelectedEmployeeForHistory(null)}
                />
            )}

            {/* Modal for regular employee */}
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
    adminCardActionFooter: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight
    },
    adminCardActionText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary
    },
    safeArea: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        backgroundColor: colors.surface,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    headerLeftCol: {
        justifyContent: 'center'
    },
    adminLiveIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 2
    },
    liveGreenDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.success
    },
    adminLiveText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.success
    },
    adminAddEmployeeHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: 10,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 2
    },
    adminAddEmployeeHeaderBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#FFFFFF'
    },
    adminDateBar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 8,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 14
    },
    adminNavBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    adminDateCenter: {
        flex: 1,
        alignItems: 'center'
    },
    adminDateCenterText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary
    },
    todayQuickBtn: {
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8,
        marginLeft: 6
    },
    todayQuickBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary
    },
    adminSummaryStrip: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 14
    },
    adminStatBox: {
        flex: 1,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 6,
        borderWidth: 1,
        alignItems: 'center'
    },
    adminStatVal: {
        fontSize: 16,
        fontWeight: '800'
    },
    adminStatLbl: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 2
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        marginBottom: 12
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        height: 42,
        fontSize: 13,
        color: colors.textPrimary
    },
    filterTabsRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16,
        flexWrap: 'wrap'
    },
    filterPill: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border
    },
    filterPillActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary
    },
    filterPillText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.textSecondary
    },
    filterPillTextActive: {
        color: '#FFFFFF'
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    emptyCardText: {
        fontSize: 13,
        color: colors.textSecondary
    },
    adminRosterList: {
        gap: 12
    },
    adminEmpCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border
    },
    adminEmpTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    adminEmpAvatar: {
        width: 38,
        height: 38,
        borderRadius: 19,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 10
    },
    adminEmpAvatarText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E60FF'
    },
    adminEmpMeta: {
        flex: 1
    },
    adminEmpName: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textPrimary
    },
    adminEmpSub: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 1
    },
    adminStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8
    },
    adminStatusBadgeText: {
        fontSize: 11,
        fontWeight: '700'
    },
    adminPunchStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 10
    },
    adminPunchCol: {
        flex: 1
    },
    adminPunchLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted,
        marginBottom: 2
    },
    adminPunchVal: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textPrimary
    },
    adminAddressText: {
        fontSize: 9,
        color: colors.textSecondary,
        marginTop: 2
    },
    adminPunchDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
        marginHorizontal: 8
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    toggleModeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 10,
        backgroundColor: colors.primaryLight
    },
    toggleModeText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32
    },
    monthHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14
    },
    navBtn: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: colors.surface,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    monthTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary
    },
    weekStripContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 16
    },
    dayColumn: {
        alignItems: 'center',
        paddingVertical: 6,
        paddingHorizontal: 4,
        borderRadius: 12
    },
    dayColumnSelected: {
        backgroundColor: colors.primaryLight
    },
    weekDayName: {
        fontSize: 11,
        color: colors.textMuted,
        fontWeight: '600',
        marginBottom: 4
    },
    weekDayNameSelected: {
        color: colors.primary,
        fontWeight: '700'
    },
    dayNumberCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dayNumberCircleSelected: {
        backgroundColor: colors.primary
    },
    dayNumberText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    dayNumberTextSelected: {
        color: '#FFFFFF'
    },
    monthlySummaryGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16
    },
    summaryItem: {
        flex: 1,
        borderRadius: 12,
        padding: 10,
        alignItems: 'center',
        borderWidth: 1
    },
    summaryVal: {
        fontSize: 16,
        fontWeight: '800'
    },
    summaryLbl: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 2
    },
    todayCard: {
        backgroundColor: colors.surface,
        borderRadius: 20,
        padding: 18,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 20
    },
    todayCardTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 12
    },
    todayMainRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    todayStatusCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.successLight,
        alignItems: 'center',
        justifyContent: 'center'
    },
    todayInfoCol: {
        flex: 1
    },
    todayPresentText: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary
    },
    todaySubText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    todayHoursText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        marginTop: 4
    },
    todayActionRow: {
        marginTop: 16
    },
    todayCta: {
        backgroundColor: colors.primary,
        height: 46,
        borderRadius: 12
    },
    doneBadge: {
        backgroundColor: colors.successLight,
        paddingVertical: 10,
        borderRadius: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.successBorder
    },
    doneBadgeText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.success
    },
    monthCenterCol: {
        alignItems: 'center'
    },
    jumpCurrentMonthBtn: {
        marginTop: 2,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6
    },
    jumpCurrentMonthText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary
    },
    todayHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 12
    },
    todayStatusPill: {
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1
    },
    todayStatusPillText: {
        fontSize: 11,
        fontWeight: '700'
    },
    paidBadge: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0'
    },
    paidBadgeText: {
        color: '#059669'
    },
    generatedBadge: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE'
    },
    generatedBadgeText: {
        color: '#1E60FF'
    },
    absentPill: {
        backgroundColor: '#FEF2F2',
        borderColor: '#FECACA'
    },
    absentPillText: {
        color: '#DC2626'
    },
    todayPunchStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 12,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 14
    },
    todayPunchCol: {
        flex: 1
    },
    todayPunchColLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted,
        marginBottom: 2
    },
    todayPunchColVal: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.textPrimary
    },
    todayAddressText: {
        fontSize: 10,
        color: colors.textSecondary,
        marginTop: 3
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted
    },
    empHistoryList: {
        gap: 10
    },
    empDayCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border
    },
    empDayTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12
    },
    empDateBox: {
        width: 44,
        height: 44,
        borderRadius: 12,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    empDateDayNum: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary
    },
    empDateMonthStr: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase'
    },
    empDayMeta: {
        flex: 1
    },
    empDayTitleRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4
    },
    empDayWeekday: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textPrimary
    },
    empStatusPill: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6
    },
    empStatusPillText: {
        fontSize: 10,
        fontWeight: '700'
    },
    empHolidayTagText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.purple
    },
    empPunchTimesSummary: {
        fontSize: 11,
        color: colors.textSecondary
    },
    empDurationCol: {
        alignItems: 'flex-end'
    },
    empDurationLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted
    },
    empDurationVal: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 2
    },
    empLocationDetailsBox: {
        marginTop: 10,
        paddingTop: 8,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceSubtle,
        gap: 4
    },
    empLocationText: {
        fontSize: 10,
        color: colors.textSecondary
    }
});
