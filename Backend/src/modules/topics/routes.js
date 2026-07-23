import { Router } from "express";
import { getTopics, createTopic, updateTopic, deleteTopic } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import lessonRoutes from "../lessons/routes.js";
import quizRoutes from "../quizzes/routes.js"; // IMPORT THIS

const router = Router({ mergeParams: true });

router.get("/", authenticateToken, getTopics);
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), createTopic);
router.put("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateTopic);
router.delete("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteTopic);

router.use("/:topicId/lessons", lessonRoutes);
router.use("/:topicId/quiz", quizRoutes); // MAPPED AS TOPIC HAS 1 QUIZ MAX

export default router;
