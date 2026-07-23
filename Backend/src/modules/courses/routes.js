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
import chapterRoutes from "../chapters/routes.js"; // allow nesting chapters inside courses

const router = Router();

// Public routes (anyone can see available courses)
router.get("/", getAllCourses);
router.get("/:id", getCourseById);

// Admin / Content Manager routes
router.use(authenticateToken);
router.use(requireRole(["CONTENT_MANAGER"]));

router.post("/", createCourse);
router.put("/:id", updateCourse);
router.delete("/:id", deleteCourse);

// Nested routes: /api/courses/:courseId/chapters -> handled by chapters router
router.use("/:courseId/chapters", chapterRoutes);

export default router;
