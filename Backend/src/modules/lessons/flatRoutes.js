import { Router } from "express";
import { prisma } from "../../prisma.js";
import { authenticateToken } from "../../middlewares/authenticateToken.js";

const router = Router();

// student fetches a specific lesson with all its contents beautifully sorted!
router.get("/:id", authenticateToken, async (req, res) => {
    try {
        const lesson = await prisma.lesson.findUnique({
            where: { id: req.params.id },
            include: {
                contents: {
                    orderBy: { order: "asc" }
                },
                topic: {
                    include: {
                        quiz: {
                            orderBy: { order: "asc" },
                            select: { id: true, title: true, passingScore: true, order: true }
                        }
                    }
                }
            }
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        const studentId = req.user.id;
        const orderedLessons = await prisma.lesson.findMany({
            where: { topicId: lesson.topicId },
            orderBy: { order: "asc" },
            select: { id: true, order: true }
        });

        const progress = await prisma.lessonProgress.findMany({
            where: {
                studentId,
                lessonId: { in: orderedLessons.map(l => l.id) }
            },
            select: { lessonId: true, completed: true }
        });

        const progressMap = new Map(progress.map(p => [p.lessonId, p.completed]));
        const currentIndex = orderedLessons.findIndex(l => l.id === lesson.id);
        const previousLesson = orderedLessons[currentIndex - 1];
        const completed = !!progressMap.get(lesson.id);
        const locked = currentIndex > 0 && previousLesson ? !progressMap.get(previousLesson.id) : false;
        const allLessonsCompleted = orderedLessons.length > 0 && orderedLessons.every(l => !!progressMap.get(l.id));

        const quizList = (lesson.topic.quiz || []).map(q => ({
            ...q,
            available: allLessonsCompleted
        }));

        res.json({
            ...lesson,
            completed,
            locked,
            topic: {
                ...lesson.topic,
                quiz: quizList,
                quizzes: quizList,
                quizAvailable: quizList.length > 0 && allLessonsCompleted,
                hasQuiz: quizList.length > 0
            }
        });
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

export default router;
