import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, PlayCircleIcon, LockClosedIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';

// Colors for chapters/topics cycling
const chapterStyles = [
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', accentBar: 'bg-blue-500', borderColor: 'border-blue-200', icon: '📝' },
    { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', accentBar: 'bg-orange-500', borderColor: 'border-orange-200', icon: '🔢' },
    { iconBg: 'bg-green-100', iconColor: 'text-green-600', accentBar: 'bg-green-500', borderColor: 'border-green-200', icon: '🌿' },
    { iconBg: 'bg-purple-100', iconColor: 'text-purple-600', accentBar: 'bg-purple-500', borderColor: 'border-purple-200', icon: '🎨' },
];

const lessonStatusIcon = (idx) => {
    if (idx === 0) return { icon: <CheckCircleIcon className="w-6 h-6 text-green-500" />, label: 'Completed', labelColor: 'text-green-500' };
    if (idx === 1) return { icon: <span className="text-yellow-400 text-lg">⭐</span>, label: 'In Progress', labelColor: 'text-orange-500' };
    return { icon: <LockClosedIcon className="w-5 h-5 text-gray-400" />, label: 'Locked', labelColor: 'text-gray-400' };
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) {
        return (
            <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-orange-100 flex items-center justify-center p-8 text-center">
                <div>
                    <span className="text-5xl block mb-4">📭</span>
                    <p className="font-bold text-gray-500">Course not found.</p>
                </div>
            </div>
        );
    }

    const chapters = (course.chapters || []).sort((a, b) => a.order - b.order);

    return (
        <div className="bg-gradient-to-b from-blue-100 via-white to-orange-50 min-h-screen pb-32">

            {/* Hero Header — blue card matching Image 2 right panel */}
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-b-[40px] px-6 pt-14 pb-20 relative text-center shadow-xl">
                <button
                    onClick={() => navigate(-1)}
                    className="absolute top-6 left-4 bg-white/20 p-2.5 rounded-full text-white hover:bg-white/30 backdrop-blur transition"
                >
                    <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <p className="text-white/80 font-bold tracking-widest text-[11px] mb-2 uppercase">Kuta Learning</p>
                <h1 className="text-[32px] font-black text-white mb-3 leading-tight">{course.title}</h1>
                {course.description && (
                    <p className="text-white/90 text-[14px] font-medium mb-4 leading-relaxed">
                        {course.description}
                    </p>
                )}
                <div className="flex gap-3 justify-center flex-wrap mt-2">
                    <span className="bg-white/20 text-white text-[12px] font-bold px-3 py-1 rounded-full border border-white/30">
                        Grade {course.gradeLevel}
                    </span>
                    <span className="bg-white/20 text-white text-[12px] font-bold px-3 py-1 rounded-full border border-white/30">
                        {chapters.length} Chapters
                    </span>
                </div>
                {course.coverImage && (
                    <div className="mt-5">
                        <img
                            src={course.coverImage}
                            alt="Course"
                            className="w-32 h-32 object-cover rounded-2xl mx-auto shadow-xl border-4 border-white/30"
                        />
                    </div>
                )}
            </div>

            {/* Chapter list, each expands to show topics → lessons */}
            <div className="px-5 -mt-8 relative z-10 space-y-5">
                {chapters.length === 0 ? (
                    <div className="bg-white rounded-3xl p-8 shadow-md text-center border border-gray-100">
                        <span className="text-4xl block mb-3">📭</span>
                        <p className="font-bold text-gray-400">No chapters yet. Check back soon!</p>
                    </div>
                ) : (
                    chapters.map((chapter, chIdx) => {
                        const style = chapterStyles[chIdx % chapterStyles.length];
                        const topics = (chapter.topics || []).sort((a, b) => a.order - b.order);
                        let lessonGlobalIdx = 0;

                        return (
                            <div key={chapter.id} className="bg-white rounded-[28px] shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100 overflow-hidden">
                                {/* Chapter Header */}
                                <div className={`flex items-center gap-4 p-5 border-b border-gray-50`}>
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${style.iconBg} shadow-sm`}>
                                        {chapter.coverImage ? (
                                            <img src={chapter.coverImage} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <span className={`text-3xl ${style.iconColor}`}>{style.icon}</span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${style.iconColor}`}>Chapter {chIdx + 1}</span>
                                        <h3 className="font-extrabold text-gray-900 text-[18px] truncate leading-tight">{chapter.title}</h3>
                                        {chapter.description && (
                                            <p className="text-[12px] text-gray-500 font-medium line-clamp-2 mt-0.5">{chapter.description}</p>
                                        )}
                                    </div>
                                </div>

                                {/* Topics + Lessons */}
                                {topics.length > 0 && (
                                    <div className="divide-y divide-gray-50">
                                        {topics.map((topic) => {
                                            const lessons = (topic.lessons || []).sort((a, b) => a.order - b.order);
                                            return (
                                                <div key={topic.id}>
                                                    {/* Topic title row */}
                                                    <div className="flex items-center gap-2 px-5 py-3 bg-gray-50/60">
                                                        {topic.coverImage ? (
                                                            <img src={topic.coverImage} className="w-7 h-7 rounded-lg object-cover" alt="" />
                                                        ) : (
                                                            <span className="text-base">📌</span>
                                                        )}
                                                        <p className="text-[13px] font-bold text-gray-700">{topic.title}</p>
                                                    </div>
                                                    {/* Lessons */}
                                                    {lessons.map((lesson) => {
                                                        const status = lessonStatusIcon(lessonGlobalIdx++);
                                                        return (
                                                            <div
                                                                key={lesson.id}
                                                                onClick={() => navigate(`/student/lessons/${lesson.id}`)}
                                                                className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-orange-50/40 transition active:scale-[0.98]"
                                                            >
                                                                {/* Lesson icon */}
                                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 overflow-hidden ${style.iconBg}`}>
                                                                    {lesson.coverImage ? (
                                                                        <img src={lesson.coverImage} className="w-full h-full object-cover rounded-2xl" alt="" />
                                                                    ) : (
                                                                        <PlayCircleIcon className={`w-7 h-7 ${style.iconColor}`} />
                                                                    )}
                                                                </div>
                                                                <div className="flex-1 min-w-0">
                                                                    <h4 className="font-bold text-gray-800 text-[15px] truncate">{lesson.title}</h4>
                                                                    {lesson.description && (
                                                                        <p className="text-[11px] text-gray-500 font-medium line-clamp-1">{lesson.description}</p>
                                                                    )}
                                                                </div>
                                                                {/* Status */}
                                                                <div className={`flex flex-col items-center text-[10px] font-bold ${status.labelColor} shrink-0`}>
                                                                    {status.icon}
                                                                    <span className="mt-0.5">{status.label}</span>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}

                                {topics.length === 0 && (
                                    <div className="px-5 py-4 text-center text-gray-400 font-medium text-sm">No topics yet in this chapter.</div>
                                )}
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
}
