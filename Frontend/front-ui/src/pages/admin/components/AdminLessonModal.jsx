import { useState, useEffect, useRef } from 'react';
import api from '../../../services/api';
import { XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon } from '@heroicons/react/24/outline';

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

    // Add form state
    const [type, setType] = useState('TEXT');
    const [content, setContentText] = useState('');
    const [description, setDescription] = useState('');
    const [file, setFile] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const fileInputRef = useRef(null);

    // Edit state
    const [editingId, setEditingId] = useState(null);
    const [editContent, setEditContent] = useState('');
    const [editDescription, setEditDescription] = useState('');
    const [editFile, setEditFile] = useState(null);
    const editFileRef = useRef(null);
    const [editSaving, setEditSaving] = useState(false);

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

    useEffect(() => { fetchContents(); }, [lesson.id]);

    const uploadFile = async (f) => {
        if (!f) return null;
        const formData = new FormData();
        formData.append('file', f);
        const res = await api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.url;
    };

    // ── Add new content block ──
    const handleAdd = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let finalContent = content;
            if (type !== 'TEXT' && file) {
                finalContent = await uploadFile(file);
            }
            await api.post(contentsUrl, { type, content: finalContent, description, order: contents.length + 1 });
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

    // ── Open edit inline ──
    const startEdit = (item) => {
        setEditingId(item.id);
        setEditContent(item.content);
        setEditDescription(item.description || '');
        setEditFile(null);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditContent('');
        setEditDescription('');
        setEditFile(null);
    };

    // ── Save edited content block ──
    const handleSaveEdit = async (item) => {
        setEditSaving(true);
        try {
            let finalContent = editContent;
            if (item.type !== 'TEXT' && editFile) {
                finalContent = await uploadFile(editFile);
            }
            await api.put(`${contentsUrl}/${item.id}`, {
                content: finalContent,
                description: editDescription,
                order: item.order,
            });
            cancelEdit();
            await fetchContents();
        } catch (err) {
            alert('Failed to update content.');
        } finally {
            setEditSaving(false);
        }
    };

    // ── Delete content block ──
    const handleDelete = async (contentId) => {
        if (!confirm("Delete this content block?")) return;
        try {
            await api.delete(`${contentsUrl}/${contentId}`);
            setContents(contents.filter(c => c.id !== contentId));
        } catch {
            alert('Failed to delete content.');
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center shrink-0">
                    <div>
                        <h2 className="text-lg font-black text-[#0B3A63]">📚 {lesson.title}</h2>
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
                            <div key={item.id} className="bg-white p-4 rounded-2xl border border-gray-100 shadow-soft">
                                {editingId === item.id ? (
                                    /* ── Inline Edit Mode ── */
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="w-7 h-7 bg-orange-100 text-orange-600 rounded-lg flex items-center justify-center text-xs font-bold shrink-0">{idx + 1}</span>
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                                                {TYPE_ICONS[item.type]} {item.type}
                                            </span>
                                            <span className="text-xs text-orange-500 font-bold ml-auto">Editing</span>
                                        </div>
                                        <input
                                            type="text"
                                            value={editDescription}
                                            onChange={e => setEditDescription(e.target.value)}
                                            placeholder='Section label...'
                                            className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-sm focus:border-[#0F4C81] outline-none"
                                        />
                                        {item.type === 'TEXT' ? (
                                            <textarea
                                                value={editContent}
                                                onChange={e => setEditContent(e.target.value)}
                                                rows={4}
                                                className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-sm focus:border-[#0F4C81] outline-none resize-none"
                                            />
                                        ) : (
                                            <div className="space-y-2">
                                                <div className="text-xs font-bold text-gray-500 bg-gray-50 p-2 rounded-lg border border-gray-200 truncate">
                                                    Current: {editContent}
                                                </div>
                                                <input
                                                    type="file"
                                                    ref={editFileRef}
                                                    onChange={e => setEditFile(e.target.files[0])}
                                                    className="w-full px-3 py-2 bg-gray-50 border-2 border-gray-200 rounded-xl font-medium text-sm focus:border-[#0F4C81] outline-none"
                                                    accept={
                                                        item.type === 'IMAGE' ? 'image/*' :
                                                            item.type === 'VIDEO' ? 'video/*' :
                                                                item.type === 'AUDIO' ? 'audio/*' : '*'
                                                    }
                                                />
                                                <p className="text-[10px] text-gray-400 font-bold">Leave file empty to keep the current content URL.</p>
                                            </div>
                                        )}
                                        <div className="flex gap-2 justify-end">
                                            <button onClick={cancelEdit} className="px-4 py-2 text-sm font-bold text-gray-500 hover:bg-gray-100 rounded-xl transition">
                                                Cancel
                                            </button>
                                            <button
                                                onClick={() => handleSaveEdit(item)}
                                                disabled={editSaving}
                                                className="px-4 py-2 text-sm font-bold bg-[#0F4C81] text-white rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50 flex items-center gap-1.5"
                                            >
                                                <CheckIcon className="w-4 h-4" />
                                                {editSaving ? 'Saving...' : 'Save'}
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    /* ── View Mode ── */
                                    <div className="flex gap-3 items-start group">
                                        <div className="w-9 h-9 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 font-bold text-blue-600 text-sm">
                                            {idx + 1}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider bg-gray-100 px-2 py-0.5 rounded-full">
                                                    {TYPE_ICONS[item.type]} {item.type}
                                                </span>
                                                {item.description && (
                                                    <span className="font-bold text-[#0B3A63] text-sm">"{item.description}"</span>
                                                )}
                                            </div>
                                            <div className="text-gray-500 font-medium text-xs mt-1 bg-gray-50 p-2 rounded-lg border border-gray-100 truncate">
                                                {item.content}
                                            </div>
                                        </div>
                                        <div className="flex gap-1 shrink-0 transition">
                                            <button
                                                onClick={() => startEdit(item)}
                                                className="p-1.5 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                                title="Edit this block"
                                            >
                                                <PencilIcon className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(item.id)}
                                                className="p-1.5 text-red-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                title="Delete this block"
                                            >
                                                <TrashIcon className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>

                {/* Add Form */}
                <div className="p-5 bg-white border-t border-gray-100 shrink-0">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-3">Add New Block</p>
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
                                className="px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-bold text-[#0B3A63] text-sm focus:border-[#0F4C81] outline-none"
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
                                className="flex-1 px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-[#0B3A63] text-sm focus:border-[#0F4C81] outline-none"
                            />
                        </div>

                        <div className="flex gap-3">
                            {type === 'TEXT' ? (
                                <textarea
                                    value={content}
                                    onChange={e => setContentText(e.target.value)}
                                    placeholder="Enter your lesson text here..."
                                    rows={3}
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-[#0B3A63] text-sm focus:border-[#0F4C81] outline-none resize-none"
                                    required
                                />
                            ) : (
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={e => setFile(e.target.files[0])}
                                    className="flex-1 px-3 py-2.5 bg-gray-50 border-2 border-gray-100 rounded-2xl font-medium text-[#0B3A63] text-sm focus:border-[#0F4C81] outline-none"
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
                                className="bg-[#0F4C81] text-white font-bold px-5 py-2.5 rounded-2xl hover:bg-[#0B3A63] transition flex items-center gap-2 shadow-btn disabled:opacity-50 active:scale-95 shrink-0"
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
