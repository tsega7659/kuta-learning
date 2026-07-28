import { useState, useEffect } from 'react';
import api from '../../../services/api';
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline';

export default function AdminLessonModal({ courseId, chapterId, topicId, lesson, onClose }) {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Content Form
    const [type, setType] = useState('TEXT');
    const [content, setContentText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchContents = async () => {
            try {
                // Actually, our API might not have a direct GET /courses/:c/chapters/:ch/topics/:t/lessons/:l/contents
                // We just use the flat route or the nested one:
                const res = await api.get(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lesson.id}/contents`);
                // Wait, I should check if the API supports GET on contents.
                setContents(res.data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchContents();
    }, [courseId, chapterId, topicId, lesson.id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lesson.id}/contents`, {
                type,
                content,
                order: contents.length + 1
            });
            setContentText('');

            // Refetch
            const res = await api.get(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lesson.id}/contents`);
            setContents(res.data);
        } catch (err) {
            alert('Failed to add content.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (contentId) => {
        if (!confirm("Are you sure?")) return;
        try {
            await api.delete(`/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lesson.id}/contents/${contentId}`);
            setContents(contents.filter(c => c.id !== contentId));
        } catch (err) {
            alert('Failed to delete content.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-6 flex justify-between items-center">
                    <div>
                        <h2 className="text-xl font-black text-kidText">Content for: {lesson.title}</h2>
                        <p className="text-sm font-bold text-gray-400">Manage text, video, or audio blocks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <XMarkIcon className="w-6 h-6 text-gray-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/50">
                    {loading ? (
                        <div className="text-center text-gray-400 font-bold py-10">Loading layout...</div>
                    ) : (
                        <div className="space-y-4">
                            {contents.length === 0 ? (
                                <div className="text-center py-10 bg-white rounded-3xl border border-gray-100 shadow-sm">
                                    <span className="text-4xl block mb-2">📄</span>
                                    <p className="text-gray-400 font-bold">This lesson is empty.</p>
                                </div>
                            ) : (
                                contents.sort((a, b) => a.order - b.order).map((item, idx) => (
                                    <div key={item.id} className="bg-white p-5 rounded-2xl border border-gray-100 shadow-soft flex gap-4 items-start">
                                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 font-bold text-blue-600">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{item.type}</span>
                                            <div className="text-kidText font-medium whitespace-pre-wrap text-sm mt-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                {item.content}
                                            </div>
                                        </div>
                                        <button onClick={() => handleDelete(item.id)} className="p-2 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                                            <TrashIcon className="w-5 h-5" />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Add Form */}
                <div className="p-6 bg-white border-t border-gray-100">
                    <form onSubmit={handleAdd} className="flex gap-3">
                        <select
                            value={type}
                            onChange={e => setType(e.target.value)}
                            className="px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-kidText focus:border-kidOrange outline-none"
                        >
                            <option value="TEXT">Text</option>
                            <option value="VIDEO">Video URL</option>
                            <option value="AUDIO">Audio URL</option>
                            <option value="IMAGE">Image URL</option>
                        </select>
                        <input
                            type="text"
                            value={content}
                            onChange={e => setContentText(e.target.value)}
                            placeholder="Enter text or URL..."
                            className="flex-1 px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-kidText focus:border-kidOrange outline-none"
                            required
                        />
                        <button
                            disabled={submitting}
                            className="bg-kidOrange text-white font-bold px-6 py-3 rounded-2xl hover:bg-orange-600 transition flex items-center gap-2 shadow-btn disabled:opacity-50 active:scale-95"
                        >
                            <PlusIcon className="w-5 h-5" /> Add
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
