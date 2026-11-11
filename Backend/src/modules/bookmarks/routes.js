import { Router } from "express";
import {
    toggleBookmark,
    getBookmarks,
    checkBookmark,
    deleteBookmark,
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";

const router = Router();

// All bookmark routes require authentication
router.use(authenticateToken);

router.post("/toggle", toggleBookmark);
router.get("/", getBookmarks);
router.get("/check", checkBookmark);
router.delete("/:id", deleteBookmark);

export default router;

