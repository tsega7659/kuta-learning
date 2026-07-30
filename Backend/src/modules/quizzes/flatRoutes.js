import { Router } from "express";
import { prisma } from "../../prisma.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";

const router = Router();

// GET /api/quizzes/:quizId  — student fetches a quiz with questions (isCorrect hidden)
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

        // Strip isCorrect for students
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

// POST /api/quizzes/:quizId/submit
router.post("/:quizId/submit", authenticateToken, async (req, res) => {
    const { answers } = req.body;
    // answers: [{ questionId, selectedOptionId?, textResponse? }]
    try {
        const questions = await prisma.question.findMany({
            where: { quizId: req.params.quizId },
            include: { options: true }
        });

        let score = 0;
        const maxScore = questions.length;

        const processedAnswers = answers.map(ans => {
            const q = questions.find(q => q.id === ans.questionId);
            if (!q) return { ...ans, isCorrect: false };

            const correctOpt = q.options.find(o => o.isCorrect);
            let isCorrect = false;

            if (q.type === "SINGLE_CHOICE" || q.type === "COLOR_MATCH" || q.type === "TRUE_FALSE") {
                isCorrect = ans.selectedOptionId === correctOpt?.id;
            } else if (q.type === "WORD_ORDER") {
                isCorrect = ans.textResponse?.toUpperCase() === correctOpt?.text?.toUpperCase();
            } else if (q.type === "MULTIPLE_CHOICE") {
                // All correct options must be selected, nothing extra
                const correctIds = q.options.filter(o => o.isCorrect).map(o => o.id).sort();
                const selected = (ans.selectedOptionIds || []).sort();
                isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
            }

            if (isCorrect) score++;

            return {
                questionId: ans.questionId,
                selectedOptionId: ans.selectedOptionId || null,
                textResponse: ans.textResponse || null,
                isCorrect
            };
        });

        const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
        const passed = maxScore > 0 ? (score / maxScore) * 100 >= quiz.passingScore : false;

        const attempt = await prisma.quizAttempt.create({
            data: {
                studentId: req.user.id,
                quizId: req.params.quizId,
                score,
                maxScore,
                passed,
                answers: { create: processedAnswers }
            },
            include: { answers: true }
        });

        res.json({ ...attempt, score, maxScore, passed, passingScore: quiz.passingScore });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/quizzes/topic/:topicId  — get quiz by topicId (for student after finishing a topic)
router.get("/topic/:topicId", authenticateToken, async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { topicId: req.params.topicId },
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

export default router;
