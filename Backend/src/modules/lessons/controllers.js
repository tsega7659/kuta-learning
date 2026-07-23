import { prisma } from "../../prisma.js";

export const getLessons = async (req, res) => {
    try {
        const lessons = await prisma.lesson.findMany({
            where: { topicId: req.params.topicId },
            orderBy: { order: "asc" },
            include: { contents: { orderBy: { order: "asc" } } }
        });
        res.json(lessons);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const createLesson = async (req, res) => {
    const { title, description, order } = req.body;
    try {
        const lesson = await prisma.lesson.create({
            data: { title, description, order: parseInt(order), topicId: req.params.topicId },
        });
        res.status(201).json(lesson);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateLesson = async (req, res) => {
    const { title, description, order } = req.body;
    try {
        const lesson = await prisma.lesson.update({
            where: { id: req.params.id },
            data: { title, description, order: parseInt(order) },
        });
        res.json(lesson);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteLesson = async (req, res) => {
    try {
        await prisma.lesson.delete({ where: { id: req.params.id } });
        res.json({ message: "Lesson deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
