import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    RefreshControl,
    ActivityIndicator,
    Modal,
    TextInput,
    Switch,
    Alert,
    KeyboardAvoidingView,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Pencil,
    Trash2,
    Palmtree,
    Calendar,
    Sparkles,
    ShieldCheck,
    Clock,
    Info,
    Check,
    X,
    Building2
} from 'lucide-react-native';
import holidayApi from '../../src/api/holidayApi';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/constants/colors';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const HOLIDAY_TYPES = [
    'Company Holiday',
    'National Holiday',
    'Festival Working Day',
    'Optional Holiday'
];

export default function HolidaysScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    const today = new Date();
    const [year, setYear] = useState(today.getFullYear());
    const [holidays, setHolidays] = useState([]);
    const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming' | 'all' | 'festival'
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Modal state for Add/Edit
    const [modalVisible, setModalVisible] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);
    const [formSubmitting, setFormSubmitting] = useState(false);

    // Form inputs
    const [formName, setFormName] = useState('');
    const [formDate, setFormDate] = useState('');
    const [formType, setFormType] = useState('Company Holiday');
    const [formDescription, setFormDescription] = useState('');
    const [formIsWorkingDay, setFormIsWorkingDay] = useState(false);
    const [formGrantFullDay, setFormGrantFullDay] = useState(true);
    const [formCustomCutoff, setFormCustomCutoff] = useState('');
    const [formIsActive, setFormIsActive] = useState(true);

    const fetchHolidays = async () => {
        try {
            setLoading(true);
            const data = await holidayApi.getHolidays(year);
            setHolidays(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Failed to fetch holidays:', e);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        fetchHolidays();
    }, [year]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        fetchHolidays();
    }, [year]);

    const openCreateModal = () => {
        setEditingHoliday(null);
        setFormName('');
        setFormDate(`${year}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`);
        setFormType('Company Holiday');
        setFormDescription('');
        setFormIsWorkingDay(false);
        setFormGrantFullDay(true);
        setFormCustomCutoff('');
        setFormIsActive(true);
        setModalVisible(true);
    };

    const openEditModal = (holiday) => {
        setEditingHoliday(holiday);
        setFormName(holiday.name || '');
        setFormDate(holiday.date || '');
        setFormType(holiday.type || 'Company Holiday');
        setFormDescription(holiday.description || '');
        setFormIsWorkingDay(Boolean(holiday.isWorkingDay));
        setFormGrantFullDay(holiday.grantFullDayOnCheckIn !== false);
        setFormCustomCutoff(holiday.customCutoffTime || '');
        setFormIsActive(holiday.isActive !== false);
        setModalVisible(true);
    };

    const handleSaveHoliday = async () => {
        if (!formName.trim()) {
            Alert.alert('Required Field', 'Please enter a holiday title.');
            return;
        }
        if (!formDate.trim() || !/^\d{4}-\d{2}-\d{2}$/.test(formDate.trim())) {
            Alert.alert('Invalid Date', 'Please enter date in format YYYY-MM-DD (e.g. 2026-10-20).');
            return;
        }

        setFormSubmitting(true);
        try {
            const payload = {
                name: formName.trim(),
                date: formDate.trim(),
                type: formType,
                description: formDescription.trim(),
                isWorkingDay: formType === 'Festival Working Day' ? true : formIsWorkingDay,
                grantFullDayOnCheckIn: formGrantFullDay,
                customCutoffTime: formCustomCutoff.trim() || null,
                isActive: formIsActive
            };

            if (editingHoliday) {
                await holidayApi.updateHoliday(editingHoliday._id, payload);
                Alert.alert('Success 🎉', 'Holiday updated successfully.');
            } else {
                await holidayApi.createHoliday(payload);
                Alert.alert('Success 🎉', 'New holiday created successfully.');
            }

            setModalVisible(false);
            fetchHolidays();
        } catch (error) {
            console.error('Failed to save holiday:', error);
            Alert.alert('Save Failed', error.response?.data?.message || error.message || 'Could not save holiday.');
        } finally {
            setFormSubmitting(false);
        }
    };

    const handleDeleteHoliday = (holiday) => {
        Alert.alert(
            'Delete Holiday',
            `Are you sure you want to delete "${holiday.name}" (${holiday.date})? This will update attendance calculations.`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await holidayApi.deleteHoliday(holiday._id);
                            Alert.alert('Deleted', 'Holiday removed successfully.');
                            fetchHolidays();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.message || 'Failed to delete holiday.');
                        }
                    }
                }
            ]
        );
    };

    const todayStr = today.toISOString().split('T')[0];

    const displayList = holidays.filter((h) => {
        if (activeTab === 'upcoming') {
            return h.date >= todayStr;
        }
        if (activeTab === 'festival') {
            return h.type === 'Festival Working Day' || h.isWorkingDay === true;
        }
        return true;
    });

    const getTypeColor = (type) => {
        switch (type) {
            case 'National Holiday':
                return { bg: '#EFF6FF', text: '#1E60FF', border: '#BFDBFE' };
            case 'Company Holiday':
                return { bg: '#ECFDF5', text: '#059669', border: '#A7F3D0' };
            case 'Festival Working Day':
                return { bg: '#FFFBEB', text: '#D97706', border: '#FDE68A' };
            case 'Optional Holiday':
                return { bg: '#F5F3FF', text: '#8B5CF6', border: '#DDD6FE' };
            default:
                return { bg: colors.surfaceSubtle, text: colors.textSecondary, border: colors.border };
        }
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
                    <ChevronLeft size={24} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.headerTitleCol}>
                    <Text style={styles.headerTitle}>Holiday Calendar</Text>
                    {isAdmin && (
                        <View style={styles.adminIndicator}>
                            <ShieldCheck size={12} color="#1E60FF" />
                            <Text style={styles.adminIndicatorText}>Super Admin Management</Text>
                        </View>
                    )}
                </View>

                {isAdmin ? (
                    <TouchableOpacity
                        onPress={openCreateModal}
                        style={styles.addHolidayHeaderBtn}
                        activeOpacity={0.8}
                    >
                        <Plus size={16} color="#FFFFFF" />
                        <Text style={styles.addHolidayHeaderBtnText}>Add</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 36 }} />
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
                {/* Year Selector */}
                <View style={styles.yearBar}>
                    <TouchableOpacity
                        onPress={() => setYear(year - 1)}
                        style={styles.yearNavBtn}
                        activeOpacity={0.7}
                    >
                        <ChevronLeft size={18} color={colors.textPrimary} />
                    </TouchableOpacity>

                    <View style={styles.yearCenter}>
                        <Calendar size={16} color={colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.yearText}>{year} Calendar</Text>
                    </View>

                    <TouchableOpacity
                        onPress={() => setYear(year + 1)}
                        style={styles.yearNavBtn}
                        activeOpacity={0.7}
                    >
                        <ChevronRight size={18} color={colors.textPrimary} />
                    </TouchableOpacity>
                </View>

                {/* Filter Tabs */}
                <View style={styles.tabContainer}>
                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'upcoming' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('upcoming')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabBtnText, activeTab === 'upcoming' && styles.tabBtnTextActive]}>
                            Upcoming
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('all')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabBtnText, activeTab === 'all' && styles.tabBtnTextActive]}>
                            All ({holidays.length})
                        </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={[styles.tabBtn, activeTab === 'festival' && styles.tabBtnActive]}
                        onPress={() => setActiveTab('festival')}
                        activeOpacity={0.7}
                    >
                        <Text style={[styles.tabBtnText, activeTab === 'festival' && styles.tabBtnTextActive]}>
                            Festival Working
                        </Text>
                    </TouchableOpacity>
                </View>

                {/* Holiday Cards List */}
                {loading && !refreshing ? (
                    <ActivityIndicator size="large" color={colors.primary} style={{ marginVertical: 30 }} />
                ) : displayList.length === 0 ? (
                    <View style={styles.emptyCard}>
                        <Palmtree size={36} color={colors.textMuted} style={{ marginBottom: 10 }} />
                        <Text style={styles.emptyTitle}>No Holidays Found</Text>
                        <Text style={styles.emptySubtitle}>
                            {activeTab === 'upcoming'
                                ? 'No upcoming holidays remaining this year.'
                                : 'No holiday records added for this filter.'}
                        </Text>
                        {isAdmin && (
                            <TouchableOpacity style={styles.emptyAddBtn} onPress={openCreateModal}>
                                <Plus size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                                <Text style={styles.emptyAddBtnText}>Add Holiday Now</Text>
                            </TouchableOpacity>
                        )}
                    </View>
                ) : (
                    <View style={styles.list}>
                        {displayList.map((h, index) => {
                            const dateObj = new Date(h.date);
                            const day = dateObj.getDate();
                            const monthStr = MONTH_NAMES[dateObj.getMonth()]?.substring(0, 3) || 'MTH';
                            const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
                            const typeStyle = getTypeColor(h.type);
                            const isPast = h.date < todayStr;

                            return (
                                <View
                                    key={h._id || index}
                                    style={[
                                        styles.holidayCard,
                                        isPast && styles.holidayCardPast
                                    ]}
                                >
                                    {/* Date Block */}
                                    <View style={styles.dateBlock}>
                                        <Text style={styles.dateBlockDay}>{day}</Text>
                                        <Text style={styles.dateBlockMonth}>{monthStr}</Text>
                                    </View>

                                    {/* Holiday Information */}
                                    <View style={styles.holidayInfo}>
                                        <View style={styles.titleRow}>
                                            <Text style={styles.holidayTitle} numberOfLines={1}>
                                                {h.name}
                                            </Text>
                                        </View>

                                        <Text style={styles.holidayWeekday}>
                                            {weekday} • {h.date}
                                        </Text>

                                        <View style={styles.tagsRow}>
                                            <View
                                                style={[
                                                    styles.typeBadge,
                                                    { backgroundColor: typeStyle.bg, borderColor: typeStyle.border }
                                                ]}
                                            >
                                                <Text style={[styles.typeBadgeText, { color: typeStyle.text }]}>
                                                    {h.type || 'Company Holiday'}
                                                </Text>
                                            </View>

                                            {(h.type === 'Festival Working Day' || h.isWorkingDay) && (
                                                <View style={styles.workingBadge}>
                                                    <Building2 size={10} color="#D97706" />
                                                    <Text style={styles.workingBadgeText}>Office Open</Text>
                                                </View>
                                            )}

                                            {h.customCutoffTime && (
                                                <View style={styles.cutoffBadge}>
                                                    <Clock size={10} color={colors.textSecondary} />
                                                    <Text style={styles.cutoffBadgeText}>Cutoff: {h.customCutoffTime}</Text>
                                                </View>
                                            )}
                                        </View>

                                        {h.description ? (
                                            <Text style={styles.holidayDesc} numberOfLines={2}>
                                                {h.description}
                                            </Text>
                                        ) : null}
                                    </View>

                                    {/* Admin Edit & Delete Actions */}
                                    {isAdmin && (
                                        <View style={styles.adminActionCol}>
                                            <TouchableOpacity
                                                style={styles.adminIconBtn}
                                                onPress={() => openEditModal(h)}
                                                activeOpacity={0.7}
                                            >
                                                <Pencil size={16} color={colors.primary} />
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={[styles.adminIconBtn, { marginTop: 8 }]}
                                                onPress={() => handleDeleteHoliday(h)}
                                                activeOpacity={0.7}
                                            >
                                                <Trash2 size={16} color={colors.danger} />
                                            </TouchableOpacity>
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Bottom Palm Banner */}
                <View style={styles.palmBanner}>
                    <Palmtree size={24} color="#059669" />
                    <View style={styles.palmTextCol}>
                        <Text style={styles.palmTitle}>
                            {holidays.length} Total Holidays in {year}
                        </Text>
                        <Text style={styles.palmSub}>
                            WECICE Delhi Holiday Schedule
                        </Text>
                    </View>
                </View>
            </ScrollView>

            {/* ================= ADD / EDIT HOLIDAY MODAL ================= */}
            <Modal
                visible={modalVisible}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setModalVisible(false)}
            >
                <KeyboardAvoidingView
                    behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                    style={styles.modalBackdrop}
                >
                    <View style={styles.modalContent}>
                        {/* Modal Header */}
                        <View style={styles.modalHeader}>
                            <View style={styles.modalHeaderTitleCol}>
                                <Text style={styles.modalTitle}>
                                    {editingHoliday ? 'Edit Holiday' : 'Create New Holiday'}
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    Super Admin Holiday & Working Day Rules
                                </Text>
                            </View>
                            <TouchableOpacity
                                onPress={() => setModalVisible(false)}
                                style={styles.modalCloseBtn}
                                activeOpacity={0.7}
                            >
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false} style={styles.modalForm}>
                            {/* Holiday Title */}
                            <Text style={styles.inputLabel}>Holiday Name *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="e.g. Diwali, Durga Puja, Christmas"
                                placeholderTextColor={colors.textMuted}
                                value={formName}
                                onChangeText={setFormName}
                            />

                            {/* Holiday Date */}
                            <Text style={styles.inputLabel}>Date (YYYY-MM-DD) *</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="YYYY-MM-DD (e.g. 2026-10-20)"
                                placeholderTextColor={colors.textMuted}
                                value={formDate}
                                onChangeText={setFormDate}
                                keyboardType="numeric"
                            />

                            {/* Holiday Type Selector */}
                            <Text style={styles.inputLabel}>Holiday Category</Text>
                            <View style={styles.typeGrid}>
                                {HOLIDAY_TYPES.map((t) => (
                                    <TouchableOpacity
                                        key={t}
                                        style={[
                                            styles.typeChoicePill,
                                            formType === t && styles.typeChoicePillActive
                                        ]}
                                        onPress={() => {
                                            setFormType(t);
                                            if (t === 'Festival Working Day') {
                                                setFormIsWorkingDay(true);
                                                setFormGrantFullDay(true);
                                            }
                                        }}
                                        activeOpacity={0.7}
                                    >
                                        <Text
                                            style={[
                                                styles.typeChoicePillText,
                                                formType === t && styles.typeChoicePillTextActive
                                            ]}
                                        >
                                            {t}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Description / Details */}
                            <Text style={styles.inputLabel}>Description / Notes (Optional)</Text>
                            <TextInput
                                style={[styles.input, styles.multilineInput]}
                                placeholder="Additional details or instructions for employees..."
                                placeholderTextColor={colors.textMuted}
                                value={formDescription}
                                onChangeText={setFormDescription}
                                multiline
                                numberOfLines={2}
                            />

                            {/* Advanced Rules Section */}
                            <View style={styles.advancedBox}>
                                <Text style={styles.advancedBoxHeader}>Attendance Rules & Overrides</Text>

                                {/* Is Working Day Toggle */}
                                <View style={styles.switchRow}>
                                    <View style={styles.switchTextCol}>
                                        <Text style={styles.switchLabel}>Office Open (Festival Working Day)</Text>
                                        <Text style={styles.switchHelp}>
                                            If enabled, employees can check in on this holiday.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={formType === 'Festival Working Day' ? true : formIsWorkingDay}
                                        onValueChange={setFormIsWorkingDay}
                                        disabled={formType === 'Festival Working Day'}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                    />
                                </View>

                                {/* Grant Full Day on Check-in */}
                                {(formType === 'Festival Working Day' || formIsWorkingDay) && (
                                    <>
                                        <View style={styles.switchRow}>
                                            <View style={styles.switchTextCol}>
                                                <Text style={styles.switchLabel}>Grant Full Day Credit</Text>
                                                <Text style={styles.switchHelp}>
                                                    Marks employee as PRESENT for the full day upon any valid punch.
                                                </Text>
                                            </View>
                                            <Switch
                                                value={formGrantFullDay}
                                                onValueChange={setFormGrantFullDay}
                                                trackColor={{ false: colors.border, true: colors.primary }}
                                            />
                                        </View>

                                        {/* Custom Cutoff */}
                                        <Text style={styles.inputLabel}>Custom Early Cutoff Time (Optional)</Text>
                                        <TextInput
                                            style={styles.input}
                                            placeholder="e.g. 14:00 (HH:MM)"
                                            placeholderTextColor={colors.textMuted}
                                            value={formCustomCutoff}
                                            onChangeText={setFormCustomCutoff}
                                        />
                                    </>
                                )}

                                {/* Is Active Toggle */}
                                <View style={[styles.switchRow, { borderBottomWidth: 0 }]}>
                                    <View style={styles.switchTextCol}>
                                        <Text style={styles.switchLabel}>Active Holiday Status</Text>
                                        <Text style={styles.switchHelp}>
                                            Include in company payroll & working day formulas.
                                        </Text>
                                    </View>
                                    <Switch
                                        value={formIsActive}
                                        onValueChange={setFormIsActive}
                                        trackColor={{ false: colors.border, true: colors.primary }}
                                    />
                                </View>
                            </View>

                            {/* Submit & Cancel Buttons */}
                            <Button
                                title={editingHoliday ? 'Save Changes' : 'Create Holiday'}
                                onPress={handleSaveHoliday}
                                loading={formSubmitting}
                                style={styles.saveBtn}
                            />

                            <TouchableOpacity
                                style={styles.cancelModalBtn}
                                onPress={() => setModalVisible(false)}
                                disabled={formSubmitting}
                            >
                                <Text style={styles.cancelModalBtnText}>Cancel</Text>
                            </TouchableOpacity>
                        </ScrollView>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
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
    headerTitleCol: {
        flex: 1,
        marginLeft: 8
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    adminIndicator: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    adminIndicatorText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E60FF'
    },
    addHolidayHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 10
    },
    addHolidayHeaderBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32
    },
    yearBar: {
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
    yearNavBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    yearCenter: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    yearText: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary
    },
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 12,
        padding: 4,
        marginBottom: 18,
        gap: 4
    },
    tabBtn: {
        flex: 1,
        paddingVertical: 8,
        alignItems: 'center',
        borderRadius: 10
    },
    tabBtnActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    tabBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary
    },
    tabBtnTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    list: {
        gap: 12
    },
    holidayCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 14
    },
    holidayCardPast: {
        opacity: 0.65
    },
    dateBlock: {
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        paddingVertical: 8,
        borderRadius: 12,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A'
    },
    dateBlockDay: {
        fontSize: 18,
        fontWeight: '800',
        color: '#D97706'
    },
    dateBlockMonth: {
        fontSize: 11,
        fontWeight: '700',
        color: '#D97706',
        textTransform: 'uppercase'
    },
    holidayInfo: {
        flex: 1
    },
    titleRow: {
        flexDirection: 'row',
        alignItems: 'center'
    },
    holidayTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary
    },
    holidayWeekday: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    tagsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 6,
        flexWrap: 'wrap'
    },
    typeBadge: {
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1
    },
    typeBadgeText: {
        fontSize: 10,
        fontWeight: '700'
    },
    workingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FFFBEB',
        borderWidth: 1,
        borderColor: '#FDE68A',
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    workingBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#D97706'
    },
    cutoffBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 6,
        paddingVertical: 2,
        borderRadius: 6
    },
    cutoffBadgeText: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary
    },
    holidayDesc: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 6,
        fontStyle: 'italic'
    },
    adminActionCol: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingLeft: 4
    },
    adminIconBtn: {
        width: 32,
        height: 32,
        borderRadius: 8,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 30,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    emptyTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4
    },
    emptySubtitle: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16
    },
    emptyAddBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12
    },
    emptyAddBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700'
    },
    palmBanner: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECFDF5',
        borderRadius: 16,
        padding: 16,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#A7F3D0',
        gap: 12
    },
    palmTextCol: {
        flex: 1
    },
    palmTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#059669'
    },
    palmSub: {
        fontSize: 12,
        color: colors.textSecondary,
        marginTop: 2
    },
    /* Modal Styles */
    modalBackdrop: {
        flex: 1,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        justifyContent: 'flex-end'
    },
    modalContent: {
        backgroundColor: colors.surface,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 36,
        maxHeight: '88%'
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: colors.border,
        paddingBottom: 12
    },
    modalHeaderTitleCol: {
        flex: 1
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    modalSubtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2
    },
    modalCloseBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    modalForm: {
        marginBottom: 10
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 6,
        marginTop: 10
    },
    input: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 14,
        height: 44,
        fontSize: 13,
        color: colors.textPrimary
    },
    multilineInput: {
        height: 70,
        paddingVertical: 10,
        textAlignVertical: 'top'
    },
    typeGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 8,
        marginBottom: 6
    },
    typeChoicePill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border
    },
    typeChoicePillActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#1E60FF'
    },
    typeChoicePillText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary
    },
    typeChoicePillTextActive: {
        color: '#1E60FF',
        fontWeight: '700'
    },
    advancedBox: {
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        marginTop: 14,
        marginBottom: 16
    },
    advancedBoxHeader: {
        fontSize: 12,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 10
    },
    switchRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.border
    },
    switchTextCol: {
        flex: 1,
        paddingRight: 12
    },
    switchLabel: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    switchHelp: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2
    },
    saveBtn: {
        backgroundColor: colors.primary,
        height: 48,
        borderRadius: 12,
        marginTop: 10
    },
    cancelModalBtn: {
        paddingVertical: 12,
        alignItems: 'center'
    },
    cancelModalBtnText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textMuted
    }
});
