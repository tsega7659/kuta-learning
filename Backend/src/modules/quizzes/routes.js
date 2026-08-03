import { Router } from "express";
import {
    getQuiz,
    getQuizAvailability,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    addQuestion,
    updateQuestion,
    deleteQuestion,
    addOption,
    updateOption,
    deleteOption,
    startAttempt,
    submitAttempt,
    getMyAttempts,
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router({ mergeParams: true }); // Extends from topicId

// ---- Quiz meta ----
router.get("/", authenticateToken, getQuiz);
router.get("/availability", authenticateToken, getQuizAvailability);
router.get("/attempts", authenticateToken, getMyAttempts);

// ---- Content Manager: quiz CRUD ----
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), createQuiz);
router.put("/:quizId", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateQuiz);
router.delete("/:quizId", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteQuiz);

// ---- Content Manager: questions ----
router.post("/:quizId/questions", authenticateToken, requireRole(["CONTENT_MANAGER"]), addQuestion);
router.put("/:quizId/questions/:questionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateQuestion);
router.delete("/:quizId/questions/:questionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteQuestion);

// ---- Content Manager: options ----
router.post("/:quizId/questions/:questionId/options", authenticateToken, requireRole(["CONTENT_MANAGER"]), addOption);
router.put("/:quizId/questions/:questionId/options/:optionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateOption);
router.delete("/:quizId/questions/:questionId/options/:optionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteOption);

// ---- Student: attempts ----
router.post("/:quizId/start", authenticateToken, startAttempt);
router.post("/:quizId/submit", authenticateToken, submitAttempt);

export default router;
