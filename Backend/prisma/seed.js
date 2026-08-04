import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean existing data
    await prisma.quizAnswer.deleteMany();
    await prisma.quizAttempt.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.questionOption.deleteMany();
    await prisma.question.deleteMany();
    await prisma.quiz.deleteMany();
    await prisma.lessonContent.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.topic.deleteMany();
    await prisma.chapter.deleteMany();
    await prisma.course.deleteMany();
    await prisma.studentProfile.deleteMany();
    await prisma.user.deleteMany();

    console.log('🧹 Cleaned existing data');

    // ============================================================
    // 1. CREATE CONTENT MANAGER (ADMIN)
    // ============================================================
    const adminHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            email: 'admin@kuta.com',
            passwordHash: adminHash,
            role: 'CONTENT_MANAGER',
        },
    });
    console.log('👤 Admin created: admin@kuta.com / admin123');

    // ============================================================
    // 2. CREATE SAMPLE STUDENTS
    // ============================================================
    const studentHash = await bcrypt.hash('student123', 10);

    await prisma.user.create({
        data: {
            email: 'abebe@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Abebe', gradeLevel: 1 },
            },
        },
    });

    await prisma.user.create({
        data: {
            email: 'sara@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Sara', gradeLevel: 2 },
            },
        },
    });

    await prisma.user.create({
        data: {
            email: 'dawit@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Dawit', gradeLevel: 3 },
            },
        },
    });

    console.log('👧 Students created: abebe@kuta.com, sara@kuta.com, dawit@kuta.com (password: student123)');

    console.log('\n✅ Seeding complete!');
    console.log('====================================');
    console.log('📧 Admin Login:   admin@kuta.com / admin123');
    console.log('📧 Student Login: abebe@kuta.com / student123');
    console.log('📧 Student Login: sara@kuta.com  / student123');
    console.log('📧 Student Login: dawit@kuta.com / student123');
    console.log('====================================');
    console.log('📚 No courses, lessons, topics, quizzes, or mock exams seeded.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
