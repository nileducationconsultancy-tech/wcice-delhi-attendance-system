const DocumentType = require('../models/DocumentTypeModel');
const EmployeeDocument = require('../models/EmployeeDocumentModel');
const DocumentAuditLog = require('../models/DocumentAuditLogModel');

const INITIAL_DOCUMENT_TYPES = [
    // Identity
    { name: 'ID Proof', category: 'Identity', isRequired: true, isActive: true, description: 'Government issued photo identity (e.g. Aadhaar, Passport, Voter ID)', sortOrder: 1 },
    { name: 'PAN', category: 'Identity', isRequired: true, isActive: true, description: 'Permanent Account Number card copy', sortOrder: 2 },
    
    // Employment
    { name: 'Resume', category: 'Employment', isRequired: true, isActive: true, description: 'Updated Curriculum Vitae / Resume', sortOrder: 3 },
    { name: 'Offer Letter', category: 'Employment', isRequired: true, isActive: true, description: 'Signed company offer letter', sortOrder: 4 },
    { name: 'Employment Agreement', category: 'Employment', isRequired: true, isActive: true, description: 'Signed employment terms & conditions agreement', sortOrder: 5 },
    { name: 'Joining Form', category: 'Employment', isRequired: false, isActive: true, description: 'Filled employee onboarding joining form', sortOrder: 6 },
    
    // Banking
    { name: 'Bank Proof', category: 'Banking', isRequired: true, isActive: true, description: 'Bank passbook front page or recent bank statement showing account details', sortOrder: 7 },
    { name: 'Cancelled Cheque', category: 'Banking', isRequired: false, isActive: true, description: 'Cancelled bank cheque for salary account verification', sortOrder: 8 },
    
    // Education
    { name: 'Education Certificate', category: 'Education', isRequired: true, isActive: true, description: 'Highest qualification degree / diploma certificate', sortOrder: 9 },
    { name: 'Experience Certificate', category: 'Education', isRequired: false, isActive: true, description: 'Relieving / experience certificate from previous employers', sortOrder: 10 },
    
    // Other
    { name: 'Other Document', category: 'Other', isRequired: false, isActive: true, description: 'Any additional certifications or reference documents', sortOrder: 11 }
];

/**
 * Seed initial document types if not present
 */
const seedDefaultDocumentTypes = async () => {
    try {
        const count = await DocumentType.countDocuments();
        if (count === 0) {
            await DocumentType.insertMany(INITIAL_DOCUMENT_TYPES);
            console.log('✅ Default Document Types seeded successfully');
        }
    } catch (error) {
        console.error('⚠️ Error seeding default document types:', error.message);
    }
};

/**
 * Calculate dynamic document status and completion matrix for an employee
 */
const getEmployeeDocumentMatrix = async (employeeId) => {
    // 1. Get all active document types sorted by order
    const documentTypes = await DocumentType.find({ isActive: true }).sort({ sortOrder: 1, createdAt: 1 }).lean();

    // 2. Get all uploaded documents for this employee
    const uploadedDocs = await EmployeeDocument.find({ employeeId }).sort({ createdAt: -1 }).lean();

    // Create a lookup by documentTypeId (take the latest if multiple exist)
    const docMap = new Map();
    uploadedDocs.forEach(doc => {
        const typeIdStr = String(doc.documentTypeId);
        if (!docMap.has(typeIdStr)) {
            docMap.set(typeIdStr, doc);
        }
    });

    let verifiedCount = 0;
    let pendingCount = 0;
    let rejectedCount = 0;
    let missingCount = 0;
    let requiredCount = 0;
    let verifiedRequiredCount = 0;

    // Group by category
    const categoriesMap = {
        'Identity': [],
        'Employment': [],
        'Banking': [],
        'Education': [],
        'Other': []
    };

    const matrix = documentTypes.map(docType => {
        const typeIdStr = String(docType._id);
        const uploadedDoc = docMap.get(typeIdStr);

        if (docType.isRequired) {
            requiredCount++;
        }

        let status = 'MISSING';
        if (uploadedDoc) {
            status = uploadedDoc.status;
        }

        if (status === 'VERIFIED') {
            verifiedCount++;
            if (docType.isRequired) verifiedRequiredCount++;
        } else if (status === 'PENDING_VERIFICATION') {
            pendingCount++;
        } else if (status === 'REJECTED') {
            rejectedCount++;
        } else {
            missingCount++;
        }

        const item = {
            documentType: docType,
            status,
            uploadedDocument: uploadedDoc || null
        };

        const categoryKey = categoriesMap[docType.category] ? docType.category : 'Other';
        categoriesMap[categoryKey].push(item);

        return item;
    });

    // Also include any custom uploaded docs that might not match current active types (e.g., historical)
    const activeTypeIds = new Set(documentTypes.map(d => String(d._id)));
    const additionalDocs = uploadedDocs.filter(d => !activeTypeIds.has(String(d.documentTypeId)));
    if (additionalDocs.length > 0) {
        additionalDocs.forEach(doc => {
            const item = {
                documentType: {
                    _id: doc.documentTypeId,
                    name: doc.documentTypeName,
                    category: doc.category,
                    isRequired: false,
                    isActive: false
                },
                status: doc.status,
                uploadedDocument: doc
            };
            const cat = categoriesMap[doc.category] ? doc.category : 'Other';
            categoriesMap[cat].push(item);
        });
    }

    const completionPercentage = requiredCount > 0 
        ? Math.min(100, Math.round((verifiedRequiredCount / requiredCount) * 100))
        : (verifiedCount > 0 ? 100 : 0);

    return {
        matrix,
        categories: categoriesMap,
        summary: {
            totalRequired: requiredCount,
            verifiedRequired: verifiedRequiredCount,
            completionPercentage,
            verifiedCount,
            pendingCount,
            rejectedCount,
            missingCount,
            totalUploaded: uploadedDocs.length
        }
    };
};

/**
 * Record an audit log entry for any document lifecycle action
 */
const logDocumentAction = async ({
    documentId,
    employeeId,
    documentTypeName,
    action,
    performedBy,
    performedByName,
    performedByRole,
    details = {}
}) => {
    try {
        await DocumentAuditLog.create({
            documentId,
            employeeId,
            documentTypeName,
            action,
            performedBy,
            performedByName: performedByName || 'System',
            performedByRole: performedByRole || 'SYSTEM',
            details,
            timestamp: new Date()
        });
    } catch (err) {
        console.error('⚠️ Failed to save document audit log:', err.message);
    }
};

module.exports = {
    seedDefaultDocumentTypes,
    getEmployeeDocumentMatrix,
    logDocumentAction
};
