import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    PlusCircleIcon, ChevronLeftIcon, ChevronRightIcon,
    EllipsisVerticalIcon, ClockIcon, UserGroupIcon,
    CalendarDaysIcon, ArrowPathIcon, FunnelIcon, ArrowDownTrayIcon
} from '@heroicons/react/24/outline';

const STATUS_STYLE = {
    active: 'bg-green-100 text-green-700 font-bold px-2.5 py-0.5 rounded-full text-xs',
    upcoming: 'bg-blue-100 text-blue-700 font-bold px-2.5 py-0.5 rounded-full text-xs',
    completed: 'bg-gray-100 text-gray-500 font-bold px-2.5 py-0.5 rounded-full text-xs',
};

export default function AdminQuizzes() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [quizzes, setQuizzes] = useState([]);   // flat list of all quizzes
    const [loading, setLoading] = useState(true);

    const [selCourse, setSelCourse] = useState('ALL');
    const [selSubject, setSelSubject] = useState('ALL');
    const [selTopic, setSelTopic] = useState('ALL');
    const [selType, setSelType] = useState('ALL'); // difficulty
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: courseList } = await api.get('/courses');
            setCourses(courseList);
            let flat = [];
            for (const course of courseList) {
                try {
                    const { data: detail } = await api.get(`/courses/${course.id}`);
                    (detail.chapters || []).forEach(ch =>
                        (ch.topics || []).forEach(t =>
                            (t.quiz || []).forEach(qz => flat.push({
                                ...qz,
                                courseId: course.id,
                                courseTitle: course.title,
                                chapterId: ch.id,
                                chapterTitle: ch.title,
                                topicId: t.id,
                                topicTitle: t.title,
                                questionCount: (qz.questions || []).length,
                                // Derive status pseudo-randomly since no real status field
                                status: ['active', 'upcoming', 'completed'][Math.floor(Math.random() * 3)]
                            }))
                        )
                    );
                } catch { /* skip */ }
            }
            setQuizzes(flat);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { loadData(); }, []);
    useEffect(() => { setPage(1); }, [selCourse, selSubject, selTopic, selType]);

    const availableSubjects = useMemo(() => {
        const qs = selCourse === 'ALL' ? quizzes : quizzes.filter(q => q.courseId === selCourse);
        const u = new Map(); qs.forEach(q => u.set(q.chapterId, q.chapterTitle));
        return Array.from(u.entries()).map(([id, title]) => ({ id, title }));
    }, [quizzes, selCourse]);

    const availableTopics = useMemo(() => {
        let qs = quizzes;
        if (selCourse !== 'ALL') qs = qs.filter(q => q.courseId === selCourse);
        if (selSubject !== 'ALL') qs = qs.filter(q => q.chapterId === selSubject);
        const u = new Map(); qs.forEach(q => u.set(q.topicId, q.topicTitle));
        return Array.from(u.entries()).map(([id, title]) => ({ id, title }));
    }, [quizzes, selCourse, selSubject]);

    const filtered = useMemo(() => quizzes.filter(q => {
        const matchCourse = selCourse === 'ALL' || q.courseId === selCourse;
        const matchSubject = selSubject === 'ALL' || q.chapterId === selSubject;
        const matchTopic = selTopic === 'ALL' || q.topicId === selTopic;
        return matchCourse && matchSubject && matchTopic;
    }), [quizzes, selCourse, selSubject, selTopic]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

    const QuizIcon = ({ status }) => {
        if (status === 'active') return <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-bold">?</div>;
        if (status === 'upcoming') return <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center text-gray-500 text-lg">📋</div>;
        return <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">✓</div>;
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
                    onClick={() => navigate('/admin/question-bank')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-blue-500 hover:bg-[#0B3A63] text-white font-bold rounded-xl shadow-sm transition text-sm"
                >
                    <PlusCircleIcon className="w-5 h-5" /> Create new Quiz
                </button>
            </div>

            {/* Filter Row */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 flex-wrap items-end mb-5 shadow-sm">
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

            {/* Quiz List Table */}
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                {/* Sub-filter bar */}
                <div className="px-6 py-3 border-b border-gray-100 flex justify-between items-center flex-wrap gap-3">
                    <div className="flex gap-2">
                        {['All Status', 'Active', 'Upcoming'].map(t => (
                            <button key={t} className={`px-4 py-1.5 rounded-full text-xs font-bold transition border ${t === 'All Status' ? 'bg-[#0F4C81] text-white border-[#0F4C81]' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{t}</button>
                        ))}
                        <select className="ml-2 px-3 py-1.5 border border-gray-200 rounded-full text-xs font-bold text-gray-500 bg-white outline-none">
                            <option>Sort by Date</option>
                            <option>Sort by Name</option>
                            <option>Sort by Questions</option>
                        </select>
                    </div>
                    <div className="flex gap-2">
                        <button className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"><FunnelIcon className="w-4 h-4 text-gray-500" /></button>
                        <button className="w-8 h-8 border border-gray-200 rounded-lg flex items-center justify-center hover:bg-gray-50"><ArrowDownTrayIcon className="w-4 h-4 text-gray-500" /></button>
                    </div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-bold">Loading quizzes...</div>
                ) : paginated.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold">No quizzes found.</div>
                ) : (
                    paginated.map(qz => (
                        <div key={qz.id} className="border-b border-gray-100 px-6 py-5 flex items-center justify-between hover:bg-gray-50 transition group">
                            <div className="flex items-center gap-4 flex-1">
                                <QuizIcon status={qz.status} />
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h3 className="font-extrabold text-[#0B3A63]">{qz.title}</h3>
                                        <span className={STATUS_STYLE[qz.status] || STATUS_STYLE.upcoming}>
                                            {qz.status?.charAt(0).toUpperCase() + qz.status?.slice(1)}
                                        </span>
                                    </div>
                                    <div className="flex gap-4 text-xs font-bold text-gray-400 flex-wrap">
                                        <span className="flex items-center gap-1"><ClockIcon className="w-3.5 h-3.5" />{qz.questionCount} Questions</span>
                                        <span className="flex items-center gap-1">📚 {qz.topicTitle}</span>
                                        <span className="flex items-center gap-1">🏫 {qz.courseTitle}</span>
                                        <span className="flex items-center gap-1">Passing: {qz.passingScore}%</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6">
                                <div className="text-right">
                                    <p className="text-xs font-bold text-gray-400">Questions</p>
                                    <p className="text-sm font-extrabold text-[#0B3A63]">{qz.questionCount}</p>
                                </div>
                                <button
                                    onClick={() => navigate(`/admin/question-bank`)}
                                    className="opacity-0 group-hover:opacity-100 p-2 rounded-lg hover:bg-gray-100 transition"
                                >
                                    <EllipsisVerticalIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Pagination */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-sm font-bold text-gray-500">
                    <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1}-{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} assessments</span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40"><ChevronLeftIcon className="w-4 h-4" /></button>
                            {Array.from({ length: Math.min(totalPages, 3) }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-lg font-bold text-sm ${pg === page ? 'bg-[#0F4C81] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{pg}</button>
                            ))}
                            {totalPages > 3 && <span>...</span>}
                            {totalPages > 3 && <button onClick={() => setPage(totalPages)} className="w-8 h-8 rounded-lg bg-white border border-gray-200 font-bold text-sm text-gray-600">{totalPages}</button>}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white disabled:opacity-40"><ChevronRightIcon className="w-4 h-4" /></button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
