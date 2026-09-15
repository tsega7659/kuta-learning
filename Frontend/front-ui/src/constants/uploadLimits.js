/** Must match Backend/src/config/uploadLimits.js */
export const UPLOAD_LIMITS_MB = {
    image: 10,
    document: 20,
    audio: 25,
    video: 100,
};

const DOCUMENT_EXTENSIONS = new Set([
    'pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt', 'csv', 'epub',
]);

const LESSON_TYPE_TO_KIND = {
    IMAGE: 'image',
    DOCUMENT: 'document',
    AUDIO: 'audio',
    VIDEO: 'video',
};

export function maxBytesForLessonType(lessonContentType) {
    const kind = LESSON_TYPE_TO_KIND[lessonContentType] || 'document';
    return UPLOAD_LIMITS_MB[kind] * 1024 * 1024;
}

export function limitHintForLessonType(lessonContentType) {
    const kind = LESSON_TYPE_TO_KIND[lessonContentType] || 'document';
    return `Max file size: ${UPLOAD_LIMITS_MB[kind]} MB`;
}

export function validateFileForLessonType(file, lessonContentType) {
    if (!file) return null;
    const kind = LESSON_TYPE_TO_KIND[lessonContentType];
    if (!kind) return null;

    const maxBytes = UPLOAD_LIMITS_MB[kind] * 1024 * 1024;
    if (file.size <= maxBytes) return null;

    return `${kind.charAt(0).toUpperCase() + kind.slice(1)} files must be ${UPLOAD_LIMITS_MB[kind]} MB or smaller (selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
}

/** Cover images and generic image uploads */
export function validateImageFile(file) {
    if (!file) return null;
    const maxBytes = UPLOAD_LIMITS_MB.image * 1024 * 1024;
    if (file.size <= maxBytes) return null;
    return `Images must be ${UPLOAD_LIMITS_MB.image} MB or smaller (selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
}

export function classifyFile(file) {
    const mime = (file.type || '').toLowerCase();
    const ext = file.name?.includes('.') ? file.name.split('.').pop().toLowerCase() : '';
    if (mime.startsWith('image/')) return 'image';
    if (mime.startsWith('video/')) return 'video';
    if (mime.startsWith('audio/')) return 'audio';
    if (mime === 'application/pdf' || DOCUMENT_EXTENSIONS.has(ext)) return 'document';
    return 'document';
}

export function validateFileByKind(file) {
    if (!file) return null;
    const kind = classifyFile(file);
    const maxBytes = UPLOAD_LIMITS_MB[kind] * 1024 * 1024;
    if (file.size <= maxBytes) return null;
    return `${kind.charAt(0).toUpperCase() + kind.slice(1)} files must be ${UPLOAD_LIMITS_MB[kind]} MB or smaller (selected file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
}
