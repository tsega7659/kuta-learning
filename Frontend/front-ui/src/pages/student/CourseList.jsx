import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';
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

    const colors = [
        { text: 'text-blue-500', bg: 'bg-blue-50', bar: 'bg-blue-500' },
        { text: 'text-orange-500', bg: 'bg-orange-50', bar: 'bg-orange-500' },
        { text: 'text-green-500', bg: 'bg-green-50', bar: 'bg-green-500' },
        { text: 'text-purple-500', bg: 'bg-purple-50', bar: 'bg-purple-500' },
        { text: 'text-pink-500', bg: 'bg-pink-50', bar: 'bg-pink-500' },
    ];

    const emojis = ['📖', '🔢', '🌿', '🎨', '🎵', '🏰', '🚀', '🌟'];

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

            {/* COURSE LIST */}
            {courses.length === 0 ? (
                <div className="text-center py-16">
                    <span className="text-5xl block mb-4">📚</span>
                    <h3 className="font-bold text-kidText text-lg mb-2">No courses yet!</h3>
                    <p className="text-gray-400 font-medium">Ask your teacher to add some fun courses.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 gap-5">
                    {courses.map((course, idx) => {
                        const color = colors[idx % colors.length];
                        const emoji = emojis[idx % emojis.length];
                        return (
                            <div
                                key={course.id}
                                onClick={() => navigate(`/student/courses/${course.id}`)}
                                className="bg-white rounded-3xl p-5 shadow-soft border border-gray-50 flex flex-col items-center cursor-pointer transition active:scale-95"
                            >
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-3xl font-black mb-3 ${color.bg} ${color.text}`}>
                                    {emoji}
                                </div>
                                <h3 className="font-extrabold text-lg text-kidText mb-1">{course.title}</h3>
                                <p className="text-xs text-gray-400 font-medium mb-3 text-center">{course.description}</p>
                                <span className="text-[10px] font-bold bg-blue-50 text-blue-500 px-2 py-0.5 rounded-full">Grade {course.gradeLevel}</span>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
