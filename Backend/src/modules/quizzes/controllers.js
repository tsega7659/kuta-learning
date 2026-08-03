import { prisma } from "../../prisma.js";

// =============================================================
// HELPERS
// =============================================================

// Validate question options per question type.
//  - Choice types: exactly 4 options, exactly 1 correct
//  - TRUE_FALSE:   exactly 2 options, exactly 1 correct
//  - Text-answer types (WORD_ORDER, FILL_IN_BLANK, DRAG_AND_DROP): 1 correct answer
// Returns an error message string or null if valid.
const validateQuestionOptions = (type, options) => {
    if (!Array.isArray(options) || options.length === 0) return "Question must have options";

    const textTypes = ["WORD_ORDER", "FILL_IN_BLANK", "DRAG_AND_DROP"];

    if (type === "TRUE_FALSE") {
        if (options.length !== 2) return "True/False questions must have exactly two options";
    } else if (textTypes.includes(type)) {
        if (options.length < 1) return "Question must define a correct answer";
    } else if (type === "MATCHING") {
        // Matching pairs — all options are marked correct; just need at least 2 pairs
        if (options.length < 2) return "Matching questions must have at least two pairs";
        return null; // skip isCorrect validation for MATCHING
    } else {
        if (options.length < 2) return "Choice questions must have at least two options";
    }

    const correctCount = options.filter(o => o.isCorrect).length;
    if (textTypes.includes(type)) {
        if (correctCount < 1) return "Question must define a correct answer";
    } else if (type === "MULTIPLE_CHOICE") {
        if (correctCount < 1) return "At least one option must be marked as the correct answer";
    } else {
        if (correctCount !== 1) {
            return "Exactly one option must be marked as the correct answer";
        }
    }
    return null;
};

const orderOptions = (options, existingCount = 0) => {
    return options.map((o, idx) => ({
        ...o,
        order: o.order ?? idx + 1 + existingCount
    }));
};

// Strip `isCorrect` from options for students (prevents cheating)
const sanitizeForStudent = (quiz) => {
    if (!quiz) return quiz;
    return {
        ...quiz,
        questions: (quiz.questions || []).map(q => ({
            ...q,
            options: (q.options || []).map(({ isCorrect, ...safeOption }) => safeOption)
        }))
    };
};

// Fetch a quiz by topicId, with questions+options ordered.
const fetchQuizByTopic = async (topicId, includeAnswers = false) => {
    return prisma.quiz.findFirst({
        where: { topicId },
        include: {
            questions: {
                orderBy: { order: "asc" },
                include: {
                    options: { orderBy: { order: "asc" } },
                    ...(includeAnswers ? { answers: true } : {}),
                },
            },
        },
    });
};

// Check if a student has completed all lessons in a topic
const areAllLessonsCompleted = async (topicId, studentId) => {
    const lessons = await prisma.lesson.findMany({
        where: { topicId },
        select: { id: true }
    });

    if (lessons.length === 0) return true; // no lessons => quiz available

    const completed = await prisma.lessonProgress.count({
        where: {
            studentId,
            completed: true,
            lessonId: { in: lessons.map(l => l.id) }
        }
    });

    return completed === lessons.length;
};

