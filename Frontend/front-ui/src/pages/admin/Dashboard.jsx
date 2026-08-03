import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import {
    BookOpenIcon, UserGroupIcon, AcademicCapIcon,
    CircleStackIcon, PlusCircleIcon,
} from '@heroicons/react/24/outline';

export default function AdminDashboard() {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState({ students: 0, courses: 0, lessons: 0 });
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, coursesRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/courses'),
                ]);

                const courseList = coursesRes.data || [];
                setCourses(courseList.slice(0, 3));

                // Count total lessons across all courses
                let totalLessons = 0;
                for (const c of courseList) {
                    try {
                        const { data: detail } = await api.get(`/courses/${c.id}`);
                        (detail.chapters || []).forEach(ch =>
                            (ch.topics || []).forEach(t => { totalLessons += (t.lessons || []).length; })
                        );
                    } catch { /* skip */ }
                }

                setStats({
                    students: studentsRes.data.length,
                    courses: courseList.length,
                    lessons: totalLessons
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const statCards = [
        { label: 'Total Lessons', value: stats.lessons, note: '+4 this week', icon: BookOpenIcon, iconColor: 'text-blue-600 bg-blue-50' },
        { label: 'Active Students', value: stats.students, note: '+12 new', icon: UserGroupIcon, iconColor: 'text-blue-600 bg-blue-50' },
        { label: 'Active Courses', value: stats.courses, note: '+2 this term', icon: AcademicCapIcon, iconColor: 'text-blue-600 bg-blue-50' },
    ];

    const quickActions = [
        {
            title: 'Add Question',
            desc: 'Update your question bank with new assessment items.',
            btnLabel: 'Open Database',
            btnIcon: CircleStackIcon,
            onClick: () => navigate('/admin/question-bank'),
            dark: false
        },
        {
            title: 'Create Lesson',
            desc: 'Build interactive curriculum content for your students.',
            btnLabel: 'Start Editor',
            btnIcon: PlusCircleIcon,
            onClick: () => navigate('/admin/courses'),
            dark: true
        },
        {
            title: 'Create Quiz',
            desc: 'Design new assessments and track student performance.',
            btnLabel: 'New Quiz',
            btnIcon: AcademicCapIcon,
            onClick: () => navigate('/admin/quizzes'),
            dark: false
        }
    ];

    return (
        <div className="p-8 font-sans text-gray-800">
            {/* Welcome Header */}
            <div className="mb-8">
                <h1 className="text-4xl font-extrabold text-[#0B3A63] tracking-tight mb-1">Welcome, Teacher!</h1>
                <p className="text-gray-500 font-medium">Here's what's happening in your classroom today.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
                {statCards.map(s => (
                    <div key={s.label} className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm relative">
                        <div className="flex items-center gap-4">
                            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${s.iconColor}`}>
                                <s.icon className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-500">{s.label}</p>
                                <p className="text-3xl font-extrabold text-[#0B3A63]">
                                    {loading ? '…' : s.value}
                                </p>
                            </div>
                        </div>
                        <span className="absolute top-4 right-4 text-xs font-bold text-orange-500 bg-blue-50 px-2 py-1 rounded-full">
                            {s.note}
                        </span>
                    </div>
                ))}
            </div>

            {/* Your Courses */}
            <div className="mb-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-extrabold text-[#0B3A63]">Your Courses</h2>
                    <button onClick={() => navigate('/admin/courses')} className="text-sm font-bold text-blue-600 hover:underline">
                        Manage All
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {courses.length === 0 && !loading
                        ? <p className="text-gray-400 font-bold col-span-3">No courses yet.</p>
                        : courses.map(c => (
                            <button
                                key={c.id}
                                onClick={() => navigate(`/admin/courses/${c.id}`)}
                                className="bg-white border border-gray-200 shadow-sm rounded-2xl p-5 flex items-center gap-4 hover:shadow-md hover:border-blue-100 transition text-left"
                            >
                                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 font-extrabold text-xl">
                                    Σ
                                </div>
                                <div>
                                    <p className="font-extrabold text-[#0B3A63]">{c.title}</p>
                                    <p className="text-xs font-bold text-gray-400">{c.gradeLevel || 'All Grades'}</p>
                                </div>
                            </button>
                        ))}
                </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                {quickActions.map(a => (
                    <div
                        key={a.title}
                        className={`rounded-2xl p-6 border flex flex-col justify-between min-h-[180px] ${a.dark
                            ? 'bg-[#0F4C81] border-[#0B3A63] text-white'
                            : 'bg-white border-gray-200 text-gray-800'
                            } shadow-sm`}
                    >
                        <div>
                            <h3 className={`text-xl font-extrabold mb-2 ${a.dark ? 'text-white' : 'text-[#0B3A63]'}`}>{a.title}</h3>
                            <p className={`text-sm font-medium mb-5 ${a.dark ? 'text-blue-200' : 'text-gray-500'}`}>{a.desc}</p>
                        </div>
                        <button
                            onClick={a.onClick}
                            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition self-start ${a.dark
                                ? 'bg-white text-[#0F4C81] hover:bg-blue-50'
                                : 'bg-[#0F4C81] text-white hover:bg-[#0B3A63]'
                                }`}
                        >
                            <a.btnIcon className="w-5 h-5" />
                            {a.btnLabel}
                        </button>
                    </div>
                ))}
            </div>
        </div>
    );
}
