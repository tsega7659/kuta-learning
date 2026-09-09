import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import streamifier from "streamifier";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Configure Multer to use memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

/**
 * POST /api/upload
 * Expects multipart form data with a 'file' field
 */
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), upload.single("file"), (req, res) => {
    try {
        // Dynamically configure to bypass ES module hoisting of dotenv
        cloudinary.config({
            cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
            api_key: process.env.CLOUDINARY_API_KEY,
            api_secret: process.env.CLOUDINARY_API_SECRET
        });

        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const originalName = req.file.originalname || "file";
        const ext = originalName.includes(".") ? originalName.split(".").pop().toLowerCase() : "";
        const isPdf = req.file.mimetype === "application/pdf" || ext === "pdf";
        const isOfficeDoc = ["doc", "docx", "ppt", "pptx", "xls", "xlsx", "txt", "csv", "epub"].includes(ext);

        const uploadOptions = {
            folder: "kuta_learning",
            resource_type: isOfficeDoc ? "raw" : "auto",
            use_filename: true,
            unique_filename: true,
            ...(isPdf && { format: "pdf" })
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
