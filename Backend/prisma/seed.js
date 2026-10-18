import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    // Clean existing data in dependency order
    await prisma.nationalExamAnswer.deleteMany();
    await prisma.nationalExamAttempt.deleteMany();
    await prisma.examQuestionOption.deleteMany();
    await prisma.examQuestion.deleteMany();
    await prisma.nationalExam.deleteMany();
    await prisma.noteProgress.deleteMany();
    await prisma.noteChapter.deleteMany();
    await prisma.examSubject.deleteMany();

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

    console.log('✔ Cleaned existing data');

    // 1. CREATE CONTENT MANAGER (ADMIN)
    const adminHash = await bcrypt.hash('admin123', 10);
    await prisma.user.create({
        data: {
            email: 'admin@kuta.com',
            passwordHash: adminHash,
            role: 'CONTENT_MANAGER',
        },
    });
    console.log('✔ Admin created: admin@kuta.com / admin123');

    // 2. CREATE KIDS APP SAMPLE STUDENTS
    const studentHash = await bcrypt.hash('student123', 10);

    await prisma.user.create({
        data: {
            email: 'abebe@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Abebe', gradeLevel: 1, onboardingCompleted: true },
            },
        },
    });

    await prisma.user.create({
        data: {
            email: 'sara@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: { name: 'Sara', gradeLevel: 2, onboardingCompleted: true },
            },
        },
    });

    // 3. CREATE GRADE 6, 8, & 12 STUDENTS (FROM FIGMA DESIGN)
    // Ruth (Grade 12, Natural Science Stream, seen in Figma dashboard)
    const ruthUser = await prisma.user.create({
        data: {
            email: 'ruth@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: {
                    name: 'Ruth',
                    gradeLevel: 12,
                    stream: 'NATURAL',
                    isPremium: true,
                    onboardingCompleted: true,
                },
            },
        },
    });

    // Helen (Grade 8)
    await prisma.user.create({
        data: {
            email: 'helen@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: {
                    name: 'Helen',
                    gradeLevel: 8,
                    stream: null,
                    isPremium: false,
                    onboardingCompleted: true,
                },
            },
        },
    });

    // Natnael (Grade 6)
    await prisma.user.create({
        data: {
            email: 'natnael@kuta.com',
            passwordHash: studentHash,
            role: 'STUDENT',
            studentProfile: {
                create: {
                    name: 'Natnael',
                    gradeLevel: 6,
                    stream: null,
                    isPremium: false,
                    onboardingCompleted: true,
                },
            },
        },
    });

    console.log('✔ Students created: ruth@kuta.com (Grade 12), helen@kuta.com (Grade 8), natnael@kuta.com (Grade 6)');

    // 4. CREATE HIGH SCHOOL & PRIMARY SUBJECTS (AS SHOWN IN FIGMA)
    const mathSub = await prisma.examSubject.create({
        data: {
            name: 'Mathematics',
            code: 'MATH',
            gradeLevels: [6, 8, 9, 10, 11, 12],
            stream: 'NATURAL',
            description: 'NATURAL SCIENCE STREAM, Official National University Entrance Papers',
            subcategories: 'CALCULUS, ALGEBRA & VECTORS',
            icon: 'calculator',
            color: '#3B82F6',
            order: 1,
        },
    });

    const physicsSub = await prisma.examSubject.create({
        data: {
            name: 'Physics',
            code: 'PHYS',
            gradeLevels: [9, 10, 11, 12],
            stream: 'NATURAL',
            description: 'ELECTRICITY, OPTICS & MODERN PHYSICS',
            subcategories: 'ELECTRICITY, OPTICS & MODERN PHYSICS',
            icon: 'atom',
            color: '#F59E0B',
            order: 2,
        },
    });

    const chemSub = await prisma.examSubject.create({
        data: {
            name: 'Chemistry',
            code: 'CHEM',
            gradeLevels: [9, 10, 11, 12],
            stream: 'NATURAL',
            description: 'ORGANIC, PHYSICAL & GENERAL',
            subcategories: 'ORGANIC, PHYSICAL & GENERAL',
            icon: 'flask',
            color: '#10B981',
            order: 3,
        },
    });

    const bioSub = await prisma.examSubject.create({
        data: {
            name: 'Biology',
            code: 'BIO',
            gradeLevels: [9, 10, 11, 12],
            stream: 'NATURAL',
            description: 'GENETICS, ECOLOGY & CELL BIOLOGY',
            subcategories: 'GENETICS, ECOLOGY & CELL BIOLOGY',
            icon: 'dna',
            color: '#8B5CF6',
            order: 4,
        },
    });

    const englishSub = await prisma.examSubject.create({
        data: {
            name: 'English',
            code: 'ENG',
            gradeLevels: [6, 8, 9, 10, 11, 12],
            stream: 'COMMON',
            description: 'READING, GRAMMAR & VOCABULARY',
            subcategories: 'READING, GRAMMAR & VOCABULARY',
            icon: 'book-open',
            color: '#EC4899',
            order: 5,
        },
    });

    const civicsSub = await prisma.examSubject.create({
        data: {
            name: 'Civics & Ethical Education',
            code: 'CIV',
            gradeLevels: [6, 8, 9, 10, 11, 12],
            stream: 'COMMON',
            description: 'CONSTITUTION, DEMOCRACY & CITIZENSHIP',
            subcategories: 'CONSTITUTION, DEMOCRACY & CITIZENSHIP',
            icon: 'shield-check',
            color: '#06B6D4',
            order: 6,
        },
    });

    // Social science subjects
    await prisma.examSubject.create({
        data: {
            name: 'History',
            code: 'HIST',
            gradeLevels: [9, 10, 11, 12],
            stream: 'SOCIAL',
            description: 'WORLD HISTORY & ETHIOPIAN STUDIES',
            subcategories: 'MODERN HISTORY & REVOLUTIONS',
            icon: 'landmark',
            color: '#D97706',
            order: 7,
        },
    });

    await prisma.examSubject.create({
        data: {
            name: 'Geography',
            code: 'GEOG',
            gradeLevels: [9, 10, 11, 12],
            stream: 'SOCIAL',
            description: 'PHYSICAL & HUMAN GEOGRAPHY OF ETHIOPIA & HORN',
            subcategories: 'CARTOGRAPHY & POPULATION DYNAMICS',
            icon: 'globe',
            color: '#059669',
            order: 8,
        },
    });

    console.log('✔ Subjects created for Grade 12 and Primary levels');

    // 5. CREATE NATIONAL EXAMS FOR MATHEMATICS (YEARS 2023, 2022, 2021, 2020, 2019)
    const years = [2023, 2022, 2021, 2020, 2019];
    const mathExams = [];

    for (let i = 0; i < years.length; i++) {
        const yr = years[i];
        const isPrem = yr < 2022; // 2023 and 2022 free, older are premium
        const exam = await prisma.nationalExam.create({
            data: {
                subjectId: mathSub.id,
                title: `${yr} National Exam`,
                year: yr,
                gradeLevel: 12,
                stream: 'NATURAL',
                durationMinutes: 120,
                passingScore: 50,
                isPremium: isPrem,
                order: i + 1,
            },
        });
        mathExams.push(exam);
    }

    // 6. POPULATE 2023 NATIONAL EXAM QUESTIONS (AS SHOWN IN FIGMA EXAM TAKE & RESULT SCREENS)
    const exam2023 = mathExams[0];

    const q1 = await prisma.examQuestion.create({
        data: {
            examId: exam2023.id,
            order: 14,
            text: 'Let f(x) = (3x^2 - 4x + 9)/(x - 2). If f(x) is continuous at x = 2, what is the exact value of the limit: lim_{x->2} (f(x) - f(1))/(x - 1)?',
            explanation: 'Evaluating the difference quotient and applying continuity at x = 2 gives the value 3.',
            options: {
                create: [
                    { text: 'A. 3', isCorrect: true, order: 1 },
                    { text: 'B. 6', isCorrect: false, order: 2 },
                    { text: 'C. -2', isCorrect: false, order: 3 },
                    { text: 'D. Does not exist', isCorrect: false, order: 4 },
                ],
            },
        },
    });

    const q2 = await prisma.examQuestion.create({
        data: {
            examId: exam2023.id,
            order: 15,
            text: 'Find the angle in radians between the vectors u = (1, √3) and the horizontal line y = 0.',
            explanation: 'The angle is given by arctan(√3 / 1) = π/3 rad = 60°.',
            options: {
                create: [
                    { text: 'A. 30°', isCorrect: false, order: 1 },
                    { text: 'B. 60°', isCorrect: true, order: 2 },
                    { text: 'C. 45°', isCorrect: false, order: 3 },
                    { text: 'D. 90°', isCorrect: false, order: 4 },
                ],
            },
        },
    });

    const q3 = await prisma.examQuestion.create({
        data: {
            examId: exam2023.id,
            order: 17,
            text: 'If f\'(x) = 12x^2 + 6x - 2 and f(0) = 4, what is the value of f(2)?',
            explanation: 'Integrating f\'(x) gives f(x) = 4x^3 + 3x^2 - 2x + C. Since f(0)=4, C=4. Thus f(2) = 4(8) + 3(4) - 2(2) + 4 = 32 + 12 - 4 + 4 = 44.',
            options: {
                create: [
                    { text: 'A. 52', isCorrect: false, order: 1 },
                    { text: 'B. 44', isCorrect: true, order: 2 },
                    { text: 'C. 48', isCorrect: false, order: 3 },
                    { text: 'D. 36', isCorrect: false, order: 4 },
                ],
            },
        },
    });

    // Also create 2023 Physics National Exam (Banner exam in Figma)
    const physics2023 = await prisma.nationalExam.create({
        data: {
            subjectId: physicsSub.id,
            title: '2023 National Exam',
            year: 2023,
            gradeLevel: 12,
            stream: 'NATURAL',
            durationMinutes: 120,
            passingScore: 50,
            isPremium: false,
            order: 1,
        },
    });

    await prisma.examQuestion.create({
        data: {
            examId: physics2023.id,
            order: 1,
            text: 'A block of mass 2 kg is pulled with a constant force of 10 N across a frictionless surface. What is its acceleration?',
            explanation: 'Using Newton\'s second law: F = ma => a = F/m = 10 N / 2 kg = 5 m/s².',
            options: {
                create: [
                    { text: 'A. 5 m/s²', isCorrect: true, order: 1 },
                    { text: 'B. 10 m/s²', isCorrect: false, order: 2 },
                    { text: 'C. 20 m/s²', isCorrect: false, order: 3 },
                    { text: 'D. 2.5 m/s²', isCorrect: false, order: 4 },
                ],
            },
        },
    });

    // 7. CREATE AN ATTEMPT FOR RUTH (FIGMA RESULT SCREEN: 78/100, 78% ACCURACY)
    await prisma.nationalExamAttempt.create({
        data: {
            studentId: ruthUser.id,
            examId: exam2023.id,
            status: 'SUBMITTED',
            score: 78,
            maxScore: 100,
            correctAnswers: 78,
            incorrectAnswers: 22,
            accuracyPercentage: 78.0,
            passed: true,
            startedAt: new Date(Date.now() - 3600 * 1000 * 2),
            submittedAt: new Date(Date.now() - 3600 * 1000),
        },
    });

    // Create an in-progress attempt for Physics to trigger the "Resume Exam" banner seen in Figma!
    await prisma.nationalExamAttempt.create({
        data: {
            studentId: ruthUser.id,
            examId: physics2023.id,
            status: 'IN_PROGRESS',
            maxScore: 100,
            timeRemainingSeconds: 41 * 60 + 26, // "00:41:26 Remaining" from screen 5
            startedAt: new Date(),
        },
    });

    console.log('✔ Sample national exams & Ruth attempts seeded');

    // 8. CREATE SHORT NOTES CHAPTERS (AS SHOWN IN FIGMA SCREENS 8 & 9)
    // Grade 12 Math Chapters (18 chapters available across Grades 9-12)
    const grade12Chapters = [
        {
            title: 'Sequences and Series',
            subtitle: 'Chapter 1: Arithmetic & Geometric Progressions',
            description: 'Arithmetic and geometric sequences, summation notation, convergence and infinite series.',
            fileSize: '4.8 MB',
            order: 1,
            learningObjectives: [
                'Define arithmetic and geometric progressions mathematically.',
                'Compute general nth terms and sums of finite and infinite series.',
                'Apply sigma notation to solve real-world problems.'
            ],
            content: '# Sequences and Series\n\nAn arithmetic sequence has a constant difference $d$. The $n$-th term is given by $a_n = a_1 + (n - 1)d$.\n\nA geometric sequence has a constant ratio $r$. The $n$-th term is $a_n = a_1 \\cdot r^{n-1}$.',
        },
        {
            title: 'Introduction to Calculus & Limits',
            subtitle: 'Chapter 2: Limits of Functions & Continuity',
            description: 'Limits of functions, intuitive definition, one-sided limits, continuity, and infinite limits.',
            fileSize: '6.2 MB',
            order: 2,
            learningObjectives: [
                'Understand limits from intuitive and formal definitions.',
                'Evaluate algebraic limits using factoring, conjugates, and L\'Hôpital\'s Rule.',
                'Determine continuity at a point and over an interval.'
            ],
            content: '# Introduction to Calculus & Limits\n\nA function $f(x)$ is continuous at $x = c$ if:\n1. $f(c)$ is defined.\n2. $\\lim_{x \\to c} f(x)$ exists.\n3. $\\lim_{x \\to c} f(x) = f(c)$.',
        },
        {
            title: 'Derivatives and Applications',
            subtitle: 'Chapter 3: Differential Calculus in Practice',
            description: 'Product and quotient rules, chain rule, implicit differentiation, related rates, optimization.',
            fileSize: '8.1 MB',
            order: 3,
            learningObjectives: [
                'Compute derivatives using power, product, quotient, and chain rules.',
                'Solve related rates and optimization problems.',
                'Analyze curve sketching with first and second derivative tests.'
            ],
            content: '# Derivatives and Applications\n\nThe derivative $f\'(x)$ represents the instantaneous rate of change of $f(x)$ with respect to $x$.',
        },
        {
            title: 'Integrals and Applications',
            subtitle: 'Chapter 4: Integral Calculus',
            description: 'Definite and indefinite integrals, fundamental theorem of calculus, area between curves.',
            fileSize: '7.4 MB',
            order: 4,
            learningObjectives: [
                'Calculate antiderivatives and evaluate definite integrals.',
                'Apply the Fundamental Theorem of Calculus.',
                'Determine areas bounded by curves.'
            ],
            content: '# Integrals and Applications\n\nThe Fundamental Theorem of Calculus connects differentiation and integration.',
        },
        {
            title: 'Vectors in Two & Three Dimensions',
            subtitle: 'Chapter 5: Vectors, Dot & Cross Products',
            description: 'Vector arithmetic, dot product, cross product, lines and planes in 3-dimensional space.',
            fileSize: '5.5 MB',
            order: 5,
            learningObjectives: [
                'Perform vector additions and scalar multiplications in $\\mathbb{R}^3$.',
                'Compute dot products and cross products.',
                'Find equations of lines and planes in three dimensions.'
            ],
            content: '# Vectors in Two & Three Dimensions\n\nVectors represent quantities with both magnitude and direction.',
        },
    ];

    for (const ch of grade12Chapters) {
        await prisma.noteChapter.create({
            data: {
                subjectId: mathSub.id,
                gradeLevel: 12,
                stream: 'NATURAL',
                title: ch.title,
                subtitle: ch.subtitle,
                description: ch.description,
                order: ch.order,
                fileSize: ch.fileSize,
                pdfUrl: `https://example.com/notes/math-g12-ch${ch.order}.pdf`,
                learningObjectives: ch.learningObjectives,
                content: ch.content,
                resources: [
                    { name: 'Equation_Worksheet.pdf', size: '2.4 MB', type: 'PDF', url: 'https://example.com/resources/worksheet.pdf' },
                    { name: 'Instructor_Notes.docx', size: '1.1 MB', type: 'DOCX', url: 'https://example.com/resources/notes.docx' },
                ],
                isPremium: ch.order > 3,
            },
        });
    }

    // Also seed chapters for Grades 9, 10, 11 for Mathematics (so Grade 12 students can toggle between 9, 10, 11, 12 as per user request!)
    for (const g of [9, 10, 11]) {
        await prisma.noteChapter.create({
            data: {
                subjectId: mathSub.id,
                gradeLevel: g,
                stream: 'NATURAL',
                title: `Grade ${g} Mathematics Core Concepts`,
                subtitle: `Foundational Curriculum for Grade ${g}`,
                description: `Comprehensive review notes covering key Grade ${g} national entrance competencies.`,
                order: 1,
                fileSize: '5.1 MB',
                pdfUrl: `https://example.com/notes/math-g${g}-ch1.pdf`,
                learningObjectives: [
                    `Master Grade ${g} algebraic fundamentals.`,
                    'Prepare for high school national university entrance exam questions.'
                ],
                content: `# Grade ${g} Mathematics Notes\n\nEssential formulas and solved practice problems for Grade ${g}.`,
                resources: [
                    { name: `Grade_${g}_Summary.pdf`, size: '3.0 MB', type: 'PDF', url: 'https://example.com/resources/summary.pdf' }
                ],
            },
        });
    }

    // Seed Grade 6 and Grade 8 Math chapters (Figma Screen 9: "Fractions - Lesson 4.2 Equivalence and Simplification")
    await prisma.noteChapter.create({
        data: {
            subjectId: mathSub.id,
            gradeLevel: 6,
            stream: null,
            title: 'Fractions',
            subtitle: 'Lesson 4.2 Equivalence and Simplification',
            description: 'Define equivalent fractions, recognize them visually, and simplify using Greatest Common Factor (GCF).',
            order: 1,
            fileSize: '3.5 MB',
            pdfUrl: 'https://example.com/notes/math-g6-fractions.pdf',
            learningObjectives: [
                'Define equivalent fractions and recognize them visually using area models.',
                'Apply the fundamental property of fractions to create equivalent fractions by multiplication.',
                'Master the technique of simplifying fractions to their lowest terms using the GCF (Greatest Common Factor).'
            ],
            content: `# What are Equivalent Fractions?\n\nEquivalent fractions are fractions that represent the same value, even though they look different. For example, 1/2 and 2/4 are equivalent.\n\n### Steps to Simplify:\n1. Find the Greatest Common Factor (GCF) of numerator and denominator.\n2. Divide both by the GCF.\n3. Rewrite the fraction in lowest terms.`,
            resources: [
                { name: 'Equation_Worksheet.pdf', size: '2.4 MB', type: 'PDF', url: 'https://example.com/resources/Equation_Worksheet.pdf' },
                { name: 'Instructor_Notes.docx', size: '1.1 MB', type: 'DOCX', url: 'https://example.com/resources/Instructor_Notes.docx' }
            ],
        },
    });

    console.log('\n✅ Seeding complete!');
    console.log('----------------------------------------------------');
    console.log('👤 Admin:    admin@kuta.com / admin123');
    console.log('👤 Grade 12: ruth@kuta.com / student123 (Natural Science)');
    console.log('👤 Grade 8:  helen@kuta.com / student123');
    console.log('👤 Grade 6:  natnael@kuta.com / student123');
    console.log('👤 Kids App: abebe@kuta.com, sara@kuta.com');
    console.log('----------------------------------------------------');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
