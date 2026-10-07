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
    Platform,
    Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Linking from 'expo-linking';
import * as DocumentPicker from 'expo-document-picker';
import {
    Search,
    Plus,
    CheckCircle2,
    Clock,
    XCircle,
    ChevronRight,
    CloudUpload,
    FileText,
    X,
    Folder,
    AlertCircle,
    Eye,
    ShieldCheck,
    Check,
    Trash2,
    Filter,
    User,
    Building2
} from 'lucide-react-native';
import documentApi from '../../src/api/documentApi';
import { useAuthStore } from '../../src/store/authStore';
import { colors } from '../../src/constants/colors';
import Card from '../../src/components/Card';
import Button from '../../src/components/Button';
import Avatar from '../../src/components/Avatar';

export default function DocumentsScreen() {
    const { user } = useAuthStore();
    const isAdmin = user?.role === 'SUPER_ADMIN' || user?.role === 'ADMIN' || user?.role === 'HR';

    // Employee States
    const [documentData, setDocumentData] = useState(null);
    const [docTypes, setDocTypes] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Admin States
    const [adminDocs, setAdminDocs] = useState([]);
    const [adminStats, setAdminStats] = useState(null);
    const [adminStatusFilter, setAdminStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED'
    const [actionLoading, setActionLoading] = useState(false);

    // Reject Modal State (Admin)
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectDocId, setRejectDocId] = useState(null);
    const [rejectionReason, setRejectionReason] = useState('');

    // Upload Modal State (Employee)
    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [selectedDocType, setSelectedDocType] = useState('');
    const [title, setTitle] = useState('');
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Detail Modal State (Both)
    const [selectedDoc, setSelectedDoc] = useState(null);

    const fetchAdminDocuments = async () => {
        try {
            setLoading(true);
            const params = {};
            if (adminStatusFilter !== 'ALL') {
                params.status = adminStatusFilter;
            }
            if (searchQuery.trim()) {
                params.search = searchQuery.trim();
            }

            const [docsRes, statsRes] = await Promise.all([
                documentApi.getAllCompanyDocuments(params),
                documentApi.getDocumentStats()
            ]);

            setAdminDocs(docsRes.documents || []);
            setAdminStats(statsRes.stats || null);
        } catch (error) {
            console.error('Failed to load admin documents:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const fetchEmployeeDocuments = async () => {
        try {
            setLoading(true);
            const [docsRes, typesRes] = await Promise.all([
                documentApi.getMyDocuments(),
                documentApi.getDocumentTypes()
            ]);
            setDocumentData(docsRes);
            setDocTypes(typesRes.documentTypes || []);
            if (typesRes.documentTypes?.length > 0 && !selectedDocType) {
                setSelectedDocType(typesRes.documentTypes[0]._id);
            }
        } catch (error) {
            console.error('Failed to load employee documents:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    const loadData = () => {
        if (!user) return;
        if (isAdmin) {
            fetchAdminDocuments();
        } else {
            fetchEmployeeDocuments();
        }
    };

    useEffect(() => {
        if (user) {
            loadData();
        }
    }, [user, isAdmin, adminStatusFilter]);

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        loadData();
    }, [isAdmin, adminStatusFilter, searchQuery]);

    // Admin Action: Accept / Verify
    const handleVerify = (doc) => {
        Alert.alert(
            'Verify Document',
            `Are you sure you want to approve "${doc.documentTypeName || doc.title}" for ${doc.employeeId?.name || 'this employee'}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Verify & Approve',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await documentApi.verifyDocument(doc._id);
                            Alert.alert('Verified ✅', 'Document marked as verified.');
                            loadData();
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.message || 'Failed to verify document.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Admin Action: Open Reject Modal
    const handleOpenRejectModal = (doc) => {
        setRejectDocId(doc._id);
        setRejectionReason('');
        setRejectModalOpen(true);
    };

    // Admin Action: Submit Rejection
    const handleConfirmReject = async () => {
        if (!rejectionReason.trim()) {
            Alert.alert('Reason Required', 'Please provide a reason for rejecting this document.');
            return;
        }

        try {
            setActionLoading(true);
            await documentApi.rejectDocument(rejectDocId, rejectionReason.trim());
            setRejectModalOpen(false);
            setRejectDocId(null);
            setRejectionReason('');
            Alert.alert('Rejected', 'Document marked as rejected with reason.');
            loadData();
        } catch (e) {
            Alert.alert('Error', e.response?.data?.message || 'Failed to reject document.');
        } finally {
            setActionLoading(false);
        }
    };

    // Admin Action: Delete
    const handleDelete = (doc) => {
        Alert.alert(
            'Delete Document',
            `Delete "${doc.documentTypeName || doc.fileName}" permanently?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            setActionLoading(true);
                            await documentApi.deleteDocument(doc._id);
                            Alert.alert('Deleted', 'Document removed successfully.');
                            loadData();
                        } catch (e) {
                            Alert.alert('Error', e.response?.data?.message || 'Failed to delete document.');
                        } finally {
                            setActionLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // Employee File Picker
    const handlePickFile = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: ['application/pdf', 'image/*'],
                copyToCacheDirectory: true
            });

            if (!result.canceled && result.assets && result.assets.length > 0) {
                const asset = result.assets[0];
                setSelectedFile({
                    uri: asset.uri,
                    name: asset.name,
                    type: asset.mimeType || 'application/pdf',
                    size: asset.size
                });
                if (!title) setTitle(asset.name.split('.')[0]);
            }
        } catch (err) {
            Alert.alert('File Picker', err.message);
        }
    };

    // Employee File Upload
    const handleUploadSubmit = async () => {
        if (!selectedFile) {
            Alert.alert('File Required', 'Please select a file to upload.');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('documentTypeId', selectedDocType || docTypes[0]?._id);
            formData.append('title', title.trim() || selectedFile.name);
            formData.append('file', {
                uri: Platform.OS === 'ios' ? selectedFile.uri.replace('file://', '') : selectedFile.uri,
                name: selectedFile.name || 'document.pdf',
                type: selectedFile.type || 'application/pdf'
            });

            await documentApi.uploadDocument(formData);
            Alert.alert('Success 🎉', 'Document uploaded and sent for HR verification.');
            setUploadModalOpen(false);
            setSelectedFile(null);
            setTitle('');
            fetchEmployeeDocuments();
        } catch (error) {
            Alert.alert('Upload Error', error.response?.data?.message || error.message);
        } finally {
            setUploading(false);
        }
    };

    // Preview File
    const handleOpenPreview = async (doc) => {
        try {
            if (doc.fileUrl && doc.fileUrl.startsWith('http')) {
                await Linking.openURL(doc.fileUrl);
            } else {
                const url = await documentApi.getFileStreamUrl(doc._id);
                await Linking.openURL(url);
            }
        } catch (e) {
            Alert.alert('Preview', 'Could not open document preview.');
        }
    };

    const getStatusInfo = (status) => {
        switch (status) {
            case 'VERIFIED':
                return {
                    label: '✓ Verified',
                    bg: colors.successLight,
                    text: colors.success,
                    border: colors.successBorder,
                    icon: <CheckCircle2 size={12} color={colors.success} />
                };
            case 'REJECTED':
                return {
                    label: '✗ Rejected',
                    bg: colors.dangerLight,
                    text: colors.danger,
                    border: colors.dangerBorder,
                    icon: <XCircle size={12} color={colors.danger} />
                };
            case 'PENDING_VERIFICATION':
                return {
                    label: 'Pending Review',
                    bg: colors.warningLight,
                    text: colors.warning,
                    border: colors.warningBorder,
                    icon: <Clock size={12} color={colors.warning} />
                };
            case 'MISSING':
                return {
                    label: 'Missing',
                    bg: colors.surfaceSubtle,
                    text: colors.textMuted,
                    border: colors.border,
                    icon: <AlertCircle size={12} color={colors.textMuted} />
                };
            default:
                return {
                    label: 'Pending Review',
                    bg: colors.warningLight,
                    text: colors.warning,
                    border: colors.warningBorder,
                    icon: <Clock size={12} color={colors.warning} />
                };
        }
    };

    // Employee Data Mapping
    const summary = {
        verified: documentData?.summary?.verifiedCount ?? documentData?.summary?.verified ?? 0,
        pending: documentData?.summary?.pendingCount ?? documentData?.summary?.pending ?? 0,
        rejected: documentData?.summary?.rejectedCount ?? documentData?.summary?.rejected ?? 0
    };

    const employeeDocs = Array.isArray(documentData?.matrix)
        ? documentData.matrix.map((item) => ({
              _id: item.uploadedDocument?._id || item.documentType?._id,
              title: item.documentType?.name || 'Document',
              category: item.documentType?.category,
              status: item.status,
              isRequired: item.documentType?.isRequired,
              fileName: item.uploadedDocument?.fileName,
              fileUrl: item.uploadedDocument?.fileUrl,
              fileType: item.uploadedDocument?.fileType,
              fileSize: item.uploadedDocument?.fileSize,
              rejectionReason: item.uploadedDocument?.rejectionReason,
              createdAt: item.uploadedDocument?.createdAt,
              verifiedAt: item.uploadedDocument?.verifiedAt,
              verifiedByName: item.uploadedDocument?.verifiedByName,
              documentTypeId: item.documentType?._id
          }))
        : Array.isArray(documentData?.documents)
        ? documentData.documents
        : [];

    const filteredEmployeeDocs = employeeDocs.filter((d) =>
        d.title?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredAdminDocs = adminDocs.filter((d) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        const empName = d.employeeId?.name?.toLowerCase() || '';
        const empCode = d.employeeId?.employeeId?.toLowerCase() || '';
        const docName = (d.documentTypeName || d.fileName || '').toLowerCase();
        return empName.includes(q) || empCode.includes(q) || docName.includes(q);
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            {/* Header */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.headerTitle}>
                        {isAdmin ? 'Document Verification Hub' : 'My Documents'}
                    </Text>
                    {isAdmin && (
                        <View style={styles.adminBadgeRow}>
                            <ShieldCheck size={13} color="#1E60FF" />
                            <Text style={styles.adminBadgeText}>Super Admin Review Mode</Text>
                        </View>
                    )}
                </View>
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
                {/* Search Box */}
                <View style={styles.searchBox}>
                    <Search size={18} color={colors.textMuted} />
                    <TextInput
                        placeholder={
                            isAdmin
                                ? 'Search employee, ID, or document...'
                                : 'Search your documents...'
                        }
                        placeholderTextColor={colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                        onSubmitEditing={loadData}
                        style={styles.searchInput}
                    />
                    {searchQuery.length > 0 && (
                        <TouchableOpacity onPress={() => setSearchQuery('')}>
                            <X size={16} color={colors.textMuted} />
                        </TouchableOpacity>
                    )}
                </View>

                {/* KPI Stat Cards */}
                {isAdmin ? (
                    <View style={styles.kpiRow}>
                        <View style={[styles.kpiCard, { borderColor: '#FDE68A', backgroundColor: '#FFFBEB' }]}>
                            <Text style={[styles.kpiNumber, { color: '#D97706' }]}>
                                {adminStats?.pendingCount ?? 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Pending Review</Text>
                        </View>

                        <View style={[styles.kpiCard, { borderColor: colors.successBorder, backgroundColor: colors.successLight }]}>
                            <Text style={[styles.kpiNumber, { color: colors.success }]}>
                                {adminStats?.verifiedCount ?? 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Verified</Text>
                        </View>

                        <View style={[styles.kpiCard, { borderColor: colors.dangerBorder, backgroundColor: colors.dangerLight }]}>
                            <Text style={[styles.kpiNumber, { color: colors.danger }]}>
                                {adminStats?.rejectedCount ?? 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Rejected</Text>
                        </View>

                        <View style={[styles.kpiCard, { borderColor: colors.border, backgroundColor: colors.surfaceSubtle }]}>
                            <Text style={[styles.kpiNumber, { color: colors.textPrimary }]}>
                                {adminStats?.totalUploaded ?? 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Total Uploads</Text>
                        </View>
                    </View>
                ) : (
                    <View style={styles.kpiRow}>
                        <View style={[styles.kpiCard, { borderColor: colors.successBorder, backgroundColor: colors.successLight }]}>
                            <Text style={[styles.kpiNumber, { color: colors.success }]}>
                                {summary.verified || 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Verified</Text>
                        </View>

                        <View style={[styles.kpiCard, { borderColor: colors.warningBorder, backgroundColor: colors.warningLight }]}>
                            <Text style={[styles.kpiNumber, { color: colors.warning }]}>
                                {summary.pending || 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Pending</Text>
                        </View>

                        <View style={[styles.kpiCard, { borderColor: colors.dangerBorder, backgroundColor: colors.dangerLight }]}>
                            <Text style={[styles.kpiNumber, { color: colors.danger }]}>
                                {summary.rejected || 0}
                            </Text>
                            <Text style={styles.kpiLabel}>Rejected</Text>
                        </View>
                    </View>
                )}

                {/* Admin Status Filter Tabs */}
                {isAdmin && (
                    <View style={styles.filterTabsRow}>
                        {[
                            { key: 'ALL', label: 'All' },
                            { key: 'PENDING_VERIFICATION', label: 'Pending' },
                            { key: 'VERIFIED', label: 'Verified' },
                            { key: 'REJECTED', label: 'Rejected' }
                        ].map((tab) => (
                            <TouchableOpacity
                                key={tab.key}
                                style={[
                                    styles.filterTabPill,
                                    adminStatusFilter === tab.key && styles.filterTabPillActive
                                ]}
                                onPress={() => setAdminStatusFilter(tab.key)}
                            >
                                <Text
                                    style={[
                                        styles.filterTabPillText,
                                        adminStatusFilter === tab.key && styles.filterTabPillTextActive
                                    ]}
                                >
                                    {tab.label}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}

                {/* Document List Section Header */}
                <View style={styles.sectionHeaderRow}>
                    <Text style={styles.sectionTitle}>
                        {isAdmin ? 'Employee Submissions' : 'My Documents'}
                    </Text>
                    <Text style={styles.sectionCounter}>
                        {isAdmin ? `${filteredAdminDocs.length} items` : `${filteredEmployeeDocs.length} items`}
                    </Text>
                </View>

                {/* Loading State */}
                {loading ? (
                    <View style={styles.loadingBox}>
                        <ActivityIndicator size="large" color={colors.primary} />
                        <Text style={styles.loadingText}>Loading documents...</Text>
                    </View>
                ) : isAdmin ? (
                    /* ----------------- ADMIN VIEW ----------------- */
                    filteredAdminDocs.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Folder size={40} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>No employee documents found</Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery
                                    ? 'No documents matched your search filter.'
                                    : 'There are currently no employee document submissions in this status.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.docListContainer}>
                            {filteredAdminDocs.map((doc) => {
                                const statusBadge = getStatusInfo(doc.status);
                                const empName = doc.employeeId?.name || 'Staff Member';
                                const empCode = doc.employeeId?.employeeId || 'EMP';
                                const empInitial = empName.charAt(0).toUpperCase();

                                return (
                                    <View key={doc._id} style={styles.adminDocCard}>
                                        {/* Employee Header */}
                                        <View style={styles.adminDocCardHeader}>
                                            <Avatar
                                                uri={doc.employeeId?.profilePicture}
                                                name={empName}
                                                size={36}
                                                bgColor="#EFF6FF"
                                                textColor="#1E60FF"
                                                borderColor="#BFDBFE"
                                                borderWidth={1}
                                            />
                                            <View style={styles.empInfoCol}>
                                                <Text style={styles.empNameText}>{empName}</Text>
                                                <Text style={styles.empMetaText}>
                                                    {empCode} • {doc.employeeId?.designation || 'Staff'}
                                                </Text>
                                            </View>
                                            <View
                                                style={[
                                                    styles.statusPillSmall,
                                                    { backgroundColor: statusBadge.bg, borderColor: statusBadge.border }
                                                ]}
                                            >
                                                <Text style={[styles.statusPillSmallText, { color: statusBadge.text }]}>
                                                    {statusBadge.label}
                                                </Text>
                                            </View>
                                        </View>

                                        {/* Document Info */}
                                        <View style={styles.adminDocBody}>
                                            <View style={styles.adminDocIconBox}>
                                                <FileText size={20} color={colors.primary} />
                                            </View>
                                            <View style={styles.adminDocNameCol}>
                                                <Text style={styles.adminDocTitle}>
                                                    {doc.documentTypeName || doc.fileName}
                                                </Text>
                                                <Text style={styles.adminDocSub}>
                                                    {doc.category || 'General'} • {doc.fileSize ? `${(doc.fileSize / 1024).toFixed(1)} KB` : 'Uploaded'}{' '}
                                                    • {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: 'short' }) : ''}
                                                </Text>
                                                {doc.rejectionReason ? (
                                                    <Text style={styles.rejectionNoteText} numberOfLines={2}>
                                                        ⚠️ Note: {doc.rejectionReason}
                                                    </Text>
                                                ) : null}
                                            </View>
                                        </View>

                                        {/* Admin Action Buttons */}
                                        <View style={styles.adminActionRow}>
                                            {/* Preview */}
                                            <TouchableOpacity
                                                style={styles.actionBtnPreview}
                                                onPress={() => handleOpenPreview(doc)}
                                                activeOpacity={0.7}
                                            >
                                                <Eye size={15} color={colors.primary} />
                                                <Text style={styles.actionBtnPreviewText}>Preview</Text>
                                            </TouchableOpacity>

                                            {/* Accept / Verify */}
                                            {doc.status !== 'VERIFIED' && (
                                                <TouchableOpacity
                                                    style={styles.actionBtnVerify}
                                                    onPress={() => handleVerify(doc)}
                                                    disabled={actionLoading}
                                                    activeOpacity={0.7}
                                                >
                                                    <Check size={15} color="#059669" />
                                                    <Text style={styles.actionBtnVerifyText}>Approve</Text>
                                                </TouchableOpacity>
                                            )}

                                            {/* Reject */}
                                            {doc.status !== 'REJECTED' && (
                                                <TouchableOpacity
                                                    style={styles.actionBtnReject}
                                                    onPress={() => handleOpenRejectModal(doc)}
                                                    disabled={actionLoading}
                                                    activeOpacity={0.7}
                                                >
                                                    <X size={15} color="#DC2626" />
                                                    <Text style={styles.actionBtnRejectText}>Reject</Text>
                                                </TouchableOpacity>
                                            )}

                                            {/* Delete */}
                                            <TouchableOpacity
                                                style={styles.actionBtnDelete}
                                                onPress={() => handleDelete(doc)}
                                                disabled={actionLoading}
                                                activeOpacity={0.7}
                                            >
                                                <Trash2 size={15} color={colors.textMuted} />
                                            </TouchableOpacity>
                                        </View>
                                    </View>
                                );
                            })}
                        </View>
                    )
                ) : (
                    /* ----------------- EMPLOYEE VIEW ----------------- */
                    filteredEmployeeDocs.length === 0 ? (
                        <View style={styles.emptyCard}>
                            <Folder size={40} color={colors.textMuted} />
                            <Text style={styles.emptyTitle}>
                                {searchQuery ? 'No matching documents found' : 'No documents uploaded yet'}
                            </Text>
                            <Text style={styles.emptySubtitle}>
                                {searchQuery
                                    ? 'Try searching for another keyword.'
                                    : 'Upload your verification documents to complete your profile.'}
                            </Text>
                        </View>
                    ) : (
                        <View style={styles.docListContainer}>
                            {filteredEmployeeDocs.map((doc, index) => {
                                const statusBadge = getStatusInfo(doc.status);

                                return (
                                    <TouchableOpacity
                                        key={doc._id || index}
                                        style={styles.docItemRow}
                                        onPress={() => setSelectedDoc(doc)}
                                        activeOpacity={0.7}
                                    >
                                        <View style={styles.docIconBox}>
                                            <FileText size={20} color={colors.primary} />
                                        </View>

                                        <View style={styles.docTextCol}>
                                            <Text style={styles.docItemTitle}>{doc.title}</Text>
                                            <View style={styles.statusPillSmall}>
                                                <Text style={[styles.statusPillSmallText, { color: statusBadge.text }]}>
                                                    {statusBadge.label}
                                                </Text>
                                            </View>
                                        </View>

                                        <ChevronRight size={18} color={colors.textMuted} />
                                    </TouchableOpacity>
                                );
                            })}
                        </View>
                    )
                )}

                {/* Employee Upload Button */}
                {!isAdmin && (
                    <Button
                        title="+ Upload Document"
                        onPress={() => setUploadModalOpen(true)}
                        style={styles.uploadMainBtn}
                    />
                )}
            </ScrollView>

            {/* Admin Reject Reason Modal */}
            <Modal
                visible={rejectModalOpen}
                animationType="fade"
                transparent={true}
                onRequestClose={() => setRejectModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Reject Document</Text>
                            <TouchableOpacity onPress={() => setRejectModalOpen(false)} style={styles.closeBtn}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={styles.formLabel}>Rejection Reason (Required)</Text>
                        <TextInput
                            style={styles.rejectionInput}
                            placeholder="e.g. Document copy is blurred or expired. Please upload a clear original scanned copy."
                            placeholderTextColor={colors.textMuted}
                            value={rejectionReason}
                            onChangeText={setRejectionReason}
                            multiline
                            numberOfLines={3}
                        />

                        <Button
                            title="Confirm Rejection"
                            onPress={handleConfirmReject}
                            loading={actionLoading}
                            style={[styles.modalUploadBtn, { backgroundColor: '#DC2626' }]}
                        />
                    </View>
                </View>
            </Modal>

            {/* Employee Upload Document Modal */}
            <Modal
                visible={uploadModalOpen}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setUploadModalOpen(false)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Upload Document</Text>
                            <TouchableOpacity onPress={() => setUploadModalOpen(false)} style={styles.closeBtn}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView showsVerticalScrollIndicator={false}>
                            <Text style={styles.formLabel}>Document Type</Text>
                            <ScrollView
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                style={{ marginBottom: 14 }}
                                contentContainerStyle={{ gap: 8 }}
                            >
                                {(docTypes.length > 0 ? docTypes : [
                                    { _id: '1', name: 'PAN Card' },
                                    { _id: '2', name: 'ID Proof' },
                                    { _id: '3', name: 'Degree Certificate' },
                                    { _id: '4', name: 'Contract' }
                                ]).map((t) => (
                                    <TouchableOpacity
                                        key={t._id}
                                        style={[
                                            styles.typePill,
                                            selectedDocType === t._id && styles.typePillActive
                                        ]}
                                        onPress={() => setSelectedDocType(t._id)}
                                    >
                                        <Text
                                            style={[
                                                styles.typePillText,
                                                selectedDocType === t._id && styles.typePillTextActive
                                            ]}
                                        >
                                            {t.name}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={styles.formLabel}>Upload File</Text>
                            <TouchableOpacity
                                style={styles.dottedDropzone}
                                onPress={handlePickFile}
                                activeOpacity={0.7}
                            >
                                <CloudUpload size={36} color={colors.primary} />
                                <Text style={styles.dropzoneTitle}>Choose File</Text>
                                <Text style={styles.dropzoneSubtitle}>Tap to browse or select a file</Text>
                                <Text style={styles.dropzoneFormats}>PDF, JPG, PNG (Max 10 MB)</Text>
                            </TouchableOpacity>

                            {selectedFile && (
                                <View style={styles.selectedFilePill}>
                                    <FileText size={18} color={colors.primary} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.selectedFileName} numberOfLines={1}>
                                            {selectedFile.name}
                                        </Text>
                                        <Text style={styles.selectedFileSize}>
                                            {selectedFile.size ? `${(selectedFile.size / 1024).toFixed(1)} KB` : 'Ready'}
                                        </Text>
                                    </View>
                                    <TouchableOpacity onPress={() => setSelectedFile(null)}>
                                        <X size={16} color={colors.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            )}

                            <Button
                                title={uploading ? 'Uploading...' : 'Upload'}
                                onPress={handleUploadSubmit}
                                loading={uploading}
                                style={styles.modalUploadBtn}
                            />
                        </ScrollView>
                    </View>
                </View>
            </Modal>

            {/* Document Details Modal */}
            <Modal
                visible={!!selectedDoc}
                animationType="slide"
                transparent={true}
                onRequestClose={() => setSelectedDoc(null)}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Document Details</Text>
                            <TouchableOpacity onPress={() => setSelectedDoc(null)} style={styles.closeBtn}>
                                <X size={20} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        {selectedDoc && (
                            <ScrollView showsVerticalScrollIndicator={false}>
                                <View style={styles.docDetailTop}>
                                    <View style={styles.docIconLarge}>
                                        <FileText size={26} color={colors.primary} />
                                    </View>
                                    <Text style={styles.docDetailName}>{selectedDoc.title}</Text>
                                    <View
                                        style={[
                                            styles.detailStatusBadge,
                                            { backgroundColor: getStatusInfo(selectedDoc.status).bg }
                                        ]}
                                    >
                                        <Text
                                            style={[
                                                styles.detailStatusBadgeText,
                                                { color: getStatusInfo(selectedDoc.status).text }
                                            ]}
                                        >
                                            {getStatusInfo(selectedDoc.status).label}
                                        </Text>
                                    </View>
                                </View>

                                {/* Meta Details */}
                                <View style={styles.docMetaBox}>
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>Uploaded</Text>
                                        <Text style={styles.metaValue}>
                                            {selectedDoc.createdAt
                                                ? new Date(selectedDoc.createdAt).toLocaleDateString('en-US', {
                                                      day: '2-digit',
                                                      month: 'short',
                                                      year: 'numeric'
                                                  })
                                                : 'Not uploaded yet'}
                                        </Text>
                                    </View>
                                    {selectedDoc.status === 'VERIFIED' && (
                                        <View style={styles.metaRow}>
                                            <Text style={styles.metaLabel}>Verified</Text>
                                            <Text style={styles.metaValue}>
                                                {selectedDoc.verifiedAt
                                                    ? new Date(selectedDoc.verifiedAt).toLocaleDateString('en-US', {
                                                          day: '2-digit',
                                                          month: 'short',
                                                          year: 'numeric'
                                                      })
                                                    : 'Verified'}
                                            </Text>
                                        </View>
                                    )}
                                    <View style={styles.metaRow}>
                                        <Text style={styles.metaLabel}>Verified by</Text>
                                        <Text style={styles.metaValue}>
                                            {selectedDoc.verifiedByName || 'HR Admin'}
                                        </Text>
                                    </View>
                                </View>

                                {/* Rejection Reason Alert if rejected */}
                                {selectedDoc.status === 'REJECTED' && (
                                    <View style={styles.rejectionBox}>
                                        <Text style={styles.rejectionHeader}>Rejection Reason</Text>
                                        <Text style={styles.rejectionBody}>
                                            {selectedDoc.rejectionReason || 'Document is unclear. Please upload a better scanned copy.'}
                                        </Text>
                                    </View>
                                )}

                                {/* Action button */}
                                {selectedDoc.status === 'MISSING' || selectedDoc.status === 'REJECTED' ? (
                                    <Button
                                        title={selectedDoc.status === 'REJECTED' ? 'Re-upload' : 'Upload Document'}
                                        onPress={() => {
                                            const targetTypeId = selectedDoc.documentTypeId;
                                            setSelectedDoc(null);
                                            if (targetTypeId) setSelectedDocType(targetTypeId);
                                            setUploadModalOpen(true);
                                        }}
                                        style={styles.modalUploadBtn}
                                    />
                                ) : (
                                    <Button
                                        title="Preview Document"
                                        onPress={() => handleOpenPreview(selectedDoc)}
                                        style={styles.modalUploadBtn}
                                    />
                                )}
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
    adminBadgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2
    },
    adminBadgeText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#1E60FF'
    },
    content: {
        paddingHorizontal: 20,
        paddingTop: 16,
        paddingBottom: 32
    },
    searchBox: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        paddingHorizontal: 14,
        height: 46,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8,
        marginBottom: 16
    },
    searchInput: {
        flex: 1,
        fontSize: 13,
        color: colors.textPrimary
    },
    kpiRow: {
        flexDirection: 'row',
        gap: 8,
        marginBottom: 16
    },
    kpiCard: {
        flex: 1,
        borderRadius: 14,
        paddingVertical: 10,
        paddingHorizontal: 6,
        alignItems: 'center',
        borderWidth: 1
    },
    kpiNumber: {
        fontSize: 16,
        fontWeight: '800'
    },
    kpiLabel: {
        fontSize: 10,
        fontWeight: '600',
        color: colors.textSecondary,
        marginTop: 2,
        textAlign: 'center'
    },
    filterTabsRow: {
        flexDirection: 'row',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 12,
        padding: 4,
        marginBottom: 16,
        gap: 4
    },
    filterTabPill: {
        flex: 1,
        paddingVertical: 7,
        alignItems: 'center',
        borderRadius: 9
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
        marginBottom: 12
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary
    },
    sectionCounter: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textMuted
    },
    docListContainer: {
        gap: 10,
        marginBottom: 16
    },
    /* Admin Card Styles */
    adminDocCard: {
        backgroundColor: colors.surface,
        borderRadius: 16,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border
    },
    adminDocCardHeader: {
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
    adminDocBody: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: 10,
        marginBottom: 12
    },
    adminDocIconBox: {
        width: 36,
        height: 36,
        borderRadius: 10,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 2
    },
    adminDocNameCol: {
        flex: 1
    },
    adminDocTitle: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    adminDocSub: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2
    },
    rejectionNoteText: {
        fontSize: 11,
        color: '#DC2626',
        marginTop: 4,
        backgroundColor: '#FEE2E2',
        padding: 6,
        borderRadius: 8
    },
    adminActionRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        borderTopWidth: 1,
        borderTopColor: colors.surfaceSubtle,
        paddingTop: 10
    },
    actionBtnPreview: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: colors.surfaceSubtle,
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },
    actionBtnPreviewText: {
        fontSize: 11,
        fontWeight: '700',
        color: colors.primary
    },
    actionBtnVerify: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#ECFDF5',
        borderWidth: 1,
        borderColor: '#A7F3D0',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },
    actionBtnVerifyText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#059669'
    },
    actionBtnReject: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        backgroundColor: '#FEF2F2',
        borderWidth: 1,
        borderColor: '#FECACA',
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 8
    },
    actionBtnRejectText: {
        fontSize: 11,
        fontWeight: '700',
        color: '#DC2626'
    },
    actionBtnDelete: {
        padding: 6,
        borderRadius: 8,
        backgroundColor: colors.surfaceSubtle,
        marginLeft: 'auto'
    },
    /* Employee Row Styles */
    docItemRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surface,
        borderRadius: 14,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 12
    },
    docIconBox: {
        width: 40,
        height: 40,
        borderRadius: 12,
        backgroundColor: colors.surfaceSubtle,
        alignItems: 'center',
        justifyContent: 'center'
    },
    docTextCol: {
        flex: 1
    },
    docItemTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 4
    },
    statusPillSmall: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 2,
        borderRadius: 6,
        borderWidth: 1
    },
    statusPillSmallText: {
        fontSize: 10,
        fontWeight: '700'
    },
    uploadMainBtn: {
        backgroundColor: colors.primary,
        height: 48,
        borderRadius: 12,
        marginTop: 10
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
    closeBtn: {
        padding: 4
    },
    formLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textPrimary,
        marginBottom: 8
    },
    rejectionInput: {
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        color: colors.textPrimary,
        minHeight: 80,
        textAlignVertical: 'top',
        marginBottom: 16
    },
    typePill: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 10,
        backgroundColor: colors.background,
        borderWidth: 1,
        borderColor: colors.border
    },
    typePillActive: {
        backgroundColor: '#EFF6FF',
        borderColor: '#1E60FF'
    },
    typePillText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textSecondary
    },
    typePillTextActive: {
        color: '#1E60FF',
        fontWeight: '700'
    },
    dottedDropzone: {
        borderWidth: 1.5,
        borderColor: colors.border,
        borderStyle: 'dashed',
        borderRadius: 16,
        paddingVertical: 24,
        alignItems: 'center',
        backgroundColor: colors.surfaceSubtle,
        marginBottom: 16
    },
    dropzoneTitle: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textPrimary,
        marginTop: 8
    },
    dropzoneSubtitle: {
        fontSize: 11,
        color: colors.textSecondary,
        marginTop: 2
    },
    dropzoneFormats: {
        fontSize: 10,
        color: colors.textMuted,
        marginTop: 4
    },
    selectedFilePill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 10,
        marginBottom: 14
    },
    selectedFileName: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.textPrimary
    },
    selectedFileSize: {
        fontSize: 11,
        color: colors.textMuted,
        marginTop: 1
    },
    modalUploadBtn: {
        backgroundColor: colors.primary,
        height: 48,
        borderRadius: 12,
        marginTop: 6
    },
    docDetailTop: {
        alignItems: 'center',
        paddingVertical: 12
    },
    docIconLarge: {
        width: 56,
        height: 56,
        borderRadius: 16,
        backgroundColor: colors.primaryLight,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: 10
    },
    docDetailName: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.textPrimary
    },
    detailStatusBadge: {
        paddingHorizontal: 12,
        paddingVertical: 4,
        borderRadius: 12,
        marginTop: 6
    },
    detailStatusBadgeText: {
        fontSize: 12,
        fontWeight: '700'
    },
    docMetaBox: {
        backgroundColor: colors.surfaceSubtle,
        borderRadius: 14,
        padding: 14,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: colors.border,
        gap: 8
    },
    metaRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    metaLabel: {
        fontSize: 12,
        color: colors.textSecondary
    },
    metaValue: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textPrimary
    },
    rejectionBox: {
        backgroundColor: colors.dangerLight,
        borderWidth: 1,
        borderColor: colors.dangerBorder,
        borderRadius: 14,
        padding: 14,
        marginBottom: 16
    },
    rejectionHeader: {
        fontSize: 13,
        fontWeight: '700',
        color: colors.danger
    },
    rejectionBody: {
        fontSize: 12,
        color: colors.danger,
        marginTop: 4,
        lineHeight: 16
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
        padding: 30,
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
        paddingHorizontal: 20
    }
});
