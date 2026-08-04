import { Router } from "express";
import { body } from "express-validator";
import { register, login, me, forgotPassword, resetPassword } from "./controllers.js";
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

router.post("/forgot-password", [body("email").isEmail()], forgotPassword);

router.post(
    "/reset-password",
    [body("email").isEmail(), body("password").isLength({ min: 6 })],
    resetPassword
);

router.get("/me", authenticateToken, me);

export default router;
