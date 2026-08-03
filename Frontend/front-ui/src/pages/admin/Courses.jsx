import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import {
    PlusIcon, ArrowUpTrayIcon, DocumentArrowUpIcon, PhotoIcon,
    XMarkIcon, MagnifyingGlassIcon, PencilIcon, TrashIcon, ArrowPathIcon,
    ChevronLeftIcon, ChevronRightIcon
} from '@heroicons/react/24/outline';

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

export default function AdminCourses() {
    const [courses, setCourses] = useState([]);
    const [allLessons, setAllLessons] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingCourse, setEditingCourse] = useState(null);
    const [form, setForm] = useState({ title: '', description: '', gradeLevel: 1 });
    const navigate = useNavigate();

    // Filters
    const [search, setSearch] = useState('');
    const [selSubject, setSelSubject] = useState('ALL');
    const [selStatus, setSelStatus] = useState('ALL');
    const [page, setPage] = useState(1);
    const PER_PAGE = 10;

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: courseList } = await api.get('/courses');
            setCourses(courseList);
            let flat = [];
            for (const course of courseList) {
                try {
                    const { data: detail } = await api.get(`/courses/${course.id}`);
                    (detail.chapters || []).forEach(ch =>
                        (ch.topics || []).forEach(t =>
                            (t.lessons || []).forEach(l => flat.push({
                                ...l,
                                courseId: course.id,
                                courseTitle: course.title,
                                chapterTitle: ch.title,
                                topicTitle: t.title,
                                subject: course.title,
                                gradeLevel: course.gradeLevel,
                            }))
                        )
                    );
                } catch { /* skip */ }
            }
            flat.sort((a, b) => new Date(b.updatedAt || b.createdAt) - new Date(a.updatedAt || a.createdAt));
            setAllLessons(flat);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);
    useEffect(() => { setPage(1); }, [search, selSubject, selStatus]);

    const subjects = useMemo(() => {
        const s = new Set(allLessons.map(l => l.subject));
        return Array.from(s);
    }, [allLessons]);

    const filtered = useMemo(() => allLessons.filter(l => {
        const matchSearch = l.title.toLowerCase().includes(search.toLowerCase());
        const matchSubject = selSubject === 'ALL' || l.subject === selSubject;
        return matchSearch && matchSubject;
    }), [allLessons, search, selSubject]);

    const totalPages = Math.ceil(filtered.length / PER_PAGE);
    const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

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
            fetchData();
        } catch (err) {
            alert('Failed to save course');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this course and all its content?')) return;
        try { await api.delete(`/courses/${id}`); fetchData(); }
        catch { alert('Failed to delete'); }
    };

    return (
        <div className="p-8 font-sans text-gray-800">
            {/* Page Header */}
            <div className="flex justify-between items-start flex-wrap gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0B3A63]">Lessons Management</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Organize, edit, and publish curriculum content for your students.</p>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                    <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg font-bold text-gray-600 text-sm hover:bg-gray-50 transition">
                        <ArrowUpTrayIcon className="w-4 h-4" />Upload Video
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg font-bold text-gray-600 text-sm hover:bg-gray-50 transition">
                        <DocumentArrowUpIcon className="w-4 h-4" />Upload PDF
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2.5 border-2 border-gray-200 rounded-lg font-bold text-gray-600 text-sm hover:bg-gray-50 transition">
                        <PhotoIcon className="w-4 h-4" />Upload Image
                    </button>
                    <button
                        onClick={() => { setShowForm(true); setEditingCourse(null); setForm({ title: '', description: '', gradeLevel: 1 }); }}
                        className="flex items-center gap-2 px-5 py-2.5 bg-[#0F4C81] hover:bg-[#0B3A63] text-white font-bold rounded-xl shadow-sm transition text-sm"
                    >
                        <PlusIcon className="w-5 h-5" /> Create New Course
                    </button>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 flex gap-4 items-end mb-6 shadow-sm flex-wrap">
                <div className="flex flex-col flex-1 min-w-[220px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 tracking-wide">Quick Filter</label>
                    <div className="relative">
                        <MagnifyingGlassIcon className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                        <input
                            value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Filter by keywords..."
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm font-bold outline-none focus:border-[#0F4C81] bg-gray-50"
                        />
                    </div>
                </div>
                <div className="flex flex-col min-w-[160px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 tracking-wide">Subject</label>
                    <select value={selSubject} onChange={e => setSelSubject(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
                        <option value="ALL">All Subjects</option>
                        {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                </div>
                <div className="flex flex-col min-w-[160px]">
                    <label className="text-[11px] font-bold text-gray-500 mb-1 tracking-wide">Status</label>
                    <select value={selStatus} onChange={e => setSelStatus(e.target.value)} className="w-full p-2 border border-gray-200 rounded-lg font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]">
                        <option value="ALL">All Statuses</option>
                        <option value="published">Published</option>
                        <option value="draft">Draft</option>
                    </select>
                </div>
                <button onClick={() => { setSearch(''); setSelSubject('ALL'); setSelStatus('ALL'); }} className="px-4 py-2 border border-gray-200 rounded-lg font-bold text-sm text-gray-600 hover:bg-gray-100 transition">
                    Clear All
                </button>
                <button onClick={fetchData} className="w-9 h-9 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200">
                    <ArrowPathIcon className="w-4 h-4 text-gray-500" />
                </button>
            </div>

            {/* Lessons Table */}
            <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {/* Header */}
                <div className="grid grid-cols-12 bg-gray-50 border-b border-gray-200 px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    <div className="col-span-5">Title</div>
                    <div className="col-span-2">Course</div>
                    <div className="col-span-2">Subject</div>
                    <div className="col-span-1">Last Updated</div>
                    <div className="col-span-1 text-center">Status</div>
                    <div className="col-span-1 text-right">Actions</div>
                </div>

                {loading ? (
                    <div className="py-20 text-center text-gray-400 font-bold">Loading lessons...</div>
                ) : paginated.length === 0 ? (
                    <div className="py-20 text-center text-gray-400 font-bold">No lessons found.</div>
                ) : (
                    paginated.map(lesson => (
                        <div key={lesson.id} className="grid grid-cols-12 border-b border-gray-100 px-6 py-5 items-center hover:bg-gray-50 transition group">
                            {/* Title */}
                            <div className="col-span-5 flex items-start gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-700 font-extrabold text-base shrink-0 mt-0.5">
                                    Σ
                                </div>
                                <div>
                                    <p className="font-bold text-[#0B3A63]">{lesson.title}</p>
                                    <p className="text-xs font-bold text-gray-400">{lesson.chapterTitle} • Grade {lesson.gradeLevel}</p>
                                </div>
                            </div>
                            {/* Course */}
                            <div className="col-span-2 text-sm font-bold text-gray-700">{lesson.courseTitle}</div>
                            {/* Subject */}
                            <div className="col-span-2">
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold">{lesson.subject}</span>
                            </div>
                            {/* Last Updated */}
                            <div className="col-span-1 text-xs font-bold text-gray-500">
                                {lesson.updatedAt ? new Date(lesson.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                            </div>
                            {/* Status */}
                            <div className="col-span-1 flex justify-center">
                                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${lesson.isPreview
                                    ? 'bg-yellow-50 text-yellow-700 border border-yellow-200'
                                    : 'bg-green-50 text-green-700 border border-green-200'
                                    }`}>
                                    <span className={`w-1.5 h-1.5 rounded-full ${lesson.isPreview ? 'bg-yellow-500' : 'bg-green-500'}`} />
                                    {lesson.isPreview ? 'Preview' : 'Published'}
                                </span>
                            </div>
                            {/* Actions */}
                            <div className="col-span-1 flex justify-end gap-2 opacity-50 group-hover:opacity-100 transition">
                                <button onClick={() => navigate(`/admin/courses/${lesson.courseId}`)} className="text-gray-400 hover:text-blue-600 transition">
                                    <PencilIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(lesson.courseId)} className="text-gray-400 hover:text-red-500 transition">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Footer / Pagination */}
                <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center text-sm font-bold text-gray-500">
                    <span>Showing {filtered.length === 0 ? 0 : (page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} lessons</span>
                    {totalPages > 1 && (
                        <div className="flex items-center gap-1">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40">
                                <ChevronLeftIcon className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(pg => (
                                <button key={pg} onClick={() => setPage(pg)} className={`w-8 h-8 rounded-lg font-bold text-sm ${pg === page ? 'bg-[#0F4C81] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{pg}</button>
                            ))}
                            {totalPages > 5 && <span className="px-1">...</span>}
                            {totalPages > 5 && (
                                <button onClick={() => setPage(totalPages)} className={`w-8 h-8 rounded-lg font-bold text-sm ${page === totalPages ? 'bg-[#0F4C81] text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>{totalPages}</button>
                            )}
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)} className="p-1.5 rounded-lg border border-gray-200 bg-white hover:bg-gray-100 disabled:opacity-40">
                                <ChevronRightIcon className="w-4 h-4" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Also show Courses Grid below for managing course structure */}
            <div className="mt-10">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-extrabold text-[#0B3A63]">Course Structures</h2>
                    <button
                        onClick={() => { setShowForm(true); setEditingCourse(null); setForm({ title: '', description: '', gradeLevel: 1 }); }}
                        className="flex items-center gap-2 text-sm font-bold text-blue-600 hover:underline"
                    >
                        <PlusIcon className="w-4 h-4" /> Add Course
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {courses.map(c => (
                        <div key={c.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex items-center justify-between hover:border-blue-200 hover:shadow-md transition group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-blue-700">Σ</div>
                                <div>
                                    <p className="font-extrabold text-[#0B3A63] text-sm">{c.title}</p>
                                    <p className="text-xs text-gray-400 font-bold">Grade {c.gradeLevel}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                <button onClick={() => navigate(`/admin/courses/${c.id}`)} className="text-gray-400 hover:text-blue-600"><PencilIcon className="w-4 h-4" /></button>
                                <button onClick={() => handleDelete(c.id)} className="text-gray-400 hover:text-red-500"><TrashIcon className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create/Edit Course Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
                        <button onClick={() => setShowForm(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800">
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                        <h2 className="text-xl font-extrabold text-[#0B3A63] mb-5">{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Course Title</label>
                                <input required value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold outline-none focus:border-[#0F4C81]" placeholder="e.g. Advanced Mathematics" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                                <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold outline-none focus:border-[#0F4C81] resize-none" placeholder="Brief course description..." />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 mb-1 block">Grade Level</label>
                                <select value={form.gradeLevel} onChange={e => setForm({ ...form, gradeLevel: parseInt(e.target.value) })} className="w-full border-2 border-gray-200 rounded-xl p-3 font-bold bg-white outline-none focus:border-[#0F4C81]">
                                    {GRADE_LEVELS.map(g => <option key={g} value={g}>Grade {g}</option>)}
                                </select>
                            </div>
                            <button type="submit" className="w-full bg-[#0F4C81] text-white font-bold py-3 rounded-xl hover:bg-[#0B3A63] transition mt-2">
                                {editingCourse ? 'Save Changes' : 'Create Course'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
