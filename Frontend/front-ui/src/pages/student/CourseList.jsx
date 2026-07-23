import { useNavigate } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';

export default function CourseList() {
    const navigate = useNavigate();

    const courses = [
        { id: 1, title: 'English Adventure', color: 'text-blue-500', bg: 'bg-blue-50', icon: 'L', progress: 40 },
        { id: 2, title: 'Math Magic', color: 'text-orange-500', bg: 'bg-orange-50', icon: '1', progress: 85 },
        { id: 3, title: 'Science Safari', color: 'text-green-500', bg: 'bg-green-50', icon: '🌿', progress: 10 },
        { id: 4, title: 'Art Studio', color: 'text-purple-500', bg: 'bg-purple-50', icon: '🎨', progress: 50 },
    ];

    return (
        <div className="p-4 pt-10">

            {/* HEADER */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-kidOrange font-bold text-sm tracking-wide">Kuta Learning</h2>
                    <h1 className="text-3xl font-black text-kidText mt-1">Your Adventures</h1>
                </div>
                <div className="bg-white px-3 py-1.5 rounded-full border border-gray-100 flex items-center gap-1 shadow-sm">
                    <StarIcon className="w-5 h-5 text-yellow-400" />
                    <span className="font-bold text-kidText">12</span>
                </div>
            </div>

            {/* SEARCH / FILTERS */}
            <div className="flex gap-2 mb-8 overflow-x-auto pb-2 scrollbar-hide">
                <button className="bg-kidPrimary text-white px-5 py-2 rounded-full font-bold text-sm shadow-btn">All</button>
                <button className="bg-white text-gray-500 px-5 py-2 rounded-full font-bold text-sm border shadow-sm">English</button>
                <button className="bg-white text-gray-500 px-5 py-2 rounded-full font-bold text-sm border shadow-sm">Math</button>
            </div>

            {/* COURSE LIST */}
            <div className="grid grid-cols-1 gap-5">
                {courses.map(course => (
                    <div
                        key={course.id}
                        onClick={() => navigate(`/student/courses/${course.id}`)}
                        className="bg-white rounded-3xl p-5 shadow-soft border border-gray-50 flex flex-col items-center cursor-pointer transition active:scale-95"
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black mb-3 ${course.bg} ${course.color}`}>
                            {course.icon}
                        </div>
                        <h3 className="font-extrabold text-lg text-kidText mb-3">{course.title}</h3>

                        {/* Progress Bar */}
                        <div className="w-full bg-gray-100 rounded-full h-3 mb-1 overflow-hidden">
                            <div
                                className={`h-3 rounded-full ${course.color.replace('text', 'bg')}`}
                                style={{ width: `${course.progress}%` }}
                            ></div>
                        </div>
                        <div className="w-full text-right text-xs font-bold text-gray-400">
                            {course.progress}% completed
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-8 mb-4">
                <h3 className="font-bold text-kidText text-lg mb-4">Recommended for You <span className="text-xl">☀️</span></h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-100 h-32 rounded-3xl p-3 flex items-end shadow-soft relative overflow-hidden">
                        <span className="font-bold text-green-900 bg-white/70 px-2 py-1 rounded-lg text-sm w-full text-center z-10 backdrop-blur-sm">Nature Walk</span>
                    </div>
                    <div className="bg-pink-100 h-32 rounded-3xl p-3 flex items-end shadow-soft relative overflow-hidden">
                        <span className="font-bold text-pink-900 bg-white/70 px-2 py-1 rounded-lg text-sm w-full text-center z-10 backdrop-blur-sm">Music Time</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
