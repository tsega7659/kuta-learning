import { Router } from "express";
import {
    getShortNotesSubjects,
    getSubjectNoteDetails,
    getChapterDetail,
    updateChapterReadProgress,
    downloadChapterPdf,
    createNoteChapter
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Student routes
router.get("/subjects", authenticateToken, getShortNotesSubjects);
router.get("/subjects/:subjectId", authenticateToken, getSubjectNoteDetails);
router.get("/chapters/:chapterId", authenticateToken, getChapterDetail);
router.post("/chapters/:chapterId/progress", authenticateToken, updateChapterReadProgress);
router.get("/chapters/:chapterId/download", authenticateToken, downloadChapterPdf);

// Content Manager CRUD
router.post("/chapters", authenticateToken, requireRole(["CONTENT_MANAGER"]), createNoteChapter);

export default router;
