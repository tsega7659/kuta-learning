import { Router } from "express";
import multer from "multer";
import {
    getExamSubjects,
    getDashboardExamSimulator,
    getExamsBySubject,
    startExamAttempt,
    saveExamProgress,
    submitExamAttempt,
    getExamAttemptResult,
    getAdminSubjects,
    createExamSubject,
    updateExamSubject,
    deleteExamSubject,
    getAdminExams,
    getAdminExamDetail,
    createNationalExam,
    updateNationalExam,
    deleteNationalExam,
    getExamQuestions,
    addExamQuestion,
    updateExamQuestion,
    deleteExamQuestion,
    uploadExamImage,
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

// Multer memory storage for direct file upload (images for questions, options, explanations)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
});

// Student / Public Dashboard & Subjects
router.get("/subjects", authenticateToken, getExamSubjects);
router.get("/dashboard", authenticateToken, getDashboardExamSimulator);
router.get("/subjects/:subjectId/exams", authenticateToken, getExamsBySubject);

// Exam taking & attempts
router.post("/:examId/start", authenticateToken, startExamAttempt);
router.put("/attempts/:attemptId/save-progress", authenticateToken, saveExamProgress);
router.post("/attempts/:attemptId/submit", authenticateToken, submitExamAttempt);
router.get("/attempts/:attemptId", authenticateToken, getExamAttemptResult);

// Content Manager / Admin endpoints
// Subjects CRUD
router.get("/admin/subjects", authenticateToken, requireRole(["CONTENT_MANAGER"]), getAdminSubjects);
router.post("/subjects", authenticateToken, requireRole(["CONTENT_MANAGER"]), createExamSubject);
router.put("/admin/subjects/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateExamSubject);
router.delete("/admin/subjects/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteExamSubject);

// Exams CRUD
router.get("/admin/exams", authenticateToken, requireRole(["CONTENT_MANAGER"]), getAdminExams);
router.get("/admin/exams/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), getAdminExamDetail);
router.post("/exams", authenticateToken, requireRole(["CONTENT_MANAGER"]), createNationalExam);
router.put("/admin/exams/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateNationalExam);
router.delete("/admin/exams/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteNationalExam);

// Questions CRUD with direct file upload support
router.get("/exams/:examId/questions", authenticateToken, requireRole(["CONTENT_MANAGER"]), getExamQuestions);
router.post("/exams/:examId/questions", authenticateToken, requireRole(["CONTENT_MANAGER"]), upload.any(), addExamQuestion);
router.put("/admin/questions/:questionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), upload.any(), updateExamQuestion);
router.delete("/admin/questions/:questionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteExamQuestion);
router.post("/upload-image", authenticateToken, requireRole(["CONTENT_MANAGER"]), upload.single("file"), uploadExamImage);

export default router;
