const DocumentType = require('../models/DocumentTypeModel');
const EmployeeDocument = require('../models/EmployeeDocumentModel');

// GET /api/document-types
exports.getDocumentTypes = async (req, res) => {
    try {
        const query = {};
        // If not admin, only show active types
        if (!req.user || !['SUPER_ADMIN', 'ADMIN', 'HR'].includes(req.user.role)) {
            query.isActive = true;
        }

        const documentTypes = await DocumentType.find(query).sort({ sortOrder: 1, createdAt: 1 });
        res.status(200).json({ documentTypes });
    } catch (error) {
        res.status(500).json({ message: 'Failed to fetch document types', error: error.message });
    }
};

// POST /api/document-types (Admin only)
exports.createDocumentType = async (req, res) => {
    try {
        const { name, category, isRequired, isActive, description, sortOrder } = req.body;

        if (!name || !name.trim()) {
            return res.status(400).json({ message: 'Document type name is required' });
        }

        const existing = await DocumentType.findOne({ name: name.trim() });
        if (existing) {
            return res.status(400).json({ message: 'A document type with this name already exists' });
        }

        const docType = await DocumentType.create({
            name: name.trim(),
            category: category || 'Other',
            isRequired: isRequired !== undefined ? Boolean(isRequired) : true,
            isActive: isActive !== undefined ? Boolean(isActive) : true,
            description: description || '',
            sortOrder: Number(sortOrder) || 0
        });

        res.status(201).json({ message: 'Document type created successfully', documentType: docType });
    } catch (error) {
        res.status(500).json({ message: 'Failed to create document type', error: error.message });
    }
};

// PUT /api/document-types/:id (Admin only)
exports.updateDocumentType = async (req, res) => {
    try {
        const { name, category, isRequired, isActive, description, sortOrder } = req.body;

        const docType = await DocumentType.findById(req.params.id);
        if (!docType) {
            return res.status(404).json({ message: 'Document type not found' });
        }

        if (name && name.trim()) docType.name = name.trim();
        if (category) docType.category = category;
        if (isRequired !== undefined) docType.isRequired = Boolean(isRequired);
        if (isActive !== undefined) docType.isActive = Boolean(isActive);
        if (description !== undefined) docType.description = description;
        if (sortOrder !== undefined) docType.sortOrder = Number(sortOrder);

        await docType.save();

        res.status(200).json({ message: 'Document type updated successfully', documentType: docType });
    } catch (error) {
        res.status(500).json({ message: 'Failed to update document type', error: error.message });
    }
};

// DELETE /api/document-types/:id (Admin only)
exports.deleteDocumentType = async (req, res) => {
    try {
        const docType = await DocumentType.findById(req.params.id);
        if (!docType) {
            return res.status(404).json({ message: 'Document type not found' });
        }

        // Check if any employee documents exist for this type
        const inUseCount = await EmployeeDocument.countDocuments({ documentTypeId: docType._id });
        if (inUseCount > 0) {
            // Soft-deactivate instead of hard delete to preserve historical integrity
            docType.isActive = false;
            await docType.save();
            return res.status(200).json({ 
                message: `Document type is in use by ${inUseCount} records. It has been marked inactive instead of permanently deleted.`,
                documentType: docType 
            });
        }

        await DocumentType.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Document type deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Failed to delete document type', error: error.message });
    }
};
