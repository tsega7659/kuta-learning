import { Router } from "express";
import { getCourseProgress, logLessonCompletion } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";

const router = Router();

router.use(authenticateToken);

router.get("/courses/:courseId", getCourseProgress);
router.post("/lessons/:lessonId/complete", logLessonCompletion);

export default router;
