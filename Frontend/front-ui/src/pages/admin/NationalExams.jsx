import { useState, useEffect, useMemo } from 'react';
import api from '../../services/api';
import {
    PlusCircleIcon, ArrowPathIcon, TrashIcon, PencilSquareIcon,
    CheckCircleIcon, ClockIcon, BookOpenIcon, ArrowLeftIcon,
    AcademicCapIcon, ClipboardDocumentCheckIcon, DocumentTextIcon,
    SparklesIcon, CheckIcon, XMarkIcon, EyeIcon,
    ChevronRightIcon, PhotoIcon, InformationCircleIcon
} from '@heroicons/react/24/outline';

const GRADE_CONFIG = {
    6: {
        title: 'Grade 6 Regional Examination',
        subtitle: 'Primary Leaving Certificate (Amharic & English)',
        badge: 'አማርኛ & English',
        badgeColor: 'bg-amber-100 text-amber-800 border-amber-200',
        languageHint: 'Grade 6 exams support both Amharic (አማርኛ) and English. Questions and options can be typed directly in Amharic script.',
        presets: [
            { name: 'ሒሳብ (Mathematics)', code: 'MATH-06', icon: '🧮', color: '#0F4C81' },
            { name: 'አካባቢ ሳይንስ (Environmental Science)', code: 'ENV-06', icon: '🌱', color: '#059669' },
            { name: 'ኅብረተሰብ ሳይንስ (Social Studies)', code: 'SOC-06', icon: '🌍', color: '#D97706' },
            { name: 'ዜግነት (Citizenship)', code: 'CIT-06', icon: '⚖️', color: '#7C3AED' },
            { name: 'እንግሊዝኛ (English)', code: 'ENG-06', icon: '📖', color: '#2563EB' },
            { name: 'አማርኛ ቋንቋ (Amharic Language)', code: 'AMH-06', icon: '✍️', color: '#DC2626' },
        ]
    },
    8: {
        title: 'Grade 8 Ministry Examination',
        subtitle: 'Middle School Leaving Certificate (English)',
        badge: 'English',
        badgeColor: 'bg-blue-100 text-blue-800 border-blue-200',
        languageHint: 'Grade 8 national exams are prepared in English as the primary medium of instruction.',
        presets: [
            { name: 'Mathematics', code: 'MATH-08', icon: '📐', color: '#0F4C81' },
            { name: 'General Science', code: 'SCI-08', icon: '🔬', color: '#059669' },
            { name: 'Social Studies', code: 'SOC-08', icon: '🏛️', color: '#D97706' },
            { name: 'Citizenship', code: 'CIT-08', icon: '⚖️', color: '#7C3AED' },
            { name: 'English Language', code: 'ENG-08', icon: '📚', color: '#2563EB' },
            { name: 'Career & Technical Education', code: 'CTE-08', icon: '⚙️', color: '#4B5563' },
        ]
    },
    12: {
        title: 'Grade 12 University Entrance (EUEE)',
        subtitle: 'Ethiopian University Entrance Examination (Natural & Social Streams)',
        badge: 'Natural & Social Streams (English)',
        badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200',
        languageHint: 'Grade 12 national exams are administered in English, structured by Natural and Social Science streams.',
        presets: [
            { name: 'Mathematics (Natural)', code: 'MATH-NAT-12', stream: 'NATURAL', icon: '🔢', color: '#0F4C81' },
            { name: 'Physics', code: 'PHYS-12', stream: 'NATURAL', icon: '⚛️', color: '#2563EB' },
            { name: 'Chemistry', code: 'CHEM-12', stream: 'NATURAL', icon: '🧪', color: '#059669' },
            { name: 'Biology', code: 'BIO-12', stream: 'NATURAL', icon: '🧬', color: '#10B981' },
            { name: 'Mathematics (Social)', code: 'MATH-SOC-12', stream: 'SOCIAL', icon: '📊', color: '#D97706' },
            { name: 'History', code: 'HIST-12', stream: 'SOCIAL', icon: '📜', color: '#92400E' },
            { name: 'Geography', code: 'GEOG-12', stream: 'SOCIAL', icon: '🗺️', color: '#047857' },
            { name: 'Economics', code: 'ECON-12', stream: 'SOCIAL', icon: '📈', color: '#B45309' },
            { name: 'English Language', code: 'ENG-12', stream: 'COMMON', icon: '📖', color: '#4338CA' },
            { name: 'Scholastic Aptitude', code: 'APT-12', stream: 'COMMON', icon: '💡', color: '#7C3AED' },
        ]
    }
};

const DEFAULT_OPTIONS = [
    { text: '', isCorrect: true, imageUrl: '' },
    { text: '', isCorrect: false, imageUrl: '' },
    { text: '', isCorrect: false, imageUrl: '' },
    { text: '', isCorrect: false, imageUrl: '' },
];

