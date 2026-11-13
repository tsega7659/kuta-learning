import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon,
    ArrowLeftIcon, ArrowPathIcon, XMarkIcon, CheckCircleIcon
} from '@heroicons/react/24/outline';
import AdminQuizBuilder from './components/AdminQuizBuilder';

const TYPE_BADGE = {
    SINGLE_CHOICE: 'bg-green-100 text-green-700',
    MULTIPLE_CHOICE: 'bg-purple-100 text-purple-700',
    TRUE_FALSE: 'bg-blue-100 text-blue-700',
    COLOR_MATCH: 'bg-pink-100 text-pink-700',
    WORD_ORDER: 'bg-yellow-100 text-yellow-700',
    DRAG_AND_DROP: 'bg-orange-100 text-orange-700',
    MATCHING: 'bg-indigo-100 text-indigo-700',
    FILL_IN_BLANK: 'bg-teal-100 text-teal-700',
};
const TYPE_LABEL = {
    SINGLE_CHOICE: 'Single Choice', MULTIPLE_CHOICE: 'Multiple Answer',
    TRUE_FALSE: 'True / False', COLOR_MATCH: 'Color Match',
    WORD_ORDER: 'Word Order', DRAG_AND_DROP: 'Drag & Drop',
    MATCHING: 'Matching', FILL_IN_BLANK: 'Fill Blank',
};

