import { prisma } from "../../prisma.js";

// Helper to determine student's effective grade and stream
const getStudentContext = async (req) => {
    let gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel, 10) : null;
    let stream = req.query.stream ? req.query.stream.toUpperCase() : null;

    if (req.user && req.user.role === "STUDENT") {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (profile) {
            if (!gradeLevel) gradeLevel = profile.gradeLevel;
            if (!stream) stream = profile.stream;
        }
    }

    return { gradeLevel: gradeLevel || 12, stream: stream || "NATURAL" };
};

// ── GET /api/national-exams/subjects ──────────────────────────────────────────
// Returns subjects with progress for the student's grade and stream
export const getExamSubjects = async (req, res) => {
    try {
        const { gradeLevel, stream } = await getStudentContext(req);
        const studentId = req.user?.id;

        // Find subjects matching the grade level and stream
        const subjects = await prisma.examSubject.findMany({
            where: {
                gradeLevels: { has: gradeLevel },
                OR: [
                    { stream: null },
                    { stream: "COMMON" },
                    { stream: stream }
                ]
            },
            orderBy: { order: "asc" },
            include: {
                exams: {
                    where: {
                        gradeLevel: gradeLevel,
                        OR: [
                            { stream: null },
                            { stream: "COMMON" },
                            { stream: stream }
                        ]
                    },
                    include: {
                        questions: { select: { id: true } },
                        attempts: studentId ? {
                            where: { studentId },
                            select: { id: true, status: true, score: true, maxScore: true, accuracyPercentage: true, passed: true }
                        } : false
                    }
                }
            }
        });

        const formatted = subjects.map(sub => {
            const totalExams = sub.exams.length;
            const totalQuestions = sub.exams.reduce((sum, e) => sum + e.questions.length, 0);

            let completedExamsCount = 0;
            let totalCorrect = 0;
            let totalAttemptedQuestions = 0;

            if (studentId) {
                sub.exams.forEach(exam => {
                    const bestSubmittedAttempt = (exam.attempts || [])
                        .filter(a => a.status === "SUBMITTED")
                        .sort((a, b) => (b.accuracyPercentage || 0) - (a.accuracyPercentage || 0))[0];

                    if (bestSubmittedAttempt) {
                        completedExamsCount++;
                        totalCorrect += bestSubmittedAttempt.score;
                        totalAttemptedQuestions += bestSubmittedAttempt.maxScore;
                    }
                });
            }

            const progressPercentage = totalExams > 0
                ? Math.round((completedExamsCount / totalExams) * 100)
                : 0;

            return {
                id: sub.id,
                name: sub.name,
                code: sub.code,
                stream: sub.stream,
                description: sub.description,
                subcategories: sub.subcategories,
                icon: sub.icon,
                color: sub.color,
                order: sub.order,
                totalExams,
                totalQuestions,
                completedExams: completedExamsCount,
                progressPercentage,
            };
        });

        res.json(formatted);
    } catch (err) {
        console.error("Error in getExamSubjects:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── GET /api/national-exams/dashboard ─────────────────────────────────────────
// Dashboard view: Banner (Active/Recent Exam) + Subject List with progress
export const getDashboardExamSimulator = async (req, res) => {
    try {
        const { gradeLevel, stream } = await getStudentContext(req);
        const studentId = req.user?.id;

        const profile = studentId ? await prisma.studentProfile.findUnique({
            where: { userId: studentId }
        }) : null;

        // Check for in-progress or recently taken exam attempt
        let bannerExam = null;
        if (studentId) {
            const inProgressAttempt = await prisma.nationalExamAttempt.findFirst({
                where: { studentId, status: "IN_PROGRESS" },
                orderBy: { updatedAt: "desc" },
                include: {
                    exam: {
                        include: {
                            subject: { select: { name: true, color: true, icon: true } }
                        }
                    }
                }
            });

            if (inProgressAttempt) {
                bannerExam = {
                    attemptId: inProgressAttempt.id,
                    examId: inProgressAttempt.exam.id,
                    title: inProgressAttempt.exam.title,
                    subjectName: inProgressAttempt.exam.subject.name,
                    year: inProgressAttempt.exam.year,
                    status: "IN_PROGRESS",
                    action: "Resume Exam",
                    timeRemainingSeconds: inProgressAttempt.timeRemainingSeconds,
                };
            } else {
                // Find latest exam available in student's grade/stream
                const latestExam = await prisma.nationalExam.findFirst({
                    where: {
                        gradeLevel,
                        OR: [{ stream: null }, { stream: "COMMON" }, { stream }]
                    },
                    orderBy: { year: "desc" },
                    include: {
                        subject: { select: { name: true, color: true, icon: true } }
                    }
                });

                if (latestExam) {
                    bannerExam = {
                        attemptId: null,
                        examId: latestExam.id,
                        title: latestExam.title,
                        subjectName: latestExam.subject.name,
                        year: latestExam.year,
                        status: "NOT_STARTED",
                        action: "Start Exam",
                    };
                }
            }
        }

        // Fetch subjects
        const subjectsReq = { query: { gradeLevel, stream }, user: req.user };
        // We can call subject calculation logic
        const subjects = await prisma.examSubject.findMany({
            where: {
                gradeLevels: { has: gradeLevel },
                OR: [
                    { stream: null },
                    { stream: "COMMON" },
                    { stream: stream }
                ]
            },
            orderBy: { order: "asc" },
            include: {
                exams: {
                    where: {
                        gradeLevel: gradeLevel,
                        OR: [
                            { stream: null },
                            { stream: "COMMON" },
                            { stream: stream }
                        ]
                    },
                    include: {
                        questions: { select: { id: true } },
                        attempts: studentId ? {
                            where: { studentId, status: "SUBMITTED" },
                            select: { id: true }
                        } : false
                    }
                }
            }
        });

        const formattedSubjects = subjects.map(sub => {
            const totalExams = sub.exams.length;
            const totalQuestions = sub.exams.reduce((sum, e) => sum + e.questions.length, 0);
            const completedCount = sub.exams.filter(e => (e.attempts || []).length > 0).length;
            const progressPercentage = totalExams > 0 ? Math.round((completedCount / totalExams) * 100) : 0;

            return {
                id: sub.id,
                name: sub.name,
                code: sub.code,
                stream: sub.stream,
                description: sub.description,
                subcategories: sub.subcategories,
                icon: sub.icon,
                color: sub.color,
                totalExams,
                totalQuestions,
                completedExams: completedCount,
                progressPercentage,
            };
        });

        res.json({
            student: {
                name: profile?.name || req.user?.email?.split("@")[0] || "Student",
                gradeLevel,
                stream,
                isPremium: profile?.isPremium || false,
            },
            bannerExam,
            subjectsCount: formattedSubjects.length,
            subjects: formattedSubjects,
        });
    } catch (err) {
        console.error("Error in getDashboardExamSimulator:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── GET /api/national-exams/subjects/:subjectId/exams ─────────────────────────
// List national exams for a subject (supports ordering, default: descending or ascending)
export const getExamsBySubject = async (req, res) => {
    const { subjectId } = req.params;
    const { order = "desc" } = req.query; // 'desc' (recent to oldest) or 'asc' (oldest to recent)
    const sortOrder = order.toLowerCase() === "asc" ? "asc" : "desc";

    try {
        const { gradeLevel, stream } = await getStudentContext(req);
        const studentId = req.user?.id;

        const subject = await prisma.examSubject.findUnique({
            where: { id: subjectId }
        });

        if (!subject) {
            return res.status(404).json({ message: "Exam subject not found" });
        }

        const exams = await prisma.nationalExam.findMany({
            where: {
                subjectId,
                gradeLevel,
                OR: [
                    { stream: null },
                    { stream: "COMMON" },
                    { stream }
                ]
            },
            orderBy: { year: sortOrder },
            include: {
                questions: { select: { id: true } },
                attempts: studentId ? {
                    where: { studentId },
                    orderBy: { updatedAt: "desc" },
                    take: 1
                } : false
            }
        });

        const formattedExams = exams.map(exam => {
            const latestAttempt = exam.attempts?.[0] || null;
            let userStatus = "NOT_STARTED";
            let actionLabel = "Start Exam";

            if (latestAttempt) {
                if (latestAttempt.status === "IN_PROGRESS") {
                    userStatus = "IN_PROGRESS";
                    actionLabel = "Resume";
                } else if (latestAttempt.status === "SUBMITTED") {
                    userStatus = "SUBMITTED";
                    actionLabel = "Review Results";
                }
            }

            return {
                id: exam.id,
                subjectId: exam.subjectId,
                title: exam.title,
                year: exam.year,
                gradeLevel: exam.gradeLevel,
                stream: exam.stream,
                durationMinutes: exam.durationMinutes,
                passingScore: exam.passingScore,
                totalQuestions: exam.questions.length,
                isPremium: exam.isPremium,
                badge: "Official Paper",
                userStatus,
                actionLabel,
                latestAttempt: latestAttempt ? {
                    id: latestAttempt.id,
                    status: latestAttempt.status,
                    score: latestAttempt.score,
                    maxScore: latestAttempt.maxScore,
                    accuracyPercentage: latestAttempt.accuracyPercentage,
                    passed: latestAttempt.passed,
                    submittedAt: latestAttempt.submittedAt,
                } : null
            };
        });

        res.json({
            subject: {
                id: subject.id,
                name: subject.name,
                code: subject.code,
                stream: subject.stream,
                description: subject.description,
            },
            sortOrder,
            totalExams: formattedExams.length,
            exams: formattedExams
        });
    } catch (err) {
        console.error("Error in getExamsBySubject:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── POST /api/national-exams/:examId/start ────────────────────────────────────
// Starts or resumes an exam attempt. Returns questions without answers for student.
export const startExamAttempt = async (req, res) => {
    const { examId } = req.params;
    const studentId = req.user.id;

    try {
        const exam = await prisma.nationalExam.findUnique({
            where: { id: examId },
            include: {
                subject: { select: { id: true, name: true, color: true } },
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: {
                            orderBy: { order: "asc" },
                            select: { id: true, text: true, imageUrl: true, order: true }
                        }
                    }
                }
            }
        });

        if (!exam) {
            return res.status(404).json({ message: "National exam not found" });
        }

        // Check Premium Access
        if (exam.isPremium) {
            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId: studentId }
            });
            if (!studentProfile?.isPremium) {
                return res.status(403).json({
                    message: "This national exam is only available to Premium subscribers.",
                    isPremiumRequired: true
                });
            }
        }

        // Check if there is an active in-progress attempt
        let attempt = await prisma.nationalExamAttempt.findFirst({
            where: { studentId, examId, status: "IN_PROGRESS" },
            include: {
                answers: {
                    select: {
                        questionId: true,
                        selectedOptionId: true,
                        textResponse: true,
                        isFlagged: true
                    }
                }
            }
        });

        if (!attempt) {
            attempt = await prisma.nationalExamAttempt.create({
                data: {
                    studentId,
                    examId,
                    status: "IN_PROGRESS",
                    maxScore: exam.questions.length,
                    timeRemainingSeconds: exam.durationMinutes * 60,
                    startedAt: new Date(),
                },
                include: { answers: true }
            });
        }

        res.json({
            attemptId: attempt.id,
            status: attempt.status,
            timeRemainingSeconds: attempt.timeRemainingSeconds ?? (exam.durationMinutes * 60),
            exam: {
                id: exam.id,
                title: exam.title,
                year: exam.year,
                gradeLevel: exam.gradeLevel,
                stream: exam.stream,
                durationMinutes: exam.durationMinutes,
                passingScore: exam.passingScore,
                subject: exam.subject,
                totalQuestions: exam.questions.length,
            },
            questions: exam.questions,
            savedAnswers: attempt.answers || [],
        });
    } catch (err) {
        console.error("Error in startExamAttempt:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── PUT /api/national-exams/attempts/:attemptId/save-progress ─────────────────
// Autosaves student answers and time remaining while exam is in progress
export const saveExamProgress = async (req, res) => {
    const { attemptId } = req.params;
    const { answers, timeRemainingSeconds } = req.body;
    const studentId = req.user.id;

    try {
        const attempt = await prisma.nationalExamAttempt.findUnique({
            where: { id: attemptId }
        });

        if (!attempt || attempt.studentId !== studentId) {
            return res.status(404).json({ message: "Attempt not found or unauthorized" });
        }

        if (attempt.status !== "IN_PROGRESS") {
            return res.status(400).json({ message: "Cannot save progress for an already submitted exam" });
        }

        // Upsert answers
        if (Array.isArray(answers) && answers.length > 0) {
            for (const ans of answers) {
                if (!ans.questionId) continue;
                await prisma.nationalExamAnswer.upsert({
                    where: {
                        attemptId_questionId: {
                            attemptId,
                            questionId: ans.questionId
                        }
                    },
                    update: {
                        selectedOptionId: ans.selectedOptionId || null,
                        textResponse: ans.textResponse || null,
                        isFlagged: Boolean(ans.isFlagged),
                    },
                    create: {
                        attemptId,
                        questionId: ans.questionId,
                        selectedOptionId: ans.selectedOptionId || null,
                        textResponse: ans.textResponse || null,
                        isFlagged: Boolean(ans.isFlagged),
                        isCorrect: false
                    }
                });
            }
        }

        // Update remaining time
        if (timeRemainingSeconds !== undefined) {
            await prisma.nationalExamAttempt.update({
                where: { id: attemptId },
                data: { timeRemainingSeconds: parseInt(timeRemainingSeconds, 10) }
            });
        }

        res.json({ message: "Progress saved successfully" });
    } catch (err) {
        console.error("Error in saveExamProgress:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── POST /api/national-exams/attempts/:attemptId/submit ────────────────────────
// Submits exam attempt, grades answers, computes accuracy & score
export const submitExamAttempt = async (req, res) => {
    const { attemptId } = req.params;
    const { answers } = req.body;
    const studentId = req.user.id;

    try {
        const attempt = await prisma.nationalExamAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    include: {
                        questions: {
                            include: { options: true }
                        }
                    }
                }
            }
        });

        if (!attempt || attempt.studentId !== studentId) {
            return res.status(404).json({ message: "Attempt not found or unauthorized" });
        }

        if (attempt.status === "SUBMITTED") {
            return res.status(400).json({ message: "Exam has already been submitted", attemptId });
        }

        const questions = attempt.exam.questions;
        const maxScore = questions.length;
        let score = 0;

        // Merge submitted answers with any previously saved answers in db
        const submittedAnswersMap = new Map();
        if (Array.isArray(answers)) {
            answers.forEach(a => {
                if (a.questionId) submittedAnswersMap.set(a.questionId, a);
            });
        }

        const existingAnswers = await prisma.nationalExamAnswer.findMany({
            where: { attemptId }
        });
        existingAnswers.forEach(a => {
            if (!submittedAnswersMap.has(a.questionId)) {
                submittedAnswersMap.set(a.questionId, a);
            }
        });

        // Grade each question
        const processedAnswers = [];
        for (const q of questions) {
            const userAns = submittedAnswersMap.get(q.id);
            const correctOption = q.options.find(o => o.isCorrect);
            let isCorrect = false;

            if (userAns && userAns.selectedOptionId) {
                isCorrect = correctOption ? userAns.selectedOptionId === correctOption.id : false;
            } else if (userAns && userAns.textResponse && correctOption) {
                isCorrect = userAns.textResponse.trim().toLowerCase() === correctOption.text.trim().toLowerCase();
            }

            if (isCorrect) score++;

            processedAnswers.push({
                questionId: q.id,
                selectedOptionId: userAns?.selectedOptionId || null,
                textResponse: userAns?.textResponse || null,
                isFlagged: Boolean(userAns?.isFlagged),
                isCorrect
            });
        }

        const accuracyPercentage = maxScore > 0 ? parseFloat(((score / maxScore) * 100).toFixed(1)) : 0;
        const passed = accuracyPercentage >= attempt.exam.passingScore;
        const incorrectAnswers = maxScore - score;

        // Transaction to save answers and update attempt
        await prisma.$transaction(async (tx) => {
            for (const item of processedAnswers) {
                await tx.nationalExamAnswer.upsert({
                    where: {
                        attemptId_questionId: {
                            attemptId,
                            questionId: item.questionId
                        }
                    },
                    update: {
                        selectedOptionId: item.selectedOptionId,
                        textResponse: item.textResponse,
                        isFlagged: item.isFlagged,
                        isCorrect: item.isCorrect
                    },
                    create: {
                        attemptId,
                        questionId: item.questionId,
                        selectedOptionId: item.selectedOptionId,
                        textResponse: item.textResponse,
                        isFlagged: item.isFlagged,
                        isCorrect: item.isCorrect
                    }
                });
            }

            await tx.nationalExamAttempt.update({
                where: { id: attemptId },
                data: {
                    status: "SUBMITTED",
                    score,
                    maxScore,
                    correctAnswers: score,
                    incorrectAnswers,
                    accuracyPercentage,
                    passed,
                    timeRemainingSeconds: 0,
                    submittedAt: new Date()
                }
            });
        });

        res.json({
            message: "Exam submitted successfully",
            attemptId,
            examId: attempt.examId,
            examTitle: attempt.exam.title,
            score,
            maxScore,
            accuracyPercentage,
            correctAnswers: score,
            incorrectAnswers,
            passingScore: attempt.exam.passingScore,
            passed,
        });
    } catch (err) {
        console.error("Error in submitExamAttempt:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── GET /api/national-exams/attempts/:attemptId ───────────────────────────────
// Results Page (Screen 6): Returns score breakdown and question review
export const getExamAttemptResult = async (req, res) => {
    const { attemptId } = req.params;
    const studentId = req.user.id;

    try {
        const attempt = await prisma.nationalExamAttempt.findUnique({
            where: { id: attemptId },
            include: {
                exam: {
                    include: {
                        subject: { select: { id: true, name: true, color: true } },
                        questions: {
                            orderBy: { order: "asc" },
                            include: {
                                options: { orderBy: { order: "asc" } }
                            }
                        }
                    }
                },
                answers: true
            }
        });

        if (!attempt) {
            return res.status(404).json({ message: "Attempt not found" });
        }

        if (attempt.studentId !== studentId && req.user.role !== "CONTENT_MANAGER") {
            return res.status(403).json({ message: "Access denied" });
        }

        const answerMap = new Map(attempt.answers.map(a => [a.questionId, a]));

        const questionsReview = attempt.exam.questions.map(q => {
            const userAns = answerMap.get(q.id);
            const correctOpt = q.options.find(o => o.isCorrect);
            const chosenOpt = q.options.find(o => o.id === userAns?.selectedOptionId);

            return {
                id: q.id,
                order: q.order,
                text: q.text,
                resourceUrl: q.resourceUrl,
                explanation: q.explanation,
                options: q.options.map(opt => ({
                    id: opt.id,
                    text: opt.text,
                    imageUrl: opt.imageUrl,
                    order: opt.order,
                    isCorrect: opt.isCorrect,
                    isSelected: opt.id === userAns?.selectedOptionId
                })),
                userAnswer: {
                    selectedOptionId: userAns?.selectedOptionId || null,
                    selectedOptionText: chosenOpt?.text || null,
                    textResponse: userAns?.textResponse || null,
                    isFlagged: userAns?.isFlagged || false,
                },
                correctAnswer: {
                    optionId: correctOpt?.id || null,
                    text: correctOpt?.text || null
                },
                wasCorrect: userAns?.isCorrect || false
            };
        });

        res.json({
            attemptId: attempt.id,
            status: attempt.status,
            score: attempt.score,
            maxScore: attempt.maxScore,
            correctAnswers: attempt.correctAnswers,
            incorrectAnswers: attempt.incorrectAnswers,
            accuracyPercentage: attempt.accuracyPercentage,
            passed: attempt.passed,
            startedAt: attempt.startedAt,
            submittedAt: attempt.submittedAt,
            exam: {
                id: attempt.exam.id,
                title: attempt.exam.title,
                year: attempt.exam.year,
                gradeLevel: attempt.exam.gradeLevel,
                stream: attempt.exam.stream,
                passingScore: attempt.exam.passingScore,
                subject: attempt.exam.subject
            },
            questions: questionsReview
        });
    } catch (err) {
        console.error("Error in getExamAttemptResult:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── Content Manager CRUD ──────────────────────────────────────────────────────
export const getAdminSubjects = async (req, res) => {
    const { gradeLevel } = req.query;
    try {
        const whereClause = {};
        if (gradeLevel) {
            whereClause.gradeLevels = { has: parseInt(gradeLevel, 10) };
        }
        const subjects = await prisma.examSubject.findMany({
            where: whereClause,
            orderBy: { order: "asc" },
            include: {
                exams: {
                    select: {
                        id: true,
                        title: true,
                        year: true,
                        gradeLevel: true,
                        stream: true,
                        durationMinutes: true,
                        isPremium: true,
                        _count: { select: { questions: true } }
                    }
                }
            }
        });
        res.json(subjects);
    } catch (err) {
        console.error("Error in getAdminSubjects:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const createExamSubject = async (req, res) => {
    const { name, code, gradeLevels, stream, description, subcategories, icon, color, order } = req.body;
    try {
        const parsedGradeLevels = Array.isArray(gradeLevels)
            ? gradeLevels.map(g => parseInt(g, 10))
            : [12];

        const subject = await prisma.examSubject.create({
            data: {
                name,
                code: code || null,
                gradeLevels: parsedGradeLevels,
                stream: stream || null,
                description: description || null,
                subcategories: subcategories || null,
                icon: icon || null,
                color: color || "#0F4C81",
                order: order !== undefined ? parseInt(order, 10) : 0
            }
        });
        res.status(201).json(subject);
    } catch (err) {
        console.error("Error in createExamSubject:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const updateExamSubject = async (req, res) => {
    const { id } = req.params;
    const { name, code, gradeLevels, stream, description, subcategories, icon, color, order } = req.body;
    try {
        const subject = await prisma.examSubject.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(code !== undefined && { code }),
                ...(Array.isArray(gradeLevels) && { gradeLevels: gradeLevels.map(g => parseInt(g, 10)) }),
                ...(stream !== undefined && { stream: stream || null }),
                ...(description !== undefined && { description }),
                ...(subcategories !== undefined && { subcategories }),
                ...(icon !== undefined && { icon }),
                ...(color !== undefined && { color }),
                ...(order !== undefined && { order: parseInt(order, 10) })
            }
        });
        res.json(subject);
    } catch (err) {
        console.error("Error in updateExamSubject:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const deleteExamSubject = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.examSubject.delete({ where: { id } });
        res.json({ message: "Subject deleted successfully" });
    } catch (err) {
        console.error("Error in deleteExamSubject:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const getAdminExams = async (req, res) => {
    const { gradeLevel, subjectId, stream } = req.query;
    try {
        const whereClause = {};
        if (gradeLevel) whereClause.gradeLevel = parseInt(gradeLevel, 10);
        if (subjectId) whereClause.subjectId = subjectId;
        if (stream && stream !== "ALL") whereClause.stream = stream;

        const exams = await prisma.nationalExam.findMany({
            where: whereClause,
            orderBy: [{ gradeLevel: "asc" }, { year: "desc" }, { order: "asc" }],
            include: {
                subject: { select: { id: true, name: true, color: true, icon: true, code: true } },
                _count: { select: { questions: true, attempts: true } }
            }
        });
        res.json(exams);
    } catch (err) {
        console.error("Error in getAdminExams:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const getAdminExamDetail = async (req, res) => {
    const { id } = req.params;
    try {
        const exam = await prisma.nationalExam.findUnique({
            where: { id },
            include: {
                subject: true,
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: { orderBy: { order: "asc" } }
                    }
                }
            }
        });
        if (!exam) return res.status(404).json({ message: "National exam not found" });
        res.json(exam);
    } catch (err) {
        console.error("Error in getAdminExamDetail:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const createNationalExam = async (req, res) => {
    const { subjectId, title, year, gradeLevel, stream, durationMinutes, passingScore, isPremium, order } = req.body;
    try {
        const exam = await prisma.nationalExam.create({
            data: {
                subjectId,
                title,
                year: parseInt(year, 10),
                gradeLevel: parseInt(gradeLevel, 10),
                stream: stream || null,
                durationMinutes: durationMinutes ? parseInt(durationMinutes, 10) : 120,
                passingScore: passingScore ? parseInt(passingScore, 10) : 50,
                isPremium: Boolean(isPremium),
                order: order ?? 0
            },
            include: {
                subject: true,
                _count: { select: { questions: true } }
            }
        });
        res.status(201).json(exam);
    } catch (err) {
        console.error("Error in createNationalExam:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const updateNationalExam = async (req, res) => {
    const { id } = req.params;
    const { title, year, gradeLevel, stream, durationMinutes, passingScore, isPremium, order } = req.body;
    try {
        const exam = await prisma.nationalExam.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(year && { year: parseInt(year, 10) }),
                ...(gradeLevel && { gradeLevel: parseInt(gradeLevel, 10) }),
                ...(stream !== undefined && { stream: stream || null }),
                ...(durationMinutes && { durationMinutes: parseInt(durationMinutes, 10) }),
                ...(passingScore && { passingScore: parseInt(passingScore, 10) }),
                ...(isPremium !== undefined && { isPremium: Boolean(isPremium) }),
                ...(order !== undefined && { order: parseInt(order, 10) })
            },
            include: {
                subject: true,
                _count: { select: { questions: true } }
            }
        });
        res.json(exam);
    } catch (err) {
        console.error("Error in updateNationalExam:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const deleteNationalExam = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.nationalExam.delete({ where: { id } });
        res.json({ message: "Exam deleted successfully" });
    } catch (err) {
        console.error("Error in deleteNationalExam:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const getExamQuestions = async (req, res) => {
    const { examId } = req.params;
    try {
        const questions = await prisma.examQuestion.findMany({
            where: { examId },
            orderBy: { order: "asc" },
            include: {
                options: { orderBy: { order: "asc" } }
            }
        });
        res.json(questions);
    } catch (err) {
        console.error("Error in getExamQuestions:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const addExamQuestion = async (req, res) => {
    const { examId } = req.params;
    const { text, type, resourceUrl, explanation, order, options } = req.body;

    try {
        let questionOrder = order;
        if (questionOrder === undefined || questionOrder === null) {
            const count = await prisma.examQuestion.count({ where: { examId } });
            questionOrder = count + 1;
        }

        const question = await prisma.examQuestion.create({
            data: {
                examId,
                text,
                type: type || "SINGLE_CHOICE",
                resourceUrl: resourceUrl || null,
                explanation: explanation || null,
                order: questionOrder,
                options: {
                    create: (options || []).map((opt, idx) => ({
                        text: opt.text,
                        isCorrect: Boolean(opt.isCorrect),
                        imageUrl: opt.imageUrl || null,
                        order: opt.order ?? idx + 1
                    }))
                }
            },
            include: { options: { orderBy: { order: "asc" } } }
        });
        res.status(201).json(question);
    } catch (err) {
        console.error("Error in addExamQuestion:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const updateExamQuestion = async (req, res) => {
    const { questionId } = req.params;
    const { text, type, resourceUrl, explanation, options } = req.body;

    try {
        const updated = await prisma.$transaction(async (tx) => {
            await tx.examQuestion.update({
                where: { id: questionId },
                data: {
                    ...(text && { text }),
                    ...(type && { type }),
                    ...(resourceUrl !== undefined && { resourceUrl: resourceUrl || null }),
                    ...(explanation !== undefined && { explanation: explanation || null }),
                }
            });

            if (Array.isArray(options) && options.length > 0) {
                await tx.examQuestionOption.deleteMany({ where: { questionId } });
                await tx.examQuestionOption.createMany({
                    data: options.map((opt, idx) => ({
                        questionId,
                        text: opt.text,
                        isCorrect: Boolean(opt.isCorrect),
                        imageUrl: opt.imageUrl || null,
                        order: opt.order ?? idx + 1
                    }))
                });
            }

            return tx.examQuestion.findUnique({
                where: { id: questionId },
                include: { options: { orderBy: { order: "asc" } } }
            });
        });
        res.json(updated);
    } catch (err) {
        console.error("Error in updateExamQuestion:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const deleteExamQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        await prisma.examQuestion.delete({ where: { id: questionId } });
        res.json({ message: "Question deleted successfully" });
    } catch (err) {
        console.error("Error in deleteExamQuestion:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

