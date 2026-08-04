import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaLock, FaCircleCheck, FaStar,
    FaPen, FaHashtag, FaLeaf, FaPalette, FaInbox,
} from 'react-icons/fa6';
import api from '../../services/api';

const chapterStyles = [
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', accent: 'bg-blue-500', Icon: FaPen },
    { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', accent: 'bg-orange-500', Icon: FaHashtag },
    { iconBg: 'bg-green-100', iconColor: 'text-green-600', accent: 'bg-blue-500', Icon: FaLeaf },
    { iconBg: 'bg-[#eee0d4]', iconColor: 'text-[#9a5a2b]', accent: 'bg-[#ec9c66]', Icon: FaPalette },
];

const lessonStatus = (lesson) => {
    if (lesson.locked) {
        return { badge: 'Locked', badgeClass: 'text-gray-500', icon: <FaLock className="w-5 h-5 text-gray-400" /> };
    }
    if (lesson.completed) {
        return { badge: 'Completed', badgeClass: 'text-green-600', icon: <FaCircleCheck className="w-5 h-5 text-green-500" /> };
    }
    return { badge: 'In Progress', badgeClass: 'text-orange-500', icon: <FaStar className="w-5 h-5 text-orange-500" /> };
};

export default function CourseDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get(`/courses/${id}`)
            .then(res => setCourse(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-kidOrange border-t-transparent"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gradient-to-b from-blue-100 via-white to-orange-100 p-8 text-center">
                <div>
                    <FaInbox className="mb-4 mx-auto text-5xl text-gray-400" />
                    <p className="font-bold text-gray-500">Course not found.</p>
                </div>
            </div>
        );
    }

    const chapters = (course.chapters || []).sort((a, b) => a.order - b.order);
    const totalLessons = chapters.flatMap(ch => ch.topics || []).reduce((sum, topic) => sum + (topic.lessons || []).length, 0);
    const completedLessons = chapters.flatMap(ch => ch.topics || []).reduce((sum, topic) => sum + (topic.lessons || []).filter(lesson => lesson.completed).length, 0);
    const progress = totalLessons ? Math.round((completedLessons / totalLessons) * 100) : 0;

    return (
        <div className="min-h-screen bg-[#f6f3ee] pb-28">
            <div className="mx-auto max-w-md">
                <div className="rounded-b-[36px] bg-[#7eb1f3] px-4 pb-10 pt-12 text-center text-white shadow-[0_10px_24px_rgba(3,85,160,0.25)]">
                    <button
                        onClick={() => navigate(-1)}
                        className="absolute left-4 top-6 rounded-full bg-white/20 p-2.5 text-white backdrop-blur transition hover:bg-white/30"
                    >
                        <FaChevronLeft className="h-5 w-5" />
                    </button>

                    <p className="mb-2 text-[11px] font-extrabold uppercase tracking-[0.24em] text-white/80">Kuta Learning</p>
                    <h1 className="text-[32px] font-black leading-tight">{course.title}</h1>
                    {course.description && (
                        <p className="mx-auto mt-3 max-w-[280px] text-[14px] font-medium leading-relaxed text-white/90">{course.description}</p>
                    )}

                    <div className="mt-4 flex flex-wrap justify-center gap-2">
                        <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[12px] font-bold">Grade {course.gradeLevel}</span>
                        <span className="rounded-full border border-white/30 bg-white/15 px-3 py-1 text-[12px] font-bold">{chapters.length} Modules</span>
                    </div>

                    {course.coverImage && (
                        <div className="mt-5 flex justify-center">
                            <img src={course.coverImage} alt={course.title} className="h-28 w-28 rounded-[22px] object-cover shadow-xl ring-4 ring-white/30" />
                        </div>
                    )}
                </div>

                <div className="-mt-6 space-y-4 px-4">
                    {chapters.length === 0 ? (
                        <div className="rounded-[28px] bg-white p-6 text-center shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                            <FaInbox className="mb-3 mx-auto text-4xl text-gray-400" />
                            <p className="font-bold text-gray-400">No modules yet. Check back soon!</p>
                        </div>
                    ) : (
                        chapters.map((chapter, chIdx) => {
                            const style = chapterStyles[chIdx % chapterStyles.length];
                            const topics = (chapter.topics || []).sort((a, b) => a.order - b.order);
                            const chapterLessons = topics.reduce((sum, topic) => sum + (topic.lessons || []).length, 0);
                            const chapterCompleted = topics.reduce((sum, topic) => sum + (topic.lessons || []).filter(lesson => lesson.completed).length, 0);
                            const chapterProgress = chapterLessons ? Math.round((chapterCompleted / chapterLessons) * 100) : 0;

                            return (
                                <div key={chapter.id} className="rounded-[30px] bg-white p-4 shadow-[0_6px_18px_rgba(0,0,0,0.04)]">
                                    <div className="flex items-center gap-3">
                                        <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.iconBg} shadow-sm`}>
                                            {chapter.coverImage ? (
                                                <img src={chapter.coverImage} alt={chapter.title} className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                <style.Icon className={`text-3xl ${style.iconColor}`} />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-extrabold uppercase tracking-[0.18em] text-gray-500">Module {chIdx + 1}</p>
                                            <h3 className="truncate text-[18px] font-extrabold text-[#222222]">{chapter.title}</h3>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-[11px] font-bold text-gray-500">{chapterProgress}%</div>
                                            <div className={`mt-1 h-1.5 w-16 rounded-full ${style.iconBg}`}>
                                                <div className={`h-1.5 rounded-full ${style.accent}`} style={{ width: `${chapterProgress}%` }} />
                                            </div>
                                        </div>
                                    </div>

                                    {topics.length > 0 && (
                                        <div className="mt-4 space-y-3">
                                            {topics.map((topic) => {
                                                const lessons = (topic.lessons || []).sort((a, b) => a.order - b.order);
                                                const topicCompleted = lessons.filter(lesson => lesson.completed).length;
                                                const topicProgress = lessons.length ? Math.round((topicCompleted / lessons.length) * 100) : 0;
                                                const quiz = (topic.quizzes || topic.quiz || [])[0];
                                                const allLessonsDone = lessons.length > 0 && lessons.every(l => l.completed);
                                                const quizAvailable = topic.quizAvailable || (quiz && allLessonsDone);

                                                return (
                                                    <div
                                                        key={topic.id}
                                                        className="w-full rounded-[24px] bg-[#f8f7f4] p-3 text-left shadow-[inset_0_0_0_1px_rgba(0,0,0,0.03)]"
                                                    >
                                                        <div className="flex items-start gap-3">
                                                            <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.iconBg}`}>
                                                                {topic.coverImage ? (
                                                                    <img src={topic.coverImage} alt={topic.title} className="h-full w-full rounded-full object-cover" />
                                                                ) : (
                                                                    <style.Icon className={`text-3xl ${style.iconColor}`} />
                                                                )}
                                                            </div>

                                                            <div className="min-w-0 flex-1">
                                                                <div className="flex items-start justify-between gap-2">
                                                                    <div className="min-w-0 flex-1">
                                                                        <h4 className="truncate text-[17px] font-extrabold text-[#222222]">{topic.title}</h4>
                                                                        {topic.description && (
                                                                            <p className="mt-1 text-[12px] text-gray-500">{topic.description}</p>
                                                                        )}
                                                                    </div>

                                                                    <div className="flex items-center gap-1 text-[11px] font-bold text-gray-500">
                                                                        <span>{topicProgress}%</span>
                                                                    </div>
                                                                </div>

                                                                <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#d9dee5]">
                                                                    <div className={`h-full rounded-full ${style.accent}`} style={{ width: `${topicProgress}%` }} />
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Individual lessons */}
                                                        {lessons.length > 0 && (
                                                            <div className="mt-3 space-y-2">
                                                                {lessons.map((lesson, lessonIdx) => {
                                                                    const status = lessonStatus(lesson);
                                                                    return (
                                                                        <button
                                                                            key={lesson.id}
                                                                            type="button"
                                                                            disabled={lesson.locked}
                                                                            onClick={() => !lesson.locked && navigate(`/student/lessons/${lesson.id}`)}
                                                                            className={`w-full flex items-center justify-between gap-3 rounded-[18px] bg-white px-3 py-2.5 text-left transition active:scale-[0.98] ${
                                                                                lesson.locked ? 'opacity-60 cursor-not-allowed' : 'hover:bg-blue-50'
                                                                            }`}
                                                                        >
                                                                            <div className="flex items-center gap-2 min-w-0">
                                                                                {status.icon}
                                                                                <span className="text-[13px] font-bold text-gray-800 truncate">
                                                                                    {lessonIdx + 1}. {lesson.title || `Lesson ${lessonIdx + 1}`}
                                                                                </span>
                                                                            </div>
                                                                            <span className={`text-[10px] font-extrabold uppercase shrink-0 ${status.badgeClass}`}>
                                                                                {status.badge}
                                                                            </span>
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        )}

                                                        {/* Quiz button — only after all lessons done */}
                                                        {quizAvailable && quiz && (
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/student/quiz/${quiz.id}`)}
                                                                className="mt-3 w-full flex items-center justify-center gap-2 rounded-[18px] bg-gradient-to-r from-yellow-400 to-yellow-500 px-3 py-2.5 text-[13px] font-extrabold text-yellow-900 shadow-sm transition active:scale-[0.98]"
                                                            >
                                                                <FaStar className="h-4 w-4" />
                                                                Take Quiz
                                                            </button>
                                                        )}

                                                        {lessons.length === 0 && (
                                                            <div className="mt-3 rounded-[18px] bg-white px-3 py-2 text-[12px] font-bold text-gray-400">
                                                                No lessons yet
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
