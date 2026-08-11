import { prisma } from "../../prisma.js";

// === PUBLIC ===
export const getAllCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                chapters: {
                    include: {
                        topics: {
                            include: {
                                lessons: { select: { id: true } },
                                quiz: { where: { quizType: "QUIZ" }, select: { id: true, title: true, passingScore: true } }
                            }
                        }
                    }
                }
            }
        });

        if (req.user && req.user.role === "STUDENT") {
            const studentId = req.user.id;
            const enrichedCourses = await Promise.all(courses.map(async (course) => {
                const lessonIds = course.chapters
                    .flatMap(c => c.topics)
                    .flatMap(t => t.lessons)
                    .map(l => l.id);

                const courseQuizzes = course.chapters
                    .flatMap(c => c.topics)
                    .flatMap(t => t.quiz);

                const quizIds = courseQuizzes.map(q => q.id);

                let completedCount = 0;
                if (lessonIds.length > 0) {
                    completedCount = await prisma.lessonProgress.count({
                        where: { studentId, lessonId: { in: lessonIds }, completed: true }
                    });
                }

                // Fetch best attempt for each quiz
                const attempts = quizIds.length > 0 ? await prisma.quizAttempt.findMany({
                    where: { studentId, quizId: { in: quizIds }, submittedAt: { not: null } },
                    orderBy: { score: 'desc' }
                }) : [];

                const enrichedQuizzes = courseQuizzes.map(q => {
                    const bestAttempt = attempts.find(a => a.quizId === q.id);
                    return {
                        id: q.id,
                        title: q.title,
                        passingScore: q.passingScore,
                        score: bestAttempt ? bestAttempt.score : null,
                        maxScore: bestAttempt ? bestAttempt.maxScore : null,
                        passed: bestAttempt ? bestAttempt.passed : false,
                        attempted: !!bestAttempt
                    };
                });

                const progressPercentage = lessonIds.length > 0 ? Math.round((completedCount / lessonIds.length) * 100) : 0;

                return {
                    id: course.id,
                    title: course.title,
                    description: course.description,
                    coverImage: course.coverImage,
                    gradeLevel: course.gradeLevel,
                    createdAt: course.createdAt,
                    updatedAt: course.updatedAt,
                    progressPercentage,
                    totalLessons: lessonIds.length,
                    completedLessons: completedCount,
                    quizzes: enrichedQuizzes
                };
            }));
            return res.json(enrichedCourses);
        }

        const safeCourses = courses.map(c => ({
            id: c.id,
            title: c.title,
            description: c.description,
            coverImage: c.coverImage,
            gradeLevel: c.gradeLevel,
            createdAt: c.createdAt,
            updatedAt: c.updatedAt
        }));
        res.json(safeCourses);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

export const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await prisma.course.findUnique({
            where: { id },
            include: {
                chapters: {
                    orderBy: { order: "asc" },
                    include: {
                        topics: {
                            orderBy: { order: "asc" },
                            include: {
                                lessons: {
                                    orderBy: { order: "asc" }
                                },
                                quiz: {
                                    where: { quizType: "QUIZ" },
                                    orderBy: { order: "asc" },
                                    select: { id: true, title: true, passingScore: true, order: true }
                                }
                            }
                        }
                    }
                }
            },
        });
        if (!course) return res.status(404).json({ message: "Course not found" });

        // If a student is requesting, enrich with lesson progress + quiz availability
        if (req.user && req.user.role === "STUDENT") {
            const studentId = req.user.id;
            const lessonIds = course.chapters
                .flatMap(c => c.topics)
                .flatMap(t => t.lessons)
                .map(l => l.id);

            const progress = await prisma.lessonProgress.findMany({
                where: { studentId, lessonId: { in: lessonIds } },
                select: { lessonId: true, completed: true }
            });
            const progressMap = new Map(progress.map(p => [p.lessonId, p.completed]));

            const quizIds = course.chapters
                .flatMap(c => c.topics)
                .flatMap(t => t.quiz || [])
                .map(q => q.id);

            const quizAttempts = await prisma.quizAttempt.findMany({
                where: {
                    studentId,
                    quizId: { in: quizIds },
                    passed: true
                },
                select: { quizId: true }
            });
            const completedQuizzes = new Set(quizAttempts.map(qa => qa.quizId));

            course.chapters = course.chapters.map(ch => ({
                ...ch,
                topics: ch.topics.map(t => {
                    const lessonsWithStatus = t.lessons.map((lesson, lessonIndex) => {
                        const completed = !!progressMap.get(lesson.id);
                        const previousLessonCompleted = lessonIndex === 0 ? true : (t.lessons[lessonIndex - 1]?.id ? !!progressMap.get(t.lessons[lessonIndex - 1].id) : true);

                        return {
                            ...lesson,
                            completed,
                            locked: !previousLessonCompleted
                        };
                    });

                    const allDone = lessonsWithStatus.length > 0 && lessonsWithStatus.every(l => l.completed);
                    const quizzes = (t.quiz || []).map(q => ({
                        ...q,
                        available: allDone,
                        completed: completedQuizzes.has(q.id)
                    }));

                    return {
                        ...t,
                        lessons: lessonsWithStatus,
                        quizzes,
                        quizAvailable: quizzes.length > 0 && allDone,
                        hasQuiz: quizzes.length > 0
                    };
                })
            }));
        }

        res.json(course);
    } catch (err) {
        console.error("Error in getCourseById:", err);
        res.status(500).json({ message: "Server error", error: err.message, stack: err.stack });
    }
};

// === CONTENT MANAGER ===
export const createCourse = async (req, res) => {
    const { title, description, coverImage, gradeLevel } = req.body;
    try {
        const course = await prisma.course.create({
            data: { title, description, coverImage, gradeLevel: parseInt(gradeLevel) },
        });
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { title, description, coverImage, gradeLevel } = req.body;
    try {
        const course = await prisma.course.update({
            where: { id },
            data: { title, description, coverImage, gradeLevel: parseInt(gradeLevel) },
        });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.course.delete({ where: { id } });
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
