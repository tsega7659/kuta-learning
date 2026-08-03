import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function AdminStudents() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    useEffect(() => {
        api.get('/students').then(res => {
            setStudents(res.data);
            setLoading(false);
        }).catch(() => setLoading(false));
    }, []);

    const filtered = students.filter(s =>
        (s.studentProfile?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        s.email.toLowerCase().includes(search.toLowerCase())
    );

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-[#0F4C81] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-[#0B3A63]">Students</h1>
                    <p className="text-gray-400 font-bold">{students.length} registered students</p>
                </div>
            </div>

            {/* Search */}
            <div className="mb-6">
                <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full max-w-md px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] focus:outline-none transition text-[#0B3A63] font-medium"
                    placeholder="Search students..."
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-gray-100">
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase">Name</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase">Email</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase">Grade</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase">Lessons</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase">Quizzes</th>
                            <th className="text-left px-6 py-4 text-xs font-bold text-gray-400 uppercase">Joined</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filtered.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-6 py-10 text-center text-gray-400 font-bold">No students found.</td>
                            </tr>
                        ) : (
                            filtered.map((s) => (
                                <tr key={s.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                                    <td className="px-6 py-4 font-bold text-[#0B3A63]">{s.studentProfile?.name || '--'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-500">{s.email}</td>
                                    <td className="px-6 py-4">
                                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-xs font-bold">
                                            Grade {s.studentProfile?.gradeLevel || '--'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-[#0B3A63]">{s._count?.lessonProgress || 0}</td>
                                    <td className="px-6 py-4 font-bold text-[#0B3A63]">{s._count?.quizAttempts || 0}</td>
                                    <td className="px-6 py-4 text-sm text-gray-400">{new Date(s.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
