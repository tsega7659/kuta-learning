import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
    ChevronRightIcon, ArrowLeftIcon, PlayCircleIcon,
    CheckCircleIcon, LockClosedIcon, DocumentCheckIcon,
    QueueListIcon, QuestionMarkCircleIcon, TrophyIcon,
    BookOpenIcon, SparklesIcon, MapIcon, ListBulletIcon
} from '@heroicons/react/24/outline';
import { FaStar, FaCircleCheck, FaLock, FaPlay, FaTrophy } from 'react-icons/fa6';
import api from '../../services/api';

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'

    const chapterParam = searchParams.get('chapter');
    const topicParam = searchParams.get('topic');

    const selectedChapterId = chapterParam || null;
    const selectedTopicId = topicParam || null;

    useEffect(() => {
        setLoading(true);
        api.get(`/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    const handleSelectChapter = (chapterId) => {
        setSearchParams({ chapter: chapterId });
    };

    const handleSelectTopic = (topicId) => {
        if (selectedChapterId) {
            setSearchParams({ chapter: selectedChapterId, topic: topicId });
        }
    };

    const handleBackToChapters = () => {
        setSearchParams({});
    };

    const handleBackToTopics = () => {
        if (selectedChapterId) {
            setSearchParams({ chapter: selectedChapterId });
        } else {
            setSearchParams({});
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f26522] border-t-transparent"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center p-6 text-center">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-100 max-w-sm w-full">
                    <BookOpenIcon className="w-16 h-16 mb-3 mx-auto text-[#f26522]/40" />
                    <h3 className="font-extrabold text-[#0c3b6b] text-lg mb-1">Course Not Found</h3>
                    <p className="text-gray-400 text-xs font-bold mb-5">The selected subject could not be loaded.</p>
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="w-full py-3 bg-[#f26522] text-white font-black text-sm rounded-full shadow-[0_4px_12px_rgba(242,101,34,0.3)] hover:bg-orange-600 transition"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    const chapters = (course.chapters || []).sort((a, b) => (a.order || 0) - (b.order || 0));
    const activeChapter = chapters.find(c => c.id === selectedChapterId) || null;
    const topics = activeChapter ? (activeChapter.topics || []).sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const activeTopic = topics.find(t => t.id === selectedTopicId) || null;

    // Calculate global stats for this course
    const allTopics = chapters.flatMap(c => c.topics || []);
    const allLessons = allTopics.flatMap(t => t.lessons || []);
    const completedLessonsCount = allLessons.filter(l => l.completed).length;
    const progressPercent = allLessons.length > 0 ? Math.round((completedLessonsCount / allLessons.length) * 100) : 0;

    // Active topic lessons stats
    const topicLessons = activeTopic ? (activeTopic.lessons || []).sort((a, b) => (a.order || 0) - (b.order || 0)) : [];
    const topicQuizzes = activeTopic ? (activeTopic.quizzes || activeTopic.quiz || []) : [];
    const topicCompletedCount = topicLessons.filter(l => l.completed).length;
    const firstUnfinishedIdx = topicLessons.findIndex(l => !l.completed);
    const currentActiveLessonIdx = firstUnfinishedIdx === -1 ? (topicLessons.length > 0 ? topicLessons.length - 1 : 0) : firstUnfinishedIdx;
    const allTopicLessonsCompleted = topicLessons.length > 0 && topicCompletedCount === topicLessons.length;

    return (
        <div className="min-h-screen pb-32 font-sans text-gray-800">

            {/* ── Top Header Banner ── */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] text-white pt-6 pb-6 px-4 rounded-b-[32px] shadow-[0_8px_25px_rgba(12,59,107,0.22)] sticky top-0 z-30">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => {
                            if (selectedTopicId) handleBackToTopics();
                            else if (selectedChapterId) handleBackToChapters();
                            else navigate('/student/courses');
                        }}
                        className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition active:scale-95 shadow-sm shrink-0"
                        title="Go back"
                    >
                        <ArrowLeftIcon className="w-5 h-5" />
                    </button>

                    <div className="min-w-0 flex-1 text-center px-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-200 block truncate">
                            Grade {course.gradeLevel || 1} • {course.title}
                        </span>
                        <h1 className="text-base sm:text-lg font-black tracking-tight truncate">
                            {activeTopic ? activeTopic.title : activeChapter ? activeChapter.title : 'Curriculum'}
                        </h1>
                    </div>

                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black shrink-0">
                        <FaStar className="text-yellow-300 w-3.5 h-3.5 fill-yellow-300" />
                        <span>{progressPercent}%</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-yellow-300 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* ── Main Container ── */}
            <div className="px-4 mt-5 max-w-4xl mx-auto">
                <div className="bg-white border border-gray-200 rounded-3xl shadow-sm overflow-hidden min-h-[480px]">

                    {/* ── Breadcrumb Navigation Strip ── */}
                    <div className="bg-gray-50/90 border-b border-gray-200 px-4 py-3 flex items-center justify-between gap-2 font-bold text-xs sm:text-sm">
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-0.5">
                            <button
                                onClick={handleBackToChapters}
                                className={`shrink-0 transition ${!selectedChapterId ? 'text-[#0c3b6b] font-black' : 'text-gray-400 hover:text-[#0c3b6b]'}`}
                            >
                                Chapters
                            </button>

                            {selectedChapterId && activeChapter && (
                                <>
                                    <span className="text-gray-300 shrink-0">/</span>
                                    <button
                                        onClick={handleBackToTopics}
                                        className={`shrink-0 transition truncate max-w-[140px] sm:max-w-xs ${!selectedTopicId ? 'text-[#0c3b6b] font-black' : 'text-gray-400 hover:text-[#0c3b6b]'}`}
                                    >
                                        {activeChapter.title}
                                    </button>
                                </>
                            )}

                            {selectedTopicId && activeTopic && (
                                <>
                                    <span className="text-gray-300 shrink-0">/</span>
                                    <span className="text-[#f26522] font-black shrink-0 truncate max-w-[140px] sm:max-w-xs">
                                        {activeTopic.title}
                                    </span>
                                </>
                            )}
                        </div>

                        {/* View Switcher for Lessons view */}
                        {selectedTopicId && activeTopic && topicLessons.length > 0 && (
                            <div className="flex items-center gap-1 bg-gray-200/70 p-1 rounded-xl shrink-0">
                                <button
                                    onClick={() => setViewMode('map')}
                                    title="Adventure Map View"
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                                        viewMode === 'map'
                                            ? 'bg-white text-[#f26522] shadow-xs'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <MapIcon className="w-3.5 h-3.5" /> Map
                                </button>
                                <button
                                    onClick={() => setViewMode('list')}
                                    title="List View"
                                    className={`px-2.5 py-1 rounded-lg text-xs font-black flex items-center gap-1 transition ${
                                        viewMode === 'list'
                                            ? 'bg-white text-[#0c3b6b] shadow-xs'
                                            : 'text-gray-500 hover:text-gray-800'
                                    }`}
                                >
                                    <ListBulletIcon className="w-3.5 h-3.5" /> List
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ══════════════════════════════════════════════
                        VIEW 1: CHAPTERS LIST
                       ══════════════════════════════════════════════ */}
                    {!selectedChapterId && (
                        <div>
                            {/* Back to course selector button */}
                            <div className="px-5 pt-4 pb-2">
                                <button
                                    onClick={() => navigate('/student/courses')}
                                    className="flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-[#0c3b6b] transition"
                                >
                                    <ArrowLeftIcon className="w-3.5 h-3.5" /> Back to all subjects
                                </button>
                            </div>

                            {/* Column Header */}
                            <div className="grid grid-cols-12 bg-white border-b border-gray-100 px-5 py-3 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                                <div className="col-span-2 sm:col-span-1">#</div>
                                <div className="col-span-7 sm:col-span-8">Chapter Name</div>
                                <div className="col-span-3 text-right">Topics</div>
                            </div>

                            {chapters.length === 0 ? (
                                <div className="py-20 text-center px-4">
                                    <BookOpenIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="font-extrabold text-[#0c3b6b]">No chapters available yet</p>
                                    <p className="text-gray-400 text-xs font-bold mt-1">Please check back soon.</p>
                                </div>
                            ) : (
                                chapters.map((ch, idx) => {
                                    const chTopics = ch.topics || [];
                                    const chLessons = chTopics.flatMap(t => t.lessons || []);
                                    const chCompleted = chLessons.filter(l => l.completed).length;
                                    const isAllDone = chLessons.length > 0 && chCompleted === chLessons.length;

                                    return (
                                        <div
                                            key={ch.id}
                                            onClick={() => handleSelectChapter(ch.id)}
                                            className="grid grid-cols-12 border-b border-gray-100 px-5 py-4 items-center hover:bg-orange-50/40 cursor-pointer transition group"
                                        >
                                            <div className="col-span-2 sm:col-span-1 font-black text-gray-400 group-hover:text-[#f26522] text-sm">
                                                #{ch.order || idx + 1}
                                            </div>

                                            <div className="col-span-7 sm:col-span-8 flex items-center gap-3 pr-2 min-w-0">
                                                {ch.coverImage ? (
                                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-blue-50 shrink-0 border border-blue-100/80 shadow-xs">
                                                        <img src={ch.coverImage} alt={ch.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                    </div>
                                                ) : (
                                                    <div className="w-12 h-12 bg-blue-50 group-hover:bg-orange-100 rounded-2xl flex items-center justify-center text-blue-700 group-hover:text-[#f26522] font-extrabold text-lg shrink-0 transition border border-blue-100/80 group-hover:border-orange-200">
                                                        📁
                                                    </div>
                                                )}
                                                <div className="min-w-0 flex-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <p className="font-black text-[#0c3b6b] text-sm sm:text-base truncate group-hover:text-[#f26522] transition">
                                                            {ch.title}
                                                        </p>
                                                        {isAllDone && (
                                                            <FaCircleCheck className="w-4 h-4 text-green-500 shrink-0" />
                                                        )}
                                                    </div>
                                                    {ch.description && (
                                                        <p className="text-xs font-bold text-gray-400 truncate max-w-md mt-0.5">
                                                            {ch.description}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="col-span-3 flex items-center justify-end gap-2">
                                                <span className="px-2.5 py-1 bg-gray-100 group-hover:bg-orange-100 group-hover:text-[#f26522] rounded-full text-[11px] font-extrabold text-gray-600 transition">
                                                    {chTopics.length} Topics
                                                </span>
                                                <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-[#f26522] group-hover:translate-x-0.5 transition shrink-0" />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        VIEW 2: TOPICS GRID
                       ══════════════════════════════════════════════ */}
                    {selectedChapterId && !selectedTopicId && activeChapter && (
                        <div className="p-5 bg-gray-50/50">
                            {/* Chapter Header Banner */}
                            <div className="flex items-center gap-4 mb-6 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
                                <button
                                    onClick={handleBackToChapters}
                                    className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl hover:bg-orange-50 hover:text-[#f26522] hover:border-orange-200 text-gray-600 transition active:scale-95 shrink-0"
                                    title="Back to Chapters"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" />
                                </button>
                                
                                {activeChapter.coverImage && (
                                    <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200 shadow-xs">
                                        <img src={activeChapter.coverImage} alt={activeChapter.title} className="w-full h-full object-cover" />
                                    </div>
                                )}

                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                        CHAPTER #{activeChapter.order || 1}
                                    </p>
                                    <h2 className="text-lg font-black text-[#0c3b6b] truncate">
                                        {activeChapter.title}
                                    </h2>
                                    {activeChapter.description && (
                                        <p className="text-xs font-bold text-gray-500 line-clamp-1 mt-0.5">
                                            {activeChapter.description}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Topics Cards Grid */}
                            {topics.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 font-bold bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <QueueListIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    No topics in this chapter yet.
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {topics.map((topic, idx) => {
                                        const currentTopicLessons = topic.lessons || [];
                                        const currentTopicQuizzes = topic.quizzes || topic.quiz || [];
                                        const completedLessons = currentTopicLessons.filter(l => l.completed).length;
                                        const isTopicDone = currentTopicLessons.length > 0 && completedLessons === currentTopicLessons.length;

                                        return (
                                            <div
                                                key={topic.id}
                                                onClick={() => handleSelectTopic(topic.id)}
                                                className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-orange-300 transition cursor-pointer group flex flex-col justify-between relative overflow-hidden"
                                            >
                                                {/* Top Accent Line on hover */}
                                                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#f26522] to-[#ff8533] opacity-0 group-hover:opacity-100 transition-opacity" />

                                                <div>
                                                    {/* Topic Cover Image if available */}
                                                    {topic.coverImage && (
                                                        <div className="w-full h-32 rounded-xl overflow-hidden mb-3 bg-gray-100 border border-gray-100 shadow-xs">
                                                            <img
                                                                src={topic.coverImage}
                                                                alt={topic.title}
                                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="flex items-center justify-between mb-1.5">
                                                        <span className="text-[11px] font-black text-[#f26522] tracking-wider uppercase">
                                                            Topic {topic.order || idx + 1}
                                                        </span>
                                                        {isTopicDone && (
                                                            <span className="flex items-center gap-1 text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                                                                <FaCircleCheck className="w-3 h-3" /> Done
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-base font-black text-[#0c3b6b] mb-1 group-hover:text-[#f26522] transition line-clamp-2">
                                                        {topic.title}
                                                    </h3>

                                                    <p className="text-xs font-bold text-gray-400 line-clamp-2 leading-relaxed">
                                                        {topic.description || 'Explore the concepts and lessons in this topic.'}
                                                    </p>
                                                </div>

                                                {/* Meta stats footer */}
                                                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs font-bold text-gray-500">
                                                    <div className="flex items-center gap-3">
                                                        <span className="flex items-center gap-1 group-hover:text-[#0c3b6b] transition text-[11px]">
                                                            <QueueListIcon className="w-3.5 h-3.5 text-[#f26522]" /> {currentTopicLessons.length} Lessons
                                                        </span>
                                                        <span className="flex items-center gap-1 group-hover:text-[#0c3b6b] transition text-[11px]">
                                                            <QuestionMarkCircleIcon className="w-3.5 h-3.5 text-[#0c3b6b]" /> {currentTopicQuizzes.length} Quizzes
                                                        </span>
                                                    </div>
                                                    <ChevronRightIcon className="w-4 h-4 text-gray-300 group-hover:text-[#f26522] group-hover:translate-x-0.5 transition shrink-0" />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ══════════════════════════════════════════════
                        VIEW 3: LESSONS & QUIZZES (COMPACT KUTA SERPENTINE MAP & LIST)
                       ══════════════════════════════════════════════ */}
                    {selectedTopicId && activeTopic && (
                        <div className="p-4 sm:p-5 bg-[#fdfbf7] min-h-[500px] relative overflow-hidden">

                            {/* Background Accents in Kuta Tones */}
                            <div className="absolute top-10 left-6 text-2xl opacity-25 pointer-events-none select-none">☁️</div>
                            <div className="absolute top-36 right-6 text-xl opacity-20 pointer-events-none select-none">✨</div>
                            <div className="absolute bottom-20 left-6 text-2xl opacity-25 pointer-events-none select-none">☀️</div>

                            {/* Topic Journey Header Banner */}
                            <div className="flex items-center justify-between gap-3 mb-5 relative z-10 bg-white/90 backdrop-blur-sm p-3 rounded-2xl border border-orange-100/80 shadow-xs">
                                <div className="flex items-center gap-2.5">
                                    {activeTopic.coverImage && (
                                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-orange-100">
                                            <img src={activeTopic.coverImage} alt={activeTopic.title} className="w-full h-full object-cover" />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <span className="text-[10px] font-black uppercase text-[#f26522] tracking-wider block">
                                            Topic {activeTopic.order || 1}
                                        </span>
                                        <h2 className="text-sm font-black text-[#0c3b6b] truncate max-w-[170px] sm:max-w-xs">
                                            {activeTopic.title}
                                        </h2>
                                    </div>
                                </div>

                                <div className="bg-[#0c3b6b] text-white px-3 py-1 rounded-full text-xs font-black shadow-xs flex items-center gap-1.5 shrink-0">
                                    <FaStar className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                                    <span>{topicCompletedCount}/{topicLessons.length}</span>
                                </div>
                            </div>

                            {topicLessons.length === 0 ? (
                                <div className="py-16 text-center text-gray-400 font-bold bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                    <BookOpenIcon className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                                    No lessons in this topic yet.
                                </div>
                            ) : viewMode === 'map' ? (
                                /* ── 1. COMPACT SERPENTINE ROAD (KUTA THEME) ── */
                                <div className="relative py-2 max-w-[260px] sm:max-w-[300px] mx-auto flex flex-col items-center">

                                    {/* Continuous Compact Winding Track */}
                                    <div className="w-full flex flex-col items-center relative">
                                        
                                        {topicLessons.map((lesson, idx) => {
                                            const isCurrent = idx === currentActiveLessonIdx;
                                            const isCompleted = !!lesson.completed;
                                            const isLocked = !isCompleted && !isCurrent;
                                            const isEven = idx % 2 === 0; // Even loops Right, Odd loops Left

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    className="w-full relative flex items-center justify-center -my-1"
                                                    style={{ zIndex: topicLessons.length - idx }}
                                                >
                                                    {/* Compact Track Capsule Segment */}
                                                    <div className={`w-full h-22 relative flex items-center ${
                                                        isEven ? 'justify-end pr-2' : 'justify-start pl-2'
                                                    }`}>
                                                        {/* Outer Curved Track Loop */}
                                                        <div
                                                            className={`absolute top-0 bottom-0 ${
                                                                isEven
                                                                    ? 'right-0 w-[60%] rounded-r-[44px] border-r-[13px] border-y-[13px]'
                                                                    : 'left-0 w-[60%] rounded-l-[44px] border-l-[13px] border-y-[13px]'
                                                            } ${
                                                                isCurrent
                                                                    ? 'border-[#f26522] bg-orange-50/70 shadow-[0_4px_0_0_#b54611]'
                                                                    : isCompleted
                                                                        ? 'border-[#0c3b6b]/60 bg-blue-50/40 shadow-[0_3px_0_0_#072442]'
                                                                        : 'border-[#cbd5e1] bg-white/60 shadow-[0_3px_0_0_#94a3b8]'
                                                            } transition-all`}
                                                        />

                                                        {/* Stepping Stone Node Button inside the apex */}
                                                        <div className="relative z-10 flex flex-col items-center">
                                                            {isCurrent ? (
                                                                /* Active Current Lesson Node (Kuta Orange) */
                                                                <div className="flex flex-col items-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                                        className="w-14 h-14 rounded-full bg-gradient-to-b from-[#ff7836] to-[#f26522] border-3 border-white shadow-[0_5px_0_0_#b54611,0_8px_16px_rgba(242,101,34,0.35)] flex items-center justify-center text-white transition-all active:translate-y-1 active:shadow-[0_1px_0_0_#b54611] hover:scale-105"
                                                                    >
                                                                        <span className="text-xl font-black">{idx + 1}</span>
                                                                    </button>

                                                                    {/* "CURRENT" pill badge */}
                                                                    <div className="mt-1 bg-[#0c3b6b] text-white text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                                                        <span>CURRENT</span>
                                                                        <FaPlay className="w-1.5 h-1.5 text-[#f26522]" />
                                                                    </div>

                                                                    {/* Floating Lesson Title */}
                                                                    <span className="mt-0.5 text-[10px] font-black text-[#0c3b6b] bg-white/95 px-2.5 py-0.5 rounded-full shadow-xs border border-orange-100 max-w-[110px] truncate text-center">
                                                                        {lesson.title}
                                                                    </span>
                                                                </div>
                                                            ) : isCompleted ? (
                                                                /* Completed Lesson Node */
                                                                <div className="flex flex-col items-center">
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                                        className="w-13 h-13 rounded-full bg-white border-3 border-[#0c3b6b] shadow-[0_4px_0_0_#072442] flex items-center justify-center text-[#0c3b6b] hover:scale-105 active:translate-y-1 active:shadow-[0_1px_0_0_#072442] transition-all"
                                                                    >
                                                                        <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center">
                                                                            <FaCircleCheck className="w-5 h-5 text-green-600" />
                                                                        </div>
                                                                    </button>

                                                                    {/* Star rating pill */}
                                                                    <div className="flex gap-0.5 mt-0.5 text-yellow-400 text-[8px]">
                                                                        <FaStar className="fill-yellow-400" />
                                                                        <FaStar className="fill-yellow-400" />
                                                                        <FaStar className="fill-yellow-400" />
                                                                    </div>

                                                                    <span className="text-[9px] font-bold text-gray-600 bg-white/80 px-1.5 py-0.5 rounded max-w-[95px] truncate text-center">
                                                                        {lesson.title}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                /* Locked Lesson Node */
                                                                <div className="flex flex-col items-center opacity-85">
                                                                    <div className="w-12 h-12 rounded-full bg-[#f1f5f9] border-3 border-white shadow-[0_3px_0_0_#cbd5e1] flex items-center justify-center text-gray-400">
                                                                        <FaLock className="w-3.5 h-3.5 text-gray-400" />
                                                                    </div>
                                                                    <span className="mt-0.5 text-[9px] font-bold text-gray-400 max-w-[90px] truncate text-center">
                                                                        Lesson {idx + 1}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                    </div>

                                    {/* ── Topic Quiz Finish Castle / Trophy Milestone ── */}
                                    {topicQuizzes.length > 0 && (
                                        <div className="w-full mt-6 pt-4 flex flex-col items-center text-center relative z-20">
                                            <div className="mb-1.5 bg-gradient-to-r from-[#f26522] to-[#ff8533] text-white text-[9px] font-black uppercase tracking-widest py-0.5 px-3 rounded-full shadow-xs flex items-center gap-1">
                                                <span>FINAL CHALLENGE</span>
                                                <FaTrophy className="w-2.5 h-2.5 text-yellow-200" />
                                            </div>

                                            {topicQuizzes.map((quiz) => {
                                                const isQuizCompleted = !!quiz.completed;
                                                const isAvailable = allTopicLessonsCompleted || isQuizCompleted;

                                                return (
                                                    <div key={quiz.id} className="flex flex-col items-center mt-1">
                                                        <button
                                                            type="button"
                                                            disabled={!isAvailable}
                                                            onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                                                            className={`w-18 h-18 rounded-[24px] p-1.5 flex flex-col items-center justify-center transition-all ${
                                                                isAvailable
                                                                    ? 'bg-gradient-to-b from-[#ff7836] to-[#f26522] border-3 border-white shadow-[0_6px_0_0_#b54611,0_10px_20px_rgba(242,101,34,0.35)] hover:scale-105 active:translate-y-1 active:shadow-[0_1px_0_0_#b54611]'
                                                                    : 'bg-gray-200 border-3 border-white text-gray-400 shadow-[0_3px_0_0_#cbd5e1] cursor-not-allowed opacity-75'
                                                            }`}
                                                        >
                                                            <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-xs">
                                                                <FaTrophy className={`w-5 h-5 ${isAvailable ? 'text-[#f26522] animate-bounce-subtle' : 'text-gray-400'}`} />
                                                            </div>
                                                        </button>

                                                        <div className="mt-2 bg-[#0c3b6b] text-white px-3.5 py-1 rounded-full shadow-xs text-center">
                                                            <span className="font-black text-[11px] uppercase tracking-wider block">
                                                                {isQuizCompleted ? 'Retake Quiz 🏆' : isAvailable ? 'Take Quiz 🏆' : 'Quiz Locked 🔒'}
                                                            </span>
                                                        </div>
                                                        <span className="text-[10px] font-bold text-gray-500 mt-0.5">
                                                            {quiz.title} • {quiz.passingScore}% pass mark
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                /* ── 2. COMPACT LIST VIEW ── */
                                <div className="space-y-3 max-w-2xl mx-auto">
                                    <div className="space-y-2">
                                        {topicLessons.map((lesson, lIdx) => {
                                            const isCompleted = !!lesson.completed;
                                            const isLocked = !isCompleted && lIdx !== currentActiveLessonIdx;
                                            const blockCount = (lesson.contents || []).length;

                                            return (
                                                <div
                                                    key={lesson.id}
                                                    onClick={() => !isLocked && navigate(`/student/lessons/${lesson.id}`)}
                                                    className={`bg-white rounded-2xl p-3.5 border border-gray-200 shadow-xs flex items-center justify-between transition group ${
                                                        isLocked
                                                            ? 'opacity-65 cursor-not-allowed bg-gray-50/50'
                                                            : 'hover:border-orange-300 hover:shadow cursor-pointer'
                                                    }`}
                                                >
                                                    <div className="flex items-center gap-3 min-w-0 flex-1 pr-2">
                                                        {lesson.coverImage ? (
                                                            <div className="relative w-12 h-11 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200/80 shadow-xs">
                                                                <img src={lesson.coverImage} alt={lesson.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                                                <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                                                                    {isCompleted ? (
                                                                        <CheckCircleIcon className="w-4 h-4 text-white drop-shadow-md" />
                                                                    ) : isLocked ? (
                                                                        <LockClosedIcon className="w-3.5 h-3.5 text-white drop-shadow-md" />
                                                                    ) : (
                                                                        <PlayCircleIcon className="w-4 h-4 text-white drop-shadow-md" />
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                                                isCompleted
                                                                    ? 'bg-green-50 text-green-600'
                                                                    : isLocked
                                                                        ? 'bg-gray-100 text-gray-400'
                                                                        : 'bg-orange-50 text-[#f26522] group-hover:bg-orange-100 transition'
                                                            }`}>
                                                                {isCompleted ? (
                                                                    <CheckCircleIcon className="w-5 h-5" />
                                                                ) : isLocked ? (
                                                                    <LockClosedIcon className="w-4 h-4" />
                                                                ) : (
                                                                    <PlayCircleIcon className="w-5 h-5" />
                                                                )}
                                                            </div>
                                                        )}

                                                        <div className="min-w-0 flex-1">
                                                            <p className="font-extrabold text-gray-800 text-xs sm:text-sm truncate group-hover:text-[#0c3b6b] transition">
                                                                Lesson {lesson.order || lIdx + 1}: {lesson.title}
                                                            </p>
                                                            <div className="flex items-center gap-2 mt-0.5">
                                                                <span className="text-[9px] bg-gray-100 text-gray-500 font-bold px-1.5 py-0.5 rounded uppercase">
                                                                    {blockCount} {blockCount === 1 ? 'BLOCK' : 'BLOCKS'}
                                                                </span>
                                                                {isCompleted && (
                                                                    <span className="text-[9px] font-black text-green-600 flex items-center gap-0.5">
                                                                        <FaStar className="w-2 h-2 fill-yellow-400 text-yellow-400" /> Done
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="shrink-0">
                                                        {isLocked ? (
                                                            <span className="text-gray-400 font-bold text-xs px-2.5 py-1 bg-gray-100 rounded-lg flex items-center gap-1">
                                                                <LockClosedIcon className="w-3 h-3" /> Locked
                                                            </span>
                                                        ) : isCompleted ? (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/student/lessons/${lesson.id}`); }}
                                                                className="text-[#0c3b6b] font-bold text-xs hover:underline px-2.5 py-1 bg-blue-50 hover:bg-blue-100 rounded-lg transition"
                                                            >
                                                                Review →
                                                            </button>
                                                        ) : (
                                                            <button
                                                                type="button"
                                                                onClick={(e) => { e.stopPropagation(); navigate(`/student/lessons/${lesson.id}`); }}
                                                                className="text-white font-bold text-xs px-3 py-1 bg-[#f26522] hover:bg-orange-600 rounded-lg transition shadow-xs"
                                                            >
                                                                Start →
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
