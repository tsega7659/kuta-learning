import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaPen, FaHashtag, FaLeaf, FaPalette, FaBook, FaArrowRight } from 'react-icons/fa6';
import api from '../../services/api';

const styling = [
    { iconBg: 'bg-blue-100', iconColor: 'text-blue-600', barBg: 'bg-blue-500', Icon: FaPen },
    { iconBg: 'bg-orange-100', iconColor: 'text-orange-600', barBg: 'bg-orange-500', Icon: FaHashtag },
    { iconBg: 'bg-green-100', iconColor: 'text-green-600', barBg: 'bg-blue-500', Icon: FaLeaf },
    { iconBg: 'bg-[#eee0d4]', iconColor: 'text-[#9a5a2b]', barBg: 'bg-[#ec9c66]', Icon: FaPalette },
];

export default function CourseList() {
    const navigate = useNavigate();
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/courses')
            .then(res => setCourses(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f6f3ee] px-4 py-5 pb-28">
            <div className="mx-auto max-w-md">
                <h1 className="text-[#a54c15] font-extrabold text-[15px] mb-5">Kuta Learning</h1>

                <div className="flex items-center justify-between mb-5">
                    <h2 className="text-[27px] font-black text-[#1f1f1f] leading-none">Your Adventures</h2>
                    <button className="text-[#a54c15] text-[13px] font-extrabold flex items-center gap-1">
                        View All <FaArrowRight className="text-sm" />
                    </button>
                </div>

                <div className="space-y-4">
                    {courses.length === 0 ? (
                        <div className="rounded-[28px] bg-white p-6 text-center shadow-[0_6px_18px_rgba(0,0,0,0.04)] border border-gray-100">
                            <FaBook className="text-4xl text-blue-500 mx-auto mb-2" />
                            <p className="font-bold text-gray-500">Ask your teacher to add courses!</p>
                        </div>
                    ) : (
                        courses.map((course, idx) => {
                            const style = styling[idx % styling.length];
                            const progress = Math.max(0, Math.min(100, Number(course.progressPercentage || 0)));

                            return (
                                <button
                                    key={course.id}
                                    type="button"
                                    onClick={() => navigate(`/student/courses/${course.id}`)}
                                    className="w-full rounded-[30px] bg-white px-4 py-5 text-left shadow-[0_6px_18px_rgba(0,0,0,0.04)] border border-gray-100 transition-transform active:scale-[0.98]"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className={`mb-4 flex h-20 w-20 items-center justify-center rounded-full ${style.iconBg} shadow-sm`}>
                                            {course.coverImage ? (
                                                <img src={course.coverImage} className="h-full w-full rounded-full object-cover" alt={course.title} />
                                            ) : (
                                                <style.Icon className={`text-[38px] ${style.iconColor}`} />
                                            )}
                                        </div>

                                        <h3 className="mb-5 text-[20px] font-extrabold text-[#222222]">{course.title}</h3>
                                    </div>

                                    <div className="flex items-center justify-between text-[12px] font-bold text-gray-500 px-1">
                                        <span>Progress</span>
                                        <span>{progress}%</span>
                                    </div>

                                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-[#e5e7eb]">
                                        <div className={`h-full ${style.barBg} rounded-full`} style={{ width: `${progress}%` }} />
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>
        </div>
    );
}
