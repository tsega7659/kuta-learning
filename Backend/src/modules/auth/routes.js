import { Router } from "express";
import { body } from "express-validator";
import {
    register,
    registerKids,
    login,
    refreshToken,
    me,
    forgotPassword,
    verifyOtp,
    resetPassword,
    requestChangePasswordOtp,
    changePassword,
    submitOnboarding,
    updateProfile,
} from "./controllers.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { otpRateLimiter } from "../../middlewares/rateLimiter.js";

const router = Router();

// Registration for Grades (gradeLevel is optional on signup; chosen on onboarding)
router.post(
    "/register",
    [
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
        body("name").notEmpty(),
        body("gradeLevel").optional({ nullable: true }).isInt({ min: 1, max: 12 }),
        body("stream").optional({ nullable: true }).isString(),
    ],
    register
);

router.post(
    "/register/grades",
    [
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
        body("name").notEmpty(),
        body("gradeLevel").optional({ nullable: true }).isInt({ min: 1, max: 12 }),
        body("stream").optional({ nullable: true }).isString(),
    ],
    register
);

// Independent Registration for Kids (selects grade 1-4 directly)
router.post(
    "/register/kids",
    [
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
        body("name").notEmpty(),
        body("gradeLevel").isInt({ min: 1, max: 6 }),
    ],
    registerKids
);

router.post("/login", [body("email").isEmail(), body("password").notEmpty()], login);

// Refresh Token Route (OAuth 2.0 / JWT rotation)
router.post("/refresh-token", [body("refreshToken").notEmpty()], refreshToken);

// Forgot Password Flow (Rate limited to 5 OTPs / 10 minutes)
router.post("/forgot-password", otpRateLimiter, [body("email").isEmail()], forgotPassword);

router.post(
    "/verify-otp",
    [
        body("email").isEmail(),
        body("otp").isLength({ min: 6, max: 6 }),
        body("type").optional().isString(),
    ],
    verifyOtp
);

router.post(
    "/reset-password",
    [
        body("email").isEmail(),
        body("password").isLength({ min: 6 }),
    ],
    resetPassword
);

// Authenticated Password Change Flow (Rate limited)
router.post("/change-password/request-otp", authenticateToken, otpRateLimiter, requestChangePasswordOtp);

router.post(
    "/change-password",
    authenticateToken,
    [
        body("currentPassword").notEmpty(),
        body("newPassword").isLength({ min: 6 }),
        body("otp").isLength({ min: 6, max: 6 }),
    ],
    changePassword
);

router.get("/me", authenticateToken, me);

// Onboarding for Grade 6, 8, 12 (stream if 12)
router.post(
    "/onboarding",
    authenticateToken,
    [
        body("gradeLevel").isInt({ min: 1, max: 12 }),
        body("stream").optional().isString(),
    ],
    submitOnboarding
);

router.put("/profile", authenticateToken, updateProfile);

export default router;
