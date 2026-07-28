import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
    const [stats, setStats] = useState({ students: 0, courses: 0 });
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [studentsRes, coursesRes] = await Promise.all([
                    api.get('/students'),
                    api.get('/courses'),
                ]);
                setStudents(studentsRes.data);
                setStats({
                    students: studentsRes.data.length,
                    courses: coursesRes.data.length,
                });
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-black text-kidText mb-2">Dashboard</h1>
            <p className="text-gray-400 font-bold mb-8">Welcome back, Content Manager!</p>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">👨‍🎓</div>
                        <div>
                            <p className="text-3xl font-black text-kidText">{stats.students}</p>
                            <p className="text-sm font-bold text-gray-400">Students</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-50 rounded-xl flex items-center justify-center text-2xl">📖</div>
                        <div>
                            <p className="text-3xl font-black text-kidText">{stats.courses}</p>
                            <p className="text-sm font-bold text-gray-400">Courses</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center text-2xl">✅</div>
                        <div>
                            <p className="text-3xl font-black text-kidText">--</p>
                            <p className="text-sm font-bold text-gray-400">Avg. Quiz Score</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Recent Students */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100">
                <div className="p-6 border-b border-gray-100">
                    <h2 className="text-lg font-bold text-kidText">Recent Students</h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Name</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Grade</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Lessons Done</th>
                                <th className="text-left px-6 py-3 text-xs font-bold text-gray-400 uppercase">Quiz Attempts</th>
                            </tr>
                        </thead>
                        <tbody>
                            {students.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-400 font-bold">No students yet.</td>
                                </tr>
                            ) : (
                                students.slice(0, 10).map((s) => (
                                    <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-bold text-kidText">{s.studentProfile?.name || '--'}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500">{s.email}</td>
                                        <td className="px-6 py-4">
                                            <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded-lg text-xs font-bold">
                                                Grade {s.studentProfile?.gradeLevel || '--'}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 font-bold text-kidText">{s._count?.lessonProgress || 0}</td>
                                        <td className="px-6 py-4 font-bold text-kidText">{s._count?.quizAttempts || 0}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
