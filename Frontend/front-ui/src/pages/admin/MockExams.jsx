import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
    PlusCircleIcon, ArrowPathIcon, TrashIcon, EyeIcon,
    CheckCircleIcon, ClockIcon, BookOpenIcon
} from '@heroicons/react/24/outline';

// ─── Persist mock exam configs to localStorage ───
const STORAGE_KEY = 'kuta_mock_exam_configs';
const loadSaved = () => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); }
    catch { return []; }
};
const savePersisted = (list) => localStorage.setItem(STORAGE_KEY, JSON.stringify(list));

export default function AdminMockExams() {
    // ── Live topic data from the same source as Practice Menu ──
    const [practiceTopics, setPracticeTopics] = useState([]);  // from /practice/topics
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Filters ──
    const [selCourse, setSelCourse] = useState('ALL');
    const [selSubject, setSelSubject] = useState('ALL');
    const [selTopic, setSelTopic] = useState('ALL');

    // ── Mock exam configs (persisted) ──
    const [mockExams, setMockExams] = useState(loadSaved);
    const [generating, setGenerating] = useState(false);

    const persistExams = (newExams) => {
        setMockExams(newExams);
        savePersisted(newExams);
    };

    // ── Load data ──
    const loadData = async () => {
        setLoading(true);
        try {
            // Load courses for filter dropdowns
            const { data: courseList } = await api.get('/courses');
            setCourses(courseList);

            // Load practice topics — EXACTLY the same endpoint as students use
            const { data: topics } = await api.get('/practice/topics');
            setPracticeTopics(topics);
        } catch (err) {
            console.error('Failed to load mock exam data', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // ── Build subject/topic filter options from live topics ──
    const availableSubjects = useMemo(() => {
        const src = selCourse === 'ALL' ? practiceTopics : practiceTopics.filter(t => t.courseTitle === selCourse);
        const u = new Map();
        src.forEach(t => u.set(t.chapterTitle, t.chapterTitle));
        return Array.from(u.keys()).map(v => ({ id: v, title: v }));
    }, [practiceTopics, selCourse]);

    const availableTopics = useMemo(() => {
        let src = practiceTopics;
        if (selCourse !== 'ALL') src = src.filter(t => t.courseTitle === selCourse);
        if (selSubject !== 'ALL') src = src.filter(t => t.chapterTitle === selSubject);
        return src;
    }, [practiceTopics, selCourse, selSubject]);

    const filteredTopics = useMemo(() => {
        if (selTopic !== 'ALL') return availableTopics.filter(t => t.id === selTopic);
        return availableTopics;
    }, [availableTopics, selTopic]);

    const totalQuestions = filteredTopics.reduce((acc, t) => acc + t.totalQuestions, 0);

    // ── Generate exam config ──
    const handleGenerate = async () => {
        if (filteredTopics.length === 0) {
            alert('No topics with questions match your filters. Please adjust the filters.');
            return;
        }
        setGenerating(true);
        try {
            const questionCount = Math.min(totalQuestions, 40);
            const newExam = {
                id: `exam-${Date.now()}`,
                title: `Mock Exam ${mockExams.length + 1}`,
                topicIds: filteredTopics.map(t => t.id),
                topicTitles: filteredTopics.map(t => t.title),
                courseTitle: [...new Set(filteredTopics.map(t => t.courseTitle))].join(', '),
                questionCount,
                totalAvailable: totalQuestions,
                etaMinutes: Math.ceil(questionCount * 1.5),
                status: 'draft',
                createdAt: new Date().toISOString(),
            };

            const updated = [newExam, ...mockExams];
            persistExams(updated);
        } finally {
            setGenerating(false);
        }
    };

    // ── Toggle publish ──
    const togglePublish = (id) => {
        const updated = mockExams.map(ex =>
            ex.id === id ? { ...ex, status: ex.status === 'published' ? 'draft' : 'published' } : ex
        );
        persistExams(updated);
    };

    // ── Delete exam ──
    const deleteExam = (id) => {
        if (!confirm('Delete this mock exam?')) return;
        persistExams(mockExams.filter(ex => ex.id !== id));
    };

    // ── Reset course filter ──
    const handleCourseChange = (v) => { setSelCourse(v); setSelSubject('ALL'); setSelTopic('ALL'); };
    const handleSubjectChange = (v) => { setSelSubject(v); setSelTopic('ALL'); };

    // Unique courses from live topics
    const topicCourses = [...new Set(practiceTopics.map(t => t.courseTitle))];

    return (
        <div className="p-8 font-sans text-gray-800">

            {/* ── Header ── */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0B3A63]">Exam Management</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        Design mock exams from your live question bank. Students see the same topics on their Practice screen.
                    </p>
                </div>
                <button
                    onClick={handleGenerate}
                    disabled={generating || filteredTopics.length === 0}
                    className="flex items-center gap-2 px-6 py-3 bg-[#0F4C81] text-white font-bold rounded-xl shadow hover:bg-[#0B3A63] transition disabled:opacity-50"
                >
                    <PlusCircleIcon className="w-5 h-5" />
                    {generating ? 'Generating...' : 'Generate Mock Exam'}
                </button>
            </div>

            {/* ── Info Banner ── */}
            <div className="mb-5 bg-blue-50 border border-blue-100 rounded-xl px-5 py-3 flex items-center gap-3">
                <BookOpenIcon className="w-5 h-5 text-blue-500 shrink-0" />
                <p className="text-sm font-bold text-blue-700">
                    Topic data is pulled live from your question bank — the same source students see on the <span className="underline">Practice Modules</span> screen.
                </p>
            </div>

            {/* ── Filter Bar ── */}
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex gap-6 items-end mb-5 shadow-sm flex-wrap">
                {/* Course */}
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Course</label>
                    <select
                        value={selCourse} onChange={e => handleCourseChange(e.target.value)}
                        className="p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]"
                    >
                        <option value="ALL">All Courses</option>
                        {topicCourses.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>

                {/* Subject */}
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Subject</label>
                    <select
                        value={selSubject} onChange={e => handleSubjectChange(e.target.value)}
                        className="p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]"
                    >
                        <option value="ALL">Select Subject</option>
                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>

                {/* Topic */}
                <div className="flex flex-col flex-1 min-w-[180px]">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Topic</label>
                    <select
                        value={selTopic} onChange={e => setSelTopic(e.target.value)}
                        className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]"
                    >
                        <option value="ALL">All Topics</option>
                        {availableTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>

                <button onClick={loadData} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 border border-gray-200">
                    <ArrowPathIcon className="w-5 h-5 text-gray-500" />
                </button>
            </div>

            {/* ── Stats bar ── */}
            {!loading && (
                <p className="text-sm font-bold text-gray-500 mb-6">
                    <span className="text-[#0B3A63]">{filteredTopics.length}</span> topics available ·{' '}
                    <span className="text-[#0B3A63]">{totalQuestions}</span> total questions in bank
                </p>
            )}

            {/* ── Live Topics Preview ── */}
            {!loading && filteredTopics.length > 0 && (
                <div className="mb-8">
                    <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Live Topics (visible to students)</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {filteredTopics.map(t => (
                            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                                <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 font-extrabold text-lg shrink-0">✦</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{t.courseTitle}</p>
                                    <p className="font-extrabold text-[#0B3A63] text-sm truncate">{t.title}</p>
                                    <p className="text-xs font-bold text-blue-500">{t.totalQuestions} Questions Available</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* ── Generated Exams ── */}
            <h2 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Generated Mock Exams</h2>

            {loading ? (
                <div className="py-20 text-center text-gray-400 font-bold">Loading question bank data...</div>
            ) : mockExams.length === 0 ? (
                <div className="py-16 text-center bg-white border-2 border-dashed border-gray-200 rounded-2xl">
                    <div className="text-5xl mb-4">📋</div>
                    <h3 className="text-lg font-extrabold text-gray-600 mb-2">No Mock Exams Yet</h3>
                    <p className="text-sm font-bold text-gray-400 mb-6">Click "Generate Mock Exam" to auto-generate an exam from your question bank.</p>
                    <button
                        onClick={handleGenerate}
                        disabled={generating || filteredTopics.length === 0}
                        className="px-8 py-3 bg-[#0F4C81] text-white font-bold rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50"
                    >
                        Generate Now
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {mockExams.map(exam => (
                        <div key={exam.id} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-100 transition flex flex-col gap-4">
                            <div className="flex justify-between items-start">
                                <h3 className="text-lg font-extrabold text-[#0B3A63]">{exam.title}</h3>
                                {exam.status === 'published' ? (
                                    <span className="bg-green-50 text-green-600 text-xs font-bold px-2.5 py-1 rounded-full border border-green-200">Active</span>
                                ) : (
                                    <span className="bg-blue-50 text-blue-600 text-xs font-bold px-2.5 py-1 rounded-full">Draft</span>
                                )}
                            </div>

                            <div className="space-y-1.5">
                                <div className="flex items-center gap-2 text-sm font-bold text-gray-600">
                                    <span className="w-2 h-2 bg-yellow-400 rounded-full shrink-0" />
                                    {exam.questionCount} Questions
                                    {exam.totalAvailable > exam.questionCount && (
                                        <span className="text-xs text-gray-400">(from {exam.totalAvailable} available)</span>
                                    )}
                                </div>
                                <p className="text-xs font-bold text-gray-400">
                                    {exam.topicTitles?.length || 0} topic{exam.topicTitles?.length !== 1 ? 's' : ''} · {exam.courseTitle}
                                </p>
                                <p className="text-xs font-bold text-gray-400">
                                    Created {new Date(exam.createdAt).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="border-t border-gray-100 pt-3 flex items-center gap-2">
                                <span className={exam.status === 'published' ? 'w-2 h-2 bg-green-500 rounded-full' : 'w-2 h-2 bg-blue-500 rounded-full'} />
                                <span className="text-sm font-extrabold text-gray-700">ETA ≈ {exam.etaMinutes} min</span>
                            </div>

                            <div className="flex gap-2 mt-auto">
                                <button
                                    onClick={() => alert(`Preview Mode: "${exam.title}"\n\nTopics: ${exam.topicTitles?.join(', ')}\nQuestions: ${exam.questionCount}\n\nFull student preview will connect to the exam session.`)}
                                    className="flex-1 py-2 rounded-xl border-2 border-[#0F4C81] text-[#0F4C81] font-bold text-sm hover:bg-blue-50 transition flex items-center justify-center gap-1.5"
                                >
                                    <EyeIcon className="w-4 h-4" /> Preview
                                </button>
                                <button
                                    onClick={() => togglePublish(exam.id)}
                                    className={`flex-1 py-2 rounded-xl font-bold text-sm transition flex items-center justify-center gap-1.5 ${exam.status === 'published'
                                            ? 'bg-red-50 text-red-600 hover:bg-red-100 border-2 border-transparent'
                                            : 'bg-[#0F4C81] text-white hover:bg-[#0B3A63] border-2 border-[#0F4C81]'
                                        }`}
                                >
                                    <CheckCircleIcon className="w-4 h-4" />
                                    {exam.status === 'published' ? 'Unpublish' : 'Publish'}
                                </button>
                                <button
                                    onClick={() => deleteExam(exam.id)}
                                    className="w-10 flex-none py-2 rounded-xl border-2 border-gray-200 text-gray-400 hover:text-red-500 hover:border-red-200 transition flex items-center justify-center"
                                >
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
