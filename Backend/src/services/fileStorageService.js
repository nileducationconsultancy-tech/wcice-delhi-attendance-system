const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_PUBLISHABLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET_NAME || 'Employee-document';

const isSupabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_KEY && !SUPABASE_URL.includes('your_supabase'));

let supabase = null;
if (isSupabaseConfigured) {
    try {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
            auth: { persistSession: false }
        });
        console.log('✅ Supabase Storage initialized for Employee Documents');
    } catch (err) {
        console.error('⚠️ Failed to initialize Supabase client, falling back to local storage:', err.message);
    }
} else {
    console.log('ℹ️ Supabase credentials not set in .env, using private Local Disk Storage fallback (uploads/documents)');
}

const os = require('os');

// Local storage fallback directory (use os.tmpdir() in serverless environments)
const LOCAL_UPLOAD_DIR = process.env.VERCEL
    ? path.join(os.tmpdir(), 'uploads', 'documents')
    : path.join(__dirname, '../../uploads/documents');

try {
    if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
        fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
    }
} catch (err) {
    console.warn('Notice: Local storage directory init skipped:', err.message);
}

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Validate incoming file buffer & metadata
 */
const validateFile = (file) => {
    if (!file || !file.buffer) {
        throw new Error('No file provided for upload.');
    }
    if (file.size > MAX_FILE_SIZE) {
        throw new Error(`File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed limit of 10MB.`);
    }
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype.toLowerCase())) {
        throw new Error(`Unsupported file format (${file.mimetype}). Allowed types: PDF, JPG, JPEG, PNG.`);
    }
};

/**
 * Sanitize filename and extract extension
 */
const getSafeFileExtension = (originalname, mimetype) => {
    const ext = path.extname(originalname).toLowerCase();
    if (ext && ['.pdf', '.jpg', '.jpeg', '.png'].includes(ext)) {
        return ext;
    }
    if (mimetype === 'application/pdf') return '.pdf';
    if (mimetype === 'image/jpeg' || mimetype === 'image/jpg') return '.jpg';
    if (mimetype === 'image/png') return '.png';
    return '.bin';
};

/**
 * Upload file buffer to Supabase Storage (or local disk fallback)
 */
const uploadFile = async ({ file, employeeId, category = 'General' }) => {
    validateFile(file);

    const ext = getSafeFileExtension(file.originalname, file.mimetype);
    const uniqueId = crypto.randomBytes(8).toString('hex');
    const timestamp = Date.now();
    const cleanCategory = (category || 'General').replace(/[^a-zA-Z0-9]/g, '_');
    const safeName = `${cleanCategory}_${timestamp}_${uniqueId}${ext}`;
    const fileKey = `${employeeId}/${safeName}`;

    // 1. Try Supabase Storage
    if (isSupabaseConfigured && supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .upload(fileKey, file.buffer, {
                    contentType: file.mimetype,
                    upsert: true
                });

            if (error) {
                // If bucket doesn't exist yet, attempt to create it or throw descriptive error
                if (error.message && error.message.includes('Bucket not found')) {
                    console.warn(`Bucket "${SUPABASE_BUCKET}" not found in Supabase. Attempting to create...`);
                    try {
                        await supabase.storage.createBucket(SUPABASE_BUCKET, { public: false });
                        const retry = await supabase.storage.from(SUPABASE_BUCKET).upload(fileKey, file.buffer, {
                            contentType: file.mimetype,
                            upsert: true
                        });
                        if (retry.error) throw retry.error;
                    } catch (createErr) {
                        console.warn('Could not auto-create Supabase bucket, falling back to local storage:', createErr.message);
                        return saveToLocalStorage({ file, fileKey, safeName, employeeId });
                    }
                } else {
                    console.warn('Supabase upload error, falling back to local disk:', error.message);
                    return saveToLocalStorage({ file, fileKey, safeName, employeeId });
                }
            }

            return {
                fileKey,
                fileUrl: '',
                storageProvider: 'SUPABASE',
                fileSize: file.size,
                fileName: file.originalname,
                fileType: file.mimetype
            };
        } catch (supabaseErr) {
            console.warn('Supabase upload exception, falling back to local disk:', supabaseErr.message);
            return saveToLocalStorage({ file, fileKey, safeName, employeeId });
        }
    }

    // 2. Local disk fallback
    return saveToLocalStorage({ file, fileKey, safeName, employeeId });
};

/**
 * Save to local private disk storage
 */
const saveToLocalStorage = ({ file, fileKey, safeName, employeeId }) => {
    const empDir = path.join(LOCAL_UPLOAD_DIR, String(employeeId));
    if (!fs.existsSync(empDir)) {
        fs.mkdirSync(empDir, { recursive: true });
    }
    const localFilePath = path.join(empDir, safeName);
    fs.writeFileSync(localFilePath, file.buffer);

    return {
        fileKey,
        fileUrl: '',
        storageProvider: 'LOCAL',
        fileSize: file.size,
        fileName: file.originalname,
        fileType: file.mimetype
    };
};

/**
 * Generate secure signed URL for viewing/downloading (or local proxy url)
 */
const getSignedUrl = async (fileKey, storageProvider = 'SUPABASE', expiresIn = 300) => {
    if (storageProvider === 'SUPABASE' && isSupabaseConfigured && supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .createSignedUrl(fileKey, expiresIn);

            if (!error && data?.signedUrl) {
                return data.signedUrl;
            }

            // Fallback to public url if bucket is marked public
            const { data: pubData } = supabase.storage
                .from(SUPABASE_BUCKET)
                .getPublicUrl(fileKey);

            if (pubData?.publicUrl) {
                return pubData.publicUrl;
            }
        } catch (err) {
            console.warn('Supabase URL generation error:', err.message);
        }
    }

    return null;
};

/**
 * Read file buffer from storage (works for both local and Supabase)
 */
const getFileBuffer = async (fileKey, storageProvider = 'SUPABASE') => {
    if (storageProvider === 'SUPABASE' && isSupabaseConfigured && supabase) {
        try {
            const { data, error } = await supabase.storage
                .from(SUPABASE_BUCKET)
                .download(fileKey);

            if (error) throw error;
            const arrayBuffer = await data.arrayBuffer();
            return Buffer.from(arrayBuffer);
        } catch (err) {
            console.warn('Could not download buffer from Supabase, checking local disk:', err.message);
        }
    }

    // Check local disk
    const localFilePath = path.join(LOCAL_UPLOAD_DIR, fileKey);
    if (fs.existsSync(localFilePath)) {
        return fs.readFileSync(localFilePath);
    }

    throw new Error('Document file not found on storage server.');
};

/**
 * Delete file from storage
 */
const deleteFile = async (fileKey, storageProvider = 'SUPABASE') => {
    if (storageProvider === 'SUPABASE' && isSupabaseConfigured && supabase) {
        try {
            await supabase.storage.from(SUPABASE_BUCKET).remove([fileKey]);
        } catch (err) {
            console.warn('Failed to delete file from Supabase:', err.message);
        }
    }

    const localFilePath = path.join(LOCAL_UPLOAD_DIR, fileKey);
    if (fs.existsSync(localFilePath)) {
        try {
            fs.unlinkSync(localFilePath);
        } catch (err) {
            console.warn('Failed to delete local file:', err.message);
        }
    }
};

module.exports = {
    uploadFile,
    getSignedUrl,
    getFileBuffer,
    deleteFile,
    validateFile,
    ALLOWED_MIME_TYPES,
    MAX_FILE_SIZE
};
