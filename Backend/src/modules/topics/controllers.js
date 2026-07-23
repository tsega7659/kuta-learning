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
    const { title, order } = req.body;
    try {
        const topic = await prisma.topic.create({
            data: { title, order: parseInt(order), chapterId: req.params.chapterId },
        });
        res.status(201).json(topic);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
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
