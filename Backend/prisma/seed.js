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
    const admin = await prisma.user.create({
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

    const student1 = await prisma.user.create({
        data: {
            email: 'abebe@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Abebe', gradeLevel: 1 },
            },
        },
    });

    const student2 = await prisma.user.create({
        data: {
            email: 'sara@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Sara', gradeLevel: 2 },
            },
        },
    });

    const student3 = await prisma.user.create({
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

    // ============================================================
    // 3. CREATE COURSES
    // ============================================================

    // --- Course 1: English Adventure ---
    const englishCourse = await prisma.course.create({
        data: {
            title: 'English Adventure',
            description: 'Master the alphabet, colors, and basic words in this fun journey!',
            gradeLevel: 1,
            coverImage: null,
        },
    });

    // Chapter 1: The Alphabet
    const ch1 = await prisma.chapter.create({
        data: { courseId: englishCourse.id, title: 'The Alphabet', order: 1 },
    });

    const topic1_1 = await prisma.topic.create({
        data: { chapterId: ch1.id, title: 'Letters A - F', order: 1 },
    });

    const lesson1_1_1 = await prisma.lesson.create({
        data: { topicId: topic1_1.id, title: 'Meet Letter A', description: 'Learn the letter A and words that start with A', order: 1 },
    });
    await prisma.lessonContent.create({
        data: { lessonId: lesson1_1_1.id, type: 'TEXT', content: '# Meet the Letter A! 🅰️\n\nA is the first letter of the alphabet.\n\n**Words that start with A:**\n- 🍎 Apple\n- 🐜 Ant\n- ✈️ Airplane\n\nCan you say "A" out loud?', order: 1 },
    });

    const lesson1_1_2 = await prisma.lesson.create({
        data: { topicId: topic1_1.id, title: 'Meet Letter B', description: 'Learn the letter B and words that start with B', order: 2 },
    });
    await prisma.lessonContent.create({
        data: { lessonId: lesson1_1_2.id, type: 'TEXT', content: '# Meet the Letter B! 🅱️\n\nB is the second letter.\n\n**Words that start with B:**\n- 🏐 Ball\n- 🦋 Butterfly\n- 🍌 Banana\n\nGreat job learning B!', order: 1 },
    });

    // Quiz for topic1_1
    const quiz1 = await prisma.quiz.create({
        data: {
            topicId: topic1_1.id,
            title: 'Alphabet Quiz: A-F',
            description: 'Show what you know about the first six letters of the alphabet!',
            passingScore: 60,
        },
    });
    await prisma.question.create({
        data: {
            quizId: quiz1.id, type: 'SINGLE_CHOICE', text: 'Which word starts with the letter A?', explanation: 'Apple starts with the letter A.', order: 1,
            options: {
                create: [
                    { text: 'Apple', isCorrect: true, order: 1 },
                    { text: 'Ball', isCorrect: false, order: 2 },
                    { text: 'Cat', isCorrect: false, order: 3 },
                    { text: 'Dog', isCorrect: false, order: 4 },
                ],
            },
        },
    });
    await prisma.question.create({
        data: {
            quizId: quiz1.id, type: 'SINGLE_CHOICE', text: 'Which letter comes after A?', explanation: 'The alphabet order is A, B, C, D...', order: 2,
            options: {
                create: [
                    { text: 'C', isCorrect: false, order: 1 },
                    { text: 'B', isCorrect: true, order: 2 },
                    { text: 'D', isCorrect: false, order: 3 },
                    { text: 'E', isCorrect: false, order: 4 },
                ],
            },
        },
    });
    await prisma.question.create({
        data: {
            quizId: quiz1.id, type: 'TRUE_FALSE', text: 'The letter F comes after the letter E.', explanation: 'Yes! E comes before F in the alphabet.', order: 3,
            options: {
                create: [
                    { text: 'True', isCorrect: true, order: 1 },
                    { text: 'False', isCorrect: false, order: 2 },
                    { text: 'Maybe', isCorrect: false, order: 3 },
                    { text: 'Not sure', isCorrect: false, order: 4 },
                ],
            },
        },
    });

    // Chapter 2: Colors
    const ch2 = await prisma.chapter.create({
        data: { courseId: englishCourse.id, title: 'Colors', order: 2 },
    });

    const topic2_1 = await prisma.topic.create({
        data: { chapterId: ch2.id, title: 'All About Blue', order: 1 },
    });

    const lesson2_1_1 = await prisma.lesson.create({
        data: { topicId: topic2_1.id, title: 'The Color Blue', description: 'Learn about the color blue', order: 1 },
    });
    await prisma.lessonContent.create({
        data: { lessonId: lesson2_1_1.id, type: 'TEXT', content: '# The Color Blue! 💙\n\nBlue is the color of the sky and the ocean.\n\n**Blue things:**\n- 🦋 Blue butterfly\n- 🫐 Blueberries\n- 🐦 Blue bird\n\nLook around! Can you find something blue?', order: 1 },
    });

    const topic2_2 = await prisma.topic.create({
        data: { chapterId: ch2.id, title: 'All About Red', order: 2 },
    });

    const lesson2_2_1 = await prisma.lesson.create({
        data: { topicId: topic2_2.id, title: 'The Color Red', description: 'Learn about the color red', order: 1 },
    });
    await prisma.lessonContent.create({
        data: { lessonId: lesson2_2_1.id, type: 'TEXT', content: '# The Color Red! ❤️\n\nRed is a warm, bright color.\n\n**Red things:**\n- 🍎 Red apple\n- 🌹 Red rose\n- 🚗 Red car\n\nRed means stop at a traffic light!', order: 1 },
    });

    // Chapter 3: Animals
    const ch3 = await prisma.chapter.create({
        data: { courseId: englishCourse.id, title: 'Animals', order: 3 },
    });

    const topic3_1 = await prisma.topic.create({
        data: { chapterId: ch3.id, title: 'Farm Animals', order: 1 },
    });

    await prisma.lesson.create({
        data: { topicId: topic3_1.id, title: 'Cows and Chickens', description: 'Learn about farm animals', order: 1 },
    });

    console.log('📘 English Adventure course created with 3 chapters, topics, lessons, and a quiz');

    // --- Course 2: Math Magic ---
    const mathCourse = await prisma.course.create({
        data: {
            title: 'Math Magic',
            description: 'Numbers, counting, and basic addition for young learners!',
            gradeLevel: 1,
            coverImage: null,
        },
    });

    const mathCh1 = await prisma.chapter.create({
        data: { courseId: mathCourse.id, title: 'Numbers 1-10', order: 1 },
    });

    const mathTopic1 = await prisma.topic.create({
        data: { chapterId: mathCh1.id, title: 'Counting 1-5', order: 1 },
    });

    await prisma.lesson.create({
        data: { topicId: mathTopic1.id, title: 'Count to 5', description: 'Learn to count from 1 to 5', order: 1 },
    });
    await prisma.lesson.create({
        data: { topicId: mathTopic1.id, title: 'Number Shapes', description: 'Learn what numbers look like', order: 2 },
    });

    const mathQuiz1 = await prisma.quiz.create({
        data: { topicId: mathTopic1.id, title: 'Counting Quiz', passingScore: 50 },
    });
    await prisma.question.create({
        data: {
            quizId: mathQuiz1.id, type: 'SINGLE_CHOICE', text: 'What comes after 3?', order: 1,
            options: {
                create: [
                    { text: '2', isCorrect: false, order: 1 },
                    { text: '4', isCorrect: true, order: 2 },
                    { text: '5', isCorrect: false, order: 3 },
                ],
            },
        },
    });

    const mathTopic2 = await prisma.topic.create({
        data: { chapterId: mathCh1.id, title: 'Counting 6-10', order: 2 },
    });
    await prisma.lesson.create({
        data: { topicId: mathTopic2.id, title: 'Count to 10', description: 'Learn numbers 6 through 10', order: 1 },
    });

    const mathCh2 = await prisma.chapter.create({
        data: { courseId: mathCourse.id, title: 'Basic Addition', order: 2 },
    });

    const mathTopic3 = await prisma.topic.create({
        data: { chapterId: mathCh2.id, title: 'Adding Small Numbers', order: 1 },
    });
    await prisma.lesson.create({
        data: { topicId: mathTopic3.id, title: '1 + 1 = ?', description: 'Your first addition!', order: 1 },
    });

    console.log('🔢 Math Magic course created with 2 chapters');

    // --- Course 3: Science Safari ---
    const scienceCourse = await prisma.course.create({
        data: {
            title: 'Science Safari',
            description: 'Explore plants, animals, and the world around you!',
            gradeLevel: 2,
            coverImage: null,
        },
    });

    const sciCh1 = await prisma.chapter.create({
        data: { courseId: scienceCourse.id, title: 'Plants', order: 1 },
    });
    const sciTopic1 = await prisma.topic.create({
        data: { chapterId: sciCh1.id, title: 'Parts of a Plant', order: 1 },
    });
    await prisma.lesson.create({
        data: { topicId: sciTopic1.id, title: 'Roots and Stems', description: 'Learn about roots and stems', order: 1 },
    });
    await prisma.lesson.create({
        data: { topicId: sciTopic1.id, title: 'Leaves and Flowers', description: 'Learn about leaves and flowers', order: 2 },
    });

    console.log('🌿 Science Safari course created');

    // --- Course 4: Art Studio ---
    const artCourse = await prisma.course.create({
        data: {
            title: 'Art Studio',
            description: 'Draw, paint, and create beautiful art!',
            gradeLevel: 1,
            coverImage: null,
        },
    });

    const artCh1 = await prisma.chapter.create({
        data: { courseId: artCourse.id, title: 'Drawing Basics', order: 1 },
    });
    const artTopic1 = await prisma.topic.create({
        data: { chapterId: artCh1.id, title: 'Lines and Shapes', order: 1 },
    });
    await prisma.lesson.create({
        data: { topicId: artTopic1.id, title: 'Straight Lines', description: 'Practice drawing straight lines', order: 1 },
    });
    await prisma.lesson.create({
        data: { topicId: artTopic1.id, title: 'Circles and Squares', description: 'Learn to draw basic shapes', order: 2 },
    });

    console.log('🎨 Art Studio course created');

    // ============================================================
    // 4. ADD SOME LESSON PROGRESS FOR STUDENT 1
    // ============================================================
    await prisma.lessonProgress.create({
        data: { studentId: student1.id, lessonId: lesson1_1_1.id, completed: true },
    });
    await prisma.lessonProgress.create({
        data: { studentId: student1.id, lessonId: lesson1_1_2.id, completed: true },
    });

    console.log('📊 Sample lesson progress added for Abebe');

    console.log('\n✅ Seeding complete!');
    console.log('====================================');
    console.log('📧 Admin Login:   admin@kuta.com / admin123');
    console.log('📧 Student Login: abebe@kuta.com / student123');
    console.log('📧 Student Login: sara@kuta.com  / student123');
    console.log('📧 Student Login: dawit@kuta.com / student123');
    console.log('====================================');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
