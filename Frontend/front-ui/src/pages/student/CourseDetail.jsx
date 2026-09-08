import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaLock, FaCircleCheck, FaStar,
    FaTrophy, FaInbox, FaPlay
} from 'react-icons/fa6';
import api from '../../services/api';

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);
    const [selectedChapterIdx, setSelectedChapterIdx] = useState(0);

    useEffect(() => {
        api.get(`/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center bg-[#f7f5f0]">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f26522] border-t-transparent"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex min-h-screen items-center justify-center p-8 text-center bg-[#f7f5f0]">
                <div className="bg-white p-8 rounded-[32px] shadow-sm border border-orange-100 max-w-sm w-full">
                    <FaInbox className="mb-4 mx-auto text-5xl text-[#f26522]/40" />
                    <p className="font-extrabold text-[#0c3b6b]">Course not found.</p>
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="mt-4 px-6 py-2.5 bg-[#f26522] text-white font-black text-sm rounded-full shadow-[0_4px_0_0_#b54611]"
                    >
                        Back to Courses
                    </button>
                </div>
            </div>
        );
    }

    const chapters = (course.chapters || []).sort((a, b) => a.order - b.order);
    const currentChapter = chapters[selectedChapterIdx] || chapters[0];
    const topics = currentChapter ? (currentChapter.topics || []).sort((a, b) => a.order - b.order) : [];

    // Flatten all lessons in this chapter
    const allLessons = topics.flatMap(t =>
        (t.lessons || []).map(l => ({
            ...l,
            topicTitle: t.title,
            quizId: t.quizzes?.[0]?.id || t.quiz?.[0]?.id
        }))
    );
    const completedCount = allLessons.filter(l => l.completed).length;
    const totalCount = allLessons.length;
    const firstUnfinishedIdx = allLessons.findIndex(l => !l.completed);
    const currentActiveIdx = firstUnfinishedIdx === -1 ? allLessons.length - 1 : firstUnfinishedIdx;

    // Get the topic quiz (if available)
    const primaryQuiz = topics.flatMap(t => t.quizzes || t.quiz || [])[0];
    const allLessonsCompleted = totalCount > 0 && completedCount === totalCount;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    // Alternating horizontal offsets for the winding serpentine path
    const getOffsetClass = (index) => {
        const pattern = [
            'translate-x-0',        // Center
            '-translate-x-12 sm:-translate-x-16', // Left
            'translate-x-0',        // Center
            'translate-x-12 sm:translate-x-16',   // Right
        ];
        return pattern[index % pattern.length];
    };

    return (
        <div className="min-h-screen bg-[#f7f5f0] pb-32">
            {/* Header with Kuta Navy & Orange gradient */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] text-white pt-6 pb-6 px-4 rounded-b-[32px] shadow-[0_8px_25px_rgba(12,59,107,0.22)] sticky top-0 z-30">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition active:scale-95 shadow-sm"
                    >
                        <FaChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="text-center px-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-200 block">
                            {course.title}
                        </span>
                        <h1 className="text-lg font-black tracking-tight truncate max-w-[200px]">
                            {currentChapter?.title || 'Chapter Journey'}
                        </h1>
                    </div>

                    {/* Progress pill */}
                    <div className="bg-white/20 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-xs font-black">
                        <FaStar className="text-yellow-300 w-3.5 h-3.5 fill-yellow-300" />
                        <span>{completedCount}/{totalCount}</span>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-white/20 h-2 rounded-full overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-yellow-300 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Chapter Selector Tabs if multiple chapters */}
                {chapters.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto mt-3 pb-1 no-scrollbar">
                        {chapters.map((ch, idx) => (
                            <button
                                key={ch.id}
                                onClick={() => setSelectedChapterIdx(idx)}
                                className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                                    selectedChapterIdx === idx
                                        ? 'bg-white text-[#0c3b6b] shadow-md scale-105'
                                        : 'bg-white/20 text-white hover:bg-white/30'
                                }`}
                            >
                                Module {idx + 1}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Journey Map Canvas */}
            <div className="px-4 mt-4 max-w-md mx-auto">
                <div className="relative bg-white/80 backdrop-blur-sm rounded-[36px] p-6 shadow-[0_8px_30px_rgba(12,59,107,0.06)] border border-orange-100 overflow-hidden min-h-[580px]">
                    
                    {/* Decorative world accents */}
                    <div className="absolute top-8 left-4 text-2xl opacity-40 pointer-events-none select-none">☁️</div>
                    <div className="absolute top-1/3 right-4 text-xl opacity-30 pointer-events-none select-none">✨</div>
                    <div className="absolute bottom-1/4 left-5 text-2xl opacity-40 pointer-events-none select-none">🌳</div>
                    <div className="absolute bottom-12 right-6 text-2xl opacity-40 pointer-events-none select-none">🌟</div>

                    {allLessons.length === 0 ? (
                        <div className="py-24 text-center">
                            <FaInbox className="text-5xl text-gray-300 mx-auto mb-3" />
                            <h3 className="text-base font-black text-gray-600">No Lessons Yet</h3>
                            <p className="text-xs font-bold text-gray-400 mt-1">Lessons will appear here once published.</p>
                        </div>
                    ) : (
                        /* Gamified Serpentine Path */
                        <div className="relative flex flex-col items-center py-6 space-y-8">
                            {/* Curved Path S-Road SVG in the background */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
                                <defs>
                                    <linearGradient id="roadGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                        <stop offset="0%" stopColor="#f26522" stopOpacity="0.4" />
                                        <stop offset="100%" stopColor="#0c3b6b" stopOpacity="0.3" />
                                    </linearGradient>
                                </defs>
                            </svg>

                            {allLessons.map((lesson, idx) => {
                                const isCurrent = idx === currentActiveIdx;
                                const isCompleted = !!lesson.completed;
                                const offsetClass = getOffsetClass(idx);

                                return (
                                    <div
                                        key={lesson.id}
                                        className={`relative flex flex-col items-center transition-all duration-300 ${offsetClass}`}
                                        style={{ zIndex: 10 }}
                                    >
                                        {/* Connector Track to next node */}
                                        {idx > 0 && (
                                            <div className="absolute -top-7 w-1 h-7 border-l-4 border-dashed border-orange-300/80 -z-10" />
                                        )}

                                        {/* Stepping Stone Node */}
                                        {isCurrent ? (
                                            /* Active Current Lesson Stone (3D Orange & Pulsing) */
                                            <div className="flex flex-col items-center group">
                                                {/* Speech bubble prompt above active lesson */}
                                                <div className="mb-2 bg-[#0c3b6b] text-white text-[10px] font-black py-1 px-3 rounded-full shadow-md animate-bounce-subtle flex items-center gap-1">
                                                    <span>START</span>
                                                    <FaPlay className="w-2 h-2 text-[#f26522]" />
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                    className="relative w-20 h-20 rounded-[28px] bg-gradient-to-b from-[#ff7836] to-[#f26522] border-4 border-white shadow-[0_8px_0_0_#b54611,0_12px_20px_rgba(242,101,34,0.35)] flex items-center justify-center transition-all active:translate-y-1.5 active:shadow-[0_2px_0_0_#b54611] hover:scale-105"
                                                >
                                                    <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center text-white shadow-inner">
                                                        <span className="text-2xl font-black">{idx + 1}</span>
                                                    </div>
                                                </button>

                                                {/* Lesson Title Card */}
                                                <div className="mt-2 bg-white px-3 py-1 rounded-full shadow-sm border border-orange-100 max-w-[130px] text-center">
                                                    <span className="text-xs font-black text-[#0c3b6b] truncate block">
                                                        {lesson.title || `Lesson ${idx + 1}`}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : isCompleted ? (
                                            /* Completed Lesson Stone (Navy circle with green check & stars) */
                                            <div className="flex flex-col items-center">
                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                    className="w-16 h-16 rounded-full bg-white border-4 border-[#0c3b6b] shadow-[0_5px_0_0_#072442] flex items-center justify-center text-[#0c3b6b] hover:scale-105 active:translate-y-1 active:shadow-[0_2px_0_0_#072442] transition-all"
                                                >
                                                    <div className="w-11 h-11 rounded-full bg-green-50 flex items-center justify-center">
                                                        <FaCircleCheck className="w-6 h-6 text-green-500" />
                                                    </div>
                                                </button>

                                                {/* Star rating under completed lesson */}
                                                <div className="flex gap-0.5 mt-1 text-yellow-400 text-[10px]">
                                                    <FaStar className="fill-yellow-400" />
                                                    <FaStar className="fill-yellow-400" />
                                                    <FaStar className="fill-yellow-400" />
                                                </div>

                                                <span className="mt-0.5 text-[11px] font-bold text-gray-600 max-w-[110px] text-center truncate">
                                                    {lesson.title || `Lesson ${idx + 1}`}
                                                </span>
                                            </div>
                                        ) : (
                                            /* Locked Lesson Stone (Soft grey circle with lock) */
                                            <div className="flex flex-col items-center opacity-65">
                                                <div className="w-14 h-14 rounded-full bg-[#e2e8f0] border-4 border-white shadow-[0_4px_0_0_#cbd5e1] flex items-center justify-center text-gray-400">
                                                    <FaLock className="w-4 h-4 text-gray-400" />
                                                </div>
                                                <span className="mt-1 text-[10px] font-bold text-gray-400 max-w-[100px] text-center truncate">
                                                    {lesson.title || `Lesson ${idx + 1}`}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}

                            {/* Quiz Castle / Trophy Finish Line Milestone */}
                            {primaryQuiz && (
                                <div className="relative pt-6 flex flex-col items-center" style={{ zIndex: 10 }}>
                                    <div className="absolute -top-1 w-1 h-7 border-l-4 border-dashed border-orange-300/80 -z-10" />

                                    <div className="mb-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-[10px] font-black py-0.5 px-3 rounded-full shadow-sm flex items-center gap-1">
                                        <span>FINAL CHALLENGE</span>
                                        <FaTrophy className="w-2.5 h-2.5 text-yellow-100" />
                                    </div>

                                    <button
                                        type="button"
                                        disabled={!allLessonsCompleted && !course.quizAvailable}
                                        onClick={() => navigate(`/student/quiz/${primaryQuiz.id}`)}
                                        className={`group relative w-24 h-24 rounded-[32px] p-2 flex flex-col items-center justify-center transition-all ${
                                            allLessonsCompleted || course.quizAvailable
                                                ? 'bg-gradient-to-b from-[#ff8d4d] to-[#f26522] border-4 border-white shadow-[0_8px_0_0_#b54611,0_12px_24px_rgba(242,101,34,0.4)] hover:scale-105 active:translate-y-1.5 active:shadow-[0_2px_0_0_#b54611]'
                                                : 'bg-gray-200 border-4 border-white text-gray-400 shadow-[0_4px_0_0_#cbd5e1] cursor-not-allowed opacity-75'
                                        }`}
                                    >
                                        <div className="w-14 h-14 rounded-2xl bg-white flex items-center justify-center mb-1 shadow-sm">
                                            <FaTrophy className={`w-8 h-8 ${allLessonsCompleted || course.quizAvailable ? 'text-amber-500 animate-bounce-subtle' : 'text-gray-400'}`} />
                                        </div>
                                    </button>

                                    <div className="mt-2 bg-[#0c3b6b] text-white px-4 py-1.5 rounded-full shadow-sm text-center">
                                        <span className="font-black text-xs uppercase tracking-wider block">
                                            {allLessonsCompleted || course.quizAvailable ? 'Take Chapter Quiz 🏆' : 'Quiz Locked 🔒'}
                                        </span>
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
