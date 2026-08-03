import { useState, useEffect, useMemo } from 'react';
import {
    PlusIcon, ArrowDownTrayIcon, MagnifyingGlassIcon,
    FunnelIcon, ArrowPathIcon, EyeIcon, PencilIcon, TrashIcon,
    XMarkIcon
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import AdminQuizBuilder from './components/AdminQuizBuilder';

// Question Type formatting
const TYPE_CONFIG = {
    SINGLE_CHOICE: { label: 'Single Choice', color: 'bg-green-100 text-green-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    MULTIPLE_CHOICE: { label: 'Multi Answer', color: 'bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    TRUE_FALSE: { label: 'True / False', color: 'bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    COLOR_MATCH: { label: 'Color Match', color: 'bg-pink-100 text-pink-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    WORD_ORDER: { label: 'Word Order', color: 'bg-yellow-100 text-yellow-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    DRAG_AND_DROP: { label: 'Drag & Drop', color: 'bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    MATCHING: { label: 'Matching', color: 'bg-indigo-100 text-indigo-700 font-bold px-2 py-0.5 rounded text-[10px]' },
    FILL_IN_BLANK: { label: 'Fill Blank', color: 'bg-teal-100 text-teal-700 font-bold px-2 py-0.5 rounded text-[10px]' },
};

export default function AdminQuestionBank() {
    // ──────────────────────────────────────────────
    // Data Fetching
    // ──────────────────────────────────────────────
    const [courses, setCourses] = useState([]);
    const [allQuestions, setAllQuestions] = useState([]);
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: coursesList } = await api.get('/courses');
            setCourses(coursesList);

            let flatQs = [];
            for (const course of coursesList) {
                const { data: detail } = await api.get(`/courses/${course.id}`);
                (detail.chapters || []).forEach(ch => {
                    (ch.topics || []).forEach(t => {
                        (t.quiz || []).forEach(qGroup => {
                            (qGroup.questions || []).forEach(q => {
                                flatQs.push({
                                    ...q,
                                    courseId: course.id,
                                    courseTitle: course.title,
                                    chapterId: ch.id,
                                    chapterTitle: ch.title,
                                    topicId: t.id,
                                    topicTitle: t.title,
                                    quizId: qGroup.id
                                });
                            });
                        });
                    });
                });
            }
            // Sort by updated/created
            flatQs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
            setAllQuestions(flatQs);
        } catch (err) {
            console.error('Failed to load questions', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);

    // ──────────────────────────────────────────────
    // Filters & Pagination
    // ──────────────────────────────────────────────
    const [search, setSearch] = useState('');
    const [selCourse, setSelCourse] = useState('ALL');
    const [selSubject, setSelSubject] = useState('ALL');
    const [selTopic, setSelTopic] = useState('ALL');
    const [selType, setSelType] = useState('ALL');

    // Auto-reset dependent dropdowns
    useEffect(() => { setSelSubject('ALL'); setSelTopic('ALL'); }, [selCourse]);
    useEffect(() => { setSelTopic('ALL'); }, [selSubject]);

    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Derived dropdown options
    const availableSubjects = useMemo(() => {
        const qs = selCourse === 'ALL' ? allQuestions : allQuestions.filter(q => q.courseId === selCourse);
        const unique = new Map();
        qs.forEach(q => unique.set(q.chapterId, q.chapterTitle));
        return Array.from(unique.entries()).map(([id, title]) => ({ id, title }));
    }, [allQuestions, selCourse]);

    const availableTopics = useMemo(() => {
        let qs = allQuestions;
        if (selCourse !== 'ALL') qs = qs.filter(q => q.courseId === selCourse);
        if (selSubject !== 'ALL') qs = qs.filter(q => q.chapterId === selSubject);
        const unique = new Map();
        qs.forEach(q => unique.set(q.topicId, q.topicTitle));
        return Array.from(unique.entries()).map(([id, title]) => ({ id, title }));
    }, [allQuestions, selCourse, selSubject]);

    const filtered = useMemo(() => {
        return allQuestions.filter(q => {
            const matchCourse = selCourse === 'ALL' || q.courseId === selCourse;
            const matchSubject = selSubject === 'ALL' || q.chapterId === selSubject;
            const matchTopic = selTopic === 'ALL' || q.topicId === selTopic;
            const matchType = selType === 'ALL' || q.type === selType;
            return matchCourse && matchSubject && matchTopic && matchType;
        });
    }, [allQuestions, selCourse, selSubject, selTopic, selType]);

    const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
    const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

    // Reset page if filters change
    useEffect(() => { setPage(1); }, [selCourse, selSubject, selTopic, selType]);

    // ──────────────────────────────────────────────
    // Editor Modal (Render AdminQuizBuilder over top)
    // ──────────────────────────────────────────────
    const [builderContext, setBuilderContext] = useState(null);
    // builderContext: { courseId, chapterId, topicId, topicTitle }
    const [showTopicSelect, setShowTopicSelect] = useState(false);

    const openBuilder = (q) => {
        setBuilderContext({
            courseId: q.courseId,
            chapterId: q.chapterId,
            topicId: q.topicId,
            topicTitle: q.topicTitle
        });
    };

    const handleCloseBuilder = () => {
        setBuilderContext(null);
        loadData(); // refresh table
    };

    return (
        <div className="min-h-screen bg-[#F8F9FB] p-8 text-gray-800 font-sans">

            {/* Page Header */}
            <div className="flex justify-between items-start mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0B3A63] tracking-tight">Question Bank</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">
                        Manage and organize {allQuestions.length.toLocaleString()} questions across your assigned curriculum.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-gray-300 font-bold text-gray-600 hover:bg-gray-100 transition">
                        <ArrowDownTrayIcon className="w-4 h-4" /> Bulk Import
                    </button>
                    <button
                        onClick={() => setShowTopicSelect(true)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-[#0F4C81] text-white font-bold hover:bg-[#0B3A63] transition shadow-sm"
                    >
                        <PlusIcon className="w-5 h-5" /> Create Question
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl px-5 py-4 flex gap-6 items-center mb-6 shadow-sm flex-wrap w-full">

                {/* Course Dropdown */}
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Course</label>
                    <select
                        value={selCourse} onChange={e => setSelCourse(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81] text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">All Courses</option>
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>

                {/* Subject Dropdown */}
                <div className="flex flex-col min-w-[150px]">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Subject</label>
                    <select
                        value={selSubject} onChange={e => setSelSubject(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81] text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">Select Subject</option>
                        {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                    </select>
                </div>

                {/* Topic Dropdown/Search */}
                <div className="flex flex-col min-w-[150px] flex-1">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Topic</label>
                    <select
                        value={selTopic} onChange={e => setSelTopic(e.target.value)}
                        className="w-full border border-gray-200 rounded-lg p-2 font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81] text-gray-700 cursor-pointer"
                    >
                        <option value="ALL">Select Topic</option>
                        {availableTopics.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>

                <div className="w-px h-10 bg-gray-200 hidden md:block" />

                {/* Difficulty / Type Toggle Group */}
                <div className="flex flex-col">
                    <label className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">Difficulty</label>
                    <div className="flex bg-gray-50 border border-gray-200 rounded-lg p-1">
                        <button onClick={() => setSelType('ALL')} className={`px-4 py-1 rounded-md text-xs font-bold transition ${selType === 'ALL' ? 'bg-white shadow text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}>All</button>
                        <button onClick={() => setSelType('SINGLE_CHOICE')} className={`px-4 py-1 rounded-md text-xs font-bold transition ${selType === 'SINGLE_CHOICE' ? 'bg-white shadow text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}>Easy</button>
                        <button onClick={() => setSelType('MULTIPLE_CHOICE')} className={`px-4 py-1 rounded-md text-xs font-bold transition ${selType === 'MULTIPLE_CHOICE' ? 'bg-white shadow text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}>Medium</button>
                        <button onClick={() => setSelType('MATCHING')} className={`px-4 py-1 rounded-md text-xs font-bold transition ${selType === 'MATCHING' ? 'bg-white shadow text-[#0F4C81]' : 'text-gray-500 hover:text-gray-700'}`}>Advanced</button>
                    </div>
                </div>

                <div className="flex items-end pb-1 ml-auto">
                    <button onClick={loadData} className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 border border-gray-200">
                        <ArrowPathIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Questions Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 p-4 font-bold text-xs text-gray-500 uppercase tracking-wider">
                    <div className="col-span-1 text-center"></div>
                    <div className="col-span-7">Question Details</div>
                    <div className="col-span-3">Metadata</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-bold">Loading questions...</div>
                ) : paginated.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold">No questions found.</div>
                ) : (
                    paginated.map((q, idx) => {
                        const typeInfo = TYPE_CONFIG[q.type] || { label: q.type, color: 'bg-gray-100' };
                        return (
                            <div key={q.id} className="grid grid-cols-12 border-b border-gray-100 p-6 items-start hover:bg-gray-50 transition relative group">

                                {/* Serial / Check */}
                                <div className="col-span-1 flex justify-center pt-1">
                                    <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer" />
                                </div>

                                {/* Main Details */}
                                <div className="col-span-7 pr-6">
                                    <div className="flex items-center gap-3 mb-2">
                                        <span className={typeInfo.color}>{typeInfo.label}</span>
                                        <span className="text-[11px] font-bold text-gray-400 tracking-wider">ID: #{q.id.split('-')[0].toUpperCase()}</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-800 leading-snug break-words mb-2">
                                        {q.text}
                                    </h3>
                                    {q.resourceUrl && (
                                        <div className="mb-3">
                                            <span className="text-xs font-bold text-blue-500 bg-blue-50 px-2 py-1 rounded">🔗 Has Media Attachment</span>
                                        </div>
                                    )}
                                    <div className="flex gap-2">
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                            🏷️ {q.chapterTitle}
                                        </span>
                                        <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                                            🏷️ {q.topicTitle}
                                        </span>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div className="col-span-3 pt-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-blue-600 font-black">∑</span>
                                        <span className="text-sm font-bold text-gray-700">{q.courseTitle}</span>
                                    </div>
                                    <p className="text-[11px] font-bold text-gray-400 mb-0.5">
                                        Updated: {new Date(q.createdAt).toLocaleDateString()}
                                    </p>
                                    <p className="text-[11px] font-bold text-gray-400">By: Admin</p>
                                </div>

                                {/* Actions */}
                                <div className="col-span-1 pt-1 flex justify-end gap-3 text-gray-400 opacity-60 group-hover:opacity-100 transition">
                                    <button onClick={() => openBuilder(q)} className="hover:text-blue-600 transition" title="Edit Question">
                                        <PencilIcon className="w-5 h-5" />
                                    </button>
                                    <button onClick={() => alert('Delete from builder!')} className="hover:text-red-500 transition">
                                        <TrashIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        );
                    })
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-500">
                        <span>Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} questions</span>
                        <div className="flex gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50">Prev</button>
                            <div className="px-3 py-1 rounded bg-[#0F4C81] text-white">{page}</div>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 rounded border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-50">Next</button>
                        </div>
                    </div>
                )}
            </div>

            {/* ────────────────────────────────────────────── */}
            {/* Topic Selector Modal (for Create Question) */}
            {/* ────────────────────────────────────────────── */}
            {showTopicSelect && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-6 relative">
                        <button onClick={() => setShowTopicSelect(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-bold text-[#0B3A63] mb-4">Add New Question</h2>
                        <p className="text-sm text-gray-500 font-medium mb-6">Select the course and topic destination for your new question.</p>

                        <TopicSelectFlow
                            courses={courses}
                            onSelect={(cId, chId, tId, tTitle) => {
                                setShowTopicSelect(false);
                                setBuilderContext({ courseId: cId, chapterId: chId, topicId: tId, topicTitle: tTitle });
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ────────────────────────────────────────────── */}
            {/* Embedded AdminQuizBuilder Modal */}
            {/* ────────────────────────────────────────────── */}
            {builderContext && (
                <div className="fixed inset-0 z-50 bg-[#F8F9FB] overflow-y-auto w-full h-full">
                    {/* Fake Header so user knows they are still in Question Bank */}
                    <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4 flex justify-between items-center shadow-sm">
                        <div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Question Bank / Editor</span>
                            <h2 className="text-lg font-black text-[#0B3A63]">Editing Topic: {builderContext.topicTitle}</h2>
                        </div>
                        <button onClick={handleCloseBuilder} className="flex items-center gap-2 text-gray-500 hover:text-red-500 font-bold bg-gray-100 px-4 py-2 rounded-lg transition">
                            <XMarkIcon className="w-5 h-5" /> CLOSE EDITOR
                        </button>
                    </div>

                    {/* Re-use the existing component! */}
                    <div className="p-8 pb-32 max-w-7xl mx-auto">
                        <AdminQuizBuilder
                            courseId={builderContext.courseId}
                            chapterId={builderContext.chapterId}
                            topicId={builderContext.topicId}
                            topicName={builderContext.topicTitle}
                            onClose={handleCloseBuilder}
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// Simple step-wise dropdown flow for Course -> Chapter -> Topic
function TopicSelectFlow({ courses, onSelect }) {
    const [cId, setCId] = useState('');
    const [chId, setChId] = useState('');
    const [tId, setTId] = useState('');

    // Derived selected states
    const [courseData, setCourseData] = useState(null);
    const [loadingInfo, setLoadingInfo] = useState(false);

    useEffect(() => {
        if (!cId) { setCourseData(null); setChId(''); setTId(''); return; }
        setLoadingInfo(true);
        api.get(`/courses/${cId}`).then(res => {
            setCourseData(res.data);
            setChId('');
            setTId('');
        }).finally(() => setLoadingInfo(false));
    }, [cId]);

    const activeChapter = courseData?.chapters?.find(c => c.id === chId);
    const activeTopic = activeChapter?.topics?.find(t => t.id === tId);

    return (
        <div className="space-y-4">
            <div>
                <label className="text-xs font-bold text-gray-500 mb-1 block">1. Select Course</label>
                <select value={cId} onChange={e => setCId(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold bg-gray-50 outline-none focus:border-blue-500">
                    <option value="">-- Choose Course --</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
            </div>

            {cId && (
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">2. Select Subject/Chapter</label>
                    <select disabled={loadingInfo} value={chId} onChange={e => setChId(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold bg-gray-50 outline-none focus:border-blue-500 disabled:opacity-50">
                        <option value="">-- Choose Chapter --</option>
                        {courseData?.chapters?.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                </div>
            )}

            {chId && activeChapter && (
                <div>
                    <label className="text-xs font-bold text-gray-500 mb-1 block">3. Select Topic</label>
                    <select value={tId} onChange={e => setTId(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold bg-gray-50 outline-none focus:border-blue-500">
                        <option value="">-- Choose Topic --</option>
                        {activeChapter.topics?.map(t => <option key={t.id} value={t.id}>{t.title}</option>)}
                    </select>
                </div>
            )}

            <button
                onClick={() => onSelect(cId, chId, tId, activeTopic?.title)}
                disabled={!tId}
                className="w-full mt-6 bg-[#0F4C81] text-white font-bold py-3 rounded-xl disabled:opacity-50 transition"
            >
                Continue to Editor
            </button>
        </div>
    );
}
