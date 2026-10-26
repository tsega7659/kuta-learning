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

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limit each IP to 30 login/register requests per 15 minutes
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
    },
});
