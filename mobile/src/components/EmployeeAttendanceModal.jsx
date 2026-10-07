import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Modal,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    TextInput,
    RefreshControl
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
    X,
    ChevronLeft,
    ChevronRight,
    Calendar,
    Search,
    MapPin,
    Clock,
    CheckCircle2,
    Shield,
    Users,
    Sparkles,
    CalendarDays
} from 'lucide-react-native';
import { colors } from '../constants/colors';
import adminApi from '../api/adminApi';
import Avatar from './Avatar';
import Card from './Card';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export const EmployeeAttendanceModal = ({
    visible,
    onClose,
    employee
}) => {
    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [month, setMonth] = useState(today.getMonth() + 1);
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [filterTab, setFilterTab] = useState('ALL'); // 'ALL' | 'PRESENT' | 'HALF_DAY' | 'ABSENT' | 'HOLIDAY_OFF'
    const [searchQuery, setSearchQuery] = useState('');

    const empId = employee?._id || employee?.id || employee?.employeeId;

    const fetchHistory = useCallback(async () => {
        if (!empId) return;
        try {
            setLoading(true);
            const res = await adminApi.getEmployeeAttendanceHistory(empId, year, month);
            setData(res);
        } catch (err) {
            console.error('Failed to load employee attendance history:', err);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [empId, year, month]);

    useEffect(() => {
        if (visible && empId) {
            fetchHistory();
        }
    }, [visible, empId, year, month, fetchHistory]);

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

    const onRefresh = () => {
        setRefreshing(true);
        fetchHistory();
    };

    const summary = data?.summary || {
        presentDays: 0,
        halfDays: 0,
        absentDays: 0,
        paidDays: 0,
        totalWorkingDays: 0,
        attendancePercentage: 0
    };

    const history = data?.history || [];

    const presentCount = history.filter(h => h.status === 'PRESENT').length;
    const halfDayCount = history.filter(h => h.status === 'HALF_DAY' || h.status === 'LATE').length;
    const absentCount = history.filter(h => h.status === 'ABSENT' || h.status === 'NOT_CHECKED_IN').length;
    const offCount = history.filter(h => h.status === 'HOLIDAY' || h.status === 'SUNDAY' || h.status === 'WEEKLY_OFF').length;

    const filteredHistory = history.filter(item => {
        const query = searchQuery.toLowerCase().trim();
        const matchQuery =
            query === '' ||
            (item.date && item.date.toLowerCase().includes(query)) ||
            (item.dayOfWeek && item.dayOfWeek.toLowerCase().includes(query)) ||
            (item.holidayName && item.holidayName.toLowerCase().includes(query)) ||
            (item.status && item.status.toLowerCase().includes(query));

        if (!matchQuery) return false;

        if (filterTab === 'PRESENT') return item.status === 'PRESENT';
        if (filterTab === 'HALF_DAY') return item.status === 'HALF_DAY' || item.status === 'LATE';
        if (filterTab === 'ABSENT') return item.status === 'ABSENT' || item.status === 'NOT_CHECKED_IN';
        if (filterTab === 'HOLIDAY_OFF') return item.status === 'HOLIDAY' || item.status === 'SUNDAY' || item.status === 'WEEKLY_OFF';
        return true;
    });

    const getStatusBadge = (status) => {
        switch (status) {
            case 'PRESENT':
                return { label: 'Present', bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
            case 'HALF_DAY':
            case 'LATE':
                return { label: 'Half-Day', bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
            case 'ABSENT':
            case 'NOT_CHECKED_IN':
                return { label: 'Absent', bg: '#FEF2F2', text: '#DC2626', border: '#FECACA' };
            case 'HOLIDAY':
                return { label: 'Holiday', bg: '#F5F3FF', text: '#7C3AED', border: '#DDD6FE' };
            case 'SUNDAY':
            case 'WEEKLY_OFF':
                return { label: 'Off Day', bg: '#F1F5F9', text: '#64748B', border: '#E2E8F0' };
            default:
                return { label: status || 'Pending', bg: '#F8FAFC', text: '#64748B', border: '#E2E8F0' };
        }
    };

    if (!employee) return null;

    const empName = employee.name || data?.employee?.name || 'Employee';
    const empDesignation = employee.designation || data?.employee?.designation || 'Staff';
    const empDisplayId = employee.employeeId || data?.employee?.employeeId || '';
    const empPic = employee.profilePicture || data?.employee?.profilePicture || null;

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={onClose}
        >
            <SafeAreaView style={styles.container}>
                {/* Modal Header */}
                <View style={styles.header}>
                    <View style={styles.headerEmpInfo}>
                        <Avatar
                            uri={empPic}
                            name={empName}
                            size={44}
                            bgColor="#EFF6FF"
                            textColor="#1E60FF"
                            borderColor="#BFDBFE"
                            borderWidth={2}
                        />
                        <View style={styles.headerTextCol}>
                            <View style={styles.nameRow}>
                                <Text style={styles.empNameText} numberOfLines={1}>{empName}</Text>
                                {empDisplayId ? (
                                    <View style={styles.idPill}>
                                        <Text style={styles.idText}>{empDisplayId}</Text>
                                    </View>
                                ) : null}
                            </View>
                            <Text style={styles.empDesignationText}>{empDesignation}</Text>
                        </View>
                    </View>

                    <TouchableOpacity
                        onPress={onClose}
                        style={styles.closeBtn}
                        activeOpacity={0.7}
                    >
                        <X size={20} color={colors.textPrimary} />
                    </TouchableOpacity>
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
                    {/* Month Navigator */}
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
                                    activeOpacity={0.7}
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
                        <View style={[styles.summaryItem, { borderColor: '#A7F3D0', backgroundColor: '#ECFDF5' }]}>
                            <Text style={[styles.summaryVal, { color: '#059669' }]}>
                                {summary.presentDays ?? presentCount}
                            </Text>
                            <Text style={styles.summaryLbl}>Present Days</Text>
                        </View>
                        <View style={[styles.summaryItem, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
                            <Text style={[styles.summaryVal, { color: '#D97706' }]}>
                                {summary.halfDays ?? halfDayCount}
                            </Text>
                            <Text style={styles.summaryLbl}>Half-Days</Text>
                        </View>
                        <View style={[styles.summaryItem, { borderColor: '#FECACA', backgroundColor: '#FEF2F2' }]}>
                            <Text style={[styles.summaryVal, { color: '#DC2626' }]}>
                                {summary.absentDays ?? absentCount}
                            </Text>
                            <Text style={styles.summaryLbl}>Absent</Text>
                        </View>
                        <View style={[styles.summaryItem, { borderColor: '#BFDBFE', backgroundColor: '#EFF6FF' }]}>
                            <Text style={[styles.summaryVal, { color: '#1E60FF' }]}>
                                {summary.attendancePercentage > 0 ? `${summary.attendancePercentage}%` : `${summary.paidDays || 0} / ${summary.totalWorkingDays || 22}`}
                            </Text>
                            <Text style={styles.summaryLbl}>
                                {summary.attendancePercentage > 0 ? 'Rate' : 'Paid Days'}
                            </Text>
                        </View>
                    </View>

                    {/* Search & Filter Bar */}
                    <View style={styles.searchContainer}>
                        <Search size={16} color={colors.textMuted} style={styles.searchIcon} />
                        <TextInput
                            style={styles.searchInput}
                            placeholder="Filter by date, day, or holiday..."
                            placeholderTextColor={colors.textMuted}
                            value={searchQuery}
                            onChangeText={setSearchQuery}
                        />
                        {searchQuery ? (
                            <TouchableOpacity onPress={() => setSearchQuery('')}>
                                <X size={16} color={colors.textMuted} />
                            </TouchableOpacity>
                        ) : null}
                    </View>

                    {/* Filter Tabs */}
                    <View style={styles.filterTabsRow}>
                        {[
                            { id: 'ALL', label: `All (${history.length})` },
                            { id: 'PRESENT', label: `Present (${presentCount})` },
                            { id: 'HALF_DAY', label: `Half-Day (${halfDayCount})` },
                            { id: 'ABSENT', label: `Absent (${absentCount})` },
                            { id: 'HOLIDAY_OFF', label: `Off (${offCount})` }
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

                    {/* Attendance Logs List */}
                    <View style={styles.historySection}>
                        <Text style={styles.sectionTitle}>
                            Attendance Breakdown ({filteredHistory.length} Days)
                        </Text>

                        {loading && !refreshing ? (
                            <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
                        ) : filteredHistory.length === 0 ? (
                            <View style={styles.emptyCard}>
                                <CalendarDays size={32} color={colors.textMuted} style={{ marginBottom: 8 }} />
                                <Text style={styles.emptyCardText}>No attendance records for selected criteria.</Text>
                            </View>
                        ) : (
                            <View style={styles.historyList}>
                                {filteredHistory.map((item, index) => {
                                    const badge = getStatusBadge(item.status);
                                    const dateObj = new Date(item.date);
                                    const dayNum = dateObj.getDate();
                                    const hasIn = item.checkIn && item.checkIn !== '--:--';
                                    const hasOut = item.checkOut && item.checkOut !== '--:--';

                                    return (
                                        <Card key={index} style={styles.dayCard}>
                                            <View style={styles.dayCardTopRow}>
                                                {/* Left Date Circle */}
                                                <View style={styles.dateCircle}>
                                                    <Text style={styles.dateDayNum}>{dayNum}</Text>
                                                    <Text style={styles.dateDayName}>{item.dayOfWeek}</Text>
                                                </View>

                                                {/* Middle Info */}
                                                <View style={styles.dayMeta}>
                                                    <Text style={styles.dateFullText}>
                                                        {item.date} • {item.dayOfWeek}
                                                    </Text>
                                                    {item.holidayName ? (
                                                        <Text style={styles.holidayNameText}>
                                                            🎉 {item.holidayName}
                                                        </Text>
                                                    ) : (
                                                        <Text style={styles.durationText}>
                                                            Duration: {item.workingHours || '0h 0m'}
                                                        </Text>
                                                    )}
                                                </View>

                                                {/* Status Badge */}
                                                <View style={[styles.statusBadge, { backgroundColor: badge.bg, borderColor: badge.border }]}>
                                                    <Text style={[styles.statusBadgeText, { color: badge.text }]}>
                                                        {badge.label}
                                                    </Text>
                                                </View>
                                            </View>

                                            {/* Punch & Location details */}
                                            {(hasIn || hasOut) && (
                                                <View style={styles.punchDetailsStrip}>
                                                    <View style={styles.punchCol}>
                                                        <Text style={styles.punchLabel}>IN TIME</Text>
                                                        <Text style={[styles.punchVal, { color: '#059669' }]}>
                                                            {hasIn ? item.checkIn : '--:--'}
                                                        </Text>
                                                        {item.checkInAddress ? (
                                                            <Text style={styles.addressText} numberOfLines={1}>
                                                                📍 {item.checkInAddress}
                                                            </Text>
                                                        ) : null}
                                                    </View>

                                                    <View style={styles.punchDivider} />

                                                    <View style={styles.punchCol}>
                                                        <Text style={styles.punchLabel}>OUT TIME</Text>
                                                        <Text style={[styles.punchVal, { color: '#1E60FF' }]}>
                                                            {hasOut ? item.checkOut : '--:--'}
                                                        </Text>
                                                        {item.checkOutAddress ? (
                                                            <Text style={styles.addressText} numberOfLines={1}>
                                                                📍 {item.checkOutAddress}
                                                            </Text>
                                                        ) : null}
                                                    </View>

                                                    <View style={styles.punchDivider} />

                                                    <View style={styles.punchCol}>
                                                        <Text style={styles.punchLabel}>TOTAL</Text>
                                                        <Text style={styles.punchVal}>
                                                            {item.workingHours || '0h 0m'}
                                                        </Text>
                                                    </View>
                                                </View>
                                            )}
                                        </Card>
                                    );
                                })}
                            </View>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        backgroundColor: colors.surface
    },
    headerEmpInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        flex: 1
    },
    headerTextCol: {
        flex: 1
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    empNameText: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textPrimary
    },
    idPill: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#BFDBFE'
    },
    idText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E60FF'
    },
    empDesignationText: {
        fontSize: 13,
        color: colors.textSecondary,
        marginTop: 2
    },
    closeBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 40
    },
    monthHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16
    },
    navBtn: {
        width: 38,
        height: 38,
        borderRadius: 12,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center'
    },
    monthCenterCol: {
        alignItems: 'center'
    },
    monthTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary
    },
    jumpCurrentMonthBtn: {
        marginTop: 3
    },
    jumpCurrentMonthText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary
    },
    monthlySummaryGrid: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16
    },
    summaryItem: {
        flex: 1,
        paddingVertical: 12,
        paddingHorizontal: 6,
        borderRadius: 12,
        borderWidth: 1,
        alignItems: 'center',
        justifyContent: 'center'
    },
    summaryVal: {
        fontSize: 16,
        fontWeight: '800'
    },
    summaryLbl: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.textSecondary,
        marginTop: 2,
        textTransform: 'uppercase'
    },
    searchContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 42,
        marginBottom: 12
    },
    searchIcon: {
        marginRight: 8
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: colors.textPrimary,
        height: '100%'
    },
    filterTabsRow: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 16
    },
    filterPill: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 20,
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
        fontWeight: '600',
        color: colors.textSecondary
    },
    filterPillTextActive: {
        color: '#FFFFFF'
    },
    historySection: {
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 10
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 24,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    emptyCardText: {
        fontSize: 13,
        color: colors.textMuted,
        fontWeight: '500'
    },
    historyList: {
        gap: 10
    },
    dayCard: {
        padding: 14,
        borderRadius: 14
    },
    dayCardTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
    dateCircle: {
        width: 42,
        height: 42,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle,
        borderWidth: 1,
        borderColor: colors.border,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dateDayNum: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary,
        lineHeight: 18
    },
    dateDayName: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase'
    },
    dayMeta: {
        flex: 1,
        marginLeft: 12
    },
    dateFullText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary
    },
    durationText: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    holidayNameText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#7C3AED',
        marginTop: 2
    },
    statusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        borderWidth: 1
    },
    statusBadgeText: {
        fontSize: 11,
        fontWeight: '700'
    },
    punchDetailsStrip: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 10,
        borderTopWidth: 1,
        borderTopColor: colors.borderLight,
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 10,
        padding: 8
    },
    punchCol: {
        flex: 1,
        alignItems: 'center'
    },
    punchLabel: {
        fontSize: 9,
        fontWeight: '700',
        color: colors.textMuted,
        textTransform: 'uppercase'
    },
    punchVal: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 2
    },
    punchDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border
    },
    addressText: {
        fontSize: 9,
        color: colors.textMuted,
        marginTop: 2,
        maxWidth: 90
    }
});

export default EmployeeAttendanceModal;
