import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { XMarkIcon, PlusIcon, TrashIcon, PhotoIcon, SpeakerWaveIcon, VideoCameraIcon, DocumentIcon } from '@heroicons/react/24/outline';

const TYPE_ICONS = {
    TEXT: '📝',
    AUDIO: '🔊',
    VIDEO: '🎬',
    IMAGE: '🖼️',
    DOCUMENT: '📄',
};

export default function AdminLessonModal({ courseId, chapterId, topicId, lesson, onClose }) {
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);

    // New Content Form
    const [type, setType] = useState('TEXT');
    const [content, setContentText] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    const contentsUrl = `/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/lessons/${lesson.id}/contents`;

    const fetchContents = async () => {
        try {
            const res = await api.get(contentsUrl);
            setContents(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContents();
    }, [lesson.id]);

    const handleAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalContent = content;

            if (type !== 'TEXT' && file) {
                const formData = new FormData();
                formData.append('file', file);
                const uploadRes = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                finalContent = uploadRes.data.url;
            }

            await api.post(contentsUrl, {
                type,
                content: finalContent,
                description,
                order: contents.length + 1
            });

            setContentText('');
            setDescription('');
            setFile(null);
            if (fileInputRef.current) fileInputRef.current.value = '';
            await fetchContents();
        } catch (err) {
            console.error(err);
            alert('Failed to add content.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (contentId) => {
        if (!confirm("Delete this content block?")) return;
        try {
            await api.delete(`${contentsUrl}/${contentId}`);
            setContents(contents.filter(c => c.id !== contentId));
        } catch (err) {
            alert('Failed to delete content.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-kidText">📚 {lesson.title}</h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">Manage content blocks below</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                {/* Content List */}
                <div className="flex-1 overflow-y-auto p-5 bg-gray-50/50 space-y-3">
                    {loading ? (
                        <div className="text-center text-gray-400 font-bold py-10">Loading...</div>
                    ) : contents.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-3xl border border-gray-100">
                            <span className="text-4xl block mb-2">📄</span>
                            <p className="text-gray-400 font-bold">Empty lesson — add content below!</p>
                        </div>
                    ) : (
                        contents.sort((a, b) => a.order - b.order).map((item, idx) => (
                            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft flex gap-3 items-start">
                                <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 font-bold text-blue-600 text-sm">
                                    {idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                                            {TYPE_ICONS[item.type]} {item.type}
                                        </span>
                                        {item.description && (
                                            <span className="font-bold text-kidText text-sm">"{item.description}"</span>
                                        )}
                                    </div>
                                    <div className="text-gray-500 font-medium text-xs mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100 truncate">
                                        {item.content}
                                    </div>
                                </div>
                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition">
                                    <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>

                {/* Add Form */}
                <div className="p-5 bg-white border-t border-gray-100">
                    <form onSubmit={handleAdd} className="space-y-3">
                        <div className="flex gap-3">
                            <select
                                value={type}
                                onChange={e => {
                                    setType(e.target.value);
                                    setContentText('');
                                    setFile(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }}
                                className="px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-kidText text-sm focus:border-kidOrange outline-none"
                            >
                                <option value="TEXT">📝 Text</option>
                                <option value="VIDEO">🎬 Video</option>
                                <option value="AUDIO">🔊 Audio</option>
                                <option value="IMAGE">🖼️ Image</option>
                                <option value="DOCUMENT">📄 Document</option>
                            </select>

                            <input
                                type="text"
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder='Section label, e.g. "Hear the Word!"'
                                className="flex-1 px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-kidText text-sm focus:border-kidOrange outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            {type === 'TEXT' ? (
                                <textarea
                                    value={content}
                                    onChange={e => setContentText(e.target.value)}
                                    placeholder="Enter your lesson text here..."
                                    rows={3}
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-kidText text-sm focus:border-kidOrange outline-none resize-none"
                                    required
                                />
                            ) : (
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={e => setFile(e.target.files[0])}
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-kidText text-sm focus:border-kidOrange outline-none"
                                    required
                                    accept={
                                        type === 'IMAGE' ? 'image/*' :
                                            type === 'VIDEO' ? 'video/*' :
                                                type === 'AUDIO' ? 'audio/*' : '*'
                                    }
                                />
                            )}

                            <button
                                disabled={submitting}
                                type="submit"
                                className="bg-kidOrange text-white font-bold px-5 py-2.5 rounded-2xl hover:bg-orange-600 transition flex items-center gap-2 shadow-btn disabled:opacity-50 active:scale-95 shrink-0"
                            >
                                <PlusIcon className="w-4 h-4" />
                                {submitting ? 'Adding...' : 'Add'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}
