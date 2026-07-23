import { prisma } from "../../prisma.js";

// -------------------------------------------------------------
// GET /api/.../topics/:topicId/quiz  (Public/Student)
// -------------------------------------------------------------
export const getQuiz = async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { topicId: req.params.topicId },
            include: {
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                        }
                    }
                }
            }
        });

        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // IMPORTANT: If user is STUDENT, hide `isCorrect` from options to prevent cheating!
        if (req.user.role === "STUDENT") {
            quiz.questions = quiz.questions.map(q => {
                q.options = q.options.map(o => {
                    const { isCorrect, ...safeOption } = o;
                    return safeOption;
                });
                return q;
            });
        }

        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// -------------------------------------------------------------
// CONTENT MANAGER OPERATIONS
// -------------------------------------------------------------
export const createQuiz = async (req, res) => {
    const { title, passingScore } = req.body;
    try {
        const quiz = await prisma.quiz.create({
            data: { title, passingScore: parseInt(passingScore), topicId: req.params.topicId }
        });
        res.status(201).json(quiz);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateQuiz = async (req, res) => {
    const { title, passingScore } = req.body;
    try {
        const quiz = await prisma.quiz.update({
            where: { id: req.params.quizId },
            data: { title, passingScore: parseInt(passingScore) }
        });
        res.json(quiz);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteQuiz = async (req, res) => {
    try {
        await prisma.quiz.delete({ where: { id: req.params.quizId } });
        res.json({ message: "Quiz deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// Creates a question alongside its options (Nested Writes)
export const addQuestion = async (req, res) => {
    const { type, text, resourceUrl, order, options } = req.body;
    // options should be an array of objects: { text, isCorrect, imageUrl, order }
    try {
        const question = await prisma.question.create({
            data: {
                quizId: req.params.quizId,
                type, text, resourceUrl, order: parseInt(order),
                options: {
                    create: options.map(o => ({
                        text: o.text,
                        isCorrect: o.isCorrect,
                        imageUrl: o.imageUrl,
                        order: parseInt(o.order)
                    }))
                }
            },
            include: { options: true }
        });
        res.status(201).json(question);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteQuestion = async (req, res) => {
    try {
        await prisma.question.delete({ where: { id: req.params.questionId } });
        res.json({ message: "Question deleted" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// -------------------------------------------------------------
// STUDENT SUBMISSION
// -------------------------------------------------------------
// POST /api/.../topics/:topicId/quiz/:quizId/submit
export const submitAttempt = async (req, res) => {
    const { answers } = req.body;
    // answers format expected: [{ questionId: '...', selectedOptionId: '...', textResponse: null }]

    try {
        // 1. Fetch correct answers from DB to score the attempt server-side securely. 
        const questions = await prisma.question.findMany({
            where: { quizId: req.params.quizId },
            include: { options: true }
        });

        let score = 0;
        const maxScore = questions.length;

        // Process correctness
        const processedAnswers = answers.map(ans => {
            const q = questions.find(question => question.id === ans.questionId);
            // Determine correct option
            const correctAnswer = q.options.find(opt => opt.isCorrect);

            let isCorrect = false;
            if (q.type === 'SINGLE_CHOICE' || q.type === 'COLOR_MATCH') {
                isCorrect = (ans.selectedOptionId === correctAnswer.id);
            } else if (q.type === 'WORD_ORDER') {
                // Assume textResponse contains the concatenated string "BLUE"
                isCorrect = (ans.textResponse && ans.textResponse.toUpperCase() === correctAnswer.text.toUpperCase());
            }

            if (isCorrect) score += 1;

            return {
                questionId: ans.questionId,
                selectedOptionId: ans.selectedOptionId || null,
                textResponse: ans.textResponse || null,
                isCorrect
            };
        });

        const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
        const passed = (score / maxScore) * 100 >= quiz.passingScore;

        // 2. Perform transaction: Log attempt and specific answers provided
        const attempt = await prisma.quizAttempt.create({
            data: {
                studentId: req.user.id,
                quizId: req.params.quizId,
                score,
                maxScore,
                passed,
                answers: {
                    create: processedAnswers
                }
            },
            include: {
                answers: true
            }
        });

        res.json(attempt);

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
