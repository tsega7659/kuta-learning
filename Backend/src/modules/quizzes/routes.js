import { Router } from "express";
import { getQuiz, createQuiz, updateQuiz, deleteQuiz, addQuestion, deleteQuestion, submitAttempt } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router({ mergeParams: true }); // Extends from topicId

// Get Quiz for this topic
router.get("/", authenticateToken, getQuiz);
// Create/Update/Delete Quiz for this topic
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), createQuiz);
router.put("/:quizId", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateQuiz);
router.delete("/:quizId", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteQuiz);

// Questions and Options management
router.post("/:quizId/questions", authenticateToken, requireRole(["CONTENT_MANAGER"]), addQuestion);
router.delete("/:quizId/questions/:questionId", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteQuestion);

// Student Quiz Submit endpoint
router.post("/:quizId/submit", authenticateToken, submitAttempt);

export default router;
