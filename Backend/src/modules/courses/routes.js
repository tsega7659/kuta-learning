import { Router } from "express";
import {
    getAllCourses,
    getCourseById,
    createCourse,
    updateCourse,
    deleteCourse,
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";
import { optionalAuth } from "../../middlewares/optionalAuth.js";
import chapterRoutes from "../chapters/routes.js";

const router = Router();

router.get("/", optionalAuth, getAllCourses);
router.get("/:id", optionalAuth, getCourseById);

router.use(authenticateToken);
router.use(requireRole(["CONTENT_MANAGER"]));

router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

router.use("/:courseId/chapters", chapterRoutes);

export default router;
