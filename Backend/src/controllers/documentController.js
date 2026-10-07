const EmployeeDocument = require('../models/EmployeeDocumentModel');
const DocumentType = require('../models/DocumentTypeModel');
const Employee = require('../models/EmployeeModel');
const DocumentAuditLog = require('../models/DocumentAuditLogModel');
const fileStorageService = require('../services/fileStorageService');
const documentService = require('../services/documentService');

/**
 * Helper to get user's display name
 */
const getUserDisplayName = (user) => {
    if (!user) return 'System';
    if (user.employeeId && user.employeeId.name) return user.employeeId.name;
    if (user.name) return user.name;
    return user.email ? user.email.split('@')[0] : 'User';
};

/**
 * GET /api/documents/employee/:employeeId
 * Get document matrix, categories, and summary for an employee
 */
exports.getEmployeeDocuments = async (req, res) => {
    try {
        const { employeeId } = req.params;

        const employee = await Employee.findById(employeeId).lean();
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Authorization check: Admin/HR can view any employee; Employee can only view their own
        const isStaffAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role);
        const userEmpId = req.user.employeeId?._id ? String(req.user.employeeId._id) : String(req.user.employeeId);

        if (!isStaffAdmin && String(employee._id) !== userEmpId) {
            return res.status(403).json({ message: 'Access denied. You can only view your own documents.' });
        }

        const data = await documentService.getEmployeeDocumentMatrix(employee._id);

        // Fetch recent audit logs for this employee's documents
        const auditLogs = await DocumentAuditLog.find({ employeeId: employee._id })
            .sort({ timestamp: -1 })
            .limit(20)
            .lean();

        res.status(200).json({
            employee: {
                _id: employee._id,
                name: employee.name,
                employeeId: employee.employeeId,
                designation: employee.designation,
                email: employee.email,
                role: employee.role,
                status: employee.status
            },
            ...data,
            auditLogs
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch employee documents', error: error.message });
    }
};

/**
 * GET /api/documents/my
 * Get logged-in employee's own documents
 */
exports.getMyDocuments = async (req, res) => {
    try {
        let userEmpId = req.user.employeeId?._id || req.user.employeeId;
        let employee = null;

        if (userEmpId) {
            employee = await Employee.findById(userEmpId).lean();
        }

        if (!employee && req.user.email) {
            employee = await Employee.findOne({ email: req.user.email }).lean();
        }

        if (!employee) {
            // For SUPER_ADMIN / ADMIN / HR without a separate employee document record
            if (['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
                return res.status(200).json({
                    employee: {
                        _id: req.user._id,
                        name: req.user.name || 'Administrator',
                        role: req.user.role,
                        email: req.user.email,
                        designation: req.user.designation || 'Administrator'
                    },
                    summary: {
                        totalRequired: 0,
                        verifiedRequired: 0,
                        completionPercentage: 100,
                        verifiedCount: 0,
                        pendingCount: 0,
                        rejectedCount: 0,
                        missingCount: 0,
                        totalUploaded: 0
                    },
                    categories: {
                        Identity: [],
                        Employment: [],
                        Banking: [],
                        Education: [],
                        Other: []
                    },
                    matrix: []
                });
            }
            return res.status(200).json({
                employee: null,
                summary: {
                    totalRequired: 0,
                    verifiedRequired: 0,
                    completionPercentage: 0,
                    verifiedCount: 0,
                    pendingCount: 0,
                    rejectedCount: 0,
                    missingCount: 0,
                    totalUploaded: 0
                },
                categories: {
                    Identity: [],
                    Employment: [],
                    Banking: [],
                    Education: [],
                    Other: []
                },
                matrix: []
            });
        }

        const data = await documentService.getEmployeeDocumentMatrix(employee._id);

        res.status(200).json({
            employee: {
                _id: employee._id,
                name: employee.name,
                employeeId: employee.employeeId,
                designation: employee.designation,
                email: employee.email
            },
            ...data
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch your documents', error: error.message });
    }
};

/**
 * POST /api/documents/upload
 * Upload a document (HR or Employee)
 */
exports.uploadDocument = async (req, res) => {
    try {
        let { employeeId, documentTypeId, uploadSource, notes } = req.body;
        const file = req.file;

        if (!file) {
            return res.status(400).json({ message: 'Please select a file to upload.' });
        }

        if (!employeeId) {
            employeeId = req.user.employeeId?._id || req.user.employeeId;
            if (!employeeId && req.user.email) {
                const foundEmp = await Employee.findOne({ email: req.user.email });
                if (foundEmp) employeeId = foundEmp._id;
            }
        }

        if (!employeeId || !documentTypeId) {
            return res.status(400).json({ message: 'Employee ID and Document Type are required.' });
        }

        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        const docType = await DocumentType.findById(documentTypeId);
        if (!docType) {
            return res.status(404).json({ message: 'Document Type not found' });
        }

        // Authorization validation
        const isStaffAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role);
        const userEmpId = req.user.employeeId?._id ? String(req.user.employeeId._id) : String(req.user.employeeId);

        let finalSource = 'MANUAL_HR';
        if (!isStaffAdmin) {
            if (String(employee._id) !== userEmpId) {
                return res.status(403).json({ message: 'You can only upload documents for yourself.' });
            }
            finalSource = 'EMPLOYEE_PORTAL';
        } else {
            if (uploadSource === 'EMAIL') {
                finalSource = 'EMAIL';
            } else if (uploadSource === 'EMPLOYEE_PORTAL') {
                finalSource = 'EMPLOYEE_PORTAL';
            } else {
                finalSource = 'MANUAL_HR';
            }
        }

        // 1. Upload file buffer to Storage
        const uploadResult = await fileStorageService.uploadFile({
            file,
            employeeId: employee._id,
            category: docType.category
        });

        const uploaderName = getUserDisplayName(req.user);

        // 2. Check if a document record already exists for this employee + documentTypeId
        let documentRecord = await EmployeeDocument.findOne({
            employeeId: employee._id,
            documentTypeId: docType._id
        });

        const isReupload = Boolean(documentRecord);

        if (documentRecord) {
            // Delete old file from storage if fileKey changed
            if (documentRecord.fileKey && documentRecord.fileKey !== uploadResult.fileKey) {
                await fileStorageService.deleteFile(documentRecord.fileKey, documentRecord.storageProvider);
            }

            documentRecord.fileName = uploadResult.fileName;
            documentRecord.fileKey = uploadResult.fileKey;
            documentRecord.fileUrl = uploadResult.fileUrl;
            documentRecord.fileType = uploadResult.fileType;
            documentRecord.fileSize = uploadResult.fileSize;
            documentRecord.storageProvider = uploadResult.storageProvider;
            documentRecord.documentTypeName = docType.name;
            documentRecord.category = docType.category;
            documentRecord.status = 'PENDING_VERIFICATION';
            documentRecord.uploadedBy = req.user._id;
            documentRecord.uploadedByRole = req.user.role;
            documentRecord.uploadedByName = uploaderName;
            documentRecord.uploadSource = finalSource;
            documentRecord.uploadedAt = new Date();
            documentRecord.rejectionReason = ''; // Clear rejection on re-upload
            if (notes) documentRecord.notes = notes;

            await documentRecord.save();
        } else {
            documentRecord = await EmployeeDocument.create({
                employeeId: employee._id,
                documentTypeId: docType._id,
                documentTypeName: docType.name,
                category: docType.category,
                fileName: uploadResult.fileName,
                fileKey: uploadResult.fileKey,
                fileUrl: uploadResult.fileUrl,
                fileType: uploadResult.fileType,
                fileSize: uploadResult.fileSize,
                storageProvider: uploadResult.storageProvider,
                status: 'PENDING_VERIFICATION',
                uploadedBy: req.user._id,
                uploadedByRole: req.user.role,
                uploadedByName: uploaderName,
                uploadSource: finalSource,
                uploadedAt: new Date(),
                notes: notes || ''
            });
        }

        // 3. Log Audit Trail
        await documentService.logDocumentAction({
            documentId: documentRecord._id,
            employeeId: employee._id,
            documentTypeName: docType.name,
            action: isReupload ? 'RE_UPLOAD' : 'UPLOAD',
            performedBy: req.user._id,
            performedByName: uploaderName,
            performedByRole: req.user.role,
            details: {
                fileName: uploadResult.fileName,
                fileSize: uploadResult.fileSize,
                uploadSource: finalSource,
                notes: notes || ''
            }
        });

        res.status(201).json({
            message: `${docType.name} uploaded successfully`,
            document: documentRecord
        });
    } catch (error) {
        res.status(500).json({ message: error.message || 'Server error uploading document' });
    }
};

/**
 * PUT /api/documents/:id/verify
 * Mark a document as verified (Admin/HR only)
 */
exports.verifyDocument = async (req, res) => {
    try {
        const document = await EmployeeDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const verifierName = getUserDisplayName(req.user);

        document.status = 'VERIFIED';
        document.verifiedBy = req.user._id;
        document.verifiedByName = verifierName;
        document.verifiedAt = new Date();
        document.rejectionReason = '';

        await document.save();

        // Audit Log
        await documentService.logDocumentAction({
            documentId: document._id,
            employeeId: document.employeeId,
            documentTypeName: document.documentTypeName,
            action: 'VERIFY',
            performedBy: req.user._id,
            performedByName: verifierName,
            performedByRole: req.user.role,
            details: {
                verifiedAt: document.verifiedAt
            }
        });

        res.status(200).json({
            message: `${document.documentTypeName} verified successfully`,
            document
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to verify document', error: error.message });
    }
};

/**
 * PUT /api/documents/:id/reject
 * Reject a document with a mandatory reason (Admin/HR only)
 */
exports.rejectDocument = async (req, res) => {
    try {
        const { rejectionReason } = req.body;

        if (!rejectionReason || !rejectionReason.trim()) {
            return res.status(400).json({ message: 'Rejection reason is required.' });
        }

        const document = await EmployeeDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        const verifierName = getUserDisplayName(req.user);

        document.status = 'REJECTED';
        document.rejectionReason = rejectionReason.trim();
        document.verifiedBy = req.user._id;
        document.verifiedByName = verifierName;
        document.verifiedAt = new Date();

        await document.save();

        // Audit Log
        await documentService.logDocumentAction({
            documentId: document._id,
            employeeId: document.employeeId,
            documentTypeName: document.documentTypeName,
            action: 'REJECT',
            performedBy: req.user._id,
            performedByName: verifierName,
            performedByRole: req.user.role,
            details: {
                rejectionReason: document.rejectionReason,
                rejectedAt: document.verifiedAt
            }
        });

        res.status(200).json({
            message: `${document.documentTypeName} rejected`,
            document
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to reject document', error: error.message });
    }
};

/**
 * DELETE /api/documents/:id
 * Delete a document (Admin/HR only)
 */
exports.deleteDocument = async (req, res) => {
    try {
        const document = await EmployeeDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Delete from storage
        await fileStorageService.deleteFile(document.fileKey, document.storageProvider);

        const performerName = getUserDisplayName(req.user);

        // Audit Log
        await documentService.logDocumentAction({
            documentId: document._id,
            employeeId: document.employeeId,
            documentTypeName: document.documentTypeName,
            action: 'DELETE',
            performedBy: req.user._id,
            performedByName: performerName,
            performedByRole: req.user.role,
            details: {
                fileName: document.fileName
            }
        });

        await EmployeeDocument.findByIdAndDelete(req.params.id);

        res.status(200).json({ message: 'Document removed successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete document', error: error.message });
    }
};

/**
 * GET /api/documents/:id/signed-url
 * Generate time-limited signed URL or streaming link for preview/download
 */
exports.getDocumentSignedUrl = async (req, res) => {
    try {
        const document = await EmployeeDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Authorization check
        const isStaffAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role);
        const userEmpId = req.user.employeeId?._id ? String(req.user.employeeId._id) : String(req.user.employeeId);

        if (!isStaffAdmin && String(document.employeeId) !== userEmpId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        // 1. Try generating Supabase signed URL
        const signedUrl = await fileStorageService.getSignedUrl(document.fileKey, document.storageProvider, 600);

        if (signedUrl) {
            return res.status(200).json({
                signedUrl,
                fileName: document.fileName,
                fileType: document.fileType,
                isDirectStream: false
            });
        }

        // 2. Fallback to stream route
        res.status(200).json({
            streamUrl: `/api/documents/${document._id}/stream`,
            fileName: document.fileName,
            fileType: document.fileType,
            isDirectStream: true
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to generate secure URL', error: error.message });
    }
};

/**
 * GET /api/documents/:id/stream
 * Stream document content with authorization
 */
exports.streamDocumentFile = async (req, res) => {
    try {
        const document = await EmployeeDocument.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ message: 'Document not found' });
        }

        // Authorization check
        const isStaffAdmin = ['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role);
        const userEmpId = req.user.employeeId?._id ? String(req.user.employeeId._id) : String(req.user.employeeId);

        if (!isStaffAdmin && String(document.employeeId) !== userEmpId) {
            return res.status(403).json({ message: 'Access denied' });
        }

        const buffer = await fileStorageService.getFileBuffer(document.fileKey, document.storageProvider);

        res.setHeader('Content-Type', document.fileType || 'application/octet-stream');
        res.setHeader('Content-Disposition', `inline; filename="${document.fileName}"`);
        res.setHeader('Content-Length', buffer.length);
        res.send(buffer);
    } catch (error) {
        res.status(500).json({ message: 'Failed to stream document', error: error.message });
    }
};

/**
 * GET /api/documents/stats/overview
 * Overview stats for Admin Dashboard & Document Center
 */
exports.getDocumentStatsOverview = async (req, res) => {
    try {
        const [totalEmployees, activeDocTypes, uploadedDocs] = await Promise.all([
            Employee.countDocuments({ status: 'ACTIVE' }),
            DocumentType.find({ isActive: true }).lean(),
            EmployeeDocument.find().lean()
        ]);

        const requiredTypes = activeDocTypes.filter(d => d.isRequired);
        const totalRequiredSlots = totalEmployees * requiredTypes.length;

        let verifiedCount = 0;
        let pendingCount = 0;
        let rejectedCount = 0;

        uploadedDocs.forEach(d => {
            if (d.status === 'VERIFIED') verifiedCount++;
            else if (d.status === 'PENDING_VERIFICATION') pendingCount++;
            else if (d.status === 'REJECTED') rejectedCount++;
        });

        // Estimated missing required documents
        const missingCount = Math.max(0, totalRequiredSlots - verifiedCount - pendingCount);

        res.status(200).json({
            stats: {
                totalEmployees,
                totalUploaded: uploadedDocs.length,
                verifiedCount,
                pendingCount,
                rejectedCount,
                missingCount,
                activeDocTypesCount: activeDocTypes.length
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to calculate document stats', error: error.message });
    }
};

/**
 * GET /api/documents/admin/all
 * Filter all company employee documents (Admin/HR Document Hub)
 */
exports.getAllCompanyDocuments = async (req, res) => {
    try {
        const { status, category, search, page = 1, limit = 25 } = req.query;
        const pageNum = parseInt(page);
        const limitNum = parseInt(limit);
        const skip = (pageNum - 1) * limitNum;

        const query = {};
        if (status) query.status = status;
        if (category) query.category = category;

        // If search by employee name or employeeId
        if (search) {
            const matchingEmployees = await Employee.find({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { employeeId: { $regex: search, $options: 'i' } }
                ]
            }).select('_id');

            const empIds = matchingEmployees.map(e => e._id);
            query.$or = [
                { employeeId: { $in: empIds } },
                { documentTypeName: { $regex: search, $options: 'i' } },
                { fileName: { $regex: search, $options: 'i' } }
            ];
        }

        const [documents, total] = await Promise.all([
            EmployeeDocument.find(query)
                .populate('employeeId', 'name employeeId designation email status profilePicture')
                .populate('uploadedBy', 'email role')
                .populate('verifiedBy', 'email role')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limitNum)
                .lean(),
            EmployeeDocument.countDocuments(query)
        ]);

        res.status(200).json({
            documents,
            total,
            page: pageNum,
            pages: Math.ceil(total / limitNum)
        });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch company documents', error: error.message });
    }
};
