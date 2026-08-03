import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
    PlusCircleIcon, ArrowPathIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';

export default function AdminMockExams() {
    const [courses, setCourses] = useState([]);
    const [allTopics, setAllTopics] = useState([]);  // [{topicTitle, courseTitle, chapterId, questionCount}]
    const [loading, setLoading] = useState(true);

    const [selCourse, setSelCourse] = useState('ALL');
    const [selSubject, setSelSubject] = useState('ALL');
    const [selTopic, setSelTopic] = useState('ALL');
    const [selType, setSelType] = useState('ALL');

    // Generated mock exams (stored in state — in a real app these would persist to DB)
    const [mockExams, setMockExams] = useState([]);
    const [generating, setGenerating] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: courseList } = await api.get('/courses');
            setCourses(courseList);

            let topics = [];
            for (const course of courseList) {
                try {
                    const { data: detail } = await api.get(`/courses/${course.id}`);
                    (detail.chapters || []).forEach(ch =>
                        (ch.topics || []).forEach(t => {
                            const qCount = (t.quiz || []).reduce((acc, qz) => acc + (qz.questions || []).length, 0);
                            if (qCount > 0) {
                                topics.push({
                                    topicId: t.id,
                                    topicTitle: t.title,
                                    chapterId: ch.id,
                                    chapterTitle: ch.title,
                                    courseId: course.id,
                                    courseTitle: course.title,
                                    questionCount: qCount
                                });
                            }
                        })
                    );
                } catch { /* skip */ }
            }
            setAllTopics(topics);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    const availableSubjects = useMemo(() => {
        const qs = selCourse === 'ALL' ? allTopics : allTopics.filter(t => t.courseId === selCourse);
        const u = new Map(); qs.forEach(t => u.set(t.chapterId, t.chapterTitle));
        return Array.from(u.entries()).map(([id, title]) => ({ id, title }));
    }, [allTopics, selCourse]);

    const availableTopics = useMemo(() => {
        let qs = allTopics;
        if (selCourse !== 'ALL') qs = qs.filter(t => t.courseId === selCourse);
        if (selSubject !== 'ALL') qs = qs.filter(t => t.chapterId === selSubject);
        const u = new Map(); qs.forEach(t => u.set(t.topicId, t.topicTitle));
        return Array.from(u.entries()).map(([id, title]) => ({ id, title }));
    }, [allTopics, selCourse, selSubject]);

    // Generate a new mock exam by sampling from the question bank
    const generateMockExam = async () => {
        setGenerating(true);
        try {
            // Fetch a random question from the backend to check availability
            await api.get('/practice/random-question');

            const filteredTopics = allTopics.filter(t => {
                if (selCourse !== 'ALL' && t.courseId !== selCourse) return false;
                if (selSubject !== 'ALL' && t.chapterId !== selSubject) return false;
                if (selTopic !== 'ALL' && t.topicId !== selTopic) return false;
                return true;
            });

            const totalQs = filteredTopics.reduce((acc, t) => acc + t.questionCount, 0);
            const topicNames = filteredTopics.map(t => t.topicTitle);

            const newExam = {
                id: `mock-${Date.now()}`,
                title: `Mock Exam ${mockExams.length + 1}`,
                questions: Math.min(totalQs, 200),
                topics: filteredTopics.length,
                topicNames: topicNames.slice(0, 3),
                grades: [...new Set(filteredTopics.map(t => t.courseTitle))].length,
                eta: `${Math.ceil(Math.min(totalQs, 200) * 0.75 / 60)}:${String(Math.ceil((Math.min(totalQs, 200) * 0.75) % 60)).padStart(2, '0')}hr`,
                createdAt: new Date(),
                status: 'pending'
            };

            setMockExams(prev => [newExam, ...prev]);
        } catch (err) {
            alert('No questions available for the selected filters.');
        } finally {
            setGenerating(false);
        }
    };

    return (
        <div className="p-8 font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0B3A63]">Exam Management</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Design, schedule, and monitor student assessments across all cohorts.</p>
                </div>
                <button
                    onClick={generateMockExam}
                    disabled={generating || loading}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-[#0B3A63] text-white font-bold rounded-xl shadow-sm transition text-sm disabled:opacity-60"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    {generating ? 'Generating...' : 'Generate Mock Exam'}
                </button>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 flex-wrap items-end mb-6 shadow-sm">
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Course</label>
                    <select value={selCourse} onChange={e => setSelCourse(e.target.value)} className="p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
                        <option value="ALL">All Courses</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Subject</label>
                    <select value={selSubject} onChange={e => setSelSubject(e.target.value)} className="p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
                        <option value="ALL">Select Subject</option>
                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>
                <div className="flex flex-col min-w-[150px] flex-1">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Topic</label>
                    <select value={selTopic} onChange={e => setSelTopic(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
                        <option value="ALL">Select Topic</option>
                        {availableTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
                <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Difficulty</label>
                    <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1">
                        {['ALL', 'EASY', 'MEDIUM', 'ADVANCED'].map((d, i) => (
                            <button key={d} onClick={() => setSelType(d)} className={`px-3 py-1 rounded-md text-xs font-bold transition ${selType === d ? 'bg-white shadow text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}>
                                {['All', 'Easy', 'Medium', 'Advanced'][i]}
                            </button>
                        ))}
                    </div>
                </div>
                <button onClick={loadData} className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 mb-0.5 border border-gray-200">
                    <ArrowPathIcon className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Available Topics Summary */}
            {!loading && (
                <div className="mb-4 text-sm font-bold text-gray-500">
                    {allTopics.length} topics available · {allTopics.reduce((a, t) => a + t.questionCount, 0)} total questions in bank
                </div>
            )}

            {/* Mock Exam Cards Grid */}
            {loading ? (
                <div className="py-20 text-center text-gray-400 font-bold">Loading question bank...</div>
            ) : mockExams.length === 0 ? (
                <div className="py-24 text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-3xl">📋</div>
                    <h3 className="text-xl font-extrabold text-[#0B3A63] mb-2">No Mock Exams Yet</h3>
                    <p className="text-gray-400 font-bold mb-6">Click "Generate Mock Exam" to auto-generate an exam from your question bank.</p>
                    <button onClick={generateMockExam} disabled={generating} className="px-6 py-3 bg-[#0F4C81] text-white font-bold rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-60">
                        {generating ? 'Generating...' : 'Generate Now'}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {mockExams.map(exam => (
                        <div key={exam.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-extrabold text-[#0B3A63]">{exam.title}</h3>
                                <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">Generated</span>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full shrink-0" />
                                    {exam.questions} Questions
                                </div>
                                <p className="text-xs font-bold text-gray-400">
                                    #{exam.topics} topics from {exam.grades} {exam.grades === 1 ? 'grade' : 'grades'}
                                </p>
                                <p className="text-xs font-bold text-gray-400">
                                    {Math.round((Date.now() - new Date(exam.createdAt).getTime()) / 60000)} MINUTES AGO
                                </p>
                            </div>

                            <div className="border-t border-gray-100 pt-4 flex items-center gap-2">
                                <span className="w-2 h-2 bg-blue-500 rounded-full" />
                                <span className="text-sm font-extrabold text-gray-700">ETA = {exam.eta}</span>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button className="flex-1 py-2 rounded-xl border-2 border-[#0F4C81] text-[#0F4C81] font-bold text-sm hover:bg-blue-50 transition">
                                    Preview
                                </button>
                                <button className="flex-1 py-2 rounded-xl bg-[#0F4C81] text-white font-bold text-sm hover:bg-[#0B3A63] transition">
                                    Publish
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
