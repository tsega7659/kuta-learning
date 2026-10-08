import { Router } from "express";
import { getChapters, createChapter, updateChapter, deleteChapter } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import topicRoutes from "../topics/routes.js";

const router = Router({ mergeParams: true });

router.get("/", authenticateToken, getChapters);

router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), createChapter);
router.put("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateChapter);
router.delete("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteChapter);

router.use("/:chapterId/topics", topicRoutes);

export default router;
