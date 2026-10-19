import rateLimit from "express-rate-limit";

export const otpRateLimiter = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 5, // Limit each IP to 5 OTP requests per 10 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many OTP verification requests. Please wait a few minutes before trying again.",
    },
});
