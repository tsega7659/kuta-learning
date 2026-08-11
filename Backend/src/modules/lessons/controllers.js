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
    let { title, description, coverImage, order } = req.body;
    try {
        const topicId = req.params.topicId;

        let finalOrder = parseInt(order);
        if (isNaN(finalOrder) || finalOrder <= 0) {
            const last = await prisma.lesson.findFirst({ where: { topicId }, orderBy: { order: "desc" } });
            finalOrder = last ? last.order + 1 : 1;
        } else {
            const existing = await prisma.lesson.findUnique({ where: { topicId_order: { topicId, order: finalOrder } } });
            if (existing) {
                const last = await prisma.lesson.findFirst({ where: { topicId }, orderBy: { order: "desc" } });
                finalOrder = last ? last.order + 1 : 1;
            }
        }

        const lesson = await prisma.lesson.create({
            data: { title, description, coverImage, order: finalOrder, topicId },
        });
        res.status(201).json(lesson);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const updateLesson = async (req, res) => {
    const { title, description, coverImage, order } = req.body;
    try {
        const updateData = { title, description };
        if (coverImage !== undefined) updateData.coverImage = coverImage;
        const finalOrder = parseInt(order);
        if (!isNaN(finalOrder)) updateData.order = finalOrder;

        const lesson = await prisma.lesson.update({
            where: { id: req.params.id },
            data: updateData,
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
