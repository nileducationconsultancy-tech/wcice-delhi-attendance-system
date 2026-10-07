import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
    ChevronLeft,
    User,
    Mail,
    Phone,
    Briefcase,
    BadgeCheck,
    Calendar,
    Sparkles,
    Shield,
    Users,
    KeyRound,
    Clock,
    CheckCircle2,
    Hash,
    RefreshCw
} from 'lucide-react-native';
import { colors } from '../../src/constants/colors';
import { useAuthStore } from '../../src/store/authStore';
import { adminApi } from '../../src/api/adminApi';
import Input from '../../src/components/Input';
import Button from '../../src/components/Button';
import Card from '../../src/components/Card';

const ROLE_OPTIONS = [
    { label: 'Employee', value: 'EMPLOYEE', description: 'Standard Staff Punch & Portal' },
    { label: 'HR Manager', value: 'HR', description: 'Leave & Attendance Verification' },
    { label: 'Administrator', value: 'ADMIN', description: 'Full Admin Operations' }
];

const SCHEDULE_OPTIONS = [
    {
        label: '6 Days Week',
        value: '6_DAYS',
        sub: 'Mon – Sat working (Sunday OFF) — Standard'
    },
    {
        label: '5 Days Week',
        value: '5_DAYS',
        sub: 'Mon – Fri working (Sat & Sun OFF)'
    }
];

