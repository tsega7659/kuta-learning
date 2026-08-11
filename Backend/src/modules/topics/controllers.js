import { prisma } from "../../prisma.js";

export const getTopics = async (req, res) => {
    try {
        const topics = await prisma.topic.findMany({
            where: { chapterId: req.params.chapterId },
            orderBy: { order: "asc" },
            include: { lessons: { orderBy: { order: "asc" } } }
        });
        res.json(topics);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const createTopic = async (req, res) => {
    let { title, description, coverImage, order } = req.body;
    try {
        const chapterId = req.params.chapterId;

        let finalOrder = parseInt(order);
        if (isNaN(finalOrder) || finalOrder <= 0) {
            const lastTopic = await prisma.topic.findFirst({ where: { chapterId }, orderBy: { order: "desc" } });
            finalOrder = lastTopic ? lastTopic.order + 1 : 1;
        } else {
            const existing = await prisma.topic.findUnique({ where: { chapterId_order: { chapterId, order: finalOrder } } });
            if (existing) {
                const lastTopic = await prisma.topic.findFirst({ where: { chapterId }, orderBy: { order: "desc" } });
                finalOrder = lastTopic ? lastTopic.order + 1 : 1;
            }
        }

        const topic = await prisma.topic.create({
            data: { title, description, coverImage, order: finalOrder, chapterId },
        });
        res.status(201).json(topic);
    } catch (err) {
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const updateTopic = async (req, res) => {
    const { title, description, coverImage, order } = req.body;
    try {
        const updateData = { title, description };
        if (coverImage !== undefined) updateData.coverImage = coverImage;
        const finalOrder = parseInt(order);
        if (!isNaN(finalOrder)) updateData.order = finalOrder;

        const topic = await prisma.topic.update({
            where: { id: req.params.id },
            data: updateData,
        });
        res.json(topic);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteTopic = async (req, res) => {
    try {
        await prisma.topic.delete({ where: { id: req.params.id } });
        res.json({ message: "Topic deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
