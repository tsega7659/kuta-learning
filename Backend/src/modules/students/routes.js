import { Router } from "express";
import { getAllStudents, getStudentDetails } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { requireRole } from "../../middlewares/requireRole.js";

const router = Router();

router.use(authenticateToken);
router.use(requireRole(["CONTENT_MANAGER"]));

router.get("/", getAllStudents);
router.get("/:id", getStudentDetails);

export default router;
