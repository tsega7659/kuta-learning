import { Router } from "express";
import { prisma } from "../../prisma.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { getAttempt } from "./controllers.js";

const router = Router();

router.get("/:quizId", authenticateToken, async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: req.params.quizId },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: { options: { orderBy: { order: "asc" } } }
                }
            }
        });

        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        const safe = {
            ...quiz,
            questions: quiz.questions.map(q => ({
                ...q,
                options: q.options.map(({ isCorrect, ...o }) => o)
            }))
        };

        res.json(safe);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.post("/:quizId/submit", authenticateToken, async (req, res) => {
    const { answers } = req.body;
    if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
    }
        // Use transaction to prevent race condition duplicates on rapid double-tap submissions
        const attempt = await prisma.$transaction(async (tx) => {
            const existingAttempt = await tx.quizAttempt.findFirst({
                where: { studentId: req.user.id, quizId: req.params.quizId }
            });
            if (existingAttempt) {
                const err = new Error("ALREADY_SUBMITTED");
                err.attemptId = existingAttempt.id;
                throw err;
            }

            return tx.quizAttempt.create({
                data: {
                    studentId: req.user.id,
                    quizId: req.params.quizId,
                    score,
                    maxScore,
                    correctAnswers: score,
                    passed,
                    startedAt: new Date(),
                    submittedAt: new Date(),
                    answers: { create: processedAnswers }
                },
                include: { answers: true }
            });
        });

        res.json({
            ...attempt,
            percentage,
            correctAnswers: score,
            incorrectAnswers: maxScore - score,
            passingScore: quiz.passingScore,
            passed
        });
    } catch (err) {
        if (err.message === "ALREADY_SUBMITTED") {
            return res.status(400).json({
                message: "You have already submitted this quiz. Only one attempt is allowed.",
                attemptId: err.attemptId
            });
        }
        console.error("Quiz submission error:", err);
        res.status(500).json({ message: "Server error submitting quiz" });
    }
});

router.get("/topic/:topicId", authenticateToken, async (req, res) => {
    try {
        const quiz = await prisma.quiz.findFirst({
            where: { topicId: req.params.topicId, quizType: "QUIZ" },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: { options: { orderBy: { order: "asc" } } }
                }
            }
        });

        if (!quiz) return res.status(404).json({ message: "No quiz for this topic" });

        const safe = {
            ...quiz,
            questions: quiz.questions.map(q => ({
                ...q,
                options: q.options.map(({ isCorrect, ...o }) => o)
            }))
        };

        res.json(safe);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

router.get("/attempts/:id", authenticateToken, getAttempt);

export default router;
