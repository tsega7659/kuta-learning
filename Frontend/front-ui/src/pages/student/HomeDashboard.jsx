import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaStar, FaEllipsisVertical, FaLock, FaBookOpen, FaGamepad,
    FaArrowRight, FaPen, FaHashtag, FaLeaf, FaPalette, FaCircleCheck
} from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const defaultStyles = [
    { iconBg: 'bg-orange-50', iconColor: 'text-[#f26522]', barBg: 'bg-[#f26522]', Icon: FaPen },
    { iconBg: 'bg-blue-50', iconColor: 'text-[#0c3b6b]', barBg: 'bg-[#0c3b6b]', Icon: FaHashtag },
    { iconBg: 'bg-amber-50', iconColor: 'text-amber-600', barBg: 'bg-amber-500', Icon: FaLeaf },
    { iconBg: 'bg-emerald-50', iconColor: 'text-emerald-600', barBg: 'bg-emerald-500', Icon: FaPalette },
];

export default function HomeDashboard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/courses')
            .then(res => setCourses(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const overallProgress = courses.length
        ? Math.round(courses.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / courses.length)
        : 0;

    const studentName = user?.name || 'Student';
    const gradeLevel = user?.gradeLevel || user?.studentProfile?.gradeLevel || 2;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="w-12 h-12 border-4 border-[#f26522] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen px-4 pt-6 pb-28 space-y-6">
            {/* Top Bar / Greeting with Kuta brand */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="relative">
                        <div className="w-13 h-13 rounded-full bg-gradient-to-tr from-[#f26522] to-[#0c3b6b] p-0.5 shadow-md">
                            {user?.avatarUrl ? (
                                <img
                                    src={user.avatarUrl}
                                    alt={studentName}
                                    className="w-full h-full rounded-full object-cover"
                                />
                            ) : (
                                <div className="w-full h-full rounded-full bg-white flex items-center justify-center text-xl font-black text-[#f26522]">
                                    {studentName[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <h1 className="text-[20px] font-black text-[#0c3b6b] leading-tight">
                                Hello, {studentName}!
                            </h1>
                        </div>
                        <p className="text-[12px] font-extrabold text-[#f26522]">
                            Grade {gradeLevel} • Kuta Explorer
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Progress Pill */}
                    <div className="bg-white px-3 py-1.5 rounded-full shadow-[0_2px_10px_rgba(12,59,107,0.08)] border border-orange-100 flex items-center gap-1.5">
                        <FaStar className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                        <span className="text-[12px] font-black text-[#0c3b6b]">{overallProgress}%</span>
                    </div>

                    <button
                        onClick={() => navigate('/student/profile')}
                        className="w-9 h-9 rounded-full bg-white/90 hover:bg-white flex items-center justify-center text-gray-500 shadow-sm transition active:scale-95 border border-gray-100"
                    >
                        <FaEllipsisVertical className="w-4 h-4 text-[#0c3b6b]" />
                    </button>
                </div>
            </div>

            {/* Section 1: My Lessons (Courses) */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[18px] font-black text-[#0c3b6b]">My Lessons</h2>
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="text-[12px] font-extrabold text-[#f26522] hover:text-orange-700 transition flex items-center gap-1"
                    >
                        See All <FaArrowRight className="text-[10px]" />
                    </button>
                </div>

                {courses.length === 0 ? (
                    <div className="bg-white rounded-[28px] p-6 text-center shadow-soft border border-orange-100/60">
                        <FaBookOpen className="text-4xl text-[#f26522]/40 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-400">No courses enrolled yet.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 gap-3.5">
                        {courses.slice(0, 4).map((course, idx) => {
                            const style = defaultStyles[idx % defaultStyles.length];
                            const progress = Math.max(0, Math.min(100, Number(course.progressPercentage || 0)));
                            const isCompleted = progress === 100;

                            return (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => navigate(`/student/courses/${course.id}`)}
                                    className="group relative bg-white rounded-[28px] p-3 text-left shadow-[0_4px_18px_rgba(12,59,107,0.06)] border border-orange-100/70 hover:shadow-card transition-all active:scale-[0.98] flex flex-col justify-between"
                                >
                                    {/* Thumbnail container */}
                                    <div className={`relative w-full aspect-[4/3] rounded-[22px] overflow-hidden ${style.iconBg} flex items-center justify-center mb-2.5`}>
                                        {course.coverImage ? (
                                            <img
                                                src={course.coverImage}
                                                alt={course.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                            />
                                        ) : (
                                            <style.Icon className={`text-4xl ${style.iconColor}`} />
                                        )}

                                        {/* Center Badge (Kuta Orange/Navy) */}
                                        <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                                            <div className="w-11 h-11 rounded-full bg-white border-2 border-white shadow-lg flex items-center justify-center transform group-hover:scale-110 transition-transform">
                                                {isCompleted ? (
                                                    <FaCircleCheck className="w-5 h-5 text-green-600" />
                                                ) : progress > 0 ? (
                                                    <FaStar className="w-5 h-5 text-[#f26522] fill-[#f26522]" />
                                                ) : (
                                                    <FaLock className="w-4 h-4 text-[#0c3b6b]" />
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title Pill */}
                                    <div className="w-full text-center">
                                        <h3 className="text-[14px] font-black text-[#1a2736] truncate px-1 mb-1">
                                            {course.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-[10px] font-extrabold text-gray-400 px-1 mb-1">
                                            <span>Progress</span>
                                            <span className="text-[#f26522]">{progress}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-orange-100/80 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-[#f26522] to-[#ff8533] rounded-full transition-all"
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Section 2: Practice & Fun Activities with Kuta Navy/Orange Wave */}
            <div>
                <div className="flex items-center justify-between mb-3 px-1">
                    <h2 className="text-[18px] font-black text-[#0c3b6b]">Practice & Quizzes</h2>
                    <button
                        onClick={() => navigate('/student/practice')}
                        className="text-[12px] font-extrabold text-[#f26522] hover:text-orange-700 transition flex items-center gap-1"
                    >
                        Explore <FaArrowRight className="text-[10px]" />
                    </button>
                </div>

                <div
                    onClick={() => navigate('/student/practice')}
                    className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#0c3b6b] via-[#134980] to-[#f26522] p-5 text-white shadow-[0_8px_25px_rgba(12,59,107,0.22)] cursor-pointer active:scale-[0.99] transition-transform"
                >
                    <div className="relative z-10 max-w-[70%]">
                        <span className="inline-block bg-white/20 backdrop-blur-md px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider mb-2">
                            Quick Practice
                        </span>
                        <h3 className="text-[18px] font-black leading-tight mb-1">
                            New Name, Same Excellence!
                        </h3>
                        <p className="text-[12px] font-medium text-blue-100 mb-3">
                            Practice question sets and earn stars to boost your grade score.
                        </p>
                        <span className="inline-flex items-center gap-1.5 bg-[#f26522] text-white font-black text-[12px] px-3.5 py-1.5 rounded-full shadow-md hover:bg-orange-600 transition">
                            Start Practicing &rarr;
                        </span>
                    </div>

                    <div className="absolute -right-4 -bottom-4 w-28 h-28 bg-white/10 rounded-full flex items-center justify-center">
                        <FaGamepad className="text-6xl text-white/40" />
                    </div>
                </div>
            </div>
        </div>
    );
}

