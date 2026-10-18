import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../../prisma.js";
import { validationResult } from "express-validator";

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

export const register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password, name, gradeLevel, stream } = req.body;

    // Validate stream if grade 12
    const parsedGrade = Number(gradeLevel);
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

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.status(201).json({
            token,
            role: user.role,
            profile: formatUserProfile(user),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { studentProfile: true },
        });
        if (!user) return res.status(401).json({ message: "Invalid credentials" });

        const match = await bcrypt.compare(password, user.passwordHash);
        if (!match) return res.status(401).json({ message: "Invalid credentials" });

        const token = jwt.sign({ userId: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

        res.json({
            token,
            role: user.role,
            profile: formatUserProfile(user),
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const forgotPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "No account found with this email address." });

        res.json({ found: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const resetPassword = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

    const { email, password } = req.body;

    try {
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(404).json({ message: "No account found with this email address." });

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
