import { Router } from "express";
import { getChapters, createChapter, updateChapter, deleteChapter } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import topicRoutes from "../topics/routes.js"; // nested topics

const router = Router({ mergeParams: true }); // merges req.params.courseId from parent route

router.get("/", authenticateToken, getChapters);

router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), createChapter);
router.put("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateChapter);
router.delete("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteChapter);

// Nested routes: /api/courses/:courseId/chapters/:chapterId/topics
router.use("/:chapterId/topics", topicRoutes);

export default router;
