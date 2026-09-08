import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaLock, FaCircleCheck, FaStar, FaPen, FaHashtag, FaLeaf, FaPalette, FaBookOpen } from 'react-icons/fa6';
import api from '../../services/api';

const defaultStyles = [
    { iconBg: 'bg-orange-50', iconColor: 'text-[#f26522]', barBg: 'bg-[#f26522]', Icon: FaPen },
    { iconBg: 'bg-blue-50', iconColor: 'text-[#0c3b6b]', barBg: 'bg-[#0c3b6b]', Icon: FaHashtag },
    { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', barBg: 'bg-amber-500', Icon: FaLeaf },
    { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', barBg: 'bg-emerald-500', Icon: FaPalette },
];

export default function CourseList() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/courses')
            .then(res => setCourses(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="w-12 h-12 border-4 border-[#f26522] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-28">
            {/* Header Banner with Kuta Navy to Orange Gradient */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] pt-10 pb-8 px-6 rounded-b-[36px] text-white shadow-[0_10px_25px_rgba(12,59,107,0.22)] text-center relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-[28px] font-black tracking-tight">Lessons</h1>
                    <span className="text-2xl">📚</span>
                </div>
                <p className="text-[13px] font-bold text-orange-100 max-w-[260px] mx-auto leading-relaxed">
                    Choose a subject to start your learning journey!
                </p>
            </div>

            {/* Subject Cards List */}
            <div className="px-4 mt-6 space-y-4">
                {courses.length === 0 ? (
                    <div className="rounded-[32px] bg-white p-8 text-center shadow-[0_6px_20px_rgba(12,59,107,0.06)] border border-orange-100">
                        <FaBookOpen className="text-4xl text-[#f26522]/40 mx-auto mb-3" />
                        <h3 className="text-lg font-black text-[#0c3b6b] mb-1">No Subjects Yet</h3>
                        <p className="font-bold text-gray-400 text-sm">Ask your teacher or admin to assign subjects.</p>
                    </div>
                ) : (
                    courses.map((course, idx) => {
                        const style = defaultStyles[idx % defaultStyles.length];
                        const progress = Math.max(0, Math.min(100, Number(course.progressPercentage || 0)));
                        const isCompleted = progress === 100;

                        return (
                            <button
                                key={course.id}
                                type="button"
                                onClick={() => navigate(`/student/courses/${course.id}`)}
                                className="group w-full rounded-[28px] bg-white p-4 text-left shadow-[0_6px_20px_rgba(12,59,107,0.06)] border border-orange-100/80 transition-all hover:shadow-card active:scale-[0.98] relative overflow-hidden"
                            >
                                <div className="flex items-center justify-between gap-3">
                                    {/* Left: Lock/Status & Info */}
                                    <div className="flex items-start gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0 mt-1 border border-orange-100">
                                            {isCompleted ? (
                                                <FaCircleCheck className="w-5 h-5 text-green-600" />
                                            ) : progress > 0 ? (
                                                <FaStar className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                            ) : (
                                                <FaLock className="w-4 h-4 text-[#0c3b6b]" />
                                            )}
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <h3 className="text-[17px] font-black text-[#0c3b6b] leading-tight truncate">
                                                {course.title}
                                            </h3>
                                            <p className="text-[12px] font-bold text-gray-400 mt-1 leading-snug line-clamp-1">
                                                {course.description || `Start learning ${course.title}`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Right: Circular Subject Thumbnail with Badge */}
                                    <div className="relative shrink-0">
                                        <div className={`w-16 h-16 rounded-full overflow-hidden ${style.iconBg} shadow-inner flex items-center justify-center border-2 border-white`}>
                                            {course.coverImage ? (
                                                <img
                                                    src={course.coverImage}
                                                    alt={course.title}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                            ) : (
                                                <style.Icon className={`text-2xl ${style.iconColor}`} />
                                            )}
                                        </div>

                                        {/* Circular lock / check pill over image */}
                                        <div className="absolute inset-0 bg-black/10 rounded-full flex items-center justify-center">
                                            <div className="w-7 h-7 rounded-full bg-white/95 shadow-sm flex items-center justify-center">
                                                {isCompleted ? (
                                                    <FaCircleCheck className="w-3.5 h-3.5 text-green-600" />
                                                ) : (
                                                    <FaLock className="w-3 h-3 text-[#0c3b6b]" />
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mt-3.5 pt-2 border-t border-orange-50">
                                    <div className="flex items-center justify-between text-[11px] font-extrabold text-gray-400 mb-1.5 px-0.5">
                                        <span>Progress</span>
                                        <span className="text-[#f26522] font-black">{progress}%</span>
                                    </div>
                                    <div className="h-2 w-full overflow-hidden rounded-full bg-orange-100/70">
                                        <div
                                            className="h-full bg-gradient-to-r from-[#f26522] to-[#ff8533] rounded-full transition-all duration-500"
                                            style={{ width: `${progress}%` }}
                                        />
                                    </div>
                                </div>
                            </button>
                        );
                    })
                )}
            </div>
        </div>
    );
}


