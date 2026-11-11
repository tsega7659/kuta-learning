import { prisma } from "../../prisma.js";

/**
 * POST /api/bookmarks/toggle
 * Toggle bookmark for any item (exam question, note chapter, lesson, quiz question).
 * Body: { type, itemId, title?, subjectId?, metadata? }
 */
export const toggleBookmark = async (req, res) => {
    const studentId = req.user.id;
    const { type = "EXAM_QUESTION", itemId, title, subjectId, metadata } = req.body;

    if (!itemId) {
        return res.status(400).json({ message: "itemId is required" });
    }

    try {
        const existing = await prisma.bookmark.findUnique({
            where: {
                studentId_type_itemId: {
                    studentId,
                    type,
                    itemId,
                },
            },
        });

        if (existing) {
            await prisma.bookmark.delete({
                where: { id: existing.id },
            });
            return res.json({
                isBookmarked: false,
                message: "Bookmark removed",
                bookmarkId: existing.id,
            });
        }

        const newBookmark = await prisma.bookmark.create({
            data: {
                studentId,
                type,
                itemId,
                title: title || null,
                subjectId: subjectId || null,
                metadata: metadata || null,
            },
        });

        return res.status(201).json({
            isBookmarked: true,
            message: "Bookmark added",
            bookmark: newBookmark,
        });
    } catch (err) {
        console.error("Error in toggleBookmark:", err);
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
};

/**
 * GET /api/bookmarks
 * List user's bookmarks with optional type and subjectId filtering.
 */
export const getBookmarks = async (req, res) => {
    const studentId = req.user.id;
    const { type, subjectId, page = 1, limit = 50 } = req.query;

    const skip = (Math.max(1, parseInt(page, 10)) - 1) * Math.min(100, parseInt(limit, 10));
    const take = Math.min(100, Math.max(1, parseInt(limit, 10)));

    try {
        const where = {
            studentId,
            ...(type && { type }),
            ...(subjectId && { subjectId }),
        };

        const [total, bookmarks] = await Promise.all([
            prisma.bookmark.count({ where }),
            prisma.bookmark.findMany({
                where,
                skip,
                take,
                orderBy: { createdAt: "desc" },
            }),
        ]);

        return res.json({
            total,
            page: parseInt(page, 10),
            limit: take,
            bookmarks,
        });
    } catch (err) {
        console.error("Error in getBookmarks:", err);
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
};

/**
 * GET /api/bookmarks/check
 * Check if a specific item is bookmarked by the student.
 * Query: ?type=EXAM_QUESTION&itemId=...
 */
export const checkBookmark = async (req, res) => {
    const studentId = req.user.id;
    const { type = "EXAM_QUESTION", itemId } = req.query;

    if (!itemId) {
        return res.status(400).json({ message: "itemId is required" });
    }

    try {
        const bookmark = await prisma.bookmark.findUnique({
            where: {
                studentId_type_itemId: {
                    studentId,
                    type,
                    itemId,
                },
            },
        });

        return res.json({
            isBookmarked: Boolean(bookmark),
            bookmark: bookmark || null,
        });
    } catch (err) {
        console.error("Error in checkBookmark:", err);
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
};

/**
 * DELETE /api/bookmarks/:id
 * Delete a bookmark by ID.
 */
export const deleteBookmark = async (req, res) => {
    const studentId = req.user.id;
    const { id } = req.params;

    try {
        const existing = await prisma.bookmark.findUnique({
            where: { id },
        });

        if (!existing || existing.studentId !== studentId) {
            return res.status(404).json({ message: "Bookmark not found" });
        }

        await prisma.bookmark.delete({ where: { id } });
        return res.json({ message: "Bookmark removed successfully" });
    } catch (err) {
        console.error("Error in deleteBookmark:", err);
        return res.status(500).json({ message: "Server error", detail: err.message });
    }
};

