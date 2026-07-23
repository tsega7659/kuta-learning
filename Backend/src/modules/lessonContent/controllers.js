import { prisma } from "../../prisma.js";

export const getLessonContents = async (req, res) => {
    try {
        const contents = await prisma.lessonContent.findMany({
            where: { lessonId: req.params.lessonId },
            orderBy: { order: "asc" }
        });
        res.json(contents);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const addLessonContent = async (req, res) => {
    const { type, content, order } = req.body;
    try {
        const lessonContent = await prisma.lessonContent.create({
            data: { type, content, order: parseInt(order), lessonId: req.params.lessonId },
        });
        res.status(201).json(lessonContent);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateLessonContent = async (req, res) => {
    const { type, content, order } = req.body;
    try {
        const lessonContent = await prisma.lessonContent.update({
            where: { id: req.params.id },
            data: { type, content, order: parseInt(order) },
        });
        res.json(lessonContent);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteLessonContent = async (req, res) => {
    try {
        await prisma.lessonContent.delete({ where: { id: req.params.id } });
        res.json({ message: "Lesson content deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
