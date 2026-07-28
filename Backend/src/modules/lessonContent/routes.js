import { Router } from "express";
import { getLessonContents, addLessonContent, updateLessonContent, deleteLessonContent } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router({ mergeParams: true });

router.get("/", authenticateToken, getLessonContents);
router.post("/", authenticateToken, requireRole(["CONTENT_MANAGER"]), addLessonContent);
router.put("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), updateLessonContent);
router.delete("/:id", authenticateToken, requireRole(["CONTENT_MANAGER"]), deleteLessonContent);

export default router;
