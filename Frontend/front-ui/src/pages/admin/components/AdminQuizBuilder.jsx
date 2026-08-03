import { useState, useEffect } from 'react';
import api from '../../../services/api';
import {
    XMarkIcon, PlusIcon, TrashIcon, PencilIcon, CheckIcon, ChevronUpIcon, ChevronDownIcon,
} from '@heroicons/react/24/outline';

const QUESTION_TYPES = [
    { value: 'SINGLE_CHOICE', label: 'Single Choice', icon: '🔘' },
    { value: 'MULTIPLE_CHOICE', label: 'Multiple Answer', icon: '☑️' },
    { value: 'TRUE_FALSE', label: 'True / False', icon: '✅' },
    { value: 'COLOR_MATCH', label: 'Color Match', icon: '🎨' },
    { value: 'WORD_ORDER', label: 'Word Order', icon: '🔤' },
    { value: 'MATCHING', label: 'Matching', icon: '🔗' },
    { value: 'FILL_IN_BLANK', label: 'Fill in Blank', icon: '✏️' },
    { value: 'DRAG_AND_DROP', label: 'Drag & Drop', icon: '🖱️' },
];

const TYPE_ICONS = QUESTION_TYPES.reduce((acc, t) => { acc[t.value] = t.icon; return acc; }, {});

