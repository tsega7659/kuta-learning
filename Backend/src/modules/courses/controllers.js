import { prisma } from "../../prisma.js";

// === PUBLIC ===
export const getAllCourses = async (req, res) => {
    try {
        const courses = await prisma.course.findMany({
            orderBy: { createdAt: "desc" },
        });
        res.json(courses);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const getCourseById = async (req, res) => {
    const { id } = req.params;
    try {
        const course = await prisma.course.findUnique({
            where: { id },
            include: { chapters: { orderBy: { order: "asc" } } },
        });
        if (!course) return res.status(404).json({ message: "Course not found" });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// === CONTENT MANAGER ===
export const createCourse = async (req, res) => {
    const { title, description, coverImage, gradeLevel } = req.body;
    try {
        const course = await prisma.course.create({
            data: { title, description, coverImage, gradeLevel: parseInt(gradeLevel) },
        });
        res.status(201).json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error", error: err.message });
    }
};

export const updateCourse = async (req, res) => {
    const { id } = req.params;
    const { title, description, coverImage, gradeLevel } = req.body;
    try {
        const course = await prisma.course.update({
            where: { id },
            data: { title, description, coverImage, gradeLevel: parseInt(gradeLevel) },
        });
        res.json(course);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

export const deleteCourse = async (req, res) => {
    const { id } = req.params;
    try {
        await prisma.course.delete({ where: { id } });
        res.json({ message: "Course deleted successfully" });
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
