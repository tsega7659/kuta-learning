import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";
import { validationResult } from "express-validator";
import { sendOtpEmail } from "../../services/emailService.js";

const formatUserProfile = (user) => {
    const displayName = user.studentProfile?.name ?? user.email.split("@")[0];
    return {
        id: user.id,
        email: user.email,
        role: user.role,
        name: displayName,
        ...(user.studentProfile && {
            gradeLevel: user.studentProfile.gradeLevel,
            stream: user.studentProfile.stream,
            isPremium: user.studentProfile.isPremium,
            onboardingCompleted: user.studentProfile.onboardingCompleted,
            avatarUrl: user.studentProfile.avatarUrl,
        }),
    };
};

const validateRequest = (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errs = errors.array();
        res.status(400).json({
            message: errs[0]?.msg || "Validation error",
            errors: errs,
        });
        return false;
    }
    return true;
};

const generateTokens = (user) => {
    const token = jwt.sign(
        { userId: user.id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "7d" }
    );
    const refreshToken = jwt.sign(
        { userId: user.id, role: user.role, type: "REFRESH" },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
    );
    return { token, refreshToken };
};

export const register = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { email, password, name, gradeLevel, stream } = req.body;

    // Validate gradeLevel and stream if provided (grades signup can omit gradeLevel)
    const parsedGrade = (gradeLevel !== undefined && gradeLevel !== null && gradeLevel !== "") ? Number(gradeLevel) : null;
    let normalizedStream = null;
    if (parsedGrade === 12) {
        if (stream && ["NATURAL", "SOCIAL"].includes(stream.toUpperCase())) {
            normalizedStream = stream.toUpperCase();
        } else if (stream) {
            return res.status(400).json({ message: "Invalid stream for grade 12. Must be 'NATURAL' or 'SOCIAL'." });
        }
    }

    const onboardingCompleted = Boolean(parsedGrade && (parsedGrade !== 12 || normalizedStream));

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: "Email already registered" });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { email, passwordHash, role: "STUDENT" },
            });

            await tx.studentProfile.create({
                data: {
                    userId: newUser.id,
                    name,
                    gradeLevel: parsedGrade,
                    stream: normalizedStream,
                    onboardingCompleted,
                },
            });

            return tx.user.findUnique({
                where: { id: newUser.id },
                include: { studentProfile: true },
            });
        });

        const { token, refreshToken: newRefreshToken } = generateTokens(user);

        res.status(201).json({
            token,
            refreshToken: newRefreshToken,
            role: user.role,
            profile: formatUserProfile(user),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const registerKids = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { email, password, name, gradeLevel } = req.body;
    const parsedGrade = Number(gradeLevel);

    try {
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(409).json({ message: "Email already registered" });

        const passwordHash = await bcrypt.hash(password, 10);

        const user = await prisma.$transaction(async (tx) => {
            const newUser = await tx.user.create({
                data: { email, passwordHash, role: "STUDENT" },
            });

            await tx.studentProfile.create({
                data: {
                    userId: newUser.id,
                    name,
                    gradeLevel: parsedGrade,
                    stream: null,
                    onboardingCompleted: true, // Kids select grade at registration, so onboarding is complete
                },
            });

            return tx.user.findUnique({
                where: { id: newUser.id },
                include: { studentProfile: true },
            });
        });

        const { token, refreshToken: newRefreshToken } = generateTokens(user);

        res.status(201).json({
            token,
            refreshToken: newRefreshToken,
            role: user.role,
            profile: formatUserProfile(user),
        });
    } catch (err) {
        console.error("Kids registration error:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const login = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { studentProfile: true },
        });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ message: "Invalid credentials" });

        const { token, refreshToken: newRefreshToken } = generateTokens(user);

        res.json({
            token,
            refreshToken: newRefreshToken,
            role: user.role,
            profile: formatUserProfile(user),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const refreshToken = async (req, res) => {
    const { refreshToken: tokenToRefresh } = req.body;
    if (!tokenToRefresh) {
        return res.status(400).json({ message: "Refresh token is required" });
    }

    try {
        const decoded = jwt.verify(tokenToRefresh, process.env.JWT_SECRET);
        if (decoded.type !== "REFRESH") {
            return res.status(403).json({ message: "Invalid token type" });
        }

        const user = await prisma.user.findUnique({
            where: { id: decoded.userId },
            include: { studentProfile: true },
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const { token, refreshToken: newRefreshToken } = generateTokens(user);

        res.json({
            token,
            refreshToken: newRefreshToken,
            role: user.role,
            profile: formatUserProfile(user),
        });
    } catch (err) {
        return res.status(403).json({ message: "Invalid or expired refresh token" });
    }
};

export const forgotPassword = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            // Enumeration-safe: Do not reveal if email is registered
            return res.json({ message: "If an account exists with this email address, a verification code has been sent.", email });
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Clear previous forgot-password OTPs for this email
        await prisma.otpVerification.deleteMany({
            where: { email, type: "FORGOT_PASSWORD" },
        });

        // Store new OTP
        await prisma.otpVerification.create({
            data: {
                email,
                otp,
                type: "FORGOT_PASSWORD",
                expiresAt,
            },
        });

        // Send OTP email
        await sendOtpEmail({
            to: email,
            otp,
            purpose: "Password Reset",
        });

        res.json({ message: "If an account exists with this email address, a verification code has been sent.", email });
    } catch (err) {
        console.error("Forgot password error:", err);
        res.status(500).json({ message: "Server error sending verification code", detail: err.message });
    }
};

export const verifyOtp = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { email, otp, type = "FORGOT_PASSWORD" } = req.body;

    try {
        const record = await prisma.otpVerification.findFirst({
            where: {
                email,
                otp,
                type,
                expiresAt: { gt: new Date() },
            },
        });

        if (!record) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        // Delete used OTP
        await prisma.otpVerification.delete({ where: { id: record.id } });

        // Generate temporary reset token (15 mins)
        const resetToken = jwt.sign(
            { email, purpose: "PASSWORD_RESET" },
            process.env.JWT_SECRET,
            { expiresIn: "15m" }
        );

        res.json({
            message: "Code verified successfully.",
            resetToken,
        });
    } catch (err) {
        console.error("Verify OTP error:", err);
        res.status(500).json({ message: "Server error verifying code" });
    }
};

export const resetPassword = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { email, password, resetToken, otp } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "No account found with this email address." });

        // Validate resetToken if present
        if (resetToken) {
            try {
                const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
                if (decoded.email !== email || decoded.purpose !== "PASSWORD_RESET") {
                    return res.status(400).json({ message: "Invalid reset token." });
                }
            } catch (err) {
                return res.status(400).json({ message: "Reset token expired or invalid. Please request a new OTP." });
            }
        } else if (otp) {
            // Alternatively allow direct verification with OTP
            const record = await prisma.otpVerification.findFirst({
                where: {
                    email,
                    otp,
                    type: "FORGOT_PASSWORD",
                    expiresAt: { gt: new Date() },
                },
            });
            if (!record) {
                return res.status(400).json({ message: "Invalid or expired verification code." });
            }
            await prisma.otpVerification.delete({ where: { id: record.id } });
        } else {
            return res.status(400).json({ message: "Verification token or OTP is required to reset password." });
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await prisma.user.update({
            where: { email },
            data: { passwordHash },
        });

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const requestChangePasswordOtp = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await prisma.otpVerification.deleteMany({
            where: { email: user.email, type: "PASSWORD_CHANGE" },
        });

        await prisma.otpVerification.create({
            data: {
                email: user.email,
                otp,
                type: "PASSWORD_CHANGE",
                expiresAt,
            },
        });

        await sendOtpEmail({
            to: user.email,
            otp,
            purpose: "Password Change",
        });

        res.json({ message: "Verification code sent to your registered email.", email: user.email });
    } catch (err) {
        console.error("Change password OTP error:", err);
        res.status(500).json({ message: "Server error sending OTP" });
    }
};

