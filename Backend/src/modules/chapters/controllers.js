import { prisma } from "../../prisma.js";

// GET /api/courses/:courseId/chapters
export const getChapters = async (req, res) => {
    try {
        const chapters = await prisma.chapter.findMany({
            where: { courseId: req.params.courseId },
            orderBy: { order: "asc" },
            include: { topics: { orderBy: { order: "asc" } } }
        });
        res.json(chapters);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// POST /api/courses/:courseId/chapters
export const createChapter = async (req, res) => {
    const { title, order } = req.body;
    try {
        const chapter = await prisma.chapter.create({
            data: { title, order: parseInt(order), courseId: req.params.courseId },
        });
        res.status(201).json(chapter);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// PUT /api/courses/:courseId/chapters/:id (we can just use /api/chapters/:id directly in the future, but it works here)
export const updateChapter = async (req, res) => {
    const { title, order } = req.body;
    try {
        const chapter = await prisma.chapter.update({
            where: { id: req.params.id },
            data: { title, order: parseInt(order) },
        });
        res.json(chapter);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteChapter = async (req, res) => {
    try {
        await prisma.chapter.delete({ where: { id: req.params.id } });
        res.json({ message: "Chapter deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
