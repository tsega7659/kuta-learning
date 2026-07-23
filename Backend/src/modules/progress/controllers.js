import { prisma } from "../../prisma.js";

// GET /api/progress/courses/:courseId
// Returns the student's completion rate for a specific course
export const getCourseProgress = async (req, res) => {
    const { courseId } = req.params;
    const studentId = req.user.id; // from JWT token

    try {
        // Check how many lessons are in the course total
        const totalLessons = await prisma.lesson.count({
            where: {
                topic: {
                    chapter: {
                        courseId: courseId
                    }
                }
            }
        });

        // Check how many of those lessons the student has completed
        const completedLessons = await prisma.lessonProgress.count({
            where: {
                studentId: studentId,
                completed: true,
                lesson: {
                    topic: {
                        chapter: {
                            courseId: courseId
                        }
                    }
                }
            }
        });

        const percentage = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

        res.json({
            courseId,
            totalLessons,
            completedLessons,
            percentage
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/progress/lessons/:lessonId/complete
// Toggle completion of a distinct lesson
export const logLessonCompletion = async (req, res) => {
    const { lessonId } = req.params;
    const studentId = req.user.id;

    try {
        const progress = await prisma.lessonProgress.upsert({
            where: {
                studentId_lessonId: { studentId, lessonId }
            },
            update: {
                completed: true,
                completedAt: new Date()
            },
            create: {
                studentId,
                lessonId,
                completed: true
            }
        });
        res.json(progress);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
};
