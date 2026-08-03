import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PlusIcon, TrashIcon, ChevronLeftIcon, PencilIcon, XMarkIcon, CheckIcon } from '@heroicons/react/24/outline';
import AdminLessonModal from './components/AdminLessonModal';
import AdminQuizBuilder from './components/AdminQuizBuilder';

/* ─── Reusable modal shell ─── */
function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-fade-in">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <h2 className="text-lg font-black text-[#0B3A63]">{title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>
                <div className="px-6 py-5 space-y-4">{children}</div>
            </div>
        </div>
    );
}

/* ─── Inline editable field with image upload ─── */
function EditableRow({ label, value, onSave, isImage = false }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || '');
    const [uploading, setUploading] = useState(false);

    const handleSave = () => { onSave(val); setEditing(false); };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            setVal(res.data.url);
        } catch { alert('Upload failed'); }
        finally { setUploading(false); }
    };

    if (!editing) return (
        <div className="flex items-center gap-2 group">
            <span className="text-xs text-gray-400 font-bold w-20 shrink-0">{label}:</span>
            {isImage && val ? (
                <img src={val} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />
            ) : (
                <span className="text-sm text-[#0B3A63] font-medium truncate max-w-[200px]">{val || <span className="text-gray-300 italic">None</span>}</span>
            )}
            <button onClick={() => setEditing(true)} className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-100 rounded-lg transition ml-1">
                <PencilIcon className="w-3.5 h-3.5 text-gray-400" />
            </button>
        </div>
    );

    return (
        <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 font-bold w-20 shrink-0">{label}:</span>
            {isImage ? (
                <div className="flex items-center gap-2 flex-1">
                    {uploading ? <span className="text-xs text-gray-400">Uploading...</span> : (
                        <input type="file" accept="image/*" onChange={handleFileUpload} className="text-xs flex-1" />
                    )}
                    {val && <img src={val} alt="" className="w-10 h-10 rounded-lg object-cover border border-gray-100" />}
                </div>
            ) : (
                <input value={val} onChange={e => setVal(e.target.value)}
                    className="flex-1 text-sm px-2 py-1 rounded-lg border-2 border-[#0F4C81] outline-none font-medium text-[#0B3A63]"
                    autoFocus />
            )}
            <button onClick={handleSave} className="p-1 bg-green-100 hover:bg-green-200 rounded-lg transition">
                <CheckIcon className="w-3.5 h-3.5 text-green-600" />
            </button>
            <button onClick={() => setEditing(false)} className="p-1 bg-gray-100 hover:bg-gray-200 rounded-lg transition">
                <XMarkIcon className="w-3.5 h-3.5 text-gray-500" />
            </button>
        </div>
    );
}

/* ─── Shared styled input ─── */
function Field({ label, type = 'text', value, onChange, placeholder, required, min }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
            <input
                type={type}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                required={required}
                min={min}
                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] focus:outline-none font-medium text-sm text-[#0B3A63] transition"
            />
        </div>
    );
}

function FileField({ label, onChange, hasFile }) {
    return (
        <div>
            <label className="block text-xs font-bold text-gray-500 mb-1">{label}</label>
            <div className="flex items-center gap-3 bg-gray-50 border-2 border-dashed border-gray-200 rounded-2xl px-4 py-3">
                <input type="file" accept="image/*,video/*,audio/*,.pdf" onChange={onChange} className="flex-1 text-sm text-gray-600" />
                {hasFile && <span className="text-xs font-bold text-green-500 shrink-0">✓ Selected</span>}
            </div>
        </div>
    );
}

/* ─── Main component ─── */
export default function AdminCourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [chapterModal, setChapterModal] = useState(false);
    const [topicModal, setTopicModal] = useState(null);   // chapterId when open
    const [lessonModal, setLessonModal] = useState(null); // { chapterId, topicId }

    // Form data
    const [chapterForm, setChapterForm] = useState({ title: '', description: '', order: 1 });
    const [chapterCoverFile, setChapterCoverFile] = useState(null);

    const [topicForm, setTopicForm] = useState({ title: '', description: '', order: 1 });
    const [topicCoverFile, setTopicCoverFile] = useState(null);

    const [lessonForm, setLessonForm] = useState({ title: '', description: '', order: 1 });
    const [lessonCoverFile, setLessonCoverFile] = useState(null);

