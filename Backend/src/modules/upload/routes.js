import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import https from "https";
import http from "http";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import {
    UPLOAD_LIMITS_MB,
    UPLOAD_MAX_BYTES,
    getUploadLimitError,
} from "../../config/uploadLimits.js";

const router = Router();

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: UPLOAD_MAX_BYTES },
});

router.get("/limits", authenticateToken, (req, res) => {
    res.json({ limitsMb: UPLOAD_LIMITS_MB });
});

// Helper: configure cloudinary once
const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
};

const hasCloudinaryCredentials = () =>
    Boolean(process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET);

/** Parse a Cloudinary delivery URL into resource_type, public_id, and optional format. */
const parseCloudinaryUrl = (url) => {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/").filter(Boolean);
    const uploadIdx = pathParts.indexOf("upload");
    if (uploadIdx === -1) return null;

    const resourceType = pathParts[uploadIdx - 1] || "image";
    const afterUpload = pathParts.slice(uploadIdx + 1);
    const startIdx = /^v\d+$/.test(afterUpload[0]) ? 1 : 0;
    const publicIdParts = [...afterUpload.slice(startIdx)];
    if (publicIdParts.length === 0) return null;

    const lastPart = publicIdParts[publicIdParts.length - 1];
    let format;
    const dotIdx = lastPart.lastIndexOf(".");
    if (dotIdx !== -1) {
        format = lastPart.slice(dotIdx + 1).toLowerCase();
        publicIdParts[publicIdParts.length - 1] = lastPart.slice(0, dotIdx);
    }

    const publicId = publicIdParts.join("/");
    if (!publicId) return null;

    return { resourceType, publicId, format };
};

const pipeRemoteFile = (targetUrl, res, safeFilename) =>
    new Promise((resolve, reject) => {
        const protocol = targetUrl.startsWith("https") ? https : http;
        const req = protocol.get(targetUrl, (upstream) => {
            if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
                upstream.resume();
                pipeRemoteFile(upstream.headers.location, res, safeFilename).then(resolve).catch(reject);
                return;
            }

            if (upstream.statusCode !== 200) {
                upstream.resume();
                reject(new Error(`Upstream ${upstream.statusCode}`));
                return;
            }

            if (!res.headersSent) {
                res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
                res.setHeader("Content-Type", upstream.headers["content-type"] || "application/octet-stream");
                if (upstream.headers["content-length"]) {
                    res.setHeader("Content-Length", upstream.headers["content-length"]);
                }
            }
            upstream.pipe(res);
            upstream.on("end", resolve);
            upstream.on("error", reject);
        });
        req.on("error", reject);
    });

const buildSignedCloudinaryUrl = (parsed) => {
    configureCloudinary();
    const options = {
        resource_type: parsed.resourceType,
        sign_url: true,
        secure: true,
        type: "upload",
        expires_at: Math.floor(Date.now() / 1000) + 300,
    };
    // Image-type PDFs need explicit format; raw assets should use public_id as stored.
    if (parsed.resourceType === "image" && parsed.format) {
        options.format = parsed.format;
    } else if (parsed.resourceType === "image" && !parsed.format) {
        options.format = "pdf";
    }
    return cloudinary.url(parsed.publicId, options);
};

/**
 * GET /api/upload/download?url=<encoded_cloudinary_url>&filename=<optional_name>
 * Proxies the file download server-side to avoid CORS / 401 issues.
 */
router.get("/download", authenticateToken, async (req, res) => {
    try {
        const { url, filename } = req.query;
        if (!url) {
            return res.status(400).json({ message: "Missing url query parameter" });
        }

        if (!url.includes("cloudinary.com")) {
            return res.status(400).json({ message: "Not a valid Cloudinary URL" });
        }

        let targetUrl = url;
        if (targetUrl.includes("/image/upload/") && !targetUrl.split("/").pop().includes(".")) {
            targetUrl = `${targetUrl}.pdf`;
        }

        const safeFilename = (filename || "document.pdf").replace(/[^\w\-\.]/g, "_");
        const parsed = parseCloudinaryUrl(targetUrl);

        if (!parsed) {
            return res.status(400).json({ message: "Could not parse Cloudinary URL" });
        }

        const attempts = [];

        if (hasCloudinaryCredentials()) {
            try {
                attempts.push(buildSignedCloudinaryUrl(parsed));
            } catch (signErr) {
                console.error("[download] Signed URL build failed:", signErr);
            }
        } else {
            console.warn("[download] Cloudinary API secret missing — signed downloads unavailable");
        }

        attempts.push(targetUrl);

        let lastError = null;
        for (const attemptUrl of attempts) {
            try {
                console.log(`[download] Trying: ${attemptUrl}`);
                await pipeRemoteFile(attemptUrl, res, safeFilename);
                return;
            } catch (err) {
                lastError = err;
                if (res.headersSent) return;
                console.error(`[download] Attempt failed: ${err.message}`);
            }
        }

        if (!res.headersSent) {
            res.status(502).json({
                message: hasCloudinaryCredentials()
                    ? "File not accessible on Cloudinary. Ask your instructor to re-upload the document."
                    : "Download service is not configured (Cloudinary credentials missing on server).",
                detail: lastError?.message,
            });
        }
    } catch (err) {
        console.error("[download] Route error:", err);
        if (!res.headersSent) res.status(500).json({ message: "Server error", error: err.message });
    }
});

const handleUpload = (req, res) => {
    try {
        configureCloudinary();

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const limitError = getUploadLimitError(req.file);
        if (limitError) {
            return res.status(413).json({ message: limitError });
        }

        const originalName = req.file.originalname || "file";
        const ext = originalName.includes(".") ? originalName.split(".").pop().toLowerCase() : "";
        const isPdf = req.file.mimetype === "application/pdf" || ext === "pdf";
        // PDFs and office docs use "raw" resource_type — raw files are always publicly
        // accessible on Cloudinary without signed URLs or delivery restrictions.
        const isDocumentType = isPdf || ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "epub"].includes(ext);

        const uploadOptions = {
            folder: "kuta_learning",
            resource_type: isDocumentType ? "raw" : "auto",
            use_filename: true,
            unique_filename: true,
        };

        // Upload to Cloudinary using upload_stream
        const uploadStream = cloudinary.uploader.upload_stream(
            uploadOptions,
            (error, result) => {
                if (error) {
                    console.error("Cloudinary upload error:", error);
                    return res.status(500).json({ message: "File upload failed", error: error.message });
                }

                let finalUrl = result.secure_url;
                // Legacy image-type PDFs need .pdf suffix for correct delivery.
                // Raw uploads must keep Cloudinary's URL unchanged.
                if (isPdf && result.resource_type === "image" && !finalUrl.toLowerCase().endsWith(".pdf")) {
                    finalUrl = `${finalUrl}.pdf`;
                }

                res.status(201).json({ url: finalUrl, resourceType: result.resource_type });
            }
        );

        // Convert multer buffer to stream and pipe to cloudinary
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (err) {
        res.status(500).json({ message: "File upload failed", error: err.message });
    }
};

/**
 * POST /api/upload
 * Expects multipart form data with a 'file' field
 */
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), (req, res) => {
    upload.single("file")(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === "LIMIT_FILE_SIZE") {
                return res.status(413).json({
                    message: `File is too large. Maximum allowed size is ${UPLOAD_LIMITS_MB.video} MB for videos and lower limits for other types.`,
                });
            }
            return res.status(400).json({ message: err.message });
        }
        if (err) {
            return res.status(500).json({ message: "File upload failed", error: err.message });
        }
        handleUpload(req, res);
    });
});

export default router;
