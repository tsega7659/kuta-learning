import { Router } from "express";
import { prisma } from "../../prisma.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";
import { getAttempt } from "./controllers.js";

const router = Router();

// GET /api/quizzes/:quizId — student fetches a quiz with questions (isCorrect hidden)
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
    // answers: [{ questionId, selectedOptionId?, selectedOptionIds?, textResponse? }]
    if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
    }
    try {
        // Prevent duplicate submission
        const existingAttempt = await prisma.quizAttempt.findFirst({
            where: { studentId: req.user.id, quizId: req.params.quizId }
        });
        if (existingAttempt) {
            return res.status(400).json({
                message: "You have already submitted this quiz. Only one attempt is allowed.",
                attemptId: existingAttempt.id
            });
        }

        const questions = await prisma.question.findMany({
            where: { quizId: req.params.quizId },
            include: { options: true }
        });

        const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });
        if (questions.length === 0) {
            return res.status(400).json({ message: "Cannot submit a quiz without questions" });
        }

        let score = 0;
        const maxScore = questions.length;
        const processedAnswers = [];

        for (const ans of answers) {
            const q = questions.find(q => q.id === ans.questionId);
            if (!q) {
                processedAnswers.push({ questionId: ans.questionId, selectedOptionId: null, textResponse: null, isCorrect: false });
                continue;
            }

            const correctOpts = q.options.filter(o => o.isCorrect);
            let isCorrect = false;

            switch (q.type) {
                case "SINGLE_CHOICE":
                case "COLOR_MATCH":
                case "TRUE_FALSE":
                case "MATCHING": {
                    isCorrect = ans.selectedOptionId === correctOpts[0]?.id;
                    break;
                }
                case "MULTIPLE_CHOICE": {
                    const correctIds = correctOpts.map(o => o.id).sort();
                    const selected = (ans.selectedOptionIds || []).sort();
                    isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
                    break;
                }
                case "WORD_ORDER": {
                    isCorrect = ans.textResponse?.toUpperCase() === correctOpts[0]?.text?.toUpperCase();
                    break;
                }
                case "FILL_IN_BLANK": {
                    const acceptable = correctOpts.map(o => o.text.toLowerCase().trim());
                    isCorrect = acceptable.includes((ans.textResponse || "").toLowerCase().trim());
                    break;
                }
                case "DRAG_AND_DROP": {
                    const expectedText = correctOpts[0]?.text;
                    if (expectedText) {
                        try {
                            const expected = JSON.parse(expectedText);
                            const submitted = typeof ans.textResponse === "string" ? JSON.parse(ans.textResponse) : ans.textResponse;
                            isCorrect = JSON.stringify(expected) === JSON.stringify(submitted);
                        } catch {
                            isCorrect = (ans.textResponse || "").toUpperCase() === expectedText.toUpperCase();
                        }
                    }
                    break;
                }
                default: {
                    isCorrect = ans.selectedOptionId === correctOpts[0]?.id;
                }
            }

            if (isCorrect) score++;

            processedAnswers.push({
                questionId: ans.questionId,
                selectedOptionId: ans.selectedOptionId || null,
                textResponse: ans.textResponse || null,
                isCorrect
            });
        }

        const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        const passed = percentage >= quiz.passingScore;

        const attempt = await prisma.quizAttempt.create({
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

        res.json({
            ...attempt,
            percentage,
            correctAnswers: score,
            incorrectAnswers: maxScore - score,
            passingScore: quiz.passingScore,
            passed
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", error: err.message });
    }
});

// GET /api/quizzes/topic/:topicId — get quiz by topicId (for student after finishing a topic)
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

// GET /api/quizzes/attempts/:id — fetch a single attempt with full review data
router.get("/attempts/:id", authenticateToken, getAttempt);

export default router;
