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
    Alert,
    Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import {
    ReceiptText,
    Download,
    Eye,
    X,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    ShieldCheck,
    Search,
    Zap,
    Pencil,
    RefreshCw,
    Trash2,
    TrendingUp,
    IndianRupee,
    Calendar,
    Users
} from 'lucide-react-native';
import payslipApi from '../../src/api/payslipApi';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/constants/colors';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import Avatar from '../../src/components/Avatar';

const MONTH_NAMES = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

export default function PayslipsScreen() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN';

    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());

    // Employee State
    const [employeePayslips, setEmployeePayslips] = useState([]);
    const [selectedPayslip, setSelectedPayslip] = useState(null);

    // Admin State
    const [adminPayslips, setAdminPayslips] = useState([]);
    const [adminKpis, setAdminKpis] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'Generated' | 'Paid'
    const [generatingBulk, setGeneratingBulk] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    // Admin Edit / Adjustment Modal State
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editingPayslip, setEditingPayslip] = useState(null);
    const [formBonus, setFormBonus] = useState('');
    const [formIncentive, setFormIncentive] = useState('');
    const [formOtherDeductions, setFormOtherDeductions] = useState('');
    const [formRemarks, setFormRemarks] = useState('');
    const [formPaymentStatus, setFormPaymentStatus] = useState('Generated');

    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [downloadingPdfId, setDownloadingPdfId] = useState(null);

    // Fetch Admin Payslips
    const fetchAdminData = async () => {
        try {
            setLoading(true);
            const params = {
                month: selectedMonth,
                year: selectedYear
            };
            if (statusFilter !== 'ALL') {
                params.status = statusFilter;
            }
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const res = await payslipApi.getAdminPayslips(params);
            setAdminPayslips(res.payslips || []);
            setAdminKpis({
                totalGrossSalary: res.summary?.totalGrossSalary ?? res.totalGrossSalary ?? 0,
                totalDeductions: res.summary?.totalDeductions ?? res.totalDeductions ?? 0,
                totalNetPayroll: res.summary?.totalNetPayroll ?? res.totalNetPayroll ?? 0,
                totalEmployeesCount: res.summary?.totalEmployees ?? res.totalEmployeesCount ?? 0,
                generatedCount: res.summary?.payslipsGenerated ?? res.generatedCount ?? (res.payslips ? res.payslips.length : 0)
            });
        } catch (error) {
            console.error('Failed to fetch admin payslips:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    // Fetch Employee Payslips
    const fetchEmployeeData = async () => {
        try {
            setLoading(true);
            const data = await payslipApi.getMyPayslips();
            setEmployeePayslips(data.payslips || []);
        } catch (error) {
            console.error('Failed to fetch employee payslips:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadData = () => {
        if (!user) return;
        if (isAdmin) {
            fetchAdminData();
        } else {
            fetchEmployeeData();
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, isAdmin, selectedMonth, selectedYear, statusFilter]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [isAdmin, selectedMonth, selectedYear, statusFilter, searchQuery]);

    // Month Navigation
    const handlePrevMonth = () => {
        if (selectedMonth === 1) {
            setSelectedMonth(12);
            setSelectedYear(prev => prev - 1);
        } else {
            setSelectedMonth(prev => prev - 1);
        }
    };

    const handleNextMonth = () => {
        if (selectedMonth === 12) {
            setSelectedMonth(1);
            setSelectedYear(prev => prev + 1);
        } else {
            setSelectedMonth(prev => prev + 1);
        }
    };

    // Admin Action: Bulk Generate Payslips
    const handleBulkGenerate = () => {
        Alert.alert(
            'Generate Bulk Payslips',
            `Generate attendance-synced payslips for all active employees for ${MONTH_NAMES[selectedMonth]} ${selectedYear}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: '⚡ Generate All',
                    onPress: async () => {
                        try {
                            setGeneratingBulk(true);
                            const res = await payslipApi.generateBulkPayslips(selectedMonth, selectedYear);
                            Alert.alert('Success 🎉', res.message || 'Payslips generated successfully!');
                            fetchAdminData();
                        } catch (err) {
                            Alert.alert('Generation Error', err.response?.data?.message || 'Failed to generate payslips.');
                        } finally {
                            setGeneratingBulk(false);
                        }
                    }
                }
            ]
        );
    };

    // Admin Action: Regenerate Single
    const handleRegenerate = async (payslip) => {
        Alert.alert(
            'Sync Attendance & Regenerate',
            `Recalculate ${payslip.employeeName}'s salary directly from the latest attendance logs?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Regenerate',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await payslipApi.regeneratePayslip(payslip._id);
                            Alert.alert('Updated', 'Payslip regenerated successfully.');
                            fetchAdminData();
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.message || 'Failed to regenerate payslip.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Admin Action: Open Edit Modal
    const handleOpenEditModal = (payslip) => {
        setEditingPayslip(payslip);
        setFormBonus(payslip.bonus ? String(payslip.bonus) : '0');
        setFormIncentive(payslip.incentive ? String(payslip.incentive) : '0');
        setFormOtherDeductions(payslip.otherDeductions ? String(payslip.otherDeductions) : '0');
        setFormRemarks(payslip.remarks || '');
        setFormPaymentStatus(payslip.paymentStatus || 'Generated');
        setEditModalOpen(true);
    };

    // Admin Action: Save Adjustments
    const handleSaveAdjustments = async () => {
        try {
            setActionLoading(true);
            await payslipApi.updatePayslip(editingPayslip._id, {
                bonus: Number(formBonus) || 0,
                incentive: Number(formIncentive) || 0,
                otherDeductions: Number(formOtherDeductions) || 0,
                remarks: formRemarks.trim(),
                paymentStatus: formPaymentStatus
            });
            Alert.alert('Success ✅', 'Payslip adjustments saved.');
            setEditModalOpen(false);
            setEditingPayslip(null);
            fetchAdminData();
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to update payslip.');
        } finally {
            setActionLoading(false);
        }
    };

    // Admin Action: Delete
    const handleDeletePayslip = (payslip) => {
        Alert.alert(
            'Delete Payslip',
            `Delete payslip for ${payslip.employeeName} (${MONTH_NAMES[payslip.month]} ${payslip.year})?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await payslipApi.deletePayslip(payslip._id);
                            Alert.alert('Deleted', 'Payslip deleted.');
                            fetchAdminData();
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.message || 'Failed to delete payslip.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Download PDF (Admin or Employee)
    const handleDownloadPdf = async (payslipId) => {
        try {
            setDownloadingPdfId(payslipId);
            const url = isAdmin
                ? await payslipApi.getAdminPdfDownloadUrl(payslipId)
                : await payslipApi.getPdfDownloadUrl(payslipId);

            if (Platform.OS === 'web') {
                if (typeof window !== 'undefined') {
                    window.open(url, '_blank');
                }
                return;
            }

            const canOpen = await Linking.canOpenURL(url).catch(() => false);
            if (canOpen) {
                await Linking.openURL(url);
            } else {
                await Linking.openURL(url);
            }
        } catch (e) {
            Alert.alert('Download Error', e.message || 'Unable to open PDF download link.');
        } finally {
            setDownloadingPdfId(null);
        }
    };

    const filteredAdminPayslips = adminPayslips.filter((p) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const name = (p.employeeName || '').toLowerCase();
        const code = (p.employeeId || '').toLowerCase();
        const desig = (p.designation || '').toLowerCase();
        return name.includes(q) || code.includes(q) || desig.includes(q);
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>
                        {isAdmin ? 'Payroll & Payslip Engine' : 'My Payslips'}
                    </Text>
                    {isAdmin && (
                        <View style={styles.adminBadgeRow}>
                            <ShieldCheck size={13} color="#1E60FF" />
                            <Text style={styles.adminBadgeText}>Super Admin Payroll Management</Text>
                        </View>
                    )}
                </View>

                {isAdmin && (
                    <TouchableOpacity
                        style={styles.headerBulkBtn}
                        onPress={handleBulkGenerate}
                        disabled={generatingBulk}
                        activeOpacity={0.7}
                    >
                        {generatingBulk ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                        ) : (
                            <>
                                <Zap size={14} color="#FFFFFF" />
                                <Text style={styles.headerBulkBtnText}>Generate All</Text>
                            </>
                        )}
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
                {/* Admin Month & Year Navigator */}
                {isAdmin && (
                    <View style={styles.monthNavigator}>
                        <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                            <ChevronLeft size={20} color={colors.textPrimary} />
                        </TouchableOpacity>

                        <View style={styles.monthCenter}>
                            <Calendar size={16} color={colors.primary} />
                            <Text style={styles.monthTitleText}>
                                {MONTH_NAMES[selectedMonth]} {selectedYear}
                            </Text>
                        </View>

                        <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                            <ChevronRight size={20} color={colors.textPrimary} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Admin Payroll KPI Dashboard */}
                {isAdmin && adminKpis && (
                    <View style={styles.kpiContainer}>
                        <View style={styles.kpiMainCard}>
                            <View style={styles.kpiMainHeader}>
                                <Text style={styles.kpiMainLabel}>Total Net Payroll</Text>
                                <View style={styles.kpiPill}>
                                    <Text style={styles.kpiPillText}>
                                        {adminKpis.generatedCount} / {adminKpis.totalEmployeesCount || adminKpis.generatedCount} Staff
                                    </Text>
                                </View>
                            </View>
                            <Text style={styles.kpiMainValue}>
                                ₹{(adminKpis.totalNetPayroll || 0).toLocaleString('en-IN')}
                            </Text>

                            <View style={styles.kpiSplitRow}>
                                <View style={styles.kpiSplitItem}>
                                    <Text style={styles.kpiSplitLabel}>Gross Total</Text>
                                    <Text style={styles.kpiSplitValue}>
                                        ₹{(adminKpis.totalGrossSalary || 0).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                                <View style={styles.kpiSplitDivider} />
                                <View style={styles.kpiSplitItem}>
                                    <Text style={styles.kpiSplitLabel}>Deductions</Text>
                                    <Text style={[styles.kpiSplitValue, { color: '#DC2626' }]}>
                                        -₹{(adminKpis.totalDeductions || 0).toLocaleString('en-IN')}
                                    </Text>
                                </View>
                            </View>
                        </View>

                        {/* Search & Status Filters */}
                        <View style={styles.searchBox}>
                            <Search size={18} color={colors.textMuted} />
                            <TextInput
                                placeholder="Search staff by name or ID..."
                                placeholderTextColor={colors.textMuted}
                                value={searchQuery}
                                onChangeText={setSearchQuery}
                                style={styles.searchInput}
                            />
                            {searchQuery.length > 0 && (
                                <TouchableOpacity onPress={() => setSearchQuery('')}>
                                    <X size={16} color={colors.textMuted} />
                                </TouchableOpacity>
                            )}
                        </View>

                        <View style={styles.filterTabsRow}>
                            {[
                                { key: 'ALL', label: 'All Payslips' },
                                { key: 'Generated', label: 'Generated' },
                                { key: 'Paid', label: 'Paid' }
                            ].map((tab) => (
                                <TouchableOpacity
                                    key={tab.key}
                                    style={[
                                        styles.filterTabPill,
                                        statusFilter === tab.key && styles.filterTabPillActive
                                    ]}
                                    onPress={() => setStatusFilter(tab.key)}
                                >
                                    <Text
                                        style={[
                                            styles.filterTabPillText,
                                            statusFilter === tab.key && styles.filterTabPillTextActive
                                        ]}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                )}

                {/* Section Header */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                        {isAdmin ? 'Staff Payslips' : 'Issued Payslips'}
                    </Text>
                    <Text style={styles.sectionCount}>
                        {isAdmin
                            ? `${filteredAdminPayslips.length} payslips`
                            : `${employeePayslips.length} records`}
                    </Text>
                </View>

                {/* Loading Indicator */}
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading payslips...</Text>
                    </View>
                ) : isAdmin ? (
                    /* ----------------- ADMIN LIST ----------------- */
                    filteredAdminPayslips.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <ReceiptText size={42} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>No Payslips for this Month</Text>
                            <Text style={styles.emptySubtitle}>
                                Tap "Generate All" above to automatically calculate payroll from attendance records.
                            </Text>
                            <TouchableOpacity
                                style={styles.emptyGenBtn}
                                onPress={handleBulkGenerate}
                                activeOpacity={0.7}
                            >
                                <Zap size={16} color="#FFFFFF" />
                                <Text style={styles.emptyGenBtnText}>⚡ Generate All Payslips</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.payslipsList}>
                            {filteredAdminPayslips.map((p) => {
                                const isPaid = p.paymentStatus === 'Paid';
                                const initial = (p.employeeName || 'E').charAt(0).toUpperCase();

                                return (
                                    <View key={p._id} style={styles.adminPayslipCard}>
                                        <TouchableOpacity 
                                            style={styles.adminCardHeader} 
                                            onPress={() => setSelectedPayslip(p)}
                                            activeOpacity={0.7}
                                        >
                                            <Avatar
                                                uri={p.employee?.profilePicture || p.profilePicture}
                                                name={p.employeeName}
                                                size={36}
                                                bgColor="#EFF6FF"
                                                textColor="#1E60FF"
                                                borderColor="#BFDBFE"
                                                borderWidth={1}
                                            />
                                            <View style={styles.empInfoCol}>
                                                <Text style={styles.empNameText}>{p.employeeName}</Text>
                                                <Text style={styles.empMetaText}>
                                                    {p.employeeId} • {p.designation || 'Staff'}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.paymentStatusBadge,
                                                    isPaid ? styles.paidBadge : styles.generatedBadge
                                                ]}
                                            >
                                                <Text
                                                    style={[
                                                        styles.paymentStatusBadgeText,
                                                        isPaid ? styles.paidBadgeText : styles.generatedBadgeText
                                                    ]}
                                                >
                                                    {p.paymentStatus || 'Generated'} {isPaid ? '✓' : '⚡'}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Salary Breakdown Bar */}
                                        <TouchableOpacity 
                                            style={styles.salaryGrid} 
                                            onPress={() => setSelectedPayslip(p)}
                                            activeOpacity={0.7}
                                        >
                                            <View style={styles.salaryCol}>
                                                <Text style={styles.salaryColLabel}>Basic / Gross</Text>
                                                <Text style={styles.salaryColValue}>
                                                    ₹{(p.grossSalary || p.monthlySalary || 0).toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                            <View style={styles.salaryCol}>
                                                <Text style={styles.salaryColLabel}>Deductions</Text>
                                                <Text style={[styles.salaryColValue, { color: '#DC2626' }]}>
                                                    -₹{(p.totalDeduction || 0).toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                            <View style={styles.salaryCol}>
                                                <Text style={styles.salaryColLabel}>Net Pay</Text>
                                                <Text style={[styles.salaryColValue, { color: '#059669', fontWeight: '800' }]}>
                                                    ₹{(p.netSalary || 0).toLocaleString('en-IN')}
                                                </Text>
                                            </View>
                                        </TouchableOpacity>

                                        {/* Attendance Summary Strip */}
                                        <TouchableOpacity 
                                            style={styles.attendStrip}
                                            onPress={() => setSelectedPayslip(p)}
                                            activeOpacity={0.7}
                                        >
                                            <Text style={styles.attendStripText}>
                                                Present: {p.presentDays || 0}d • Half: {p.halfDays || 0}d • Absent: {p.absentDays || 0}d • Paid: {p.paidDays || 0}d
                                            </Text>
                                            {p.bonus > 0 && (
                                                <Text style={styles.bonusTag}>+₹{p.bonus} Bonus</Text>
                                            )}
                                        </TouchableOpacity>

                                        {/* Action Bar */}
                                        <View style={styles.cardActionRow}>
                                            <TouchableOpacity
                                                style={[styles.cardActionBtn, { backgroundColor: colors.primaryLight }]}
                                                onPress={() => setSelectedPayslip(p)}
                                                activeOpacity={0.7}
                                            >
                                                <Eye size={14} color={colors.primary} />
                                                <Text style={[styles.cardActionBtnText, { color: colors.primary }]}>View</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.cardActionBtn}
                                                onPress={() => handleOpenEditModal(p)}
                                                activeOpacity={0.7}
                                            >
                                                <Pencil size={14} color="#475569" />
                                                <Text style={[styles.cardActionBtnText, { color: '#475569' }]}>Adjust</Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.cardActionBtn}
                                                onPress={() => handleRegenerate(p)}
                                                activeOpacity={0.7}
                                            >
                                                <RefreshCw size={14} color="#059669" />
                                                <Text style={[styles.cardActionBtnText, { color: '#059669' }]}>
                                                    Sync Logs
                                                </Text>
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.cardActionBtn}
                                                onPress={() => handleDownloadPdf(p._id)}
                                                disabled={downloadingPdfId === p._id}
                                                activeOpacity={0.7}
                                            >
                                                {downloadingPdfId === p._id ? (
                                                    <ActivityIndicator size="small" color={colors.primary} />
                                                ) : (
                                                    <>
                                                        <Download size={14} color={colors.textSecondary} />
                                                        <Text style={[styles.cardActionBtnText, { color: colors.textSecondary }]}>
                                                            PDF
                                                        </Text>
                                                    </>
                                                )}
                                            </TouchableOpacity>

                                            <TouchableOpacity
                                                style={styles.trashBtn}
                                                onPress={() => handleDeletePayslip(p)}
                                                activeOpacity={0.7}
                                            >
                                                <Trash2 size={15} color="#DC2626" />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )
                ) : (
                    /* ----------------- EMPLOYEE LIST ----------------- */
                    employeePayslips.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <ReceiptText size={40} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>No Published Payslips Yet</Text>
                            <Text style={styles.emptySubtitle}>
                                Your generated payslips will appear here once finalized by HR.
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.payslipsList}>
                            {employeePayslips.map((p) => {
                                const monthName = MONTH_NAMES[p.month] || `Month ${p.month}`;

                                return (
                                    <TouchableOpacity 
                                        key={p._id} 
                                        style={styles.payslipCard}
                                        onPress={() => setSelectedPayslip(p)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.cardMainCol}>
                                            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                                                <Text style={styles.monthYearTitle}>
                                                    {monthName} {p.year}
                                                </Text>
                                                <View style={styles.generatedBadge}>
                                                    <Text style={styles.generatedBadgeText}>
                                                        {p.paymentStatus || 'Generated'} ✓
                                                    </Text>
                                                </View>
                                            </View>
                                            
                                            <Text style={styles.netSalaryLabel}>Net Disbursed Salary</Text>
                                            <Text style={styles.netSalaryValue}>
                                                ₹{(p.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>

                                            {/* Attendance Snapshot Strip */}
                                            <View style={[styles.attendStrip, { marginTop: 4, marginBottom: 0 }]}>
                                                <Text style={styles.attendStripText}>
                                                    Present: {p.presentDays || 0}d • Half: {p.halfDays || 0}d • Absent: {p.absentDays || 0}d • Paid: {p.paidDays || 0}d
                                                </Text>
                                            </View>
                                        </View>

                                        <View style={[styles.viewBtn, { marginLeft: 10 }]}>
                                            <Text style={styles.viewBtnText}>Details</Text>
                                            <ChevronRight size={16} color={colors.primary} />
                                        </View>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )
                )}
            </ScrollView>

            {/* Admin: Edit / Adjustment Modal */}
            <Modal
                visible={editModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setEditModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <View>
                                <Text style={styles.modalTitle}>Adjust Payslip</Text>
                                <Text style={styles.modalSubtitle}>
                                    {editingPayslip?.employeeName} ({editingPayslip?.employeeId})
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setEditModalOpen(false)} style={styles.closeBtn}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            {/* Bonus */}
                            <Text style={styles.formLabel}>Performance Bonus (₹)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                value={formBonus}
                                onChangeText={setFormBonus}
                            />

                            {/* Incentive */}
                            <Text style={styles.formLabel}>Incentives / Overtime (₹)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                value={formIncentive}
                                onChangeText={setFormIncentive}
                            />

                            {/* Other Deductions */}
                            <Text style={styles.formLabel}>Other Deductions / Advance (₹)</Text>
                            <TextInput
                                style={styles.formInput}
                                placeholder="0"
                                placeholderTextColor={colors.textMuted}
                                keyboardType="numeric"
                                value={formOtherDeductions}
                                onChangeText={setFormOtherDeductions}
                            />

                            {/* Payment Status Picker */}
                            <Text style={styles.formLabel}>Payment Status</Text>
                            <View style={styles.statusChoiceRow}>
                                {['Generated', 'Paid'].map((st) => (
                                    <TouchableOpacity
                                        key={st}
                                        style={[
                                            styles.statusChoiceBtn,
                                            formPaymentStatus === st && styles.statusChoiceBtnActive
                                        ]}
                                        onPress={() => setFormPaymentStatus(st)}
                                    >
                                        <Text
                                            style={[
                                                styles.statusChoiceBtnText,
                                                formPaymentStatus === st && styles.statusChoiceBtnTextActive
                                            ]}
                                        >
                                            {st}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </View>

                            {/* Remarks */}
                            <Text style={styles.formLabel}>HR Remarks / Note (Optional)</Text>
                            <TextInput
                                style={[styles.formInput, { height: 64, textAlignVertical: 'top' }]}
                                placeholder="Notes on bonus or deductions..."
                                placeholderTextColor={colors.textMuted}
                                value={formRemarks}
                                onChangeText={setFormRemarks}
                                multiline
                            />

                            <Button
                                title="Save Adjustments"
                                onPress={handleSaveAdjustments}
                                loading={actionLoading}
                                style={styles.modalSaveBtn}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Employee / Admin: Payslip Detail Modal with Complete Attendance Breakdown */}
            <Modal
                visible={!!selectedPayslip}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedPayslip(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <TouchableOpacity onPress={() => setSelectedPayslip(null)} style={styles.closeBtn}>
                                <ChevronLeft size={22} color={colors.textPrimary} />
                            </TouchableOpacity>
                            <View style={{ flex: 1, alignItems: 'center' }}>
                                <Text style={styles.modalTitle}>
                                    {selectedPayslip?.employeeName || 'Staff'} Payslip
                                </Text>
                                <Text style={styles.modalSubtitle}>
                                    {MONTH_NAMES[selectedPayslip?.month]} {selectedPayslip?.year} • {selectedPayslip?.employeeId}
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => setSelectedPayslip(null)} style={styles.closeBtn}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedPayslip && (
                            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
                                {/* Net Pay Highlight */}
                                <View style={styles.netPayHighlightCard}>
                                    <Text style={styles.netPayHighlightLabel}>Net Disbursed Salary</Text>
                                    <Text style={styles.netPayHighlightAmount}>
                                        ₹{(selectedPayslip.netSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                    </Text>
                                    <View style={styles.paidBadgePill}>
                                        <Text style={styles.paidBadgePillText}>
                                            Status: {selectedPayslip.paymentStatus || 'Generated'} ✓
                                        </Text>
                                    </View>
                                </View>

                                {/* 1. Attendance Breakdown Section */}
                                <Text style={styles.breakdownSectionTitle}>Attendance Summary ({MONTH_NAMES[selectedPayslip.month]} {selectedPayslip.year})</Text>
                                <View style={styles.attendanceGrid}>
                                    <View style={styles.attendGridCell}>
                                        <Text style={styles.attendGridLabel}>Month Days</Text>
                                        <Text style={styles.attendGridVal}>
                                            {new Date(selectedPayslip.year, selectedPayslip.month, 0).getDate()}
                                        </Text>
                                    </View>

                                    <View style={styles.attendGridCell}>
                                        <Text style={styles.attendGridLabel}>Office Days</Text>
                                        <Text style={styles.attendGridVal}>
                                            {selectedPayslip.totalWorkingDays || selectedPayslip.workingDays || 0}
                                        </Text>
                                    </View>

                                    <View style={[styles.attendGridCell, { backgroundColor: '#EEF2FF' }]}>
                                        <Text style={[styles.attendGridLabel, { color: '#4338CA' }]}>Off/Holidays</Text>
                                        <Text style={[styles.attendGridVal, { color: '#312E81' }]}>
                                            {(selectedPayslip.weeklyOffDays || 0) + (selectedPayslip.holidayDays || 0)}
                                        </Text>
                                    </View>

                                    <View style={[styles.attendGridCell, { backgroundColor: '#ECFDF5' }]}>
                                        <Text style={[styles.attendGridLabel, { color: '#065F46' }]}>Present</Text>
                                        <Text style={[styles.attendGridVal, { color: '#047857' }]}>
                                            {selectedPayslip.presentDays || 0}
                                        </Text>
                                    </View>

                                    <View style={[styles.attendGridCell, { backgroundColor: '#FAF5FF' }]}>
                                        <Text style={[styles.attendGridLabel, { color: '#7E22CE' }]}>Paid Leave</Text>
                                        <Text style={[styles.attendGridVal, { color: '#6B21A8' }]}>
                                            +{selectedPayslip.paidLeaveDays || 0} PL
                                        </Text>
                                    </View>

                                    <View style={[styles.attendGridCell, { backgroundColor: '#FFFBEB' }]}>
                                        <Text style={[styles.attendGridLabel, { color: '#B45309' }]}>Half Days</Text>
                                        <Text style={[styles.attendGridVal, { color: '#92400E' }]}>
                                            {selectedPayslip.halfDays || 0}
                                        </Text>
                                    </View>

                                    <View style={[styles.attendGridCell, { backgroundColor: '#FFF1F2' }]}>
                                        <Text style={[styles.attendGridLabel, { color: '#BE123C' }]}>Absent</Text>
                                        <Text style={[styles.attendGridVal, { color: '#9F1239' }]}>
                                            {selectedPayslip.absentDays || 0}
                                        </Text>
                                    </View>

                                    <View style={[styles.attendGridCell, { backgroundColor: '#EFF6FF', borderColor: '#93C5FD', borderWidth: 1 }]}>
                                        <Text style={[styles.attendGridLabel, { color: '#1E40AF', fontWeight: '800' }]}>Paid Days</Text>
                                        <Text style={[styles.attendGridVal, { color: '#1E3A8A', fontWeight: '900' }]}>
                                            {selectedPayslip.paidDays || 0}
                                        </Text>
                                    </View>
                                </View>

                                {/* Formula note */}
                                <View style={styles.formulaNoteBox}>
                                    <Text style={styles.formulaNoteText}>
                                        💡 Paid Days ({selectedPayslip.paidDays}): {selectedPayslip.presentDays || 0} Present + {(selectedPayslip.weeklyOffDays || 0) + (selectedPayslip.holidayDays || 0)} Weekends/Holidays + {selectedPayslip.paidLeaveDays || 0} PL {selectedPayslip.halfDays > 0 ? `+ ${(selectedPayslip.halfDays * 0.5)} Half Days` : ''} = {selectedPayslip.paidDays} Days Credited.
                                    </Text>
                                </View>

                                {/* 2. Earnings Section */}
                                <Text style={styles.breakdownSectionTitle}>Earnings & Base Rate</Text>
                                <View style={styles.breakdownBox}>
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>Basic Monthly Salary</Text>
                                        <Text style={styles.breakdownVal}>
                                            ₹{(selectedPayslip.monthlySalary || selectedPayslip.basicSalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>Per Day Salary Rate</Text>
                                        <Text style={[styles.breakdownVal, { color: colors.textSecondary }]}>
                                            ₹{(selectedPayslip.perDaySalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}/day
                                        </Text>
                                    </View>
                                    {selectedPayslip.bonus > 0 && (
                                        <View style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>Performance Bonus</Text>
                                            <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                                                +₹{(selectedPayslip.bonus).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedPayslip.incentive > 0 && (
                                        <View style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>Incentive / Allowance</Text>
                                            <Text style={[styles.breakdownVal, { color: '#059669' }]}>
                                                +₹{(selectedPayslip.incentive).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                                        <Text style={[styles.breakdownLabel, { fontWeight: '700', color: colors.textPrimary }]}>Total Gross Salary</Text>
                                        <Text style={[styles.breakdownVal, { color: '#059669', fontWeight: '800' }]}>
                                            ₹{(selectedPayslip.grossSalary || selectedPayslip.monthlySalary || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                </View>

                                {/* 3. Deductions Section */}
                                <Text style={styles.breakdownSectionTitle}>Attendance Deductions</Text>
                                <View style={styles.breakdownBox}>
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>
                                            Absent Deduction ({selectedPayslip.absentDays || 0}d - PL)
                                        </Text>
                                        <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                                            -₹{(selectedPayslip.absentDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    <View style={styles.breakdownRow}>
                                        <Text style={styles.breakdownLabel}>
                                            Half-Day Deduction ({selectedPayslip.halfDays || 0}d @ 50%)
                                        </Text>
                                        <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                                            -₹{(selectedPayslip.halfDayDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                    {selectedPayslip.lateDeduction > 0 && (
                                        <View style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>
                                                Late Check-in Deduction ({selectedPayslip.lateDays || 0}d @ 25%)
                                            </Text>
                                            <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                                                -₹{(selectedPayslip.lateDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    )}
                                    {selectedPayslip.otherDeductions > 0 && (
                                        <View style={styles.breakdownRow}>
                                            <Text style={styles.breakdownLabel}>Other Deductions / Advance</Text>
                                            <Text style={[styles.breakdownVal, { color: '#DC2626' }]}>
                                                -₹{(selectedPayslip.otherDeductions).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={[styles.breakdownRow, { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 8, marginTop: 4 }]}>
                                        <Text style={[styles.breakdownLabel, { fontWeight: '700', color: colors.textPrimary }]}>Total Deductions</Text>
                                        <Text style={[styles.breakdownVal, { color: '#DC2626', fontWeight: '800' }]}>
                                            -₹{(selectedPayslip.totalDeduction || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                                        </Text>
                                    </View>
                                </View>

                                {selectedPayslip.remarks ? (
                                    <View style={styles.remarksBox}>
                                        <Text style={styles.remarksLabel}>HR Remarks / Note:</Text>
                                        <Text style={styles.remarksText}>{selectedPayslip.remarks}</Text>
                                    </View>
                                ) : null}

                                <Button
                                    title="Download PDF Payslip"
                                    onPress={() => handleDownloadPdf(selectedPayslip._id)}
                                    loading={downloadingPdfId === selectedPayslip._id}
                                    style={styles.modalSaveBtn}
                                />
                            </ScrollView>
                        )}
                    </View>
                </View>
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
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    adminBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    adminBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E60FF'
    },
    headerBulkBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10
    },
    headerBulkBtnText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: '700'
    },
    content: {
        paddingHorizontal: 16,
        paddingTop: 14,
        paddingBottom: 32
    },
    /* Month Navigator */
    monthNavigator: {
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
    navBtn: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    monthCenter: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    monthTitleText: {
        fontSize: 15,
        fontWeight: '800',
        color: colors.textPrimary
    },
    /* KPI Card */
    kpiContainer: {
        marginBottom: 14
    },
    kpiMainCard: {
        backgroundColor: colors.surface,
        borderRadius: 18,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border,
        marginBottom: 12
    },
    kpiMainHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    kpiMainLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary
    },
    kpiPill: {
        backgroundColor: '#EFF6FF',
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: '#BFDBFE'
    },
    kpiPillText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E60FF'
    },
    kpiMainValue: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.textPrimary,
        marginVertical: 6
    },
    kpiSplitRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 12,
        padding: 10,
        marginTop: 6
    },
    kpiSplitItem: {
        flex: 1
    },
    kpiSplitLabel: {
        fontSize: 10,
        color: colors.textSecondary
    },
    kpiSplitValue: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 2
    },
    kpiSplitDivider: {
        width: 1,
        height: 24,
        backgroundColor: colors.border,
        marginHorizontal: 12
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 42,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
        marginBottom: 10
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: colors.textPrimary
    },
    filterTabsRow: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 10,
        padding: 3,
        gap: 4
    },
    filterTabPill: {
        flex: 1,
        paddingVertical: 6,
        alignItems: 'center',
        borderRadius: 8
    },
    filterTabPillActive: {
        backgroundColor: colors.surface,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 1
    },
    filterTabPillText: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary
    },
    filterTabPillTextActive: {
        color: colors.primary,
        fontWeight: '700'
    },
    sectionHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 10,
        marginTop: 4
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '800',
        color: colors.textPrimary
    },
    sectionCount: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted
    },
    loadingBox: {
        paddingVertical: 36,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8
    },
    loadingText: {
        fontSize: 13,
        color: colors.textSecondary
    },
    emptyCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 28,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border,
        marginVertical: 12
    },
    emptyTitle: {
        fontSize: 15,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 10,
        marginBottom: 4
    },
    emptySubtitle: {
        fontSize: 12,
        color: colors.textSecondary,
        textAlign: 'center',
        marginBottom: 16
    },
    emptyGenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: colors.primary,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 12
    },
    emptyGenBtnText: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '700'
    },
    payslipsList: {
        gap: 10
    },
    /* Admin Payslip Card */
    adminPayslipCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border
    },
    adminCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderBottomWidth: 1,
        borderBottomColor: colors.surfaceSubtle,
        paddingBottom: 10,
        marginBottom: 10
    },
    empAvatarCircle: {
        width: 34,
        height: 34,
        borderRadius: 17,
        backgroundColor: '#EFF6FF',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 1,
        borderColor: '#BFDBFE'
    },
    empAvatarText: {
        fontSize: 14,
        fontWeight: '800',
        color: '#1E60FF'
    },
    empInfoCol: {
        flex: 1
    },
    empNameText: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    empMetaText: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 1
    },
    paymentStatusBadge: {
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 6,
        borderWidth: 1
    },
    paidBadge: {
        backgroundColor: '#ECFDF5',
        borderColor: '#A7F3D0'
    },
    paidBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669'
    },
    generatedBadge: {
        backgroundColor: '#EFF6FF',
        borderColor: '#BFDBFE'
    },
    generatedBadgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#1E60FF'
    },
    salaryGrid: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 12,
        padding: 10,
        marginBottom: 8
    },
    salaryCol: {
        flex: 1,
        alignItems: 'center'
    },
    salaryColLabel: {
        fontSize: 10,
        color: colors.textSecondary
    },
    salaryColValue: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 2
    },
    attendStrip: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 10,
        paddingHorizontal: 2
    },
    attendStripText: {
        fontSize: 11,
        color: colors.textMuted
    },
    bonusTag: {
        fontSize: 10,
        fontWeight: '700',
        color: '#059669',
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 6,
        paddingVertical: 1,
        borderRadius: 4
    },
    cardActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceSubtle,
        paddingTop: 8
    },
    cardActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 8,
        paddingVertical: 6,
        borderRadius: 8
    },
    cardActionBtnText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary
    },
    trashBtn: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: '#FEF2F2',
        marginLeft: 'auto'
    },
    /* Employee Card */
    payslipCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 16,
        borderWidth: 1,
        borderColor: colors.border
    },
    cardMainCol: {
        flex: 1
    },
    monthYearTitle: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.textPrimary,
        marginBottom: 4
    },
    netSalaryLabel: {
        fontSize: 11,
        color: colors.textSecondary
    },
    netSalaryValue: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginVertical: 2
    },
    viewBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10
    },
    viewBtnText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary
    },
    /* Modal Styles */
    modalOverlay: {
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
        maxHeight: '85%'
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
    modalTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary
    },
    modalSubtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2
    },
    closeBtn: {
        padding: 4
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 6,
        marginTop: 8
    },
    formInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        paddingHorizontal: 12,
        height: 44,
        fontSize: 13,
        color: colors.textPrimary
    },
    statusChoiceRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 8
    },
    statusChoiceBtn: {
        flex: 1,
        paddingVertical: 10,
        alignItems: 'center',
        borderRadius: 10,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border
    },
    statusChoiceBtnActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#1E60FF'
    },
    statusChoiceBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary
    },
    statusChoiceBtnTextActive: {
        color: '#1E60FF',
        fontWeight: '700'
    },
    modalSaveBtn: {
        backgroundColor: colors.primary,
        height: 48,
        borderRadius: 12,
        marginTop: 16
    },
    netPayHighlightCard: {
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 16,
        padding: 16,
        alignItems: 'center',
        marginVertical: 10
    },
    netPayHighlightLabel: {
        fontSize: 12,
        color: colors.textSecondary
    },
    netPayHighlightAmount: {
        fontSize: 26,
        fontWeight: '800',
        color: colors.textPrimary,
        marginVertical: 4
    },
    paidBadgePill: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 10,
        paddingVertical: 3,
        borderRadius: 8
    },
    paidBadgePillText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669'
    },
    breakdownSectionTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 12,
        marginBottom: 6
    },
    breakdownBox: {
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8
    },
    breakdownRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    breakdownLabel: {
        fontSize: 12,
        color: colors.textSecondary
    },
    breakdownVal: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    /* Attendance Breakdown Grid */
    attendanceGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: 6,
        marginBottom: 8
    },
    attendGridCell: {
        flexBasis: '23%',
        flexGrow: 1,
        backgroundColor: colors.background,
        borderRadius: 10,
        paddingVertical: 8,
        paddingHorizontal: 4,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.border
    },
    attendGridLabel: {
        fontSize: 9.5,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        textAlign: 'center'
    },
    attendGridVal: {
        fontSize: 13,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 2,
        textAlign: 'center'
    },
    formulaNoteBox: {
        backgroundColor: '#F8FAFC',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#E2E8F0',
        marginBottom: 10
    },
    formulaNoteText: {
        fontSize: 10.5,
        color: '#475569',
        lineHeight: 15
    },
    remarksBox: {
        backgroundColor: '#FFFBEB',
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: '#FDE68A',
        marginTop: 10
    },
    remarksLabel: {
        fontSize: 11,
        fontWeight: '700',
        color: '#92400E',
        marginBottom: 2
    },
    remarksText: {
        fontSize: 12,
        color: '#78350F'
    }
});
