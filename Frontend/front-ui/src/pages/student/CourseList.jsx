import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function CourseList() {
    const navigate = useNavigate();
    const { user } = useAuth();
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

    // Dynamic style mappers for Figma look
    const styling = [
        { iconBg: 'bg-blue-100', iconColor: 'text-blue-500', barBg: 'bg-blue-500', barBorder: 'border-blue-600', icon: '📝' },
        { iconBg: 'bg-orange-100', iconColor: 'text-orange-500', barBg: 'bg-orange-500', barBorder: 'border-orange-600', icon: '🔢' },
        { iconBg: 'bg-blue-200', iconColor: 'text-blue-600', barBg: 'bg-blue-400', barBorder: 'border-blue-500', icon: '🌿' },
        { iconBg: 'bg-[#e2d5c3]', iconColor: 'text-[#925529]', barBg: 'bg-[#eaa678]', barBorder: 'border-[#c17849]', icon: '🎨' },
    ];

    return (
        <div className="bg-gradient-to-br from-blue-50 via-white to-orange-50 min-h-screen px-6 py-8 pb-32 font-sans">
            <h1 className="text-[#a54c15] font-extrabold text-[15px] mb-6">Kuta Learning</h1>

            {/* Section 1: Your Adventures */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-black text-gray-800">Your Adventures</h2>
                <button className="text-[#a54c15] text-[12px] font-bold flex items-center hover:opacity-80">
                    View All <span className="ml-[2px] leading-none text-[15px]">→</span>
                </button>
            </div>

            <div className="space-y-5 mb-8">
                {courses.length === 0 ? (
                    <div className="bg-white rounded-[32px] p-6 shadow-sm text-center border border-gray-100">
                        <span className="text-4xl block mb-2">📚</span>
                        <p className="font-bold text-gray-500">Ask your teacher to add courses!</p>
                    </div>
                ) : (
                    courses.map((course, idx) => {
                        const style = styling[idx % styling.length];

                        return (
                            <div
                                key={course.id}
                                onClick={() => navigate(`/student/courses/${course.id}`)}
                                className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.04)] border border-gray-50 cursor-pointer transition-transform active:scale-[0.98] flex flex-col items-center"
                            >
                                <div className={`w-[72px] h-[72px] rounded-full flex items-center justify-center text-[32px] mb-4 ${style.iconBg} shadow-sm border border-white`}>
                                    {course.coverImage ? (
                                        <img src={course.coverImage} className="w-full h-full rounded-full object-cover" alt="" />
                                    ) : (
                                        <span>{style.icon}</span>
                                    )}
                                </div>
                                <h3 className="font-extrabold text-[18px] text-gray-800 mb-6">{course.title}</h3>

                                <div className="w-full text-left">
                                    <div className="flex justify-between items-center text-[12px] font-bold mb-2 px-1">
                                        <span className="text-gray-500 uppercase tracking-widest">Progress</span>
                                        <span className="text-gray-500">{course.progressPercentage || 0}%</span>
                                    </div>
                                    <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden shadow-inner flex items-center">
                                        <div
                                            className={`h-full ${style.barBg} border-b-[3px] ${style.barBorder} rounded-full min-w-[5%]`}
                                            style={{ width: `${course.progressPercentage || 0}%` }}
                                        ></div>
                                    </div>
                                </div>
                            </div>
                        )
                    })
                )}
            </div>

        </div>
    );
}
