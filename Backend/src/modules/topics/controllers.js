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
    let { title, order } = req.body;
    try {
        const chapterId = req.params.chapterId;

        let finalOrder = parseInt(order);
        if (isNaN(finalOrder) || finalOrder <= 0) {
            const lastTopic = await prisma.topic.findFirst({
                where: { chapterId },
                orderBy: { order: "desc" },
            });
            finalOrder = lastTopic ? lastTopic.order + 1 : 1;
        } else {
            // Ensure no collision if they submitted a duplicate
            const existing = await prisma.topic.findUnique({
                where: { chapterId_order: { chapterId, order: finalOrder } }
            });
            if (existing) {
                const lastTopic = await prisma.topic.findFirst({
                    where: { chapterId },
                    orderBy: { order: "desc" },
                });
                finalOrder = lastTopic ? lastTopic.order + 1 : 1;
            }
        }

        const topic = await prisma.topic.create({
            data: { title, order: finalOrder, chapterId },
        });
        res.status(201).json(topic);
    } catch (err) {
        console.error("DEBUG CREATE TOPIC ERROR:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

export const updateTopic = async (req, res) => {
    const { title, order } = req.body;
    try {
        const topic = await prisma.topic.update({
            where: { id: req.params.id },
            data: { title, order: parseInt(order) },
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