export default function AdminNationalExams() {
    const [selectedGrade, setSelectedGrade] = useState(6);
    const [streamFilter, setStreamFilter] = useState('ALL'); // For Grade 12: ALL | NATURAL | SOCIAL | COMMON

    const [subjects, setSubjects] = useState([]);
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    // Preview Exam Modal
    const [previewExam, setPreviewExam] = useState(null);
    const [previewQuestions, setPreviewQuestions] = useState([]);
    const [loadingPreview, setLoadingPreview] = useState(false);

    // Target exam for adding/editing questions
    const [targetExamForQuestion, setTargetExamForQuestion] = useState(null);

    // Modals
    const [showSubjectModal, setShowSubjectModal] = useState(false);
    const [showExamModal, setShowExamModal] = useState(false);
    const [showQuestionModal, setShowQuestionModal] = useState(false);

    // Editing states
    const [editingSubject, setEditingSubject] = useState(null);
    const [editingExam, setEditingExam] = useState(null);
    const [editingQuestion, setEditingQuestion] = useState(null);

    // Form states for Subject
    const [subjectForm, setSubjectForm] = useState({
        name: '',
        code: '',
        gradeLevels: [6],
        stream: '',
        description: '',
        icon: '📚',
        color: '#0F4C81'
    });

    // Form states for Exam
    const [examForm, setExamForm] = useState({
        subjectId: '',
        title: '',
        year: new Date().getFullYear(),
        gradeLevel: 6,
        stream: '',
        durationMinutes: 120,
        passingScore: 50,
        isPremium: false,
    });

    // Form states for Question (Multiple Choice A, B, C, D)
    const [questionForm, setQuestionForm] = useState({
        text: '',
        explanation: '',
        resourceUrl: '',
        options: [...DEFAULT_OPTIONS.map(o => ({ ...o }))]
    });

    const [submitting, setSubmitting] = useState(false);

    // Fetch subjects and exams on grade change
    useEffect(() => {
        fetchData();
    }, [selectedGrade]);

    // When previewExam changes, fetch its questions
    useEffect(() => {
        if (previewExam) {
            fetchPreviewQuestions(previewExam.id);
        } else {
            setPreviewQuestions([]);
        }
    }, [previewExam]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [subsRes, examsRes] = await Promise.all([
                api.get(`/national-exams/admin/subjects?gradeLevel=${selectedGrade}`),
                api.get(`/national-exams/admin/exams?gradeLevel=${selectedGrade}`)
            ]);
            setSubjects(subsRes.data || []);
            setExams(examsRes.data || []);
        } catch (err) {
            console.error('Error fetching national exams data:', err);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreviewQuestions = async (examId) => {
        setLoadingPreview(true);
        try {
            const res = await api.get(`/national-exams/exams/${examId}/questions`);
            setPreviewQuestions(res.data || []);
        } catch (err) {
            console.error('Error fetching questions:', err);
        } finally {
            setLoadingPreview(false);
        }
    };

    // Filtered exams list by Stream (for Grade 12)
    const filteredExams = useMemo(() => {
        return exams.filter(e => {
            if (selectedGrade === 12 && streamFilter !== 'ALL') {
                if (streamFilter === 'NATURAL' && e.stream !== 'NATURAL' && e.stream !== 'COMMON') return false;
                if (streamFilter === 'SOCIAL' && e.stream !== 'SOCIAL' && e.stream !== 'COMMON') return false;
                if (streamFilter === 'COMMON' && e.stream !== 'COMMON') return false;
            }
            return true;
        });
    }, [exams, selectedGrade, streamFilter]);

    // ── Open Modals ──
    const handleOpenCreateSubject = () => {
        setEditingSubject(null);
        setSubjectForm({
            name: '',
            code: '',
            gradeLevels: [selectedGrade],
            stream: selectedGrade === 12 ? 'NATURAL' : '',
            description: '',
            icon: '📚',
            color: '#0F4C81'
        });
        setShowSubjectModal(true);
    };

    const handleOpenCreateExam = () => {
        setEditingExam(null);
        const firstSub = subjects.length > 0 ? subjects[0].id : '';
        setExamForm({
            subjectId: firstSub,
            title: `${new Date().getFullYear()} Grade ${selectedGrade} National Exam`,
            year: new Date().getFullYear(),
            gradeLevel: selectedGrade,
            stream: selectedGrade === 12 ? (streamFilter !== 'ALL' ? streamFilter : 'NATURAL') : '',
            durationMinutes: 120,
            passingScore: 50,
            isPremium: false,
        });
        setShowExamModal(true);
    };

    const handleOpenEditExam = (exam) => {
        setEditingExam(exam);
        setExamForm({
            subjectId: exam.subjectId,
            title: exam.title,
            year: exam.year,
            gradeLevel: exam.gradeLevel,
            stream: exam.stream || '',
            durationMinutes: exam.durationMinutes,
            passingScore: exam.passingScore,
            isPremium: exam.isPremium,
        });
        setShowExamModal(true);
    };

    // Direct Add Question on an Exam
    const handleOpenAddQuestion = (exam) => {
        setTargetExamForQuestion(exam);
        setEditingQuestion(null);
        setQuestionForm({
            text: '',
            explanation: '',
            resourceUrl: '',
            options: [
                { text: '', isCorrect: true, imageUrl: '' },
                { text: '', isCorrect: false, imageUrl: '' },
                { text: '', isCorrect: false, imageUrl: '' },
                { text: '', isCorrect: false, imageUrl: '' },
            ]
        });
        setShowQuestionModal(true);
    };

    const handleOpenEditQuestion = (q, exam) => {
        setTargetExamForQuestion(exam || previewExam);
        setEditingQuestion(q);
        const opts = (q.options || []).map(o => ({
            text: o.text || '',
            isCorrect: Boolean(o.isCorrect),
            imageUrl: o.imageUrl || ''
        }));
        while (opts.length < 4) {
            opts.push({ text: '', isCorrect: false, imageUrl: '' });
        }
        setQuestionForm({
            text: q.text || '',
            explanation: q.explanation || '',
            resourceUrl: q.resourceUrl || '',
            options: opts
        });
        setShowQuestionModal(true);
    };

    // ── Save Subject ──
    const handleSaveSubject = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingSubject) {
                await api.put(`/national-exams/admin/subjects/${editingSubject.id}`, subjectForm);
            } else {
                await api.post('/national-exams/subjects', subjectForm);
            }
            setShowSubjectModal(false);
            fetchData();
        } catch (err) {
            alert('Error saving subject: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    // ── Save Exam ──
    const handleSaveExam = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            if (editingExam) {
                await api.put(`/national-exams/admin/exams/${editingExam.id}`, examForm);
            } else {
                await api.post('/national-exams/exams', examForm);
            }
            setShowExamModal(false);
            fetchData();
        } catch (err) {
            alert('Error saving exam: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteExam = async (id, title) => {
        if (!window.confirm(`Delete exam "${title}" and all its questions?`)) return;
        try {
            await api.delete(`/national-exams/admin/exams/${id}`);
            if (previewExam?.id === id) setPreviewExam(null);
            fetchData();
        } catch (err) {
            alert('Error deleting exam: ' + (err.response?.data?.message || err.message));
        }
    };

    // ── Save Question ──
    const handleSaveQuestion = async (e, keepOpenForNext = false) => {
        if (e) e.preventDefault();
        const validOptions = questionForm.options.filter(o => o.text.trim().length > 0);
        if (validOptions.length < 2) {
            alert('Please provide at least 2 non-empty options.');
            return;
        }
        const hasCorrect = questionForm.options.some(o => o.isCorrect && o.text.trim().length > 0);
        if (!hasCorrect) {
            alert('Please select one of the non-empty options as the correct answer (green checkmark/radio).');
            return;
        }

        const examToUse = targetExamForQuestion || previewExam;
        if (!examToUse) return;

        setSubmitting(true);
        try {
            if (editingQuestion) {
                await api.put(`/national-exams/admin/questions/${editingQuestion.id}`, {
                    text: questionForm.text,
                    type: 'SINGLE_CHOICE',
                    explanation: questionForm.explanation,
                    resourceUrl: questionForm.resourceUrl,
                    options: validOptions
                });
            } else {
                await api.post(`/national-exams/exams/${examToUse.id}/questions`, {
                    text: questionForm.text,
                    type: 'SINGLE_CHOICE',
                    explanation: questionForm.explanation,
                    resourceUrl: questionForm.resourceUrl,
                    options: validOptions
                });
            }

            // Update questions list if preview is open
            if (previewExam?.id === examToUse.id) {
                fetchPreviewQuestions(examToUse.id);
            }

            // Update count on the exam card
            setExams(prev => prev.map(ex => ex.id === examToUse.id
                ? { ...ex, _count: { ...ex._count, questions: (ex._count?.questions || 0) + (editingQuestion ? 0 : 1) } }
                : ex
            ));

            if (keepOpenForNext) {
                setQuestionForm({
                    text: '',
                    explanation: '',
                    resourceUrl: '',
                    options: [
                        { text: '', isCorrect: true, imageUrl: '' },
                        { text: '', isCorrect: false, imageUrl: '' },
                        { text: '', isCorrect: false, imageUrl: '' },
                        { text: '', isCorrect: false, imageUrl: '' },
                    ]
                });
                setEditingQuestion(null);
            } else {
                setShowQuestionModal(false);
            }
        } catch (err) {
            alert('Error saving question: ' + (err.response?.data?.message || err.message));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteQuestion = async (qId) => {
        if (!window.confirm('Delete this question?')) return;
        try {
            await api.delete(`/national-exams/admin/questions/${qId}`);
            if (previewExam) {
                fetchPreviewQuestions(previewExam.id);
                setExams(prev => prev.map(ex => ex.id === previewExam.id
                    ? { ...ex, _count: { ...ex._count, questions: Math.max(0, (ex._count?.questions || 1) - 1) } }
                    : ex
                ));
            }
        } catch (err) {
            alert('Error deleting question: ' + (err.response?.data?.message || err.message));
        }
    };

    const handleApplyPreset = (preset) => {
        setSubjectForm(prev => ({
            ...prev,
            name: preset.name,
            code: preset.code,
            stream: preset.stream || '',
            icon: preset.icon,
            color: preset.color
        }));
    };

    const config = GRADE_CONFIG[selectedGrade];

    return (
        <div className="p-8 max-w-7xl mx-auto space-y-6">
            {/* ── Top Header ── */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-[#0F4C81] text-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                            <ClipboardDocumentCheckIcon className="w-7 h-7" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-black text-[#0B3A63] tracking-tight">National Exams</h1>
                            <p className="text-xs font-bold text-gray-400 mt-0.5">
                                Add & Preview Official National Exams for Grades 6, 8, and 12
                            </p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="px-4 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 font-bold text-xs rounded-xl hover:bg-gray-100 flex items-center gap-2 transition"
                    >
                        <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                    <button
                        onClick={handleOpenCreateSubject}
                        className="px-4 py-2.5 bg-white border border-[#0F4C81] text-[#0F4C81] font-extrabold text-xs rounded-xl hover:bg-blue-50 flex items-center gap-2 transition shadow-xs"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                        + Add Subject
                    </button>
                    <button
                        onClick={handleOpenCreateExam}
                        disabled={subjects.length === 0}
                        className="px-5 py-2.5 bg-[#F26522] hover:bg-orange-600 text-white font-black text-xs rounded-xl flex items-center gap-2 transition shadow-md shadow-orange-500/20 disabled:opacity-50"
                    >
                        <PlusCircleIcon className="w-4 h-4" />
                        + Create National Exam
                    </button>
                </div>
            </div>

            {/* ── Grade Selection Tabs (Grade 6, Grade 8, Grade 12) ── */}
            <div className="bg-white rounded-2xl border border-gray-200 p-2 shadow-xs">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {[6, 8, 12].map(grade => {
                        const isSelected = selectedGrade === grade;
                        const cfg = GRADE_CONFIG[grade];

                        return (
                            <button
                                key={grade}
                                type="button"
                                onClick={() => {
                                    setSelectedGrade(grade);
                                    setStreamFilter('ALL');
                                }}
                                className={`text-left p-4 rounded-xl border transition-all relative ${
                                    isSelected
                                        ? 'bg-[#0F4C81] text-white border-[#0F4C81] shadow-md'
                                        : 'bg-gray-50/60 text-gray-600 border-gray-200/80 hover:bg-gray-100/70 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex items-center justify-between mb-1">
                                    <span className={`text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full border ${
                                        isSelected ? 'bg-white/20 text-white border-white/30' : cfg.badgeColor
                                    }`}>
                                        {cfg.badge}
                                    </span>
                                    <span className={`text-xs font-black px-2 py-0.5 rounded-md ${
                                        isSelected ? 'bg-white/10 text-white' : 'bg-gray-200 text-gray-700'
                                    }`}>
                                        Grade {grade}
                                    </span>
                                </div>
                                <h3 className={`text-lg font-black leading-tight mt-1 ${isSelected ? 'text-white' : 'text-[#0B3A63]'}`}>
                                    {cfg.title}
                                </h3>
                                <p className={`text-[11px] font-bold mt-1 line-clamp-1 ${isSelected ? 'text-blue-100' : 'text-gray-400'}`}>
                                    {cfg.subtitle}
                                </p>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ── Language Guidelines Banner ── */}
            <div className="bg-gradient-to-r from-blue-50/80 via-indigo-50/60 to-orange-50/60 p-4 rounded-2xl border border-blue-100 flex items-start gap-3">
                <InformationCircleIcon className="w-5 h-5 text-[#0F4C81] shrink-0 mt-0.5" />
                <div className="text-xs font-bold text-gray-700 leading-relaxed">
                    <span className="font-extrabold text-[#0B3A63]">Language & Instructions: </span>
                    {config.languageHint}
                    {selectedGrade === 6 && (
                        <span className="ml-1 text-[#F26522] font-black">
                            (ጥያቄዎችንና አማራጮችን በአማርኛ ወይም በእንግሊዝኛ መጻፍ ይችላሉ።)
                        </span>
                    )}
                </div>
            </div>

            {/* ── Stream Filter for Grade 12 ── */}
            {selectedGrade === 12 && (
                <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-xl border border-gray-200">
                    <span className="text-xs font-black text-gray-400 uppercase tracking-wider mr-2">Filter Stream:</span>
                    {['ALL', 'NATURAL', 'SOCIAL', 'COMMON'].map(stream => (
                        <button
                            key={stream}
                            type="button"
                            onClick={() => setStreamFilter(stream)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-black transition ${
                                streamFilter === stream
                                    ? 'bg-[#0F4C81] text-white shadow-xs'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        >
                            {stream === 'ALL' ? 'All Streams' : `${stream} Stream`}
                        </button>
                    ))}
                </div>
            )}

            {/* ── National Exams List ── */}
            {loading ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-gray-200">
                    <ArrowPathIcon className="w-10 h-10 text-[#0F4C81] animate-spin mx-auto mb-3" />
                    <p className="font-extrabold text-gray-400 text-base">Loading Grade {selectedGrade} National Exams...</p>
                </div>
            ) : filteredExams.length === 0 ? (
                <div className="bg-white rounded-2xl p-16 text-center border border-dashed border-gray-300">
                    <AcademicCapIcon className="w-16 h-16 text-gray-300 mx-auto mb-3" />
                    <h3 className="text-lg font-black text-[#0B3A63] mb-1">No National Exams Created Yet</h3>
                    <p className="text-xs font-bold text-gray-400 max-w-md mx-auto mb-6">
                        {subjects.length === 0
                            ? `No subjects configured for Grade ${selectedGrade}. Add a subject first (e.g. Mathematics, English) to begin.`
                            : `Create your first national exam paper to begin inserting multiple-choice questions.`}
                    </p>
                    {subjects.length === 0 ? (
                        <button
                            onClick={handleOpenCreateSubject}
                            className="px-5 py-3 bg-[#0F4C81] text-white font-black text-xs rounded-xl inline-flex items-center gap-2 hover:bg-[#0B3A63] transition shadow-md"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            Add Subject for Grade {selectedGrade}
                        </button>
                    ) : (
                        <button
                            onClick={handleOpenCreateExam}
                            className="px-5 py-3 bg-[#F26522] text-white font-black text-xs rounded-xl inline-flex items-center gap-2 hover:bg-orange-600 transition shadow-md shadow-orange-500/20"
                        >
                            <PlusCircleIcon className="w-4 h-4" />
                            Create National Exam
                        </button>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredExams.map(exam => (
                        <div
                            key={exam.id}
                            className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition flex flex-col justify-between overflow-hidden"
                        >
                            <div className="p-5">
                                {/* Card Header: Subject & Year */}
                                <div className="flex items-center justify-between gap-2 mb-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xl">{exam.subject?.icon || '📚'}</span>
                                        <span
                                            className="text-xs font-black px-2 py-0.5 rounded-md text-white"
                                            style={{ backgroundColor: exam.subject?.color || '#0F4C81' }}
                                        >
                                            {exam.subject?.name}
                                        </span>
                                    </div>
                                    <span className="bg-gray-100 text-gray-700 font-black text-xs px-2.5 py-0.5 rounded-full border border-gray-200">
                                        Year {exam.year}
                                    </span>
                                </div>

                                {/* Exam Title */}
                                <h3 className="font-black text-[#0B3A63] text-base leading-snug mb-2">
                                    {exam.title}
                                </h3>

                                {/* Badges / Stats */}
                                <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500 mb-2">
                                    <span className="bg-blue-50 text-blue-700 font-extrabold px-2 py-0.5 rounded flex items-center gap-1">
                                        <DocumentTextIcon className="w-3.5 h-3.5" />
                                        {exam._count?.questions || 0} Questions
                                    </span>
                                    <span className="bg-gray-50 text-gray-600 px-2 py-0.5 rounded flex items-center gap-1">
                                        <ClockIcon className="w-3.5 h-3.5" />
                                        {exam.durationMinutes} min
                                    </span>
                                    {exam.stream && (
                                        <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-black">
                                            {exam.stream}
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Card Footer Actions: Preview, Add Question, Edit, Delete */}
                            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    {/* Preview Button */}
                                    <button
                                        onClick={() => setPreviewExam(exam)}
                                        className="px-3.5 py-1.5 bg-[#0F4C81] hover:bg-[#0B3A63] text-white font-extrabold text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
                                        title="Preview the full exam paper"
                                    >
                                        <EyeIcon className="w-4 h-4" />
                                        <span>Preview</span>
                                    </button>

                                    {/* Quick Add Question Button */}
                                    <button
                                        onClick={() => handleOpenAddQuestion(exam)}
                                        className="px-3 py-1.5 bg-orange-50 hover:bg-orange-100 text-[#F26522] border border-orange-200 font-extrabold text-xs rounded-xl flex items-center gap-1 transition"
                                        title="Add a question to this exam"
                                    >
                                        <PlusCircleIcon className="w-4 h-4" />
                                        <span>+ Question</span>
                                    </button>
                                </div>

                                <div className="flex items-center gap-1">
                                    <button
                                        onClick={() => handleOpenEditExam(exam)}
                                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                        title="Edit Exam Info"
                                    >
                                        <PencilSquareIcon className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteExam(exam.id, exam.title)}
                                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition"
                                        title="Delete Exam"
                                    >
                                        <TrashIcon className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: FULL EXAM PREVIEW (See what the complete exam looks like)
               ══════════════════════════════════════════════════════════════════ */}
            {previewExam && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                            <div className="flex items-center gap-3">
                                <span className="text-2xl">{previewExam.subject?.icon || '📚'}</span>
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h2 className="text-lg font-black text-[#0B3A63] leading-tight">
                                            {previewExam.title}
                                        </h2>
                                        <span className="bg-gray-200 text-gray-700 text-[11px] font-black px-2 py-0.5 rounded">
                                            {previewExam.year}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-400 mt-0.5">
                                        {previewExam.subject?.name} · Grade {previewExam.gradeLevel} · {previewExam.durationMinutes} Mins · Passing: {previewExam.passingScore}%
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleOpenAddQuestion(previewExam)}
                                    className="px-3.5 py-2 bg-[#F26522] hover:bg-orange-600 text-white font-black text-xs rounded-xl flex items-center gap-1.5 transition shadow-xs"
                                >
                                    <PlusCircleIcon className="w-4 h-4" />
                                    + Add Question
                                </button>
                                <button
                                    onClick={() => setPreviewExam(null)}
                                    className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded-xl transition"
                                >
                                    <XMarkIcon className="w-5 h-5" />
                                </button>
                            </div>
                        </div>

                        {/* Questions Paper View */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {loadingPreview ? (
                                <div className="py-16 text-center">
                                    <ArrowPathIcon className="w-8 h-8 text-[#0F4C81] animate-spin mx-auto mb-2" />
                                    <p className="font-extrabold text-gray-400 text-xs">Loading exam questions...</p>
                                </div>
                            ) : previewQuestions.length === 0 ? (
                                <div className="py-16 text-center border border-dashed border-gray-300 rounded-2xl p-6">
                                    <DocumentTextIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <h4 className="font-black text-[#0B3A63] text-base mb-1">No Questions In This Exam</h4>
                                    <p className="text-xs font-bold text-gray-400 mb-4">
                                        Add multiple-choice questions to see the preview.
                                    </p>
                                    <button
                                        onClick={() => handleOpenAddQuestion(previewExam)}
                                        className="px-4 py-2 bg-[#0F4C81] text-white font-extrabold text-xs rounded-xl hover:bg-[#0B3A63] transition"
                                    >
                                        + Add First Question
                                    </button>
                                </div>
                            ) : (
                                previewQuestions.map((q, idx) => (
                                    <div
                                        key={q.id}
                                        className="bg-gray-50/70 border border-gray-200 rounded-xl p-4.5 space-y-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <span className="w-7 h-7 bg-[#0F4C81] text-white rounded-lg flex items-center justify-center font-black text-xs shrink-0">
                                                    {idx + 1}
                                                </span>
                                                <span className="text-[10px] font-black uppercase tracking-wider text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">
                                                    Multiple Choice
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                <button
                                                    onClick={() => handleOpenEditQuestion(q, previewExam)}
                                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-lg transition"
                                                    title="Edit Question"
                                                >
                                                    <PencilSquareIcon className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteQuestion(q.id)}
                                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg transition"
                                                    title="Delete Question"
                                                >
                                                    <TrashIcon className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Question Text */}
                                        <p className="text-gray-900 font-bold text-sm whitespace-pre-wrap leading-relaxed pl-9">
                                            {q.text}
                                        </p>

                                        {/* Diagram if any */}
                                        {q.resourceUrl && (
                                            <div className="pl-9">
                                                <img
                                                    src={q.resourceUrl}
                                                    alt="Exam Diagram"
                                                    className="max-h-44 rounded-lg border border-gray-200 bg-white p-1.5 object-contain"
                                                    onError={(e) => { e.target.style.display = 'none'; }}
                                                />
                                            </div>
                                        )}

                                        {/* Options Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pl-9">
                                            {(q.options || []).map((opt, optIdx) => {
                                                const letter = String.fromCharCode(65 + optIdx);
                                                return (
                                                    <div
                                                        key={opt.id || optIdx}
                                                        className={`flex items-center gap-2 p-2 rounded-lg border text-xs font-bold ${
                                                            opt.isCorrect
                                                                ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-extrabold'
                                                                : 'bg-white border-gray-200 text-gray-700'
                                                        }`}
                                                    >
                                                        <span className={`w-5 h-5 rounded flex items-center justify-center font-black text-[10px] shrink-0 ${
                                                            opt.isCorrect ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-500'
                                                        }`}>
                                                            {letter}
                                                        </span>
                                                        <span className="flex-1 truncate">{opt.text}</span>
                                                        {opt.isCorrect && (
                                                            <CheckIcon className="w-4 h-4 text-emerald-600 shrink-0 stroke-[3]" />
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Explanation */}
                                        {q.explanation && (
                                            <div className="pl-9 pt-1">
                                                <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 p-2 rounded-lg font-medium">
                                                    <span className="font-bold mr-1">💡 Solution:</span>
                                                    {q.explanation}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
                            <span className="text-xs font-extrabold text-gray-500">
                                Total: {previewQuestions.length} Questions
                            </span>
                            <button
                                onClick={() => setPreviewExam(null)}
                                className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold text-xs rounded-xl transition"
                            >
                                Close Preview
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: CREATE / EDIT SUBJECT
               ══════════════════════════════════════════════════════════════════ */}
            {showSubjectModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h2 className="text-lg font-black text-[#0B3A63]">
                                {editingSubject ? 'Edit Subject' : `Add Subject (Grade ${selectedGrade})`}
                            </h2>
                            <button onClick={() => setShowSubjectModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Quick Presets for Current Grade */}
                        {!editingSubject && (
                            <div>
                                <p className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2">
                                    Quick Presets for Grade {selectedGrade}:
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                    {config.presets.map(p => (
                                        <button
                                            key={p.name}
                                            type="button"
                                            onClick={() => handleApplyPreset(p)}
                                            className="px-2.5 py-1 bg-gray-100 hover:bg-blue-50 hover:text-blue-700 text-gray-700 text-xs font-bold rounded-lg border border-gray-200 transition"
                                        >
                                            {p.icon} {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSaveSubject} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 mb-1">Subject Name</label>
                                <input
                                    type="text"
                                    required
                                    value={subjectForm.name}
                                    onChange={(e) => setSubjectForm({ ...subjectForm, name: e.target.value })}
                                    placeholder={selectedGrade === 6 ? 'e.g. ሒሳብ (Mathematics)' : 'e.g. General Science'}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Subject Code</label>
                                    <input
                                        type="text"
                                        value={subjectForm.code}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, code: e.target.value })}
                                        placeholder="e.g. MATH-06"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Icon Emoji</label>
                                    <input
                                        type="text"
                                        value={subjectForm.icon}
                                        onChange={(e) => setSubjectForm({ ...subjectForm, icon: e.target.value })}
                                        placeholder="🧮"
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Theme Color</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="color"
                                            value={subjectForm.color}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, color: e.target.value })}
                                            className="w-10 h-10 rounded-lg cursor-pointer border border-gray-200"
                                        />
                                        <span className="text-xs font-mono font-bold text-gray-600">{subjectForm.color}</span>
                                    </div>
                                </div>

                                {selectedGrade === 12 && (
                                    <div>
                                        <label className="block text-xs font-extrabold text-gray-700 mb-1">Stream (Grade 12)</label>
                                        <select
                                            value={subjectForm.stream}
                                            onChange={(e) => setSubjectForm({ ...subjectForm, stream: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                        >
                                            <option value="">None (General)</option>
                                            <option value="NATURAL">Natural Science</option>
                                            <option value="SOCIAL">Social Science</option>
                                            <option value="COMMON">Common</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowSubjectModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-[#0F4C81] text-white font-extrabold text-xs rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50"
                                >
                                    {submitting ? 'Saving...' : editingSubject ? 'Update Subject' : 'Save Subject'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: CREATE / EDIT NATIONAL EXAM
               ══════════════════════════════════════════════════════════════════ */}
            {showExamModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-lg p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b pb-3">
                            <h2 className="text-lg font-black text-[#0B3A63]">
                                {editingExam ? 'Edit National Exam' : `Create National Exam (Grade ${selectedGrade})`}
                            </h2>
                            <button onClick={() => setShowExamModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        <form onSubmit={handleSaveExam} className="space-y-4">
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 mb-1">Select Subject</label>
                                <select
                                    required
                                    value={examForm.subjectId}
                                    onChange={(e) => setExamForm({ ...examForm, subjectId: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                >
                                    {subjects.map(s => (
                                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 mb-1">Exam Title</label>
                                <input
                                    type="text"
                                    required
                                    value={examForm.title}
                                    onChange={(e) => setExamForm({ ...examForm, title: e.target.value })}
                                    placeholder={selectedGrade === 6 ? 'e.g. የ2016 ዓ.ም የ6ኛ ክፍል የክልል ፈተና' : 'e.g. 2024 Grade 12 National Exam'}
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Exam Year</label>
                                    <input
                                        type="number"
                                        required
                                        value={examForm.year}
                                        onChange={(e) => setExamForm({ ...examForm, year: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                    />
                                </div>

                                {selectedGrade === 12 && (
                                    <div>
                                        <label className="block text-xs font-extrabold text-gray-700 mb-1">Stream</label>
                                        <select
                                            value={examForm.stream}
                                            onChange={(e) => setExamForm({ ...examForm, stream: e.target.value })}
                                            className="w-full px-3 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                        >
                                            <option value="">None (Common)</option>
                                            <option value="NATURAL">Natural Science</option>
                                            <option value="SOCIAL">Social Science</option>
                                            <option value="COMMON">Common</option>
                                        </select>
                                    </div>
                                )}
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Duration (Minutes)</label>
                                    <input
                                        type="number"
                                        required
                                        value={examForm.durationMinutes}
                                        onChange={(e) => setExamForm({ ...examForm, durationMinutes: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-extrabold text-gray-700 mb-1">Passing Score (%)</label>
                                    <input
                                        type="number"
                                        required
                                        value={examForm.passingScore}
                                        onChange={(e) => setExamForm({ ...examForm, passingScore: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end gap-2 pt-3 border-t">
                                <button
                                    type="button"
                                    onClick={() => setShowExamModal(false)}
                                    className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded-xl"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-5 py-2 bg-[#F26522] text-white font-extrabold text-xs rounded-xl hover:bg-orange-600 transition disabled:opacity-50 shadow-md shadow-orange-500/20"
                                >
                                    {submitting ? 'Saving...' : editingExam ? 'Update Exam' : 'Create Exam'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ══════════════════════════════════════════════════════════════════
                MODAL: ADD / EDIT MULTIPLE CHOICE QUESTION
               ══════════════════════════════════════════════════════════════════ */}
            {showQuestionModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gray-50 shrink-0">
                            <div>
                                <h2 className="text-lg font-black text-[#0B3A63]">
                                    {editingQuestion ? 'Edit Question' : `Add Question (${(targetExamForQuestion || previewExam)?.title})`}
                                </h2>
                                <p className="text-[11px] font-bold text-gray-400">
                                    {selectedGrade === 6 ? 'Supports Amharic (አማርኛ) or English' : 'Standard 4-Choice Multiple Choice (A, B, C, D)'}
                                </p>
                            </div>
                            <button onClick={() => setShowQuestionModal(false)} className="p-1 text-gray-400 hover:text-gray-600">
                                <XMarkIcon className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Scrollable Form Body */}
                        <div className="p-6 overflow-y-auto space-y-4 flex-1">
                            {/* Question Text */}
                            <div>
                                <label className="block text-xs font-extrabold text-gray-800 mb-1">
                                    Question Text {selectedGrade === 6 && <span className="text-[#F26522]">(የጥያቄው ጽሑፍ)</span>}
                                </label>
                                <textarea
                                    required
                                    rows="3"
                                    value={questionForm.text}
                                    onChange={(e) => setQuestionForm({ ...questionForm, text: e.target.value })}
                                    placeholder={
                                        selectedGrade === 6
                                            ? 'ለምሳሌ፦ 2x + 6 = 14 ከሆነ የ x ዋጋ ስንት ነው? / What is the value of x if 2x + 6 = 14?'
                                            : 'e.g. Which of the following is the SI unit of electric current?'
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 text-sm font-bold focus:border-[#0F4C81] focus:outline-none"
                                />
                            </div>

                            {/* Optional Diagram URL */}
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                                    Diagram / Figure URL (Optional)
                                </label>
                                <input
                                    type="url"
                                    value={questionForm.resourceUrl}
                                    onChange={(e) => setQuestionForm({ ...questionForm, resourceUrl: e.target.value })}
                                    placeholder="https://example.com/diagram.png"
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#0F4C81] focus:outline-none"
                                />
                            </div>

                            {/* 4 Multiple Choice Options (A, B, C, D) */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-black text-gray-800">
                                        Answer Options (Select the Correct Option)
                                    </label>
                                    <span className="text-[11px] font-bold text-gray-400">
                                        Click radio button to mark as correct
                                    </span>
                                </div>

                                <div className="space-y-2.5">
                                    {questionForm.options.map((opt, idx) => {
                                        const letter = String.fromCharCode(65 + idx);
                                        return (
                                            <div
                                                key={idx}
                                                className={`flex items-center gap-3 p-3 rounded-xl border transition ${
                                                    opt.isCorrect
                                                        ? 'bg-emerald-50/60 border-emerald-300 shadow-xs'
                                                        : 'bg-gray-50/50 border-gray-200'
                                                }`}
                                            >
                                                {/* Radio for correct */}
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        const updated = questionForm.options.map((o, i) => ({
                                                            ...o,
                                                            isCorrect: i === idx
                                                        }));
                                                        setQuestionForm({ ...questionForm, options: updated });
                                                    }}
                                                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs shrink-0 transition ${
                                                        opt.isCorrect
                                                            ? 'bg-emerald-600 text-white shadow-xs'
                                                            : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                    }`}
                                                >
                                                    {opt.isCorrect ? <CheckIcon className="w-4 h-4 stroke-[3]" /> : letter}
                                                </button>

                                                {/* Option Text */}
                                                <input
                                                    type="text"
                                                    required={idx < 2}
                                                    value={opt.text}
                                                    onChange={(e) => {
                                                        const updated = [...questionForm.options];
                                                        updated[idx].text = e.target.value;
                                                        setQuestionForm({ ...questionForm, options: updated });
                                                    }}
                                                    placeholder={`Option ${letter} ${selectedGrade === 6 ? '(ምርጫ ' + letter + ')' : ''}`}
                                                    className="flex-1 px-3 py-1.5 rounded-lg border border-gray-300 text-xs font-bold focus:border-[#0F4C81] focus:outline-none bg-white"
                                                />

                                                {opt.isCorrect && (
                                                    <span className="text-[10px] font-black uppercase text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                                                        Correct Answer
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Optional Explanation */}
                            <div>
                                <label className="block text-xs font-extrabold text-gray-700 mb-1">
                                    Solution Explanation (Shown to student after submitting exam)
                                </label>
                                <textarea
                                    rows="2"
                                    value={questionForm.explanation}
                                    onChange={(e) => setQuestionForm({ ...questionForm, explanation: e.target.value })}
                                    placeholder="Step-by-step solution or formula justification..."
                                    className="w-full px-3.5 py-2 rounded-xl border border-gray-300 text-xs font-medium focus:border-[#0F4C81] focus:outline-none"
                                />
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between shrink-0">
                            <button
                                type="button"
                                onClick={() => setShowQuestionModal(false)}
                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl"
                            >
                                Cancel
                            </button>

                            <div className="flex items-center gap-2">
                                {!editingQuestion && (
                                    <button
                                        type="button"
                                        disabled={submitting}
                                        onClick={(e) => handleSaveQuestion(e, true)}
                                        className="px-4 py-2 bg-white border border-[#0F4C81] text-[#0F4C81] font-extrabold text-xs rounded-xl hover:bg-blue-50 transition disabled:opacity-50"
                                    >
                                        Save & Add Next Question
                                    </button>
                                )}
                                <button
                                    type="button"
                                    disabled={submitting}
                                    onClick={(e) => handleSaveQuestion(e, false)}
                                    className="px-5 py-2 bg-[#F26522] text-white font-extrabold text-xs rounded-xl hover:bg-orange-600 transition disabled:opacity-50 shadow-md shadow-orange-500/20"
                                >
                                    {submitting ? 'Saving...' : editingQuestion ? 'Update Question' : 'Save Question'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
