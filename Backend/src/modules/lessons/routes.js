import { Router } from "express";
import { getLessons, createLesson, updateLesson, deleteLesson } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import lessonContentRoutes from "../lessonContent/routes.js"; // IMPORT THIS

const router = Router({ mergeParams: true }); // access topicId

router.get("/", authenticateToken, getLessons);
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), createLesson);
router.put("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateLesson);
router.delete("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteLesson);

// NESTED
router.use("/:lessonId/contents", lessonContentRoutes);

export default router;
