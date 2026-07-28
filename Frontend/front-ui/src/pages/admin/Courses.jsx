import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AdminCourses() {
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', gradeLevel: 1 });
    const navigate = useNavigate();

    const fetchCourses = async () => {
        try {
            const res = await api.get('/courses');
            setCourses(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourses(); }, []);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingCourse) {
                await api.put(`/courses/${editingCourse.id}`, form);
            } else {
                await api.post('/courses', form);
            }
            setShowForm(false);
            setEditingCourse(null);
            setForm({ title: '', description: '', gradeLevel: 1 });
            fetchCourses();
        } catch (err) {
            console.error(err);
            alert('Failed to save course');
        }
    };

    const handleEdit = (course) => {
        setEditingCourse(course);
        setForm({ title: course.title, description: course.description, gradeLevel: course.gradeLevel });
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('Are you sure you want to delete this course?')) return;
        try {
            await api.delete(`/courses/${id}`);
            fetchCourses();
        } catch (err) {
            alert('Failed to delete course');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-kidText">Courses</h1>
                    <p className="text-gray-400 font-bold">{courses.length} courses</p>
                </div>
                <button
                    onClick={() => { setShowForm(true); setEditingCourse(null); setForm({ title: '', description: '', gradeLevel: 1 }); }}
                    className="flex items-center gap-2 bg-kidOrange text-white font-bold px-5 py-3 rounded-2xl hover:bg-orange-600 transition shadow-btn"
                >
                    <PlusIcon className="w-5 h-5" />
                    Add Course
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-xl">
                        <h2 className="text-xl font-black text-kidText mb-4">{editingCourse ? 'Edit Course' : 'New Course'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <input
                                type="text"
                                placeholder="Course Title"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium"
                                required
                            />
                            <textarea
                                placeholder="Description"
                                value={form.description}
                                onChange={(e) => setForm({ ...form, description: e.target.value })}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium h-24 resize-none"
                                required
                            />
                            <select
                                value={form.gradeLevel}
                                onChange={(e) => setForm({ ...form, gradeLevel: parseInt(e.target.value) })}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium"
                            >
                                <option value={1}>Grade 1</option>
                                <option value={2}>Grade 2</option>
                                <option value={3}>Grade 3</option>
                                <option value={4}>Grade 4</option>
                            </select>
                            <div className="flex gap-3">
                                <button type="submit" className="flex-1 bg-kidOrange text-white font-bold py-3 rounded-2xl hover:bg-orange-600 transition">
                                    {editingCourse ? 'Update' : 'Create'}
                                </button>
                                <button type="button" onClick={() => { setShowForm(false); setEditingCourse(null); }} className="flex-1 bg-gray-100 text-kidText font-bold py-3 rounded-2xl hover:bg-gray-200 transition">
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Course Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {courses.map((course) => (
                    <div key={course.id} className="bg-white rounded-2xl p-6 shadow-soft border border-gray-100 hover:shadow-md transition">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-2xl">📘</div>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(course)} className="p-2 hover:bg-gray-100 rounded-xl transition">
                                    <PencilIcon className="w-4 h-4 text-gray-400" />
                                </button>
                                <button onClick={() => handleDelete(course.id)} className="p-2 hover:bg-red-50 rounded-xl transition">
                                    <TrashIcon className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-bold text-kidText text-lg mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-400 mb-3 line-clamp-2">{course.description}</p>
                        <div className="flex justify-between items-center">
                            <span className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-1 rounded-lg">Grade {course.gradeLevel}</span>
                            <button
                                onClick={() => navigate(`/admin/courses/${course.id}`)}
                                className="text-xs font-bold text-kidOrange hover:underline"
                            >
                                Manage →
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
