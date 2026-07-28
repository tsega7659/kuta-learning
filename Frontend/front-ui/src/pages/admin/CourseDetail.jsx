import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { PlusIcon, TrashIcon, ChevronLeftIcon } from '@heroicons/react/24/outline';
import AdminLessonModal from './components/AdminLessonModal';

export default function AdminCourseDetail() {
    const { courseId } = useParams();
    const navigate = useNavigate();
    const [course, setCourse] = useState(null);
    const [loading, setLoading] = useState(true);

    // Chapter form
    const [showChapterForm, setShowChapterForm] = useState(false);
    const [chapterForm, setChapterForm] = useState({ title: '', order: 1 });

    // Topic form
    const [showTopicForm, setShowTopicForm] = useState(null); // chapterId
    const [topicForm, setTopicForm] = useState({ title: '', order: 1 });

    // Lesson form
    const [showLessonForm, setShowLessonForm] = useState(null); // topicId
    const [lessonForm, setLessonForm] = useState({ title: '', description: '', order: 1 });

    // Lesson Content Modal
    const [activeLesson, setActiveLesson] = useState(null);

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

    const addChapter = async (e) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${courseId}/chapters`, chapterForm);
            setShowChapterForm(false);
            setChapterForm({ title: '', order: (course?.chapters?.length || 0) + 1 });
            fetchCourse();
        } catch (err) {
            alert('Failed to create chapter');
        }
    };

    const deleteChapter = async (chapterId) => {
        if (!confirm('Delete this chapter and all its contents?')) return;
        try {
            await api.delete(`/courses/${courseId}/chapters/${chapterId}`);
            fetchCourse();
        } catch (err) {
            alert('Failed to delete chapter');
        }
    };

    const addTopic = async (e, chapterId) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${courseId}/chapters/${chapterId}/topics`, topicForm);
            setShowTopicForm(null);
            setTopicForm({ title: '', order: 1 });
            fetchCourse();
        } catch (err) {
            alert('Failed to create topic');
        }
    };

    const deleteTopic = async (chapterId, topicId) => {
        if (!confirm('Delete this topic?')) return;
        try {
            await api.delete(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}`);
            fetchCourse();
        } catch (err) {
            alert('Failed to delete topic');
        }
    };

    const addLesson = async (e, chapterId, topicId) => {
        e.preventDefault();
        try {
            await api.post(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons`, lessonForm);
            setShowLessonForm(null);
            setLessonForm({ title: '', description: '', order: 1 });
            fetchCourse();
        } catch (err) {
            alert('Failed to create lesson');
        }
    };

    const deleteLesson = async (chapterId, topicId, lessonId) => {
        if (!confirm('Delete this lesson?')) return;
        try {
            await api.delete(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lessonId}`);
            fetchCourse();
        } catch (err) {
            alert('Failed to delete lesson');
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-10 h-10 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (!course) return <div className="p-8 text-center text-gray-400">Course not found</div>;

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate('/admin/courses')} className="bg-gray-100 p-2 rounded-xl hover:bg-gray-200 transition">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <div>
                    <h1 className="text-3xl font-black text-kidText">{course.title}</h1>
                    <p className="text-gray-400 font-bold">Grade {course.gradeLevel} • {course.chapters?.length || 0} chapters</p>
                </div>
            </div>

            {/* Add Chapter Button */}
            <button
                onClick={() => { setShowChapterForm(true); setChapterForm({ title: '', order: (course?.chapters?.length || 0) + 1 }); }}
                className="flex items-center gap-2 bg-kidOrange text-white font-bold px-5 py-3 rounded-2xl hover:bg-orange-600 transition shadow-btn mb-6"
            >
                <PlusIcon className="w-5 h-5" /> Add Chapter
            </button>

            {/* Chapter Form */}
            {showChapterForm && (
                <form onSubmit={addChapter} className="bg-white rounded-2xl p-4 shadow-soft border border-gray-100 mb-6 flex gap-3 items-end">
                    <input type="text" placeholder="Chapter Title" value={chapterForm.title} onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                        className="flex-1 px-4 py-3 rounded-xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium" required />
                    <input type="number" placeholder="Order" value={chapterForm.order} onChange={(e) => setChapterForm({ ...chapterForm, order: parseInt(e.target.value) })}
                        className="w-20 px-3 py-3 rounded-xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium" required />
                    <button type="submit" className="bg-kidOrange text-white font-bold px-5 py-3 rounded-xl">Save</button>
                    <button type="button" onClick={() => setShowChapterForm(false)} className="bg-gray-100 text-kidText font-bold px-5 py-3 rounded-xl">Cancel</button>
                </form>
            )}

            {/* Chapters Accordion */}
            <div className="space-y-4">
                {(course.chapters || []).sort((a, b) => a.order - b.order).map((chapter) => (
                    <div key={chapter.id} className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
                        {/* Chapter Header */}
                        <div className="flex justify-between items-center p-5 border-b border-gray-50">
                            <div>
                                <span className="text-xs font-bold text-gray-400 uppercase">Chapter {chapter.order}</span>
                                <h3 className="font-bold text-kidText text-lg">{chapter.title}</h3>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setShowTopicForm(chapter.id); setTopicForm({ title: '', order: (chapter.topics?.length || 0) + 1 }); }}
                                    className="text-xs font-bold bg-blue-50 text-blue-600 px-3 py-2 rounded-xl hover:bg-blue-100 transition">
                                    + Topic
                                </button>
                                <button onClick={() => deleteChapter(chapter.id)} className="p-2 hover:bg-red-50 rounded-xl transition">
                                    <TrashIcon className="w-4 h-4 text-red-400" />
                                </button>
                            </div>
                        </div>

                        {/* Topic Form */}
                        {showTopicForm === chapter.id && (
                            <form onSubmit={(e) => addTopic(e, chapter.id)} className="p-4 bg-blue-50/50 flex gap-3 items-end">
                                <input type="text" placeholder="Topic Title" value={topicForm.title} onChange={(e) => setTopicForm({ ...topicForm, title: e.target.value })}
                                    className="flex-1 px-4 py-2 rounded-xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium text-sm" required />
                                <input type="number" placeholder="Order" value={topicForm.order} onChange={(e) => setTopicForm({ ...topicForm, order: parseInt(e.target.value) })}
                                    className="w-16 px-3 py-2 rounded-xl border-2 border-gray-100 font-medium text-sm" required />
                                <button type="submit" className="bg-blue-600 text-white font-bold px-4 py-2 rounded-xl text-sm">Save</button>
                                <button type="button" onClick={() => setShowTopicForm(null)} className="bg-gray-100 px-4 py-2 rounded-xl text-sm font-bold">Cancel</button>
                            </form>
                        )}

                        {/* Topics */}
                        <div className="divide-y divide-gray-50">
                            {(chapter.topics || []).sort((a, b) => a.order - b.order).map((topic) => (
                                <div key={topic.id} className="px-5 py-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <h4 className="font-bold text-kidText text-sm">📌 {topic.title}</h4>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setShowLessonForm(topic.id); setLessonForm({ title: '', description: '', order: (topic.lessons?.length || 0) + 1 }); }}
                                                className="text-[10px] font-bold bg-green-50 text-green-600 px-2 py-1 rounded-lg hover:bg-green-100 transition">
                                                + Lesson
                                            </button>
                                            <button onClick={() => deleteTopic(chapter.id, topic.id)} className="text-red-400 hover:text-red-600">
                                                <TrashIcon className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Lesson Form */}
                                    {showLessonForm === topic.id && (
                                        <form onSubmit={(e) => addLesson(e, chapter.id, topic.id)} className="mb-3 p-3 bg-green-50/50 rounded-xl flex gap-2 items-end flex-wrap">
                                            <input type="text" placeholder="Lesson Title" value={lessonForm.title} onChange={(e) => setLessonForm({ ...lessonForm, title: e.target.value })}
                                                className="flex-1 min-w-[150px] px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none font-medium text-sm" required />
                                            <input type="number" placeholder="#" value={lessonForm.order} onChange={(e) => setLessonForm({ ...lessonForm, order: parseInt(e.target.value) })}
                                                className="w-14 px-2 py-2 rounded-xl border-2 border-gray-100 font-medium text-sm" required />
                                            <button type="submit" className="bg-green-600 text-white font-bold px-3 py-2 rounded-xl text-sm">Save</button>
                                            <button type="button" onClick={() => setShowLessonForm(null)} className="bg-gray-100 px-3 py-2 rounded-xl text-sm font-bold">Cancel</button>
                                        </form>
                                    )}

                                    {/* Lessons */}
                                    <div className="pl-4 space-y-1">
                                        {(topic.lessons || []).sort((a, b) => a.order - b.order).map((lesson) => (
                                            <div key={lesson.id} className="flex justify-between items-center py-1.5 hover:bg-gray-50 px-2 rounded-lg transition">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm">📝</span>
                                                    <span className="text-sm font-medium text-kidText">{lesson.title}</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <button
                                                        onClick={() => setActiveLesson({ chapterId: chapter.id, topicId: topic.id, lesson })}
                                                        className="text-xs font-bold text-kidOrange hover:underline"
                                                    >
                                                        Manage Content
                                                    </button>
                                                    <button onClick={() => deleteLesson(chapter.id, topic.id, lesson.id)} className="text-red-300 hover:text-red-500">
                                                        <TrashIcon className="w-4 h-4" />
                                                    </button>
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
            {activeLesson && (
                <AdminLessonModal
                    courseId={courseId}
                    chapterId={activeLesson.chapterId}
                    topicId={activeLesson.topicId}
                    lesson={activeLesson.lesson}
                    onClose={() => setActiveLesson(null)}
                />
            )}
        </div>
    );
}