const [activeLesson, setActiveLesson] = useState(null);
    const [quizModal, setQuizModal] = useState(null); // { chapterId, topicId, topicName }
    const [saving, setSaving] = useState(false);

    // Upload helper
    const uploadFile = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.url;
    };

    const fetchCourse = async () => {
        try {
            const res = await api.get(`/courses/${courseId}`);
            setCourse(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchCourse(); }, [courseId]);

    /* ── Chapter CRUD ── */
    const addChapter = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const coverImage = await uploadFile(chapterCoverFile);
            await api.post(`/courses/${courseId}/chapters`, { ...chapterForm, coverImage });
            setChapterModal(false);
            setChapterForm({ title: '', description: '', order: 1 });
            setChapterCoverFile(null);
            fetchCourse();
        } catch { alert('Failed to create chapter'); }
        finally { setSaving(false); }
    };

    const deleteChapter = async (chapterId) => {
        if (!confirm('Delete this chapter and all its contents?')) return;
        try { await api.delete(`/courses/${courseId}/chapters/${chapterId}`); fetchCourse(); }
        catch { alert('Failed to delete chapter'); }
    };

    const updateChapterField = async (chapterId, field, value) => {
        try { await api.put(`/courses/${courseId}/chapters/${chapterId}`, { [field]: value }); fetchCourse(); }
        catch { alert('Failed to update chapter'); }
    };

    /* ── Topic CRUD ── */
    const addTopic = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const coverImage = await uploadFile(topicCoverFile);
            await api.post(`/courses/${courseId}/chapters/${topicModal}/topics`, { ...topicForm, coverImage });
            setTopicModal(null);
            setTopicForm({ title: '', description: '', order: 1 });
            setTopicCoverFile(null);
            fetchCourse();
        } catch { alert('Failed to create topic'); }
        finally { setSaving(false); }
    };

    const deleteTopic = async (chapterId, topicId) => {
        if (!confirm('Delete this topic?')) return;
        try { await api.delete(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}`); fetchCourse(); }
        catch { alert('Failed to delete topic'); }
    };

    const updateTopicField = async (chapterId, topicId, field, value) => {
        try { await api.put(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}`, { [field]: value }); fetchCourse(); }
        catch { alert('Failed to update topic'); }
    };

    /* ── Lesson CRUD ── */
    const addLesson = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const coverImage = await uploadFile(lessonCoverFile);
            await api.post(
                `/courses/${courseId}/chapters/${lessonModal.chapterId}/topics/${lessonModal.topicId}/lessons`,
                { ...lessonForm, coverImage }
            );
            setLessonModal(null);
            setLessonForm({ title: '', description: '', order: 1 });
            setLessonCoverFile(null);
            fetchCourse();
        } catch { alert('Failed to create lesson'); }
        finally { setSaving(false); }
    };

    const deleteLesson = async (chapterId, topicId, lessonId) => {
        if (!confirm('Delete this lesson?')) return;
        try { await api.delete(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lessonId}`); fetchCourse(); }
        catch { alert('Failed to delete lesson'); }
    };

    const updateLessonField = async (chapterId, topicId, lessonId, field, value) => {
        try { await api.put(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lessonId}`, { [field]: value }); fetchCourse(); }
        catch { alert('Failed to update lesson'); }
    };

    if (loading) return (
        <div className="flex items-center justify-center h-full">
            <div className="w-10 h-10 border-4 border-[#0F4C81] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!course) return <div className="p-8 text-center text-gray-400">Course not found</div>;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/admin/courses')} className="bg-gray-100 p-2 rounded-xl hover:bg-gray-200 transition">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-[#0B3A63]">{course.title}</h1>
                    <p className="text-gray-400 font-bold">Grade {course.gradeLevel} • {course.chapters?.length || 0} chapters</p>
                </div>
            </div>

            {/* Add Chapter Button */}
            <button
                onClick={() => {
                    setChapterForm({ title: '', description: '', order: (course?.chapters?.length || 0) + 1 });
                    setChapterCoverFile(null);
                    setChapterModal(true);
                }}
                className="flex items-center gap-2 bg-[#0F4C81] text-white font-bold px-5 py-3 rounded-2xl hover:bg-blue-700 transition shadow-btn mb-6"
            >
                <PlusIcon className="w-5 h-5" /> Add Chapter
            </button>

            {/* Chapters */}
            <div className="space-y-4">
                {(course.chapters || []).sort((a, b) => a.order - b.order).map((chapter) => (
                    <div key={chapter.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                        {/* Chapter Header */}
                        <div className="p-5 border-b border-gray-50">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 space-y-1.5 pr-4">
                                    <span className="text-xs font-bold text-gray-400 uppercase">Chapter {chapter.order}</span>
                                    <EditableRow label="Title" value={chapter.title} onSave={(v) => updateChapterField(chapter.id, 'title', v)} />
                                    <EditableRow label="Description" value={chapter.description} onSave={(v) => updateChapterField(chapter.id, 'description', v)} />
                                    <EditableRow label="Cover" value={chapter.coverImage} onSave={(v) => updateChapterField(chapter.id, 'coverImage', v)} isImage />
                                </div>
                                <div className="flex gap-2 shrink-0">
                                    <button
                                        onClick={() => {
                                            setTopicForm({ title: '', description: '', order: (chapter.topics?.length || 0) + 1 });
                                            setTopicCoverFile(null);
                                            setTopicModal(chapter.id);
                                        }}
                                        className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-100 transition"
                                    >
                                        + Topic
                                    </button>
                                    <button onClick={() => deleteChapter(chapter.id)} className="p-2 hover:bg-red-50 rounded-xl transition">
                                        <TrashIcon className="w-4 h-4 text-red-400" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Topics */}
                        <div className="divide-y divide-gray-50">
                            {(chapter.topics || []).sort((a, b) => a.order - b.order).map((topic) => (
                                <div key={topic.id} className="px-5 py-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex-1 space-y-1 pr-4">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-black text-[#0B3A63]">📌 Topic {topic.order}</span>
                                            </div>
                                            <EditableRow label="Title" value={topic.title} onSave={(v) => updateTopicField(chapter.id, topic.id, 'title', v)} />
                                            <EditableRow label="Description" value={topic.description} onSave={(v) => updateTopicField(chapter.id, topic.id, 'description', v)} />
                                            <EditableRow label="Cover" value={topic.coverImage} onSave={(v) => updateTopicField(chapter.id, topic.id, 'coverImage', v)} isImage />
                                        </div>
                                        <div className="flex gap-2 shrink-0">
<button
                                                onClick={() => {
                                                    setLessonForm({ title: '', description: '', order: (topic.lessons?.length || 0) + 1 });
                                                    setLessonCoverFile(null);
                                                    setLessonModal({ chapterId: chapter.id, topicId: topic.id });
                                                }}
                                                className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100 transition"
                                            >
                                                + Lesson
                                            </button>
                                            <button
                                                onClick={() => setQuizModal({ chapterId: chapter.id, topicId: topic.id, topicName: topic.title })}
                                                className="text-[10px] font-bold bg-purple-50 text-purple-600 px-2 py-1 rounded-lg hover:bg-purple-100 transition"
                                            >
                                                📝 Quiz
                                            </button>
                                            <button onClick={() => deleteTopic(chapter.id, topic.id)} className="text-red-400 hover:text-red-600 p-1 hover:bg-red-50 rounded-lg">
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lessons */}
                                    <div className="pl-4 space-y-1 mt-2">
                                        {(topic.lessons || []).sort((a, b) => a.order - b.order).map((lesson) => (
                                            <div key={lesson.id} className="bg-gray-50 rounded-xl px-3 py-2.5 border border-gray-100">
                                                <div className="flex justify-between items-start">
                                                    <div className="flex-1 space-y-0.5 pr-3">
                                                        <EditableRow label="Title" value={lesson.title} onSave={(v) => updateLessonField(chapter.id, topic.id, lesson.id, 'title', v)} />
                                                        <EditableRow label="Desc" value={lesson.description} onSave={(v) => updateLessonField(chapter.id, topic.id, lesson.id, 'description', v)} />
                                                        <EditableRow label="Cover" value={lesson.coverImage} onSave={(v) => updateLessonField(chapter.id, topic.id, lesson.id, 'coverImage', v)} isImage />
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <button
                                                            onClick={() => setActiveLesson({ chapterId: chapter.id, topicId: topic.id, lesson })}
                                                            className="text-[10px] font-bold text-blue-600 hover:underline whitespace-nowrap"
                                                        >
                                                            📄 Content
                                                        </button>
                                                        <button onClick={() => deleteLesson(chapter.id, topic.id, lesson.id)} className="text-red-300 hover:text-red-500 p-1 hover:bg-red-50 rounded-lg">
                                                            <TrashIcon className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── CHAPTER MODAL ── */}
            {chapterModal && (
                <Modal title="Add New Chapter" onClose={() => setChapterModal(false)}>
                    <form onSubmit={addChapter} className="space-y-4">
                        <Field label="Chapter Title" value={chapterForm.title} onChange={e => setChapterForm({ ...chapterForm, title: e.target.value })} placeholder="e.g. Introduction to Math" required />
                        <Field label="Description (optional)" value={chapterForm.description} onChange={e => setChapterForm({ ...chapterForm, description: e.target.value })} placeholder="Brief overview of this chapter" />
                        <Field label="Order" type="number" min="1" value={chapterForm.order} onChange={e => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) })} />
                        <FileField label="Cover Image (optional)" onChange={e => setChapterCoverFile(e.target.files[0])} hasFile={!!chapterCoverFile} />
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="flex-1 bg-[#0F4C81] text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? 'Saving...' : 'Create Chapter'}
                            </button>
                            <button type="button" onClick={() => setChapterModal(false)} className="px-5 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── TOPIC MODAL ── */}
            {topicModal && (
                <Modal title="Add New Topic" onClose={() => setTopicModal(null)}>
                    <form onSubmit={addTopic} className="space-y-4">
                        <Field label="Topic Title" value={topicForm.title} onChange={e => setTopicForm({ ...topicForm, title: e.target.value })} placeholder="e.g. Fractions & Decimals" required />
                        <Field label="Description (optional)" value={topicForm.description} onChange={e => setTopicForm({ ...topicForm, description: e.target.value })} placeholder="What will students learn?" />
                        <Field label="Order" type="number" min="1" value={topicForm.order} onChange={e => setTopicForm({ ...topicForm, order: parseInt(e.target.value) })} />
                        <FileField label="Cover Image (optional)" onChange={e => setTopicCoverFile(e.target.files[0])} hasFile={!!topicCoverFile} />
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="flex-1 bg-[#0F4C81] text-white font-bold py-3 rounded-2xl hover:bg-blue-700 transition disabled:opacity-50">
                                {saving ? 'Saving...' : 'Create Topic'}
                            </button>
                            <button type="button" onClick={() => setTopicModal(null)} className="px-5 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

            {/* ── LESSON MODAL ── */}
            {lessonModal && (
                <Modal title="Add New Lesson" onClose={() => setLessonModal(null)}>
                    <form onSubmit={addLesson} className="space-y-4">
                        <Field label="Lesson Title" value={lessonForm.title} onChange={e => setLessonForm({ ...lessonForm, title: e.target.value })} placeholder="e.g. What Are Fractions?" required />
                        <Field label="Description (optional)" value={lessonForm.description} onChange={e => setLessonForm({ ...lessonForm, description: e.target.value })} placeholder="Short lesson summary" />
                        <Field label="Order" type="number" min="1" value={lessonForm.order} onChange={e => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })} />
                        <FileField label="Cover Image (optional)" onChange={e => setLessonCoverFile(e.target.files[0])} hasFile={!!lessonCoverFile} />
                        <div className="flex gap-3 pt-2">
                            <button type="submit" disabled={saving} className="flex-1 bg-green-600 text-white font-bold py-3 rounded-2xl hover:bg-green-700 transition disabled:opacity-50">
                                {saving ? 'Saving...' : 'Create Lesson'}
                            </button>
                            <button type="button" onClick={() => setLessonModal(null)} className="px-5 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition">
                                Cancel
                            </button>
                        </div>
                    </form>
                </Modal>
            )}

{/* ── LESSON CONTENT MODAL (existing) ── */}
            {activeLesson && (
                <AdminLessonModal
                    courseId={courseId}
                    chapterId={activeLesson.chapterId}
                    topicId={activeLesson.topicId}
                    lesson={activeLesson.lesson}
                    onClose={() => setActiveLesson(null)}
                />
            )}

            {/* ── QUIZ BUILDER MODAL ── */}
            {quizModal && (
                <AdminQuizBuilder
                    courseId={courseId}
                    chapterId={quizModal.chapterId}
                    topicId={quizModal.topicId}
                    topicName={quizModal.topicName}
                    onClose={() => setQuizModal(null)}
                />
            )}
        </div>
    );
}
