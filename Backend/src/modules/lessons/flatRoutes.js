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
                }
            }
        });

        if (!lesson) {
            return res.status(404).json({ message: "Lesson not found" });
        }

        res.json(lesson);
    } catch (err) {
        res.status(500).json({ message: "Server Error", error: err.message });
    }
});

export default router;
