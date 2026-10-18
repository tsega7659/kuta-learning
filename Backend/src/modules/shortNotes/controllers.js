import { prisma } from "../../prisma.js";

// Helper to determine student's effective grade and stream
const getStudentContext = async (req) => {
    let gradeLevel = req.query.gradeLevel ? parseInt(req.query.gradeLevel, 10) : null;
    let stream = req.query.stream ? req.query.stream.toUpperCase() : null;

    if (req.user && req.user.role === "STUDENT") {
        const profile = await prisma.studentProfile.findUnique({
            where: { userId: req.user.id }
        });
        if (profile) {
            if (!gradeLevel) gradeLevel = profile.gradeLevel;
            if (!stream) stream = profile.stream;
        }
    }

    return { gradeLevel: gradeLevel || 12, stream: stream || "NATURAL" };
};

// ── GET /api/short-notes/subjects ─────────────────────────────────────────────
// Screen 7: List of subjects for short notes
export const getShortNotesSubjects = async (req, res) => {
    try {
        const { gradeLevel, stream } = await getStudentContext(req);

        // Grade 12 students access High School curriculum (Grades 9, 10, 11, 12)
        // Grade 6 or 8 students access their specific primary curriculum
        const targetGradeLevels = gradeLevel === 12 ? [9, 10, 11, 12] : [gradeLevel];
        const curriculumType = gradeLevel === 12 ? "High School Curriculum" : "Primary School Curriculum";

        const subjects = await prisma.examSubject.findMany({
            where: {
                gradeLevels: { hasSome: targetGradeLevels },
                OR: [
                    { stream: null },
                    { stream: "COMMON" },
                    { stream: stream }
                ]
            },
            orderBy: { order: "asc" },
            include: {
                chapters: {
                    where: {
                        gradeLevel: { in: targetGradeLevels },
                        OR: [
                            { stream: null },
                            { stream: "COMMON" },
                            { stream: stream }
                        ]
                    },
                    select: { id: true, gradeLevel: true }
                }
            }
        });

        const formatted = subjects.map(sub => {
            const totalChapters = sub.chapters.length;
            const gradeBadge = gradeLevel === 12 ? "Grades 9-12" : `Grade ${gradeLevel}`;

            return {
                id: sub.id,
                name: sub.name,
                code: sub.code,
                stream: sub.stream,
                description: sub.description,
                icon: sub.icon,
                color: sub.color,
                gradeBadge,
                curriculumType,
                totalChapters,
                availableGrades: gradeLevel === 12 ? [9, 10, 11, 12] : [gradeLevel],
            };
        });

        res.json({
            curriculumType,
            studentGrade: gradeLevel,
            stream,
            subjects: formatted
        });
    } catch (err) {
        console.error("Error in getShortNotesSubjects:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── GET /api/short-notes/subjects/:subjectId ──────────────────────────────────
// Screen 8: Notes overview for a subject
// If grade 6 or 8: directly returns chapters
// If grade 12: returns available grades [9, 10, 11, 12] and chapters for the active grade (default grade 12 or query ?grade=X)
export const getSubjectNoteDetails = async (req, res) => {
    const { subjectId } = req.params;
    const studentId = req.user?.id;

    try {
        const { gradeLevel: studentGrade, stream } = await getStudentContext(req);

        const subject = await prisma.examSubject.findUnique({
            where: { id: subjectId }
        });

        if (!subject) {
            return res.status(404).json({ message: "Subject not found" });
        }

        // Determine available grades and whether grade selection UI should be shown
        let availableGrades = [];
        let requiresGradeSelection = false;
        let selectedGrade = studentGrade;

        if (studentGrade === 12) {
            // High school entrance exam prep spans Grades 9, 10, 11, and 12
            availableGrades = [9, 10, 11, 12];
            requiresGradeSelection = true;
            // Allow caller to pass ?grade=10, default to 12
            if (req.query.grade) {
                const requestedGrade = parseInt(req.query.grade, 10);
                if (availableGrades.includes(requestedGrade)) {
                    selectedGrade = requestedGrade;
                }
            }
        } else {
            // For Grade 6 or Grade 8
            availableGrades = [studentGrade];
            requiresGradeSelection = false;
            selectedGrade = studentGrade;
        }

        // Fetch chapters for the selected grade
        const chapters = await prisma.noteChapter.findMany({
            where: {
                subjectId,
                gradeLevel: selectedGrade,
                OR: [
                    { stream: null },
                    { stream: "COMMON" },
                    { stream: stream }
                ]
            },
            orderBy: { order: "asc" },
            include: {
                progress: studentId ? {
                    where: { studentId },
                    take: 1
                } : false
            }
        });

        // Compute total chapter bundle download info
        const totalSizeMB = (chapters.length * 5.2).toFixed(1); // Approximate or calculate

        const formattedChapters = chapters.map(ch => {
            const prog = ch.progress?.[0];
            return {
                id: ch.id,
                title: ch.title,
                subtitle: ch.subtitle,
                description: ch.description,
                order: ch.order,
                gradeLevel: ch.gradeLevel,
                stream: ch.stream,
                pdfUrl: ch.pdfUrl,
                fileSize: ch.fileSize || "4.5 MB",
                isPremium: ch.isPremium,
                isRead: prog?.isRead || false,
                readPercentage: prog?.readPercentage || 0,
            };
        });

        res.json({
            subject: {
                id: subject.id,
                name: subject.name,
                code: subject.code,
                stream: subject.stream,
                description: subject.description,
            },
            studentGrade,
            selectedGrade,
            requiresGradeSelection,
            availableGrades,
            totalChapters: formattedChapters.length,
            downloadAllUrl: `/api/short-notes/subjects/${subject.id}/download-all?grade=${selectedGrade}`,
            downloadAllSize: `${totalSizeMB} MB`,
            chapters: formattedChapters
        });
    } catch (err) {
        console.error("Error in getSubjectNoteDetails:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── GET /api/short-notes/chapters/:chapterId ──────────────────────────────────
// Screen 9: Lesson Detail / Reading Chapter Notes
export const getChapterDetail = async (req, res) => {
    const { chapterId } = req.params;
    const studentId = req.user?.id;

    try {
        const chapter = await prisma.noteChapter.findUnique({
            where: { id: chapterId },
            include: {
                subject: {
                    select: { id: true, name: true, code: true, color: true }
                },
                progress: studentId ? {
                    where: { studentId },
                    take: 1
                } : false
            }
        });

        if (!chapter) {
            return res.status(404).json({ message: "Chapter note not found" });
        }

        // Check premium status
        if (chapter.isPremium) {
            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId: studentId }
            });
            if (!studentProfile?.isPremium) {
                return res.status(403).json({
                    message: "This chapter note is for premium subscribers only.",
                    isPremiumRequired: true
                });
            }
        }

        const prog = chapter.progress?.[0];

        res.json({
            id: chapter.id,
            title: chapter.title,
            subtitle: chapter.subtitle,
            description: chapter.description,
            gradeLevel: chapter.gradeLevel,
            stream: chapter.stream,
            subject: chapter.subject,
            learningObjectives: chapter.learningObjectives || [],
            content: chapter.content || "",
            resources: chapter.resources || [],
            pdfUrl: chapter.pdfUrl,
            fileSize: chapter.fileSize,
            isPremium: chapter.isPremium,
            readProgress: {
                isRead: prog?.isRead || false,
                readPercentage: prog?.readPercentage || 0,
                completedAt: prog?.completedAt || null,
            }
        });
    } catch (err) {
        console.error("Error in getChapterDetail:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── POST /api/short-notes/chapters/:chapterId/progress ─────────────────────────
// Update reading progress for a chapter
export const updateChapterReadProgress = async (req, res) => {
    const { chapterId } = req.params;
    const { readPercentage = 100, isRead = true } = req.body;
    const studentId = req.user.id;

    try {
        const chapter = await prisma.noteChapter.findUnique({
            where: { id: chapterId }
        });
        if (!chapter) {
            return res.status(404).json({ message: "Chapter not found" });
        }

        const parsedPercentage = Math.min(100, Math.max(0, parseInt(readPercentage, 10)));
        const markedRead = Boolean(isRead || parsedPercentage >= 100);

        const progress = await prisma.noteProgress.upsert({
            where: {
                studentId_chapterId: {
                    studentId,
                    chapterId
                }
            },
            update: {
                readPercentage: parsedPercentage,
                isRead: markedRead,
                completedAt: markedRead ? new Date() : null,
            },
            create: {
                studentId,
                chapterId,
                readPercentage: parsedPercentage,
                isRead: markedRead,
                completedAt: markedRead ? new Date() : null,
            }
        });

        res.json({
            message: "Reading progress updated",
            progress
        });
    } catch (err) {
        console.error("Error in updateChapterReadProgress:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── GET /api/short-notes/chapters/:chapterId/download ─────────────────────────
export const downloadChapterPdf = async (req, res) => {
    const { chapterId } = req.params;
    try {
        const chapter = await prisma.noteChapter.findUnique({
            where: { id: chapterId },
            select: { id: true, title: true, pdfUrl: true, isPremium: true }
        });

        if (!chapter) {
            return res.status(404).json({ message: "Chapter note not found" });
        }

        if (chapter.isPremium) {
            const studentProfile = await prisma.studentProfile.findUnique({
                where: { userId: req.user.id }
            });
            if (!studentProfile?.isPremium) {
                return res.status(403).json({
                    message: "Download is only available to premium subscribers.",
                    isPremiumRequired: true
                });
            }
        }

        // Return download URL or redirect
        if (chapter.pdfUrl) {
            return res.json({ downloadUrl: chapter.pdfUrl, filename: `${chapter.title}.pdf` });
        }

        res.json({
            downloadUrl: `/uploads/notes/${chapter.id}.pdf`,
            filename: `${chapter.title}.pdf`
        });
    } catch (err) {
        console.error("Error in downloadChapterPdf:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};

// ── Content Manager CRUD ──────────────────────────────────────────────────────
export const createNoteChapter = async (req, res) => {
    const {
        subjectId,
        gradeLevel,
        stream,
        title,
        subtitle,
        description,
        order,
        pdfUrl,
        fileSize,
        content,
        learningObjectives,
        resources,
        isPremium
    } = req.body;

    try {
        const chapter = await prisma.noteChapter.create({
            data: {
                subjectId,
                gradeLevel: parseInt(gradeLevel, 10),
                stream: stream || null,
                title,
                subtitle,
                description,
                order: order ?? 0,
                pdfUrl,
                fileSize,
                content,
                learningObjectives: Array.isArray(learningObjectives) ? learningObjectives : [],
                resources: resources || [],
                isPremium: Boolean(isPremium)
            }
        });
        res.status(201).json(chapter);
    } catch (err) {
        console.error("Error in createNoteChapter:", err);
        res.status(500).json({ message: "Server error", detail: err.message });
    }
};
