import { prisma } from "../../prisma.js";

// GET /api/students
export const getAllStudents = async (req, res) => {
    try {
        const students = await prisma.user.findMany({
            where: { role: "STUDENT" },
            include: {
                studentProfile: true,
                _count: {
                    select: { lessonProgress: true, quizAttempts: true }
                }
            }
        });

        // Strip out hashed passwords
        const safeStudents = students.map(({ passwordHash, ...rest }) => rest);
        res.json(safeStudents);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};

// GET /api/students/:id
export const getStudentDetails = async (req, res) => {
    const { id } = req.params;
    try {
        const student = await prisma.user.findUnique({
            where: { id },
            include: {
                studentProfile: true,
                lessonProgress: {
                    include: { lesson: true }
                },
                quizAttempts: {
                    include: { quiz: true },
                    orderBy: { createdAt: "desc" }
                }
            }
        });

        if (!student || student.role !== "STUDENT") {
            return res.status(404).json({ message: "Student not found" });
        }

        const { passwordHash, ...safeStudent } = student;
        res.json(safeStudent);
    } catch (err) {
        res.status(500).json({ message: "Server error" });
    }
};