export const changePassword = async (req, res) => {
    if (!validateRequest(req, res)) return;

    const { currentPassword, newPassword, otp } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { id: req.user.id } });
        if (!user) return res.status(404).json({ message: "User not found" });

        // Check current password
        const match = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!match) {
            return res.status(400).json({ message: "Current password is incorrect." });
        }

        // Verify OTP
        const otpRecord = await prisma.otpVerification.findFirst({
            where: {
                email: user.email,
                otp,
                type: "PASSWORD_CHANGE",
                expiresAt: { gt: new Date() },
            },
        });

        if (!otpRecord) {
            return res.status(400).json({ message: "Invalid or expired verification code." });
        }

        await prisma.otpVerification.delete({ where: { id: otpRecord.id } });

        const passwordHash = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: req.user.id },
            data: { passwordHash },
        });

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("Change password error:", err);
        res.status(500).json({ message: "Server error" });
    }
};

export const me = async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { studentProfile: true },
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        res.json(formatUserProfile(user));
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// Onboarding submission: Set grade (6, 8, 12) and stream if grade 12
export const submitOnboarding = async (req, res) => {
    const { gradeLevel, stream } = req.body;
    const parsedGrade = parseInt(gradeLevel, 10);

    if (isNaN(parsedGrade) || parsedGrade < 1 || parsedGrade > 12) {
        return res.status(400).json({ message: "Valid gradeLevel is required (e.g., 6, 8, or 12)." });
    }

    let normalizedStream = null;
    if (parsedGrade === 12) {
        if (!stream || !["NATURAL", "SOCIAL"].includes(stream.toUpperCase())) {
            return res.status(400).json({ message: "For grade 12, stream must be provided as either 'NATURAL' or 'SOCIAL'." });
        }
        normalizedStream = stream.toUpperCase();
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: req.user.id },
            include: { studentProfile: true },
        });
        if (!user) return res.status(404).json({ message: "User not found" });

        const updatedProfile = await prisma.studentProfile.upsert({
            where: { userId: req.user.id },
            update: {
                gradeLevel: parsedGrade,
                stream: normalizedStream,
                onboardingCompleted: true,
            },
            create: {
                userId: req.user.id,
                name: user.email.split("@")[0],
                gradeLevel: parsedGrade,
                stream: normalizedStream,
                onboardingCompleted: true,
            },
        });

        res.json({
            message: "Onboarding completed successfully",
            profile: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: updatedProfile.name,
                gradeLevel: updatedProfile.gradeLevel,
                stream: updatedProfile.stream,
                isPremium: updatedProfile.isPremium,
                onboardingCompleted: updatedProfile.onboardingCompleted,
                avatarUrl: updatedProfile.avatarUrl,
            },
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error updating onboarding info" });
    }
};

export const updateProfile = async (req, res) => {
    const { name, avatarUrl, gradeLevel, stream } = req.body;
    try {
        const data = {};
        if (name !== undefined) data.name = name;
        if (avatarUrl !== undefined) data.avatarUrl = avatarUrl;
        if (gradeLevel !== undefined) {
            const parsedGrade = parseInt(gradeLevel, 10);
            if (!isNaN(parsedGrade)) {
                data.gradeLevel = parsedGrade;
                if (parsedGrade === 12 && stream) {
                    if (["NATURAL", "SOCIAL"].includes(stream.toUpperCase())) {
                        data.stream = stream.toUpperCase();
                    }
                } else if (parsedGrade !== 12) {
                    data.stream = null;
                }
            }
        } else if (stream !== undefined) {
            if (["NATURAL", "SOCIAL"].includes(stream.toUpperCase())) {
                data.stream = stream.toUpperCase();
            } else if (stream === null) {
                data.stream = null;
            }
        }

        const profile = await prisma.studentProfile.update({
            where: { userId: req.user.id },
            data,
        });

        res.json({
            message: "Profile updated successfully",
            profile,
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
