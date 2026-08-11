import { prisma } from "../../prisma.js";

// GET /api/practice/random-question
// Get 1 random basic question for Parent Gate
export const getRandomQuestion = async (req, res) => {
    try {
        const questions = await prisma.question.findMany({
            where: {
                type: { in: ['SINGLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_CHOICE'] }
            },
            include: { options: true }
        });

        if (questions.length === 0) {
            return res.status(404).json({ message: "No questions available" });
        }

        const randomQ = questions[Math.floor(Math.random() * questions.length)];

        // Strip isCorrect for client
        const safeOptions = randomQ.options.map(o => ({
            id: o.id,
            text: o.text,
            imageUrl: o.imageUrl
        }));

        res.json({
            id: randomQ.id,
            text: randomQ.text,
            type: randomQ.type,
            options: safeOptions
        });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/practice/random-question/verify
export const verifyRandomQuestion = async (req, res) => {
    const { questionId, selectedOptionId, selectedOptionIds } = req.body;
    try {
        const question = await prisma.question.findUnique({
            where: { id: questionId },
            include: { options: true }
        });

        if (!question) return res.status(404).json({ message: "Not found" });

        const correctOpts = question.options.filter(o => o.isCorrect);
        let isCorrect = false;

        if (question.type === 'MULTIPLE_CHOICE') {
            const cIds = correctOpts.map(o => o.id).sort();
            const sIds = (selectedOptionIds || []).sort();
            isCorrect = JSON.stringify(cIds) === JSON.stringify(sIds);
        } else {
            isCorrect = selectedOptionId === correctOpts[0]?.id;
        }

        res.json({ isCorrect });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/practice/topics
// Get topics with available question count
export const getPracticeTopics = async (req, res) => {
    try {
        const topics = await prisma.topic.findMany({
            include: {
                chapter: {
                    include: { course: true }
                },
                quiz: {
                    where: { quizType: "BANK" },
                    include: { questions: { select: { id: true } } }
                }
            }
        });

        // Map and filter topics that have at least 1 question
        const practiceTopics = topics
            .map(t => {
                const totalQuestions = t.quiz.reduce((acc, q) => acc + q.questions.length, 0);
                return {
                    id: t.id,
                    title: t.title,
                    description: t.description,
                    courseTitle: t.chapter.course.title,
                    chapterTitle: t.chapter.title,
                    totalQuestions,
                };
            })
            .filter(t => t.totalQuestions > 0);

        res.json(practiceTopics);
    } catch (err) {
        console.error("Error fetching practice topics:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// POST /api/practice/topics/:topicId/start
// Create a PracticeAttempt with 10 random questions
export const startPracticeModule = async (req, res) => {
    const studentId = req.user.userId;
    const { topicId } = req.params;

    try {
        // Fetch all questions for this topic
        const topic = await prisma.topic.findUnique({
            where: { id: topicId },
            include: {
                quiz: {
                    where: { quizType: "BANK" },
                    include: {
                        questions: {
                            include: { options: true }
                        }
                    }
                }
            }
        });

        if (!topic) return res.status(404).json({ message: "Topic not found" });

        let allQuestions = [];
        topic.quiz.forEach(q => allQuestions.push(...q.questions));

        if (allQuestions.length === 0) {
            return res.status(400).json({ message: "No questions available for this topic" });
        }

        // Shuffle and pick up to 10
        allQuestions = allQuestions.sort(() => 0.5 - Math.random()).slice(0, 10);

        // Create an attempt. Store the question list in a JSON string (could be a temp table, but this is simpler, or we just rely on PracticeAnswer initialization).
        // Since we need to know which questions belong to this attempt, let's create PracticeAnswer shells!

        const maxScore = allQuestions.length;

        const attempt = await prisma.practiceAttempt.create({
            data: {
                studentId,
                topicId,
                score: 0,
                maxScore,
                passed: false,
                submittedAt: null,   // null = in-progress; set on real submission
                answers: {
                    create: allQuestions.map(q => ({
                        questionId: q.id,
                        selectedOptionId: null,
                        textResponse: null,
                        isCorrect: false
                    }))
                }
            }
        });

        res.status(201).json({ attemptId: attempt.id });
    } catch (err) {
        console.error("Error creating practice attempt:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// GET /api/practice/attempts/:attemptId
// Get practice questions
export const getPracticeAttempt = async (req, res) => {
    try {
        const attempt = await prisma.practiceAttempt.findUnique({
            where: { id: req.params.attemptId },
            include: {
                topic: true,
                answers: {
                    include: {
                        question: {
                            include: { options: true }
                        }
                    }
                }
            }
        });

        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.studentId !== req.user.userId) return res.status(403).json({ message: "Forbidden" });

        // Build the payload
        const isSubmitted = !!attempt.submittedAt;
        const payload = {
            id: attempt.id,
            topic: attempt.topic,
            score: attempt.score,
            maxScore: attempt.maxScore,
            correctAnswers: attempt.correctAnswers,
            passed: attempt.passed,
            percentage: attempt.maxScore ? Math.round((attempt.score / attempt.maxScore) * 100) : 0,
            questions: attempt.answers.map(ans => {
                const q = {
                    id: ans.question.id,
                    type: ans.question.type,
                    text: ans.question.text,
                    explanation: isSubmitted ? ans.question.explanation : undefined,
                    resourceUrl: ans.question.resourceUrl,
                    options: ans.question.options.map(o => ({
                        id: o.id,
                        text: o.text,
                        imageUrl: o.imageUrl,
                        isCorrect: isSubmitted ? o.isCorrect : undefined
                    })),
                    // If submitted, include the student's answer and correct items
                    answer: isSubmitted ? {
                        selectedOptionId: ans.selectedOptionId,
                        textResponse: ans.textResponse,
                        isCorrect: ans.isCorrect
                    } : undefined,
                };
                if (isSubmitted) {
                    q.correctOptions = ans.question.options.filter(o => o.isCorrect);
                }
                return q;
            })
        };

        res.json(payload);
    } catch (err) {
        console.error("Error fetching attempt:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// POST /api/practice/attempts/:attemptId/submit
export const submitPracticeAttempt = async (req, res) => {
    const { attemptId } = req.params;
    const { answers } = req.body; // array of { questionId, selectedOptionId, selectedOptionIds (for MULTIPLE_CHOICE), textResponse }

    try {
        const attempt = await prisma.practiceAttempt.findUnique({
            where: { id: attemptId },
            include: { answers: { include: { question: { include: { options: true } } } } }
        });

        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.submittedAt) return res.status(400).json({ message: "Already submitted" });

        let score = 0;
        const processedAnswers = [];

        for (const pa of attempt.answers) {
            const q = pa.question;
            const submittedAns = answers.find(a => a.questionId === q.id) || {};

            const correctOpts = q.options.filter(o => o.isCorrect);
            let isCorrect = false;

            switch (q.type) {
                case "SINGLE_CHOICE":
                case "COLOR_MATCH":
                case "TRUE_FALSE": {
                    isCorrect = submittedAns.selectedOptionId === correctOpts[0]?.id;
                    break;
                }
                case "MULTIPLE_CHOICE": {
                    const cIds = correctOpts.map(o => o.id).sort();
                    const sIds = (submittedAns.selectedOptionIds || []).sort();
                    isCorrect = JSON.stringify(cIds) === JSON.stringify(sIds);
                    break;
                }
                case "MATCHING": {
                    const correctPairs = {};
                    for (const opt of q.options) {
                        const ans = opt.imageUrl?.startsWith("match::") ? opt.imageUrl.replace("match::", "") : "";
                        correctPairs[opt.id] = ans.toLowerCase().trim();
                    }
                    try {
                        const sub = typeof submittedAns.textResponse === "string" ? JSON.parse(submittedAns.textResponse) : {};
                        let allC = Object.keys(correctPairs).length > 0;
                        for (const [leftId, rightId] of Object.entries(sub)) {
                            const rightOpt = q.options.find(o => o.id === rightId);
                            const rText = (rightOpt?.imageUrl?.startsWith("match::") ? rightOpt.imageUrl.replace("match::", "") : rightOpt?.text || "").toLowerCase().trim();
                            if (correctPairs[leftId] !== rText) { allC = false; break; }
                        }
                        isCorrect = allC && Object.keys(sub).length === Object.keys(correctPairs).length;
                    } catch { isCorrect = false; }
                    break;
                }
                case "WORD_ORDER":
                case "DRAG_AND_DROP": {
                    const expected = correctOpts[0]?.text?.toUpperCase().trim() || "";
                    isCorrect = (submittedAns.textResponse || "").toUpperCase().trim() === expected;
                    break;
                }
                case "FILL_IN_BLANK": {
                    const acceptable = correctOpts.map(o => o.text.toLowerCase().trim());
                    isCorrect = acceptable.includes((submittedAns.textResponse || "").toLowerCase().trim());
                    break;
                }
                default: {
                    isCorrect = submittedAns.selectedOptionId === correctOpts[0]?.id;
                }
            }

            if (isCorrect) score++;

            processedAnswers.push({
                paId: pa.id,
                selectedOptionId: submittedAns.selectedOptionId || null,
                textResponse: submittedAns.textResponse || null,
                isCorrect
            });
        }

        const percentage = attempt.maxScore > 0 ? Math.round((score / attempt.maxScore) * 100) : 0;
        const passed = percentage >= 50; // simple threshold for practice

        // Update attempt + answers via transactional batch
        await prisma.$transaction([
            ...processedAnswers.map(ans => prisma.practiceAnswer.update({
                where: { id: ans.paId },
                data: {
                    selectedOptionId: ans.selectedOptionId,
                    textResponse: ans.textResponse,
                    isCorrect: ans.isCorrect
                }
            })),
            prisma.practiceAttempt.update({
                where: { id: attemptId },
                data: {
                    score,
                    correctAnswers: score,
                    passed,
                    submittedAt: new Date()
                }
            })
        ]);

        res.json({ id: attempt.id, score, maxScore: attempt.maxScore, passed });
    } catch (err) {
        console.error("Error submitting practice attempt:", err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/practice/preview
// Fetch all questions for given topicIds for admin mock exam preview
export const getPreviewQuestions = async (req, res) => {
    try {
        const { topicIds } = req.body;
        if (!topicIds || !Array.isArray(topicIds)) return res.json([]);
        const questions = await prisma.question.findMany({
            where: { quiz: { topicId: { in: topicIds }, quizType: "BANK" } },
            include: { options: true }
        });
        res.json(questions);
    } catch (err) {
        console.error("Preview fail:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};
