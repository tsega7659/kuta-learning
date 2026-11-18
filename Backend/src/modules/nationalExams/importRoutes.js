import { Router } from "express";
import multer from "multer";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { importNationalExamCsv } from "./importController.js";

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024, files: 1 },
});

router.post(
    "/import",
    (req, res, next) => {
        console.info("[national-exam-import] Import route matched", {
            method: req.method,
            path: req.originalUrl,
        });
        next();
    },
    authenticateToken,
    requireRole(["CONTENT_MANAGER"]),
    (req, res, next) => upload.single("file")(req, res, (error) => {
        if (!error) {
            console.info("[national-exam-import] CSV upload received", {
                filename: req.file?.originalname || null,
                sizeBytes: req.file?.size || 0,
            });
            return next();
        }
        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            console.error("[national-exam-import] CSV upload rejected", {
                status,
                code: error.code,
                message: error.message,
            });
            return res.status(status).json({ success: false, message: error.message });
        }
        console.error("[national-exam-import] CSV upload failed", {
            message: error.message,
        });
        return res.status(400).json({ success: false, message: "Could not read the uploaded CSV file." });
    }),
    importNationalExamCsv
);

export default router;
