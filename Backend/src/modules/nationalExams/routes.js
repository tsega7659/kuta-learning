import { Router } from "express";
import {
    getExamSubjects,
    getDashboardExamSimulator,
    getExamsBySubject,
    startExamAttempt,
    saveExamProgress,
    submitExamAttempt,
    getExamAttemptResult,
    createExamSubject,
    createNationalExam,
    addExamQuestion,
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

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
router.post("/subjects", authenticateToken, requireRole(["CONTENT_MANAGER"]), createExamSubject);
router.post("/exams", authenticateToken, requireRole(["CONTENT_MANAGER"]), createNationalExam);
router.post("/exams/:examId/questions", authenticateToken, requireRole(["CONTENT_MANAGER"]), addExamQuestion);

export default router;
