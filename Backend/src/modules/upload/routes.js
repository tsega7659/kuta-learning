import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import https from "https";
import http from "http";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Helper: configure cloudinary once
const configureCloudinary = () => {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
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

        // Validate it's a Cloudinary URL
        if (!url.includes("cloudinary.com")) {
            return res.status(400).json({ message: "Not a valid Cloudinary URL" });
        }

        // Normalize: ensure PDF extension is present for image-type PDFs
        let targetUrl = url;
        if (targetUrl.includes("/image/upload/") && !targetUrl.split("/").pop().includes(".")) {
            targetUrl = `${targetUrl}.pdf`;
        }

        console.log(`[download] Proxying: ${targetUrl}`);

        // Fetch the file server-side — CORS doesn't apply to Node.js,
        // so plain CDN URLs work here even if the browser gets 401/CORS blocked.
        const protocol = targetUrl.startsWith("https") ? https : http;
        const safeFilename = (filename || "document.pdf").replace(/[^\w\-\.]/g, "_");

        const proxyRequest = protocol.get(targetUrl, (upstream) => {
            console.log(`[download] Cloudinary status: ${upstream.statusCode}`);

            // Follow one redirect if needed
            if (upstream.statusCode >= 300 && upstream.statusCode < 400 && upstream.headers.location) {
                const loc = upstream.headers.location;
                const redirProtocol = loc.startsWith("https") ? https : http;
                redirProtocol.get(loc, (redirected) => {
                    res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
                    res.setHeader("Content-Type", redirected.headers["content-type"] || "application/octet-stream");
                    if (redirected.headers["content-length"]) res.setHeader("Content-Length", redirected.headers["content-length"]);
                    redirected.pipe(res);
                }).on("error", (err) => {
                    console.error("[download] Redirect error:", err);
                    if (!res.headersSent) res.status(502).json({ message: "Redirect failed" });
                });
                return;
            }

            if (upstream.statusCode !== 200) {
                console.error(`[download] Upstream ${upstream.statusCode} — trying signed URL fallback`);
                upstream.resume();

                // Fallback: generate a signed URL via Cloudinary SDK
                configureCloudinary();
                try {
                    const urlObj = new URL(targetUrl);
                    const pathParts = urlObj.pathname.split("/").filter(Boolean);
                    const uploadIdx = pathParts.indexOf("upload");
                    if (uploadIdx === -1) throw new Error("No upload segment");

                    const resourceType = pathParts[uploadIdx - 1] || "image";
                    const afterUpload = pathParts.slice(uploadIdx + 1);
                    const startIdx = /^v\d+$/.test(afterUpload[0]) ? 1 : 0;
                    const publicIdParts = [...afterUpload.slice(startIdx)];
                    const lastPart = publicIdParts[publicIdParts.length - 1];
                    const dotIdx = lastPart.lastIndexOf(".");
                    const ext = dotIdx !== -1 ? lastPart.slice(dotIdx + 1) : "pdf";
                    if (dotIdx !== -1) publicIdParts[publicIdParts.length - 1] = lastPart.slice(0, dotIdx);
                    const publicId = publicIdParts.join("/");

                    const signedUrl = cloudinary.url(publicId, {
                        resource_type: resourceType,
                        sign_url: true,
                        secure: true,
                        type: "upload",
                        expires_at: Math.floor(Date.now() / 1000) + 120,
                        ...(ext && { format: ext }),
                    });

                    console.log(`[download] Signed fallback URL for public_id="${publicId}"`);

                    const signedProtocol = signedUrl.startsWith("https") ? https : http;
                    signedProtocol.get(signedUrl, (signedUpstream) => {
                        console.log(`[download] Signed fallback status: ${signedUpstream.statusCode}`);
                        if (signedUpstream.statusCode !== 200) {
                            signedUpstream.resume();
                            if (!res.headersSent) res.status(502).json({ message: `Cannot retrieve file (${signedUpstream.statusCode})` });
                            return;
                        }
                        res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
                        res.setHeader("Content-Type", signedUpstream.headers["content-type"] || "application/octet-stream");
                        if (signedUpstream.headers["content-length"]) res.setHeader("Content-Length", signedUpstream.headers["content-length"]);
                        signedUpstream.pipe(res);
                    }).on("error", (err) => {
                        console.error("[download] Signed fallback error:", err);
                        if (!res.headersSent) res.status(502).json({ message: "Failed to retrieve file" });
                    });
                } catch (signErr) {
                    console.error("[download] Signed URL generation failed:", signErr);
                    if (!res.headersSent) res.status(502).json({ message: "File not accessible" });
                }
                return;
            }

            res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}"`);
            res.setHeader("Content-Type", upstream.headers["content-type"] || "application/octet-stream");
            if (upstream.headers["content-length"]) res.setHeader("Content-Length", upstream.headers["content-length"]);
            upstream.pipe(res);
        });

        proxyRequest.on("error", (err) => {
            console.error("[download] Proxy error:", err);
            if (!res.headersSent) res.status(502).json({ message: "Failed to reach Cloudinary" });
        });

    } catch (err) {
        console.error("[download] Route error:", err);
        if (!res.headersSent) res.status(500).json({ message: "Server error", error: err.message });
    }
});

/**
 * POST /api/upload
 * Expects multipart form data with a 'file' field
 */
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), upload.single("file"), (req, res) => {
    try {
        configureCloudinary();

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
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
                // If it was a PDF and URL doesn't have .pdf, ensure .pdf extension so Cloudinary serves it as application/pdf
                if (isPdf && !finalUrl.toLowerCase().endsWith(".pdf")) {
                    finalUrl = `${finalUrl}.pdf`;
                }

                res.status(201).json({ url: finalUrl });
            }
        );

        // Convert multer buffer to stream and pipe to cloudinary
        streamifier.createReadStream(req.file.buffer).pipe(uploadStream);

    } catch (err) {
        res.status(500).json({ message: "File upload failed", error: err.message });
    }
});

export default router;