export default function AdminQuizBuilder({ courseId, chapterId, topicId, topicName, onClose }) {
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const uploadFile = async (file) => {
        if (!file) return null;
        const formData = new FormData();
        formData.append('file', file);
        const res = await api.post('/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return res.data.url;
    };

    // Quiz form
    const [quizForm, setQuizForm] = useState({ title: '', description: '', passingScore: 60 });

    // Question form
    const [showQuestionForm, setShowQuestionForm] = useState(false);
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [questionForm, setQuestionForm] = useState({
        type: 'SINGLE_CHOICE',
        text: '',
        explanation: '',
        resourceUrl: '',
        resourceFile: null,
        options: [
            { text: '', isCorrect: false, imageUrl: '', imageFile: null },
            { text: '', isCorrect: false, imageUrl: '', imageFile: null },
            { text: '', isCorrect: false, imageUrl: '', imageFile: null },
            { text: '', isCorrect: false, imageUrl: '', imageFile: null },
        ],
    });

    const quizUrl = `/courses/${courseId}/chapters/${chapterId}/topics/${topicId}/quiz`;

    const fetchQuiz = async () => {
        try {
            const res = await api.get(quizUrl);
            setQuiz(res.data);
            if (res.data) {
                setQuizForm({
                    title: res.data.title || '',
                    description: res.data.description || '',
                    passingScore: res.data.passingScore || 60,
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchQuiz(); }, [topicId]);

    // ── Quiz CRUD ──
    const handleCreateQuiz = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post(quizUrl, {
                title: quizForm.title,
                description: quizForm.description,
                passingScore: parseInt(quizForm.passingScore),
            });
            await fetchQuiz();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to create quiz');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateQuiz = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.put(`${quizUrl}/${quiz.id}`, {
                title: quizForm.title,
                description: quizForm.description,
                passingScore: parseInt(quizForm.passingScore),
            });
            await fetchQuiz();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to update quiz');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuiz = async () => {
        if (!confirm('Delete this quiz and all its questions?')) return;
        try {
            await api.delete(`${quizUrl}/${quiz.id}`);
            setQuiz(null);
            setQuizForm({ title: '', description: '', passingScore: 60 });
        } catch (err) {
            alert('Failed to delete quiz');
        }
    };

    // ── Question form helpers ──
    const openAddQuestion = () => {
        setEditingQuestion(null);
        setQuestionForm({
            type: 'SINGLE_CHOICE',
            text: '',
            explanation: '',
            resourceUrl: '',
            resourceFile: null,
            options: [
                { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                { text: '', isCorrect: false, imageUrl: '', imageFile: null },
            ],
        });
        setShowQuestionForm(true);
    };

    const openEditQuestion = (q) => {
        setEditingQuestion(q);
        const type = q.type || 'SINGLE_CHOICE';
        let options = (q.options || []).map(o => {
            const decoded = { ...o, imageFile: null };
            // Restore matchAnswer for MATCHING questions
            if (type === 'MATCHING' && o.imageUrl?.startsWith('match::')) {
                decoded.matchAnswer = o.imageUrl.replace('match::', '');
                decoded.imageUrl = '';
            }
            return decoded;
        });
        // Ensure minimum options per type
        if (type === 'TRUE_FALSE') {
            while (options.length < 2) options.push({ text: '', isCorrect: false, imageUrl: '' });
        } else if (type === 'WORD_ORDER' || type === 'FILL_IN_BLANK' || type === 'DRAG_AND_DROP') {
            if (options.length === 0) options.push({ text: '', isCorrect: true, imageUrl: '' });
        } else if (type === 'MATCHING') {
            while (options.length < 2) options.push({ text: '', matchAnswer: '', isCorrect: true, imageUrl: '' });
        } else {
            while (options.length < 2) options.push({ text: '', isCorrect: false, imageUrl: '' });
        }
        setQuestionForm({
            type,
            text: q.text || '',
            explanation: q.explanation || '',
            resourceUrl: q.resourceUrl || '',
            resourceFile: null,
            options,
        });
        setShowQuestionForm(true);
    };

    // Reset options/answer when the question type changes
    const handleTypeChange = (type) => {
        setQuestionForm(prev => {
            let options;
            if (type === 'TRUE_FALSE') {
                options = [
                    { text: 'True', isCorrect: true, imageUrl: '', imageFile: null },
                    { text: 'False', isCorrect: false, imageUrl: '', imageFile: null },
                ];
            } else if (type === 'WORD_ORDER' || type === 'DRAG_AND_DROP') {
                // Store the correct word in text; student will see letters scrambled
                options = [{ text: '', isCorrect: true, imageUrl: '', imageFile: null }];
            } else if (type === 'FILL_IN_BLANK') {
                options = [{ text: '', isCorrect: true, imageUrl: '', imageFile: null }];
            } else if (type === 'MATCHING') {
                // Each option stores question in text and answer in imageUrl (repurposed as answer field)
                options = [
                    { text: '', matchAnswer: '', isCorrect: true, imageUrl: '', imageFile: null },
                    { text: '', matchAnswer: '', isCorrect: true, imageUrl: '', imageFile: null },
                ];
            } else {
                // SINGLE_CHOICE, MULTIPLE_CHOICE, COLOR_MATCH
                options = [
                    { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                    { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                    { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                    { text: '', isCorrect: false, imageUrl: '', imageFile: null },
                ];
            }
            return { ...prev, type, options };
        });
    };

    const setOption = (idx, field, value) => {
        setQuestionForm(prev => {
            const options = [...prev.options];
            // For single-select types, uncheck others when one is marked correct
            const singleSelect = prev.type !== 'MULTIPLE_CHOICE';
            if (field === 'isCorrect' && value && singleSelect) {
                options.forEach(o => { o.isCorrect = false; });
            }
            options[idx] = { ...options[idx], [field]: value };
            return { ...prev, options };
        });
    };

    const addOption = () => {
        setQuestionForm(prev => ({
            ...prev,
            options: [...prev.options, { text: '', isCorrect: false, imageUrl: '', imageFile: null }],
        }));
    };

    const removeOption = (idx) => {
        setQuestionForm(prev => ({
            ...prev,
            options: prev.options.filter((_, i) => i !== idx),
        }));
    };

    const handleSaveQuestion = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            const uploadedResourceUrl = await uploadFile(questionForm.resourceFile);

            // For MATCHING, we store the answer in a special JSON imageUrl format
            // e.g. imageUrl = "match::<answer>" — no image upload needed
            const uploadedOptions = await Promise.all(questionForm.options.map(async (o, i) => {
                let imageUrl = null;
                if (questionForm.type === 'MATCHING') {
                    // encode matchAnswer into imageUrl field as "match::<answer>"
                    imageUrl = `match::${o.matchAnswer || ''}`;
                } else {
                    imageUrl = (o.imageFile ? await uploadFile(o.imageFile) : o.imageUrl) || null;
                }
                return {
                    text: o.text,
                    isCorrect: o.isCorrect,
                    imageUrl,
                    order: i + 1,
                };
            }));

            const payload = {
                type: questionForm.type,
                text: questionForm.text,
                explanation: questionForm.explanation,
                resourceUrl: uploadedResourceUrl || questionForm.resourceUrl || null,
                options: uploadedOptions,
            };

            if (editingQuestion) {
                await api.put(`${quizUrl}/${quiz.id}/questions/${editingQuestion.id}`, {
                    type: questionForm.type,
                    text: questionForm.text,
                    explanation: questionForm.explanation,
                    resourceUrl: uploadedResourceUrl || questionForm.resourceUrl || null,
                });

                // Delete removed options
                const existingOptionIds = questionForm.options.map(o => o.id).filter(Boolean);
                const deletedOptions = (editingQuestion.options || []).filter(o => !existingOptionIds.includes(o.id));
                for (const dOpt of deletedOptions) {
                    await api.delete(`${quizUrl}/${quiz.id}/questions/${editingQuestion.id}/options/${dOpt.id}`);
                }

                // Add or update options
                for (const opt of questionForm.options) {
                    const uploadedImageUrl = opt.imageFile ? await uploadFile(opt.imageFile) : opt.imageUrl;

                    if (opt.id) {
                        await api.put(`${quizUrl}/${quiz.id}/questions/${editingQuestion.id}/options/${opt.id}`, {
                            text: opt.text,
                            isCorrect: opt.isCorrect,
                            imageUrl: uploadedImageUrl || null,
                        });
                    } else {
                        await api.post(`${quizUrl}/${quiz.id}/questions/${editingQuestion.id}/options`, {
                            text: opt.text,
                            isCorrect: opt.isCorrect,
                            imageUrl: uploadedImageUrl || null,
                        });
                    }
                }
            } else {
                await api.post(`${quizUrl}/${quiz.id}/questions`, payload);
            }
            setShowQuestionForm(false);
            await fetchQuiz();
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save question');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteQuestion = async (q) => {
        if (!confirm('Delete this question?')) return;
        try {
            await api.delete(`${quizUrl}/${quiz.id}/questions/${q.id}`);
            await fetchQuiz();
        } catch (err) {
            alert('Failed to delete question');
        }
    };

    const moveQuestion = async (q, dir) => {
        const questions = [...(quiz.questions || [])].sort((a, b) => a.order - b.order);
        const idx = questions.findIndex(x => x.id === q.id);
        const swapIdx = idx + dir;
        if (swapIdx < 0 || swapIdx >= questions.length) return;
        const other = questions[swapIdx];
        try {
            await api.put(`${quizUrl}/${quiz.id}/questions/${q.id}`, { order: other.order });
            await api.put(`${quizUrl}/${quiz.id}/questions/${other.id}`, { order: q.order });
            await fetchQuiz();
        } catch (err) {
            alert('Failed to reorder question');
        }
    };

    if (loading) {
        return (
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
                <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl p-8 text-center">
                    <div className="w-10 h-10 border-4 border-[#0F4C81] border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <p className="text-gray-400 font-bold mt-4">Loading quiz...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
            <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="bg-gray-50 border-b border-gray-100 p-5 flex justify-between items-center">
                    <div>
                        <h2 className="text-lg font-black text-[#0B3A63]">📝 Quiz Builder</h2>
                        <p className="text-xs font-bold text-gray-400 mt-0.5">Topic: {topicName}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
                        <XMarkIcon className="w-5 h-5 text-gray-500" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-6">
                    {/* ── Quiz Metadata ── */}
                    {!quiz ? (
                        <form onSubmit={handleCreateQuiz} className="bg-blue-50/50 border border-blue-100 rounded-3xl p-5 space-y-4">
                            <h3 className="font-black text-[#0B3A63]">Create a Quiz</h3>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Quiz Title *</label>
                                <input
                                    value={quizForm.title}
                                    onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                                    placeholder="e.g. Alphabet Quiz: A-F"
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] focus:outline-none font-medium text-sm"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Description (optional)</label>
                                <textarea
                                    value={quizForm.description}
                                    onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                                    placeholder="Short description for students"
                                    rows={2}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] focus:outline-none font-medium text-sm resize-none"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 mb-1">Passing Score (%) *</label>
                                <input
                                    type="number"
                                    value={quizForm.passingScore}
                                    onChange={e => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                                    min="0"
                                    max="100"
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] focus:outline-none font-medium text-sm"
                                    required
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-[#0F4C81] text-white font-bold py-3 rounded-2xl hover:bg-[#0B3A63] transition disabled:opacity-50"
                            >
                                {saving ? 'Creating...' : 'Create Quiz'}
                            </button>
                        </form>
                    ) : (
                        <>
                            {/* Quiz meta view/edit */}
                            <div className="bg-white border border-gray-100 rounded-3xl p-5 shadow-soft">
                                <div className="flex justify-between items-start mb-3">
                                    <div className="flex-1 pr-4">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-black text-[#0B3A63] text-lg">{quiz.title}</h3>
                                            <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">Pass {quiz.passingScore}%</span>
                                        </div>
                                        {quiz.description && (
                                            <p className="text-gray-500 font-medium text-sm mt-1">{quiz.description}</p>
                                        )}
                                        <p className="text-xs font-bold text-gray-400 mt-2">{quiz.questions?.length || 0} questions</p>
                                    </div>
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            onClick={handleDeleteQuiz}
                                            className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                                            title="Delete Quiz"
                                        >
                                            <TrashIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                {/* Inline edit quiz meta */}
                                <form onSubmit={handleUpdateQuiz} className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                                    <input
                                        value={quizForm.title}
                                        onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                                        placeholder="Title"
                                        className="px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none text-sm font-medium"
                                    />
                                    <input
                                        value={quizForm.description}
                                        onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                                        placeholder="Description"
                                        className="px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none text-sm font-medium"
                                    />
                                    <div className="flex gap-2">
                                        <input
                                            type="number"
                                            value={quizForm.passingScore}
                                            onChange={e => setQuizForm({ ...quizForm, passingScore: e.target.value })}
                                            placeholder="Pass %"
                                            min="0"
                                            max="100"
                                            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none text-sm font-medium"
                                        />
                                        <button type="submit" disabled={saving} className="bg-green-500 text-white font-bold px-4 rounded-xl hover:bg-green-600 transition disabled:opacity-50">
                                            <CheckIcon className="w-4 h-4" />
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* ── Questions List ── */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <h3 className="font-black text-[#0B3A63]">Questions</h3>
                                    <button
                                        onClick={openAddQuestion}
                                        className="flex items-center gap-2 bg-[#0F4C81] text-white font-bold text-sm px-4 py-2 rounded-xl hover:bg-[#0B3A63] transition shadow-btn"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Add Question
                                    </button>
                                </div>

                                {(quiz.questions || []).length === 0 ? (
                                    <div className="text-center py-10 bg-gray-50 rounded-3xl border border-gray-100">
                                        <span className="text-4xl block mb-2">❓</span>
                                        <p className="text-gray-400 font-bold">No questions yet. Add your first question!</p>
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {(quiz.questions || []).sort((a, b) => a.order - b.order).map((q, idx) => (
                                            <div key={q.id} className="bg-gray-50 border border-gray-100 rounded-2xl p-4">
                                                <div className="flex justify-between items-start gap-3">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-200 px-2 py-0.5 rounded-full">
                                                                {TYPE_ICONS[q.type] || '🔘'} {q.type.replace(/_/g, ' ')}
                                                            </span>
                                                            <span className="text-[10px] font-bold text-gray-400">Q{idx + 1}</span>
                                                        </div>
                                                        <p className="font-bold text-[#0B3A63] text-sm">{q.text}</p>
                                                        {q.explanation && (
                                                            <p className="text-xs text-gray-400 font-medium mt-1 italic">💡 {q.explanation}</p>
                                                        )}
                                                        {/* Options */}
                                                        <div className="mt-2 space-y-1">
                                                            {(q.options || []).sort((a, b) => a.order - b.order).map((o, oi) => (
                                                                <div key={o.id || oi} className="flex items-center gap-2 text-xs">
                                                                    <span className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${o.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                                                                        {o.isCorrect ? '✓' : ''}
                                                                    </span>
                                                                    <span className="font-medium text-gray-600">{o.text}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col gap-1 shrink-0">
                                                        <button onClick={() => moveQuestion(q, -1)} className="p-1 hover:bg-gray-200 rounded-lg"><ChevronUpIcon className="w-3.5 h-3.5 text-gray-400" /></button>
                                                        <button onClick={() => moveQuestion(q, 1)} className="p-1 hover:bg-gray-200 rounded-lg"><ChevronDownIcon className="w-3.5 h-3.5 text-gray-400" /></button>
                                                        <button onClick={() => openEditQuestion(q)} className="p-1 hover:bg-blue-50 rounded-lg"><PencilIcon className="w-3.5 h-3.5 text-blue-400" /></button>
                                                        <button onClick={() => handleDeleteQuestion(q)} className="p-1 hover:bg-red-50 rounded-lg"><TrashIcon className="w-3.5 h-3.5 text-red-400" /></button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                {/* ── Question Form Modal (nested) ── */}
                {showQuestionForm && quiz && (
                    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
                        <div className="bg-white rounded-[28px] shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
                            <div className="bg-gray-50 border-b border-gray-100 p-4 flex justify-between items-center">
                                <h3 className="font-black text-[#0B3A63]">{editingQuestion ? 'Edit Question' : 'Add Question'}</h3>
                                <button onClick={() => setShowQuestionForm(false)} className="p-2 hover:bg-gray-200 rounded-full transition">
                                    <XMarkIcon className="w-5 h-5 text-gray-500" />
                                </button>
                            </div>

                            <form onSubmit={handleSaveQuestion} className="flex-1 overflow-y-auto p-5 space-y-4">
                                {/* Type */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-2">Question Type</label>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                                        {QUESTION_TYPES.map(t => (
                                            <button
                                                key={t.value}
                                                type="button"
                                                onClick={() => handleTypeChange(t.value)}
                                                className={`px-3 py-2 rounded-xl border-2 text-xs font-bold transition ${questionForm.type === t.value ? 'border-[#0F4C81] bg-blue-50 text-[#0F4C81]' : 'border-gray-100 text-gray-500 hover:border-gray-200'}`}
                                            >
                                                <span className="block text-lg mb-1">{t.icon}</span>
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Question text */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Question Text *</label>
                                    <textarea
                                        value={questionForm.text}
                                        onChange={e => setQuestionForm({ ...questionForm, text: e.target.value })}
                                        placeholder="Type the question..."
                                        rows={2}
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none font-medium text-sm resize-none"
                                        required
                                    />
                                </div>

                                {/* Explanation */}
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Explanation (shown after quiz)</label>
                                    <input
                                        value={questionForm.explanation}
                                        onChange={e => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                        placeholder="Explain why the answer is correct..."
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none font-medium text-sm"
                                    />
                                </div>

                                {/* Resource URL / upload (for image/audio questions) */}
                                <div className="space-y-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">Resource URL or uploaded file (optional)</label>
                                    <input
                                        value={questionForm.resourceUrl}
                                        onChange={e => setQuestionForm({ ...questionForm, resourceUrl: e.target.value })}
                                        placeholder="https://... or /uploads/..."
                                        className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none font-medium text-sm"
                                    />
                                    <input
                                        type="file"
                                        accept="image/*,audio/*"
                                        onChange={e => setQuestionForm({ ...questionForm, resourceFile: e.target.files?.[0] || null })}
                                        className="w-full text-sm text-gray-600"
                                    />
                                </div>

                                {/* Options / Answer — type-specific UI */}
                                <div>
                                    {/* ── WORD ORDER & DRAG AND DROP: enter the correct word, letters will be scrambled ── */}
                                    {(questionForm.type === 'WORD_ORDER' || questionForm.type === 'DRAG_AND_DROP') ? (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Correct Word / Answer *</label>
                                            <input
                                                value={questionForm.options[0]?.text || ''}
                                                onChange={e => setOption(0, 'text', e.target.value.toUpperCase())}
                                                placeholder="e.g. APPLE"
                                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none font-bold text-lg tracking-widest"
                                                required
                                            />
                                            {questionForm.options[0]?.text && (
                                                <div className="mt-3 p-3 bg-blue-50 rounded-2xl">
                                                    <p className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Student will see letters in random order:</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {questionForm.options[0].text.split('').map((ch, i) => (
                                                            <span key={i} className="w-9 h-9 bg-white border-2 border-[#0F4C81] rounded-xl flex items-center justify-center font-black text-[#0F4C81]">{ch}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            <p className="text-[11px] text-gray-400 font-medium mt-2">
                                                {questionForm.type === 'WORD_ORDER' ? '🔤 Students drag/tap letters to spell the correct word.' : '🖱️ Students drag and drop the tiles in sequence.'}
                                            </p>
                                        </div>

                                    ) : questionForm.type === 'FILL_IN_BLANK' ? (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 mb-1">Correct Answer *</label>
                                            <input
                                                value={questionForm.options[0]?.text || ''}
                                                onChange={e => setOption(0, 'text', e.target.value)}
                                                placeholder="e.g. Apple"
                                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none font-medium text-sm"
                                                required
                                            />
                                            <p className="text-[11px] text-gray-400 font-medium mt-2">✏️ Students type the missing word/answer.</p>
                                        </div>

                                    ) : questionForm.type === 'MATCHING' ? (
                                        <div>
                                            <div className="flex justify-between items-center mb-3">
                                                <label className="text-xs font-bold text-gray-500">Matching Pairs (Question → Answer)</label>
                                                {questionForm.options.length < 8 && (
                                                    <button type="button" onClick={() => setQuestionForm(prev => ({ ...prev, options: [...prev.options, { text: '', matchAnswer: '', isCorrect: true, imageUrl: '', imageFile: null }] }))} className="text-xs font-bold text-[#0F4C81] hover:underline">+ Add Pair</button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {questionForm.options.map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-2 bg-gray-50 rounded-2xl p-3">
                                                        <span className="text-xs font-black text-gray-400 w-5">{idx + 1}</span>
                                                        <input
                                                            value={opt.text}
                                                            onChange={e => setOption(idx, 'text', e.target.value)}
                                                            placeholder={`Question ${idx + 1}`}
                                                            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-blue-400 outline-none text-sm font-medium"
                                                            required
                                                        />
                                                        <span className="text-gray-400 font-bold">→</span>
                                                        <input
                                                            value={opt.matchAnswer || ''}
                                                            onChange={e => setOption(idx, 'matchAnswer', e.target.value)}
                                                            placeholder={`Answer ${idx + 1}`}
                                                            className="flex-1 px-3 py-2 rounded-xl border-2 border-gray-100 focus:border-green-400 outline-none text-sm font-medium"
                                                            required
                                                        />
                                                        {questionForm.options.length > 2 && (
                                                            <button type="button" onClick={() => removeOption(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-medium mt-2">🔗 Students match left items to their correct right-column answer (answers shown in random order).</p>
                                        </div>

                                    ) : (
                                        // SINGLE_CHOICE, MULTIPLE_CHOICE, TRUE_FALSE, COLOR_MATCH
                                        <>
                                            <div className="flex justify-between items-center mb-2">
                                                <label className="text-xs font-bold text-gray-500">
                                                    {questionForm.type === 'TRUE_FALSE' ? 'Answers' :
                                                        questionForm.type === 'MULTIPLE_CHOICE' ? 'Options — check ALL correct answers' :
                                                            questionForm.type === 'COLOR_MATCH' ? 'Color Choices (upload image or enter color name)' :
                                                                'Options — check the correct one'}
                                                </label>
                                                {questionForm.type !== 'TRUE_FALSE' && questionForm.options.length < 10 && (
                                                    <button type="button" onClick={addOption} className="text-xs font-bold text-[#0F4C81] hover:underline">+ Add option</button>
                                                )}
                                            </div>
                                            <div className="space-y-2">
                                                {questionForm.options.map((opt, idx) => (
                                                    <div key={idx} className="flex items-center gap-2">
                                                        {questionForm.type !== 'TRUE_FALSE' && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setOption(idx, 'isCorrect', !opt.isCorrect)}
                                                                className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition ${opt.isCorrect ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-400 hover:bg-gray-200'}`}
                                                                title="Mark as correct"
                                                            >✓</button>
                                                        )}
                                                        <input
                                                            value={opt.text}
                                                            onChange={e => setOption(idx, 'text', e.target.value)}
                                                            placeholder={
                                                                questionForm.type === 'TRUE_FALSE' ? (idx === 0 ? 'True' : 'False') :
                                                                    questionForm.type === 'COLOR_MATCH' ? `Label (optional if image uploaded)` :
                                                                        `Option ${idx + 1}`
                                                            }
                                                            className="flex-1 px-3 py-2.5 rounded-xl border-2 border-gray-100 focus:border-[#0F4C81] outline-none text-sm font-medium"
                                                            required={
                                                                // COLOR_MATCH: text not required if an image is selected/exists
                                                                questionForm.type === 'COLOR_MATCH'
                                                                    ? !(opt.imageFile || opt.imageUrl)
                                                                    : true
                                                            }
                                                        />
                                                        {/* Image upload — always shown for COLOR_MATCH, hidden for TRUE_FALSE */}
                                                        {questionForm.type !== 'TRUE_FALSE' && (
                                                            <div className="flex items-center gap-1">
                                                                {(opt.imageUrl && !opt.imageFile) && (
                                                                    <img src={opt.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover border border-gray-200" />
                                                                )}
                                                                <input
                                                                    type="file"
                                                                    accept="image/*"
                                                                    onChange={e => {
                                                                        const file = e.target.files?.[0] || null;
                                                                        setOption(idx, 'imageFile', file);
                                                                        if (file) setOption(idx, 'imagePreview', URL.createObjectURL(file));
                                                                    }}
                                                                    className="text-xs text-gray-500 max-w-[100px]"
                                                                />
                                                                {opt.imageFile && opt.imagePreview && (
                                                                    <img src={opt.imagePreview} alt="" className="w-8 h-8 rounded-lg object-cover border border-orange-200" />
                                                                )}
                                                            </div>
                                                        )}
                                                        {questionForm.type !== 'TRUE_FALSE' && questionForm.options.length > 2 && (
                                                            <button type="button" onClick={() => removeOption(idx)} className="p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                                                                <TrashIcon className="w-4 h-4" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <p className="text-[11px] text-gray-400 font-medium mt-2">
                                                {questionForm.type === 'TRUE_FALSE' ? 'Students choose True or False.' :
                                                    questionForm.type === 'MULTIPLE_CHOICE' ? '☑️ Students select all that apply.' :
                                                        questionForm.type === 'COLOR_MATCH' ? '🎨 Students pick the matching color/image.' :
                                                            'Exactly one correct answer.'}
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex-1 bg-[#0F4C81] text-white font-bold py-3 rounded-2xl hover:bg-[#0B3A63] transition disabled:opacity-50"
                                    >
                                        {saving ? 'Saving...' : editingQuestion ? 'Update Question' : 'Add Question'}
                                    </button>
                                    <button type="button" onClick={() => setShowQuestionForm(false)} className="px-5 bg-gray-100 text-gray-700 font-bold py-3 rounded-2xl hover:bg-gray-200 transition">
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