// =============================================================
// GET QUIZ (Student & Content Manager)
// =============================================================
// GET /api/.../topics/:topicId/quiz
export const getQuiz = async (req, res) => {
    try {
        const quiz = await fetchQuizByTopic(req.params.topicId);

        if (!quiz) return res.status(404).json({ message: "Quiz not found for this topic" });

        // Hide correct answers for students
        if (req.user.role === "STUDENT") {
            return res.json(sanitizeForStudent(quiz));
        }
        res.json(quiz);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// =============================================================
// GET QUIZ AVAILABILITY (Student)
// =============================================================
// GET /api/.../topics/:topicId/quiz/availability
export const getQuizAvailability = async (req, res) => {
    try {
        const quiz = await fetchQuizByTopic(req.params.topicId);

        if (!quiz) {
            return res.json({ available: false, quiz: null, reason: "no_quiz" });
        }

        const allCompleted = await areAllLessonsCompleted(req.params.topicId, req.user.id);

        // If not all lessons completed, return the quiz but flag unavailable
        if (!allCompleted) {
            return res.json({ available: false, quiz: sanitizeForStudent(quiz), reason: "lessons_incomplete" });
        }

        res.json({ available: true, quiz: sanitizeForStudent(quiz), reason: "ready" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// =============================================================
// CONTENT MANAGER OPERATIONS
// =============================================================

// POST /api/.../topics/:topicId/quiz
export const createQuiz = async (req, res) => {
    const { title, description, passingScore } = req.body;
    try {
        if (!title || !String(title).trim()) {
            return res.status(400).json({ message: "Quiz title is required" });
        }

        const score = parseInt(passingScore);
        if (isNaN(score) || score < 0 || score > 100) {
            return res.status(400).json({ message: "Passing score must be between 0 and 100" });
        }

        const quiz = await prisma.quiz.create({
            data: {
                title: String(title).trim(),
                description: description || null,
                passingScore: score,
                topicId: req.params.topicId
            }
        });
        res.status(201).json(quiz);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// PUT /api/.../topics/:topicId/quiz/:quizId
export const updateQuiz = async (req, res) => {
    const { title, description, passingScore } = req.body;
    try {
        const data = {};
        if (title !== undefined) {
            if (!String(title).trim()) return res.status(400).json({ message: "Quiz title cannot be empty" });
            data.title = String(title).trim();
        }
        if (description !== undefined) data.description = description || null;
        if (passingScore !== undefined) {
            const score = parseInt(passingScore);
            if (isNaN(score) || score < 0 || score > 100) {
                return res.status(400).json({ message: "Passing score must be between 0 and 100" });
            }
            data.passingScore = score;
        }

        const quiz = await prisma.quiz.update({
            where: { id: req.params.quizId },
            data
        });
        res.json(quiz);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// DELETE /api/.../topics/:topicId/quiz/:quizId
export const deleteQuiz = async (req, res) => {
    try {
        await prisma.quiz.delete({ where: { id: req.params.quizId } });
        res.json({ message: "Quiz deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ---------------------------------------------------------------
// QUESTION MANAGEMENT
// ---------------------------------------------------------------

// POST /api/.../topics/:topicId/quiz/:quizId/questions
// Body: { type, text, explanation, resourceUrl, order, options: [{ text, isCorrect, imageUrl }] }
export const addQuestion = async (req, res) => {
    const { type = "SINGLE_CHOICE", text, explanation, resourceUrl, order, options } = req.body;
    try {
        if (!text || !String(text).trim()) {
            return res.status(400).json({ message: "Question text is required" });
        }

        const optionsError = validateQuestionOptions(type, options);
        if (optionsError) return res.status(400).json({ message: optionsError });

        // Determine order
        let finalOrder = parseInt(order);
        if (isNaN(finalOrder) || finalOrder <= 0) {
            const last = await prisma.question.findFirst({
                where: { quizId: req.params.quizId },
                orderBy: { order: "desc" }
            });
            finalOrder = last ? last.order + 1 : 1;
        }

        const question = await prisma.question.create({
            data: {
                quizId: req.params.quizId,
                type,
                text: String(text).trim(),
                resourceUrl: resourceUrl || null,
                order: finalOrder,
                options: {
                    create: options.map((o, idx) => ({
                        text: String(o.text || "").trim(),
                        isCorrect: !!o.isCorrect,
                        imageUrl: o.imageUrl || null,
                        order: o.order ?? idx + 1
                    }))
                }
            },
            include: { options: { orderBy: { order: "asc" } } }
        });
        res.status(201).json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// PUT /api/.../topics/:topicId/quiz/:quizId/questions/:questionId
// Body: { type, text, explanation, resourceUrl, order }
export const updateQuestion = async (req, res) => {
    const { type, text, explanation, resourceUrl, order } = req.body;
    try {
        const data = {};
        if (text !== undefined) {
            if (!String(text).trim()) return res.status(400).json({ message: "Question text cannot be empty" });
            data.text = String(text).trim();
        }
        if (type !== undefined) data.type = type;
        if (explanation !== undefined) data.explanation = explanation || null;
        if (resourceUrl !== undefined) data.resourceUrl = resourceUrl || null;
        if (order !== undefined) data.order = parseInt(order);

        const question = await prisma.question.update({
            where: { id: req.params.questionId },
            data,
            include: { options: { orderBy: { order: "asc" } } }
        });
        res.json(question);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// DELETE /api/.../topics/:topicId/quiz/:quizId/questions/:questionId
export const deleteQuestion = async (req, res) => {
    try {
        await prisma.question.delete({ where: { id: req.params.questionId } });
        res.json({ message: "Question deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ---------------------------------------------------------------
// OPTION MANAGEMENT
// ---------------------------------------------------------------

// POST /api/.../topics/:topicId/quiz/:quizId/questions/:questionId/options
export const addOption = async (req, res) => {
    const { text, isCorrect, imageUrl } = req.body;
    try {
        // text is required UNLESS an imageUrl is provided (e.g. COLOR_MATCH image-only option)
        if ((!text || !String(text).trim()) && !imageUrl) {
            return res.status(400).json({ message: "Option text is required (or provide an image URL)" });
        }

        const question = await prisma.question.findUnique({
            where: { id: req.params.questionId },
            include: { options: true }
        });
        if (!question) return res.status(404).json({ message: "Question not found" });

        if (question.options.length >= 10) {
            return res.status(400).json({ message: "Each question can have at most ten options" });
        }

        const lastOrder = question.options.reduce((max, o) => Math.max(max, o.order), 0);
        const option = await prisma.questionOption.create({
            data: {
                questionId: req.params.questionId,
                text: String(text || '').trim(),
                isCorrect: !!isCorrect,
                imageUrl: imageUrl || null,
                order: lastOrder + 1
            }
        });
        res.status(201).json(option);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// PUT /api/.../topics/:topicId/quiz/:quizId/questions/:questionId/options/:optionId
export const updateOption = async (req, res) => {
    const { text, isCorrect, imageUrl } = req.body;
    try {
        const data = {};
        if (text !== undefined) {
            // Allow empty text when imageUrl is being set (image-only options)
            data.text = String(text).trim();
        }
        if (isCorrect !== undefined) data.isCorrect = !!isCorrect;
        if (imageUrl !== undefined) data.imageUrl = imageUrl || null;

        const question = await prisma.question.findUnique({
            where: { id: req.params.questionId }
        });
        if (!question) return res.status(404).json({ message: "Question not found" });

        // If setting this option as correct, unset others — except for MULTIPLE_CHOICE and MATCHING
        if (isCorrect && question.type !== "MULTIPLE_CHOICE" && question.type !== "MATCHING") {
            await prisma.questionOption.updateMany({
                where: { questionId: req.params.questionId },
                data: { isCorrect: false }
            });
        }

        const option = await prisma.questionOption.update({
            where: { id: req.params.optionId },
            data
        });
        res.json(option);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// DELETE /api/.../topics/:topicId/quiz/:quizId/questions/:questionId/options/:optionId
export const deleteOption = async (req, res) => {
    try {
        await prisma.questionOption.delete({ where: { id: req.params.optionId } });
        res.json({ message: "Option deleted" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};


export const startAttempt = async (req, res) => {
    try {
        // Check availability first
        const allCompleted = await areAllLessonsCompleted(req.params.topicId, req.user.id);
        if (!allCompleted) {
            return res.status(403).json({ message: "Complete all lessons before starting the quiz" });
        }

        const quiz = await prisma.quiz.findUnique({ where: { id: req.params.quizId } });
        if (!quiz) return res.status(404).json({ message: "Quiz not found" });

        // If a previous attempt exists, return it (single attempt policy)
        const existing = await prisma.quizAttempt.findFirst({
            where: { studentId: req.user.id, quizId: req.params.quizId },
            orderBy: { createdAt: "desc" }
        });

        res.json({ started: true, quizId: quiz.id, existingAttempt: existing || null });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// POST /api/.../topics/:topicId/quiz/:quizId/submit
// Body: { answers: [{ questionId, selectedOptionId?, selectedOptionIds?, textResponse? }] }
export const submitAttempt = async (req, res) => {
    const { answers } = req.body;

    if (!Array.isArray(answers)) {
        return res.status(400).json({ message: "Answers must be an array" });
    }

    try {
        // 1. Prevent duplicate submission (single attempt allowed)
        const existingAttempt = await prisma.quizAttempt.findFirst({
            where: { studentId: req.user.id, quizId: req.params.quizId }
        });
        if (existingAttempt) {
            return res.status(400).json({
                message: "You have already submitted this quiz. Only one attempt is allowed.",
                attemptId: existingAttempt.id
            });
        }

        // 2. Fetch questions + correct options from DB
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
                processedAnswers.push({
                    questionId: ans.questionId,
                    selectedOptionId: null,
                    textResponse: null,
                    isCorrect: false
                });
                continue;
            }

            const correctOpts = q.options.filter(o => o.isCorrect);
            let isCorrect = false;

            switch (q.type) {
                case "SINGLE_CHOICE":
                case "COLOR_MATCH":
                case "TRUE_FALSE": {
                    const correctId = correctOpts[0]?.id;
                    isCorrect = ans.selectedOptionId === correctId;
                    break;
                }
                case "MULTIPLE_CHOICE": {
                    // All correct options must be selected, nothing extra
                    const correctIds = correctOpts.map(o => o.id).sort();
                    const selected = (ans.selectedOptionIds || []).sort();
                    isCorrect = JSON.stringify(correctIds) === JSON.stringify(selected);
                    break;
                }
                case "MATCHING": {
                    // textResponse is JSON: { [optionId]: optionId }
                    // Each option.imageUrl = "match::<answer>"; option.text = question
                    // Build correct map: optionId -> correctAnswerText
                    const correctPairs = {};
                    for (const opt of q.options) {
                        const ans_ = opt.imageUrl?.startsWith("match::") ? opt.imageUrl.replace("match::", "") : "";
                        correctPairs[opt.id] = ans_.toLowerCase().trim();
                    }
                    // Build submitted map: optionId -> selectedOptionId (the right column item)
                    // The client sends { [leftOptionId]: rightOptionId }
                    // right option's text is the answer text
                    try {
                        const submitted = typeof ans.textResponse === "string"
                            ? JSON.parse(ans.textResponse) : {};
                        let allCorrect = Object.keys(correctPairs).length > 0;
                        for (const [leftId, rightId] of Object.entries(submitted)) {
                            const rightOpt = q.options.find(o => o.id === rightId);
                            const rightText = (rightOpt?.imageUrl?.startsWith("match::") ? rightOpt.imageUrl.replace("match::", "") : rightOpt?.text || "").toLowerCase().trim();
                            if (correctPairs[leftId] !== rightText) { allCorrect = false; break; }
                        }
                        isCorrect = allCorrect && Object.keys(submitted).length === Object.keys(correctPairs).length;
                    } catch {
                        isCorrect = false;
                    }
                    break;
                }
                case "WORD_ORDER":
                case "DRAG_AND_DROP": {
                    // textResponse is the concatenated letters
                    const expected = correctOpts[0]?.text?.toUpperCase().trim() || "";
                    isCorrect = (ans.textResponse || "").toUpperCase().trim() === expected;
                    break;
                }
                case "FILL_IN_BLANK": {
                    const acceptable = correctOpts.map(o => o.text.toLowerCase().trim());
                    isCorrect = acceptable.includes((ans.textResponse || "").toLowerCase().trim());
                    break;
                }
                default: {
                    const correctId = correctOpts[0]?.id;
                    isCorrect = ans.selectedOptionId === correctId;
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

        // 3. Save attempt + answers in a transaction
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
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// =============================================================
// GET ATTEMPT (Student)
// =============================================================
// GET /api/quiz-attempts/:id
export const getAttempt = async (req, res) => {
    try {
        const attempt = await prisma.quizAttempt.findUnique({
            where: { id: req.params.id },
            include: {
                quiz: {
                    include: {
                        questions: {
                            orderBy: { order: "asc" },
                            include: { options: { orderBy: { order: "asc" } } }
                        }
                    }
                },
                answers: true
            }
        });

        if (!attempt) return res.status(404).json({ message: "Attempt not found" });

        // Only the owner (or a content manager) can view the attempt
        if (attempt.studentId !== req.user.id && req.user.role !== "CONTENT_MANAGER") {
            return res.status(403).json({ message: "Access denied" });
        }

        const percentage = attempt.maxScore > 0
            ? Math.round((attempt.score / attempt.maxScore) * 100)
            : 0;

        // Build review data for each question
        const questions = attempt.quiz.questions.map(q => {
            const answer = attempt.answers.find(a => a.questionId === q.id);
            const correctOptions = q.options.filter(o => o.isCorrect);
            return {
                ...q,
                answer,
                correctOptions,
                wasCorrect: answer?.isCorrect || false
            };
        });

        res.json({
            ...attempt,
            percentage,
            correctAnswers: attempt.correctAnswers,
            incorrectAnswers: attempt.maxScore - attempt.correctAnswers,
            questions
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// =============================================================
// GET ATTEMPTS BY QUIZ (Student) — for "your attempts" list
// =============================================================
// GET /api/.../topics/:topicId/quiz/attempts
export const getMyAttempts = async (req, res) => {
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { topicId: req.params.topicId },
            select: { id: true }
        });
        if (!quiz) return res.json([]);

        const attempts = await prisma.quizAttempt.findMany({
            where: { studentId: req.user.id, quizId: quiz.id },
            orderBy: { createdAt: "desc" },
            include: {
                quiz: { select: { title: true, passingScore: true } }
            }
        });
        res.json(attempts);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};