export default function AddEmployeeScreen() {
    const router = useRouter();
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR';

    const todayStr = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState({
        employeeId: '',
        name: '',
        email: '',
        phone: '',
        designation: '',
        role: 'EMPLOYEE',
        workSchedule: '6_DAYS',
        baseSalary: '',
        joiningDate: todayStr
    });

    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [fetchingId, setFetchingId] = useState(false);

    const fetchNextSequentialId = useCallback(async (showFeedback = false) => {
        try {
            setFetchingId(true);
            const res = await adminApi.getNextEmployeeId();
            if (res?.nextEmployeeId) {
                setFormData(prev => ({ ...prev, employeeId: res.nextEmployeeId }));
                if (showFeedback) {
                    Alert.alert('Sequential ID Assigned', `Next sequential ID is: ${res.nextEmployeeId}`);
                }
            } else {
                // Fallback if backend returns null
                setFormData(prev => ({ ...prev, employeeId: prev.employeeId || 'WECICE-EMP-001' }));
            }
        } catch (err) {
            console.error('Failed to get next employee id:', err);
            // Fallback: try to deduce from all employees list
            try {
                const empsRes = await adminApi.getAllEmployees();
                const emps = empsRes?.employees || [];
                let maxNum = 0;
                let prefix = 'WECICE-EMP-';
                let padLen = 3;
                for (const e of emps) {
                    if (!e.employeeId) continue;
                    const m = e.employeeId.trim().match(/^(.*?)(\d+)$/);
                    if (m) {
                        const num = parseInt(m[2], 10);
                        if (!isNaN(num) && num > maxNum) {
                            maxNum = num;
                            if (m[1]) prefix = m[1];
                            if (m[2].length > padLen) padLen = m[2].length;
                        }
                    }
                }
                const nextId = `${prefix}${String(maxNum + 1).padStart(padLen, '0')}`;
                setFormData(prev => ({ ...prev, employeeId: nextId }));
            } catch (fallbackErr) {
                setFormData(prev => ({ ...prev, employeeId: prev.employeeId || 'WECICE-EMP-001' }));
            }
        } finally {
            setFetchingId(false);
        }
    }, []);

    // Automatically load next sequential Employee ID on screen mount
    useEffect(() => {
        if (isAdmin) {
            fetchNextSequentialId();
        }
    }, [isAdmin, fetchNextSequentialId]);

    // Prevent non-admin access
    if (!isAdmin) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <View style={styles.unauthContainer}>
                    <Shield size={48} color={colors.danger} />
                    <Text style={styles.unauthTitle}>Access Restricted</Text>
                    <Text style={styles.unauthSub}>
                        Only Super Admins, Administrators, and HR managers can add employees.
                    </Text>
                    <Button
                        title="Go Back"
                        onPress={() => router.back()}
                        style={{ marginTop: 20 }}
                    />
                </View>
            </SafeAreaView>
        );
    }

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: null }));
        }
    };

    const validate = () => {
        const newErrors = {};
        if (!formData.employeeId.trim()) {
            newErrors.employeeId = 'Employee ID is required (e.g. WECICE-EMP-001)';
        }
        if (!formData.name.trim()) {
            newErrors.name = 'Full name is required';
        }
        if (!formData.email.trim()) {
            newErrors.email = 'Email address is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email.trim())) {
            newErrors.email = 'Enter a valid email address';
        }
        if (!formData.joiningDate.trim()) {
            newErrors.joiningDate = 'Joining date is required (YYYY-MM-DD)';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            Alert.alert('Incomplete Form', 'Please complete all required fields highlighted in red.');
            return;
        }

        try {
            setLoading(true);

            const payload = {
                employeeId: formData.employeeId.trim().toUpperCase(),
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                designation: formData.designation.trim() || 'Staff Member',
                role: formData.role,
                workSchedule: formData.workSchedule,
                baseSalary: formData.baseSalary ? Number(formData.baseSalary) : 0,
                joiningDate: formData.joiningDate.trim()
            };

            const response = await adminApi.createEmployee(payload);
            const defaultPass = payload.phone && payload.phone.trim() 
                ? payload.phone.trim().replace(/\s+/g, '') 
                : '123456';

            Alert.alert(
                'Employee Registered 🎉',
                `Employee "${payload.name}" (${payload.employeeId}) has been successfully created.\n\n• Login Email: ${payload.email}\n• Default Password: ${defaultPass}`,
                [
                    {
                        text: 'Add Another',
                        onPress: () => {
                            setFormData({
                                employeeId: '',
                                name: '',
                                email: '',
                                phone: '',
                                designation: '',
                                role: 'EMPLOYEE',
                                workSchedule: '6_DAYS',
                                baseSalary: '',
                                joiningDate: todayStr
                            });
                            // Fetch fresh next ID for next employee
                            fetchNextSequentialId();
                        }
                    },
                    {
                        text: 'Done',
                        style: 'default',
                        onPress: () => router.back()
                    }
                ]
            );
        } catch (error) {
            console.error('Failed to create employee:', error);
            const msg = error.response?.data?.message || error.message || 'Failed to create employee';
            Alert.alert('Creation Error', msg);
        } finally {
            setLoading(false);
        }
    };

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

                <View style={styles.headerTitleContainer}>
                    <Text style={styles.headerTitle}>Add New Employee</Text>
                    <Text style={styles.headerSub}>Register staff member & credentials</Text>
                </View>

                <View style={{ width: 28 }} />
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                style={{ flex: 1 }}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                    keyboardShouldPersistTaps="handled"
                >
                    {/* Info Card */}
                    <View style={styles.noticeBanner}>
                        <View style={styles.noticeIconCircle}>
                            <KeyRound size={16} color="#1E60FF" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.noticeTitle}>Auto-Provisioned Credentials</Text>
                            <Text style={styles.noticeText}>
                                The new employee can log into this mobile app using their email. Default password will be their phone number (or 123456).
                            </Text>
                        </View>
                    </View>

                    {/* Section 1: Account Information */}
                    <Text style={styles.sectionLabel}>Account & Personal Details</Text>
                    <Card style={styles.formCard}>
                        {/* Employee ID with Auto-Sequential Generation */}
                        <View style={styles.fieldHeaderRow}>
                            <View style={styles.fieldLabelWithBadge}>
                                <Text style={styles.inputLabel}>Employee ID *</Text>
                                <View style={styles.autoAssignedBadge}>
                                    <Sparkles size={10} color="#059669" />
                                    <Text style={styles.autoAssignedBadgeText}>Auto</Text>
                                </View>
                            </View>
                            <TouchableOpacity
                                onPress={() => fetchNextSequentialId(true)}
                                style={styles.autoGenBtn}
                                activeOpacity={0.7}
                                disabled={fetchingId}
                            >
                                {fetchingId ? (
                                    <ActivityIndicator size="small" color={colors.primary} />
                                ) : (
                                    <>
                                        <RefreshCw size={12} color={colors.primary} />
                                        <Text style={styles.autoGenText}>Recalculate</Text>
                                    </>
                                )}
                            </TouchableOpacity>
                        </View>
                        <Input
                            placeholder={fetchingId ? "Calculating next ID..." : "e.g. WECICE-EMP-001"}
                            value={formData.employeeId}
                            onChangeText={val => handleChange('employeeId', val)}
                            autoCapitalize="characters"
                            leftIcon={<Hash size={18} color={colors.textMuted} />}
                            error={errors.employeeId}
                        />

                        {/* Full Name */}
                        <Text style={styles.inputLabel}>Full Name *</Text>
                        <Input
                            placeholder="e.g. John Doe"
                            value={formData.name}
                            onChangeText={val => handleChange('name', val)}
                            autoCapitalize="words"
                            leftIcon={<User size={18} color={colors.textMuted} />}
                            error={errors.name}
                        />

                        {/* Email Address */}
                        <Text style={styles.inputLabel}>Email Address *</Text>
                        <Input
                            placeholder="employee@wecice.com"
                            value={formData.email}
                            onChangeText={val => handleChange('email', val)}
                            keyboardType="email-address"
                            autoCapitalize="none"
                            leftIcon={<Mail size={18} color={colors.textMuted} />}
                            error={errors.email}
                        />

                        {/* Phone Number */}
                        <Text style={styles.inputLabel}>Phone Number</Text>
                        <Input
                            placeholder="e.g. 9876543210"
                            value={formData.phone}
                            onChangeText={val => handleChange('phone', val)}
                            keyboardType="phone-pad"
                            leftIcon={<Phone size={18} color={colors.textMuted} />}
                            error={errors.phone}
                        />
                    </Card>

                    {/* Section 2: Role & Designation */}
                    <Text style={styles.sectionLabel}>Designation & System Role</Text>
                    <Card style={styles.formCard}>
                        {/* Designation */}
                        <Text style={styles.inputLabel}>Job Designation</Text>
                        <Input
                            placeholder="e.g. Academic Counselor / Developer"
                            value={formData.designation}
                            onChangeText={val => handleChange('designation', val)}
                            autoCapitalize="words"
                            leftIcon={<Briefcase size={18} color={colors.textMuted} />}
                        />

                        {/* System Role Selector */}
                        <Text style={styles.inputLabel}>System Access Role *</Text>
                        <View style={styles.roleOptionsContainer}>
                            {ROLE_OPTIONS.map((opt) => {
                                const isSelected = formData.role === opt.value;
                                return (
                                    <TouchableOpacity
                                        key={opt.value}
                                        style={[
                                            styles.roleOptionCard,
                                            isSelected && styles.roleOptionCardSelected
                                        ]}
                                        onPress={() => handleChange('role', opt.value)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.roleHeaderRow}>
                                            <View style={[
                                                styles.roleRadioCircle,
                                                isSelected && styles.roleRadioCircleSelected
                                            ]}>
                                                {isSelected && <View style={styles.roleRadioDot} />}
                                            </View>
                                            <Text style={[
                                                styles.roleOptionTitle,
                                                isSelected && styles.roleOptionTitleSelected
                                            ]}>
                                                {opt.label}
                                            </Text>
                                        </View>
                                        <Text style={styles.roleOptionDesc}>{opt.description}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    </Card>

                    {/* Section 3: Schedule, Compensation & Joining */}
                    <Text style={styles.sectionLabel}>Schedule, Salary & Joining Date</Text>
                    <Card style={styles.formCard}>
                        {/* Work Schedule */}
                        <Text style={styles.inputLabel}>Work Schedule (Working Days) *</Text>
                        <View style={styles.scheduleOptionsContainer}>
                            {SCHEDULE_OPTIONS.map((sch) => {
                                const isSelected = formData.workSchedule === sch.value;
                                return (
                                    <TouchableOpacity
                                        key={sch.value}
                                        style={[
                                            styles.scheduleCard,
                                            isSelected && styles.scheduleCardSelected
                                        ]}
                                        onPress={() => handleChange('workSchedule', sch.value)}
                                        activeOpacity={0.8}
                                    >
                                        <View style={styles.scheduleCardHeader}>
                                            <View style={[
                                                styles.scheduleRadio,
                                                isSelected && styles.scheduleRadioSelected
                                            ]}>
                                                {isSelected && <View style={styles.scheduleRadioDot} />}
                                            </View>
                                            <Text style={[
                                                styles.scheduleTitle,
                                                isSelected && styles.scheduleTitleSelected
                                            ]}>
                                                {sch.label}
                                            </Text>
                                        </View>
                                        <Text style={styles.scheduleSub}>{sch.sub}</Text>
                                    </TouchableOpacity>
                                );
                            })}
                        </View>

                        {/* Monthly Base Salary */}
                        <Text style={styles.inputLabel}>Monthly Base Salary (₹)</Text>
                        <Input
                            placeholder="e.g. 30000"
                            value={formData.baseSalary}
                            onChangeText={val => handleChange('baseSalary', val)}
                            keyboardType="numeric"
                            leftIcon={<Text style={styles.currencySymbol}>₹</Text>}
                        />

                        {/* Joining Date */}
                        <Text style={styles.inputLabel}>Joining Date * (YYYY-MM-DD)</Text>
                        <Input
                            placeholder="YYYY-MM-DD"
                            value={formData.joiningDate}
                            onChangeText={val => handleChange('joiningDate', val)}
                            leftIcon={<Calendar size={18} color={colors.textMuted} />}
                            error={errors.joiningDate}
                        />
                    </Card>

                    {/* Submit Button */}
                    <View style={styles.submitContainer}>
                        <Button
                            title="Register & Add Employee"
                            onPress={handleSubmit}
                            loading={loading}
                            icon={<CheckCircle2 size={18} color="#FFFFFF" />}
                            style={styles.submitBtn}
                        />
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
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
        padding: 6,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle
    },
    headerTitleContainer: {
        alignItems: 'center'
    },
    headerTitle: {
        fontSize: 17,
        fontWeight: '800',
        color: colors.textPrimary
    },
    headerSub: {
        fontSize: 11,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 1
    },
    scrollContent: {
        paddingHorizontal: 16,
        paddingTop: 16,
        paddingBottom: 40
    },
    noticeBanner: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        backgroundColor: '#EFF6FF',
        borderWidth: 1,
        borderColor: '#BFDBFE',
        borderRadius: 14,
        padding: 14,
        gap: 12,
        marginBottom: 16
    },
    noticeIconCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#DBEAFE',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2
    },
    noticeTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: '#1E40AF',
        marginBottom: 2
    },
    noticeText: {
        fontSize: 12,
        lineHeight: 17,
        color: '#1E3A8A'
    },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 8,
        marginLeft: 4
    },
    formCard: {
        padding: 16,
        marginBottom: 20,
        borderRadius: 16,
        backgroundColor: colors.surface
    },
    fieldHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 6
    },
    inputLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        marginBottom: 6
    },
    fieldLabelWithBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6
    },
    autoAssignedBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 3,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 6,
        paddingVertical: 1.5,
        borderRadius: 6
    },
    autoAssignedBadgeText: {
        fontSize: 9,
        fontWeight: '800',
        color: '#059669',
        textTransform: 'uppercase'
    },
    autoGenBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.primaryLight,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: colors.primarySubtle
    },
    autoGenText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary
    },
    currencySymbol: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.textSecondary
    },
    roleOptionsContainer: {
        gap: 8,
        marginTop: 4
    },
    roleOptionCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSubtle
    },
    roleOptionCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight
    },
    roleHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    roleRadioCircle: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: colors.textMuted,
        alignItems: 'center',
        justifyContent: 'center'
    },
    roleRadioCircleSelected: {
        borderColor: colors.primary
    },
    roleRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary
    },
    roleOptionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary
    },
    roleOptionTitleSelected: {
        color: colors.primary
    },
    roleOptionDesc: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 3,
        marginLeft: 28
    },
    scheduleOptionsContainer: {
        gap: 8,
        marginTop: 4,
        marginBottom: 16
    },
    scheduleCard: {
        padding: 12,
        borderRadius: 12,
        borderWidth: 1.5,
        borderColor: colors.border,
        backgroundColor: colors.surfaceSubtle
    },
    scheduleCardSelected: {
        borderColor: colors.primary,
        backgroundColor: colors.primaryLight
    },
    scheduleCardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10
    },
    scheduleRadio: {
        width: 18,
        height: 18,
        borderRadius: 9,
        borderWidth: 2,
        borderColor: colors.textMuted,
        alignItems: 'center',
        justifyContent: 'center'
    },
    scheduleRadioSelected: {
        borderColor: colors.primary
    },
    scheduleRadioDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: colors.primary
    },
    scheduleTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    scheduleTitleSelected: {
        color: colors.primary
    },
    scheduleSub: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 3,
        marginLeft: 28
    },
    submitContainer: {
        marginTop: 8
    },
    submitBtn: {
        height: 52,
        borderRadius: 14,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 4
    },
    unauthContainer: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24
    },
    unauthTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary,
        marginTop: 16,
        marginBottom: 8
    },
    unauthSub: {
        fontSize: 13,
        color: colors.textSecondary,
        textAlign: 'center',
        lineHeight: 18
    }
});
