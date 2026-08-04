import { Router } from "express";
import { body } from "express-validator";
import { register, login, me } from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";

const router = Router();

router.post(
    "/register",
    [
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
        body("name").notEmpty(),
        body("gradeLevel").isInt({ min: 1, max: 12 }),
    ],
    register
);

router.post("/login", [body("email").isEmail(), body("password").notEmpty()], login);

router.get("/me", authenticateToken, me);

export default router;
