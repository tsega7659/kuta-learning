export const UPLOAD_LIMITS_BYTES = {
    image: 10 * 1024 * 1024,
    document: 20 * 1024 * 1024,
    audio: 25 * 1024 * 1024,
    video: 100 * 1024 * 1024,
};

export const UPLOAD_LIMITS_MB = {
    image: 10,
    document: 20,
    audio: 25,
    video: 100,
};

export const UPLOAD_MAX_BYTES = Math.max(...Object.values(UPLOAD_LIMITS_BYTES));

const DOCUMENT_EXTENSIONS = new Set([
    "pdf", "doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "epub",
]);

export function classifyUploadFile(file) {
    const mime = (file.mimetype || "").toLowerCase();
    const ext = (file.originalname || "").includes(".")
        ? file.originalname.split(".").pop().toLowerCase()
        : "";

    if (mime.startsWith("image/")) return "image";
    if (mime.startsWith("video/")) return "video";
    if (mime.startsWith("audio/")) return "audio";
    if (mime === "application/pdf" || DOCUMENT_EXTENSIONS.has(ext)) return "document";
    return "document";
}

export function getUploadLimitError(file) {
    const kind = classifyUploadFile(file);
    const maxBytes = UPLOAD_LIMITS_BYTES[kind];
    if (file.size <= maxBytes) return null;

    const label = kind.charAt(0).toUpperCase() + kind.slice(1);
    return `${label} files must be ${UPLOAD_LIMITS_MB[kind]} MB or smaller (this file is ${(file.size / (1024 * 1024)).toFixed(1)} MB).`;
}