// ── Question detail slide-over modal ──
function QuizDetailModal({ quiz, onClose }) {
    const [questions, setQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const url = `/courses/${quiz.courseId}/chapters/${quiz.chapterId}/topics/${quiz.topicId}/quiz`;
        api.get(url)
            .then(res => setQuestions(res.data?.questions || []))
            .catch(() => setQuestions([]))
            .finally(() => setLoading(false));
    }, [quiz.id]);

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end md:items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <button onClick={onClose} className="p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50">
                        <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
                    </button>
                    <div className="flex-1">
                        <h2 className="text-lg font-extrabold text-[#0B3A63]">{quiz.title}</h2>
                        <p className="text-xs font-bold text-gray-400">{quiz.topicTitle} · {quiz.courseTitle} · Passing: {quiz.passingScore}%</p>
                    </div>
                    <span className="bg-blue-50 text-blue-700 font-bold text-xs px-3 py-1 rounded-full">
                        {questions.length} Questions
                    </span>
                </div>

                {/* Question list */}
                <div className="flex-1 overflow-y-auto p-5 space-y-3">
                    {loading ? (
                        <div className="py-16 text-center text-gray-400 font-bold">Loading questions...</div>
                    ) : questions.length === 0 ? (
                        <div className="py-16 text-center text-gray-400 font-bold">No questions in this quiz yet.</div>
                    ) : (
                        questions.map((q, idx) => (
                            <div key={q.id} className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="w-7 h-7 bg-[#0F4C81] text-white rounded-lg flex items-center justify-center text-xs font-extrabold shrink-0">
                                        {idx + 1}
                                    </span>
                                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${TYPE_BADGE[q.type] || 'bg-gray-100 text-gray-600'}`}>
                                        {TYPE_LABEL[q.type] || q.type}
                                    </span>
                                </div>
                                <p className="font-bold text-gray-800 text-sm mb-2 leading-snug">{q.text}</p>
                                {q.resourceUrl && (
                                    <p className="text-xs text-blue-500 font-bold mb-2">🔗 Has media attachment</p>
                                )}
                                <div className="grid grid-cols-2 gap-1.5 mt-2">
                                    {(q.options || []).map(opt => (
                                        <div key={opt.id} className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-bold border ${opt.isCorrect ? 'bg-green-50 border-green-200 text-green-700' : 'bg-white border-gray-200 text-gray-600'}`}>
                                            {opt.isCorrect && <CheckCircleIcon className="w-3.5 h-3.5 shrink-0 text-green-600" />}
                                            <span className="truncate">{opt.text || opt.imageUrl}</span>
                                        </div>
                                    ))}
                                </div>
                                {q.explanation && (
                                    <p className="mt-2 text-[11px] text-gray-400 font-bold italic">💡 {q.explanation}</p>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

export default function AdminQuizzes() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [fullCourseTree, setFullCourseTree] = useState([]);
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedQuiz, setSelectedQuiz] = useState(null);
    const [builderCtx, setBuilderCtx] = useState(null);

    const [selCourse, setSelCourse] = useState('ALL');
    const [selSubject, setSelSubject] = useState('ALL');
    const [selTopic, setSelTopic] = useState('ALL');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: courseList } = await api.get('/courses');
            setCourses(courseList);
            const tree = [];
            let flat = [];
            for (const course of courseList) {
                try {
                    const { data: detail } = await api.get(`/courses/${course.id}`);
                    tree.push(detail);
                    const quizFetches = [];
                    (detail.chapters || []).forEach(ch =>
                        (ch.topics || []).forEach(t =>
                            (t.quiz || []).forEach(() => {
                                quizFetches.push({
                                    url: `/courses/${course.id}/chapters/${ch.id}/topics/${t.id}/quiz`,
                                    meta: { courseId: course.id, courseTitle: course.title, chapterId: ch.id, chapterTitle: ch.title, topicId: t.id, topicTitle: t.title }
                                });
                            })
                        )
                    );
                    await Promise.all(quizFetches.map(async qf => {
                        try {
                            const { data: qd } = await api.get(qf.url);
                            flat.push({ ...qf.meta, id: qd.id, title: qd.title, passingScore: qd.passingScore, questionCount: (qd.questions || []).length });
                        } catch { /* skip */ }
                    }));
                } catch { /* skip */ }
            }
            setFullCourseTree(tree);
            setQuizzes(flat);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { loadData(); }, []);
    useEffect(() => { setPage(1); }, [selCourse, selSubject, selTopic]);

    const availableSubjects = useMemo(() => {
        const src = selCourse === 'ALL' ? fullCourseTree : fullCourseTree.filter(c => c.id === selCourse);
        return src.flatMap(c => c.chapters || []);
    }, [fullCourseTree, selCourse]);

    const availableTopics = useMemo(() => {
        const src = selSubject === 'ALL' ? availableSubjects : availableSubjects.filter(s => s.id === selSubject);
        return src.flatMap(s => s.topics || []);
    }, [availableSubjects, selSubject]);

    const handleCreateQuiz = () => {
        if (selCourse === 'ALL' || selSubject === 'ALL' || selTopic === 'ALL') {
            alert('Please select a Course, Subject, and Topic from the dropdown filters first in order to create a quiz directly.');
            return;
        }
        const topicObj = availableTopics.find(t => t.id === selTopic);
        setBuilderCtx({
            courseId: selCourse,
            chapterId: selSubject,
            topicId: selTopic,
            topicName: topicObj?.title || 'Selected Topic'
        });
    };

    const filtered = useMemo(() => quizzes.filter(q => {
        const matchCourse = selCourse === 'ALL' || q.courseId === selCourse;
        const matchSubject = selSubject === 'ALL' || q.chapterId === selSubject;
        const matchTopic = selTopic === 'ALL' || q.topicId === selTopic;
        return matchCourse && matchSubject && matchTopic;
    }), [quizzes, selCourse, selSubject, selTopic]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    return (
        <div className="p-8 font-sans text-gray-800">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0B3A63]">Quiz Management</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Select filters to create a new quiz, or click any row to inspect questions.</p>
                </div>
                <button
                    onClick={handleCreateQuiz}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0F4C81] hover:bg-[#0B3A63] text-white font-bold rounded-xl shadow-sm transition text-sm"
                >
                    <PlusCircleIcon className="w-5 h-5" /> Create Quiz
                </button>
            </div>

            {/* Filters */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 flex-wrap items-end mb-5 shadow-sm">
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Course</label>
                    <select value={selCourse} onChange={e => { setSelCourse(e.target.value); setSelSubject('ALL'); setSelTopic('ALL'); }} className="p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
                        <option value="ALL">All Courses</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1">Subject</label>
                    <select value={selSubject} onChange={e => { setSelSubject(e.target.value); setSelTopic('ALL'); }} className="p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
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
                <button onClick={loadData} className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 mb-0.5 border border-gray-200">
                    <ArrowPathIcon className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <p className="text-xs font-bold text-gray-500">
                        {filtered.length} quiz{filtered.length !== 1 ? 'zes' : ''} · click a row to see questions
                    </p>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-bold">Loading quizzes...</div>
                ) : paginated.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold">No quizzes found.</div>
                ) : (
                    paginated.map(qz => (
                        <div
                            key={qz.id}
                            onClick={() => setSelectedQuiz(qz)}
                            className="border-b border-gray-100 px-6 py-5 flex items-center justify-between hover:bg-blue-50 cursor-pointer transition group"
                        >
                            <div className="flex items-center gap-4 flex-1">
                                <div className="w-11 h-11 bg-[#EEF4FF] rounded-xl flex items-center justify-center text-[#0F4C81] font-extrabold text-lg">?</div>
                                <div className="flex-1">
                                    <h3 className="font-extrabold text-[#0B3A63] mb-1">{qz.title}</h3>
                                    <div className="flex gap-4 text-xs font-bold text-gray-400 flex-wrap">
                                        <span>📚 {qz.topicTitle}</span>
                                        <span>🏫 {qz.courseTitle}</span>
                                        <span>Passing: {qz.passingScore}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400">Questions</p>
                                    <p className="text-sm font-extrabold text-[#0B3A63]">{qz.questionCount}</p>
                                </div>
                                <ChevronRightIcon className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition" />
                            </div>
                        </div>
                    ))
                )}

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-500">
                    <span>
                        {filtered.length === 0 ? '0' : `${(page - 1) * PER_PAGE + 1}–${Math.min(page * PER_PAGE, filtered.length)}`} of {filtered.length}
                    </span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40">
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-lg font-bold text-sm ${pg === page ? 'bg-[#0F4C81] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{pg}</button>
                            ))}
                            {totalPages > 5 && <span className="px-1">...</span>}
                            {totalPages > 5 && (
                                <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 font-bold text-sm text-gray-600">{totalPages}</button>
                            )}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40">
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Quiz Question Detail Modal */}
            {selectedQuiz && (
                <QuizDetailModal quiz={selectedQuiz} onClose={() => setSelectedQuiz(null)} />
            )}

            {/* Quiz Builder Modal */}
            {builderCtx && (
                <AdminQuizBuilder
                    courseId={builderCtx.courseId}
                    chapterId={builderCtx.chapterId}
                    topicId={builderCtx.topicId}
                    topicName={builderCtx.topicName}
                    onClose={() => {
                        setBuilderCtx(null);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
