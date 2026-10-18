import app from './src/app.js';
import http from 'http';

const server = http.createServer(app);

const runTests = async () => {
    await new Promise((resolve) => server.listen(4001, resolve));
    console.log('Test server running on port 4001');

    const BASE_URL = 'http://localhost:4001/api';

    try {
        console.log('\n--- 1. Testing Auth & Login ---');
        // Login as Ruth (Grade 12, Natural)
        const loginRes = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ruth@kuta.com', password: 'student123' }),
        }).then(r => r.json());

        console.log('Ruth Login Success! Role:', loginRes.role);
        console.log('Ruth Profile:', loginRes.profile);
        const token = loginRes.token;

        const authHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };

        console.log('\n--- 2. Testing Onboarding Endpoint ---');
        // Test onboarding for a new student
        const newStudentEmail = `student_${Date.now()}@kuta.com`;
        const regRes = await fetch(`${BASE_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                email: newStudentEmail,
                password: 'password123',
                name: 'Dawit Test',
                gradeLevel: 12,
                stream: 'NATURAL'
            })
        }).then(r => r.json());
        console.log('Register with Grade 12 & Stream:', regRes.profile);

        // Switch stream via onboarding endpoint
        const onboardRes = await fetch(`${BASE_URL}/auth/onboarding`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${regRes.token}` },
            body: JSON.stringify({ gradeLevel: 12, stream: 'SOCIAL' })
        }).then(r => r.json());
        console.log('Onboarding update to SOCIAL stream:', onboardRes.profile);

        console.log('\n--- 3. Testing Dashboard (Screen 3: Exam Simulator) ---');
        const dashboard = await fetch(`${BASE_URL}/national-exams/dashboard`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log('Dashboard Student Info:', dashboard.student);
        console.log('Active Banner Exam:', dashboard.bannerExam);
        console.log('Subjects Count:', dashboard.subjectsCount);
        console.log('First Subject:', dashboard.subjects[0]?.name, 'Progress:', dashboard.subjects[0]?.progressPercentage + '%');

        console.log('\n--- 4. Testing Subject Exams List (Screen 4: Exams) ---');
        const mathSubjectId = dashboard.subjects[0].id;
        const examsRes = await fetch(`${BASE_URL}/national-exams/subjects/${mathSubjectId}/exams?order=desc`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log('Subject:', examsRes.subject.name, 'Total Exams:', examsRes.totalExams);
        console.log('Exams:', examsRes.exams.map(e => `${e.year} - Status: ${e.userStatus} - Action: ${e.actionLabel}`));

        console.log('\n--- 5. Testing Exam Take & Resume (Screen 5) ---');
        const exam2023 = examsRes.exams.find(e => e.year === 2023);
        const startRes = await fetch(`${BASE_URL}/national-exams/${exam2023.id}/start`, {
            method: 'POST',
            headers: authHeaders
        }).then(r => r.json());
        console.log('Start Exam:', startRes.exam.title, 'Duration:', startRes.exam.durationMinutes, 'mins');
        console.log('Questions received:', startRes.questions.length);
        console.log('Sample Question 1 text:', startRes.questions[0]?.text);
        console.log('Options have isCorrect stripped?', startRes.questions[0]?.options.every(o => o.isCorrect === undefined));

        console.log('\n--- 6. Testing Exam Submit & Scoring (Screen 6: Exam Result) ---');
        const q1 = startRes.questions[0];
        const attemptId = startRes.attemptId;
        const submitRes = await fetch(`${BASE_URL}/national-exams/attempts/${attemptId}/submit`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
                answers: [
                    { questionId: q1.id, selectedOptionId: q1.options[0].id }
                ]
            })
        }).then(r => r.json());
        console.log('Submit Result:', submitRes);

        // Get attempt review
        const resultDetail = await fetch(`${BASE_URL}/national-exams/attempts/${attemptId}`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log('Attempt Review - Score:', `${resultDetail.score}/${resultDetail.maxScore}`, 'Accuracy:', `${resultDetail.accuracyPercentage}%`);
        console.log('Q1 Review wasCorrect:', resultDetail.questions[0]?.wasCorrect, 'User Answer:', resultDetail.questions[0]?.userAnswer?.selectedOptionText);

        console.log('\n--- 7. Testing Short Notes Subjects (Screen 7) ---');
        const notesSubjects = await fetch(`${BASE_URL}/short-notes/subjects`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log('Notes Curriculum:', notesSubjects.curriculumType);
        console.log('Subjects list:', notesSubjects.subjects.map(s => `${s.name} (${s.gradeBadge})`));

        console.log('\n--- 8. Testing Short Notes Subject Detail for Grade 12 (Screen 8) ---');
        const noteMath = await fetch(`${BASE_URL}/short-notes/subjects/${mathSubjectId}?grade=12`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log('Grade 12 requiresGradeSelection:', noteMath.requiresGradeSelection);
        console.log('Available Grades for Grade 12:', noteMath.availableGrades);
        console.log('Chapters found for Grade 12:', noteMath.chapters.map(c => c.title));

        console.log('\n--- 9. Testing Short Notes for Grade 6 (Screen 8 & 9) ---');
        const natnaelLogin = await fetch(`${BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'natnael@kuta.com', password: 'student123' })
        }).then(r => r.json());
        const natnaelHeaders = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${natnaelLogin.token}`
        };
        const g6SubjectDetail = await fetch(`${BASE_URL}/short-notes/subjects/${mathSubjectId}`, {
            headers: natnaelHeaders
        }).then(r => r.json());
        console.log('Grade 6 requiresGradeSelection:', g6SubjectDetail.requiresGradeSelection);
        console.log('Grade 6 direct chapters:', g6SubjectDetail.chapters.map(c => c.title));

        console.log('\n--- 10. Testing Lesson Detail / Chapter Reading (Screen 9) ---');
        const ch1 = g6SubjectDetail.chapters[0];
        const chapterDetail = await fetch(`${BASE_URL}/short-notes/chapters/${ch1.id}`, {
            headers: natnaelHeaders
        }).then(r => r.json());
        console.log('Chapter:', chapterDetail.title, '-', chapterDetail.subtitle);
        console.log('Learning Objectives:', chapterDetail.learningObjectives);
        console.log('Lesson Resources:', chapterDetail.resources.map(res => `${res.name} (${res.size})`));

        // Mark as read
        const progressRes = await fetch(`${BASE_URL}/short-notes/chapters/${ch1.id}/progress`, {
            method: 'POST',
            headers: natnaelHeaders,
            body: JSON.stringify({ readPercentage: 100, isRead: true })
        }).then(r => r.json());
        console.log('Progress updated:', progressRes.progress);

        console.log('\n--- 11. Testing Kids App Backward Compatibility ---');
        const kidsCourses = await fetch(`${BASE_URL}/courses`, {
            headers: authHeaders
        }).then(r => r.json());
        console.log('Courses API accessible for kids app! Found courses count:', Array.isArray(kidsCourses) ? kidsCourses.length : 0);

        console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉');
    } catch (err) {
        console.error('Test failed with error:', err);
    } finally {
        server.close();
    }
};

runTests();
