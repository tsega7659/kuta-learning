import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import {
    PlusIcon, PencilIcon, PlayCircleIcon, DocumentCheckIcon,
    QuestionMarkCircleIcon, QueueListIcon, ChevronRightIcon, XMarkIcon,
    ArrowLeftIcon, PhotoIcon
} from '@heroicons/react/24/outline';
import AdminLessonModal from './components/AdminLessonModal';
import AdminQuizBuilder from './components/AdminQuizBuilder';

const GRADE_LEVELS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

// Cover image upload sub-component
function CoverUpload({ preview, onFile }) {
    const ref = useRef(null);
    return (
        <div>
            <label className="text-xs font-bold text-gray-500 mb-1 block">Cover Image <span className="text-gray-400 font-normal">(optional)</span></label>
            <div
                onClick={() => ref.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:border-[#0F4C81] transition"
            >
                {preview ? (
                    <img src={preview} alt="cover" className="w-16 h-12 object-cover rounded-lg" />
                ) : (
                    <div className="w-16 h-12 bg-gray-100 rounded-lg flex items-center justify-center">
                        <PhotoIcon className="w-6 h-6 text-gray-400" />
                    </div>
                )}
                <span className="text-sm font-bold text-gray-500">{preview ? 'Change image' : 'Upload cover image'}</span>
            </div>
            <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => onFile(e.target.files[0])} />
        </div>
    );
}

function Modal({ title, onClose, children }) {
    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
                <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
                    <h2 className="text-xl font-extrabold text-[#0B3A63]">{title}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-700">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>
                <div className="p-6">{children}</div>
            </div>
        </div>
    );
}

export default function AdminCourses() {
    const [courses, setCourses] = useState([]);
    const [loadingCourses, setLoadingCourses] = useState(true);
    const [selCourseId, setSelCourseId] = useState('');
    const [courseDetail, setCourseDetail] = useState(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [selectedChapterId, setSelectedChapterId] = useState(null);
    const [selectedTopicId, setSelectedTopicId] = useState(null);
    const location = useLocation();

    // ── Modals ──
    const [lessonModalCtx, setLessonModalCtx] = useState(null);
    const [quizModalCtx, setQuizModalCtx] = useState(null); // { chapterId, topicId, topicName }
    const [showCourseModal, setShowCourseModal] = useState(false);
    const [showChapterModal, setShowChapterModal] = useState(false);
    const [showTopicModal, setShowTopicModal] = useState(false);
    const [showLessonModal, setShowLessonModal] = useState(false);
    const [saving, setSaving] = useState(false);

    // Forms + cover files
    const [courseForm, setCourseForm] = useState({ title: '', description: '', gradeLevel: 1 });
    const [chapterForm, setChapterForm] = useState({ title: '', description: '' });
    const [topicForm, setTopicForm] = useState({ title: '', description: '' });
    const [lessonForm, setLessonForm] = useState({ title: '', description: '' });

    const [courseCoverFile, setCourseCoverFile] = useState(null);
    const [courseCoverPreview, setCourseCoverPreview] = useState(null);
    const [chapterCoverFile, setChapterCoverFile] = useState(null);
    const [chapterCoverPreview, setChapterCoverPreview] = useState(null);
    const [topicCoverFile, setTopicCoverFile] = useState(null);
    const [topicCoverPreview, setTopicCoverPreview] = useState(null);
    const [lessonCoverFile, setLessonCoverFile] = useState(null);
    const [lessonCoverPreview, setLessonCoverPreview] = useState(null);

    // File preview helper
    const setFileWithPreview = (file, setFile, setPreview) => {
        setFile(file);
        if (file) setPreview(URL.createObjectURL(file));
        else setPreview(null);
    };

    // Upload helper
    const uploadFile = async (file) => {
        if (!file) return null;
        const fd = new FormData();
        fd.append('file', file);
        const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        return res.data.url;
    };

    // ── Load courses list ──
    const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
            const { data } = await api.get('/courses');
            setCourses(data);
            if (location.state?.courseId) {
                setSelCourseId(location.state.courseId);
            } else if (data.length > 0) {
                setSelCourseId(data[0].id);
            }
        } catch (err) { console.error(err); }
        finally { setLoadingCourses(false); }
    };
    useEffect(() => { fetchCourses(); }, []);

    useEffect(() => {
        if (location.state?.courseId && courses.length > 0) {
            setSelCourseId(location.state.courseId);
        }
    }, [location.state?.courseId, courses]);

    // ── Load course detail on selection ──
    const fetchCourseDetail = async (id, keepNav = false) => {
        setLoadingDetail(true);
        // Only reset navigation when explicitly switching courses
        if (!keepNav) {
            setCourseDetail(null);
            setSelectedChapterId(null);
            setSelectedTopicId(null);
        }
        try {
            const { data } = await api.get(`/courses/${id}`);
            setCourseDetail(data);
        } catch (err) { console.error(err); }
        finally { setLoadingDetail(false); }
    };

    useEffect(() => {
        if (selCourseId) fetchCourseDetail(selCourseId);
    }, [selCourseId]);

    const activeChapter = courseDetail?.chapters?.find(c => c.id === selectedChapterId);
    const activeTopic = activeChapter?.topics?.find(t => t.id === selectedTopicId);

    // ── CRUD handlers ──
    const handleCreateCourse = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const coverImage = await uploadFile(courseCoverFile);
            await api.post('/courses', { ...courseForm, ...(coverImage && { coverImage }) });
            setShowCourseModal(false);
            setCourseForm({ title: '', description: '', gradeLevel: 1 });
            setCourseCoverFile(null); setCourseCoverPreview(null);
            await fetchCourses();
        } catch { alert('Failed to create course'); }
        finally { setSaving(false); }
    };

    const handleCreateChapter = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const coverImage = await uploadFile(chapterCoverFile);
            await api.post(`/courses/${selCourseId}/chapters`, { ...chapterForm, ...(coverImage && { coverImage }) });
            setShowChapterModal(false);
            setChapterForm({ title: '', description: '' });
            setChapterCoverFile(null); setChapterCoverPreview(null);
            await fetchCourseDetail(selCourseId, true);
        } catch { alert('Failed to create chapter'); }
        finally { setSaving(false); }
    };

    const handleCreateTopic = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const coverImage = await uploadFile(topicCoverFile);
            await api.post(`/courses/${selCourseId}/chapters/${selectedChapterId}/topics`, { ...topicForm, ...(coverImage && { coverImage }) });
            setShowTopicModal(false);
            setTopicForm({ title: '', description: '' });
            setTopicCoverFile(null); setTopicCoverPreview(null);
            await fetchCourseDetail(selCourseId, true);
        } catch { alert('Failed to create topic'); }
        finally { setSaving(false); }
    };

    const handleCreateLesson = async (e) => {
        e.preventDefault(); setSaving(true);
        try {
            const coverImage = await uploadFile(lessonCoverFile);
            await api.post(`/courses/${selCourseId}/chapters/${selectedChapterId}/topics/${selectedTopicId}/lessons`, { ...lessonForm, ...(coverImage && { coverImage }) });
            setShowLessonModal(false);
            setLessonForm({ title: '', description: '' });
            setLessonCoverFile(null); setLessonCoverPreview(null);
            await fetchCourseDetail(selCourseId, true);
        } catch { alert('Failed to create lesson'); }
        finally { setSaving(false); }
    };

    return (
        <div className="p-8 font-sans text-gray-800">

            {/* ── Page header ── */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-3xl font-extrabold text-[#0B3A63]">Curriculum</h1>
                    <p className="text-gray-500 font-medium text-sm mt-1">Browse and manage your courses, chapters, topics and lessons.</p>
                </div>
                <button
                    onClick={() => setShowCourseModal(true)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#0F4C81] hover:bg-[#0B3A63] text-white font-bold rounded-xl shadow-sm transition text-sm"
                >
                    <PlusIcon className="w-5 h-5" /> Create Course
                </button>
            </div>

            {/* ── Course picker ── */}
            <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm flex items-center gap-4">
                <label className="text-sm font-bold text-gray-500 shrink-0">Course:</label>
                {loadingCourses ? (
                    <span className="text-sm font-bold text-gray-400">Loading...</span>
                ) : (
                    <select
                        value={selCourseId}
                        onChange={e => setSelCourseId(e.target.value)}
                        className="flex-1 max-w-sm p-2.5 border-2 border-gray-200 rounded-xl font-bold text-sm bg-gray-50 outline-none focus:border-[#0F4C81]"
                    >
                        {courses.length === 0 && <option value="">No Courses</option>}
                        {courses.map(c => <option key={c.id} value={c.id}>{c.title} (Grade {c.gradeLevel})</option>)}
                    </select>
                )}
            </div>

            {/* ── Drilldown panel ── */}
            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden min-h-[500px]">
                {loadingDetail ? (
                    <div className="py-20 text-center text-gray-400 font-bold">Loading course structure...</div>
                ) : !courseDetail ? (
                    <div className="py-20 text-center text-gray-400 font-bold">Select a course above.</div>
                ) : (
                    <div className="flex flex-col h-full">

                        {/* Breadcrumb strip */}
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-3 flex items-center justify-between">
                            <div className="flex items-center gap-2 font-bold text-sm">
                                <button
                                    onClick={() => { setSelectedChapterId(null); setSelectedTopicId(null); }}
                                    className={`transition ${!selectedChapterId ? 'text-[#0F4C81]' : 'text-gray-400 hover:text-[#0F4C81]'}`}
                                >
                                    Chapters
                                </button>
                                {selectedChapterId && (
                                    <>
                                        <span className="text-gray-300">/</span>
                                        <button
                                            onClick={() => setSelectedTopicId(null)}
                                            className={`transition ${!selectedTopicId ? 'text-[#0F4C81]' : 'text-gray-400 hover:text-[#0F4C81]'}`}
                                        >
                                            {activeChapter?.title}
                                        </button>
                                    </>
                                )}
                                {selectedTopicId && (
                                    <>
                                        <span className="text-gray-300">/</span>
                                        <span className="text-[#0F4C81]">{activeTopic?.title}</span>
                                    </>
                                )}
                            </div>

                            {/* Context-sensitive Add button — TOP RIGHT */}
                            {!selectedChapterId && (
                                <button
                                    onClick={() => setShowChapterModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] text-white font-bold rounded-lg text-sm hover:bg-[#0B3A63] transition"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add Chapter
                                </button>
                            )}
                            {selectedChapterId && !selectedTopicId && (
                                <button
                                    onClick={() => setShowTopicModal(true)}
                                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] text-white font-bold rounded-lg text-sm hover:bg-[#0B3A63] transition"
                                >
                                    <PlusIcon className="w-4 h-4" /> Add Topic
                                </button>
                            )}
                            {selectedTopicId && (
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setShowLessonModal(true)}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-[#0F4C81] text-white font-bold rounded-lg text-sm hover:bg-[#0B3A63] transition"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Add Lesson
                                    </button>
                                    <button
                                        onClick={() => setQuizModalCtx({ chapterId: selectedChapterId, topicId: selectedTopicId, topicName: activeTopic?.title })}
                                        className="flex items-center gap-1.5 px-4 py-2 bg-white text-grey-500 font-bold rounded-lg text-sm hover:bg-purple-700 transition"
                                    >
                                        <PlusIcon className="w-4 h-4" /> Create Quiz
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Back button row for Chapters view */}
                        {!selectedChapterId && (
                            <div className="px-6 pt-5 pb-2">
                                <button
                                    onClick={() => setSelCourseId('')}
                                    className="flex items-center gap-1.5 text-sm font-bold text-gray-400 hover:text-[#0F4C81] transition"
                                >
                                    <ArrowLeftIcon className="w-4 h-4" /> Back to course selector
                                </button>
                            </div>
                        )}

                        {/* ── VIEW 1: CHAPTERS ── */}
                        {!selectedChapterId && (
                            <div>
                                <div className="grid grid-cols-12 bg-white border-b border-gray-100 px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                                    <div className="col-span-1">#</div>
                                    <div className="col-span-8">Chapter Name</div>
                                    <div className="col-span-2 text-center">Topics</div>
                                    <div className="col-span-1" />
                                </div>
                                {(courseDetail.chapters || []).length === 0 ? (
                                    <div className="py-20 text-center text-gray-400 font-bold">
                                        No chapters yet.<br />
                                        <button onClick={() => setShowChapterModal(true)} className="mt-3 text-[#0F4C81] underline text-sm">+ Add the first chapter</button>
                                    </div>
                                ) : (
                                    (courseDetail.chapters || []).sort((a, b) => a.order - b.order).map((ch, idx) => (
                                        <div
                                            key={ch.id}
                                            onClick={() => setSelectedChapterId(ch.id)}
                                            className="grid grid-cols-12 border-b border-gray-100 px-6 py-4 items-center hover:bg-blue-50 cursor-pointer transition group"
                                        >
                                            <div className="col-span-1 font-black text-gray-300 group-hover:text-blue-300">#{ch.order || idx + 1}</div>
                                            <div className="col-span-8 flex items-center gap-3">
                                                <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-extrabold text-lg">📁</div>
                                                <div>
                                                    <p className="font-extrabold text-[#0B3A63] text-base">{ch.title}</p>
                                                    <p className="text-xs font-bold text-gray-400 truncate max-w-md">{ch.description}</p>
                                                </div>
                                            </div>
                                            <div className="col-span-2 text-center">
                                                <span className="px-3 py-1 bg-gray-100 rounded-full text-xs font-bold text-gray-600">
                                                    {(ch.topics || []).length} Topics
                                                </span>
                                            </div>
                                            <div className="col-span-1 text-right">
                                                <ChevronRightIcon className="w-5 h-5 text-gray-300 inline-block group-hover:text-blue-500 transition" />
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        )}

                        {/* ── VIEW 2: TOPICS ── */}
                        {selectedChapterId && !selectedTopicId && activeChapter && (
                            <div className="p-6 bg-gray-50/50">
                                <div className="flex items-center gap-3 mb-5">
                                    <button
                                        onClick={() => setSelectedChapterId(null)}
                                        className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Chapter</p>
                                        <h2 className="text-lg font-extrabold text-[#0B3A63]">{activeChapter.title}</h2>
                                    </div>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                    {(activeChapter.topics || []).length === 0 ? (
                                        <div className="col-span-3 py-10 text-center text-gray-400 font-bold bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                            No topics yet.
                                            <button onClick={() => setShowTopicModal(true)} className="block mx-auto mt-2 text-[#0F4C81] underline text-sm">+ Add the first topic</button>
                                        </div>
                                    ) : (
                                        (activeChapter.topics || []).sort((a, b) => a.order - b.order).map(topic => (
                                            <div
                                                key={topic.id}
                                                onClick={() => setSelectedTopicId(topic.id)}
                                                className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md hover:border-blue-300 transition cursor-pointer group flex flex-col"
                                            >
                                                <span className="text-xs font-black text-blue-500 mb-2 block tracking-wider uppercase">Topic {topic.order}</span>
                                                <h3 className="text-lg font-extrabold text-[#0B3A63] mb-2">{topic.title}</h3>
                                                <p className="text-xs font-bold text-gray-400 line-clamp-2 flex-1">{topic.description}</p>
                                                <div className="mt-5 pt-4 border-t border-gray-100 flex gap-4 text-xs font-bold text-gray-500">
                                                    <span className="flex items-center gap-1 group-hover:text-blue-600 transition">
                                                        <QueueListIcon className="w-4 h-4" /> {(topic.lessons || []).length} Lessons
                                                    </span>
                                                    <span className="flex items-center gap-1 group-hover:text-blue-600 transition">
                                                        <QuestionMarkCircleIcon className="w-4 h-4" /> {(topic.quiz || []).length} Quizzes
                                                    </span>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        )}

                        {/* ── VIEW 3: LESSONS & QUIZZES ── */}
                        {selectedTopicId && activeTopic && (
                            <div className="p-6 bg-gray-50/50">
                                <div className="flex items-center gap-3 mb-5">
                                    <button
                                        onClick={() => setSelectedTopicId(null)}
                                        className="flex items-center gap-1.5 p-2 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-600 transition"
                                    >
                                        <ArrowLeftIcon className="w-4 h-4" />
                                    </button>
                                    <div>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Topic</p>
                                        <h2 className="text-lg font-extrabold text-[#0B3A63]">{activeTopic.title}</h2>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {(activeTopic.lessons || []).length === 0 && (activeTopic.quiz || []).length === 0 && (
                                        <div className="py-10 text-center text-gray-400 font-bold bg-white rounded-2xl border-2 border-dashed border-gray-200">
                                            No lessons or quizzes yet.
                                            <button onClick={() => setShowLessonModal(true)} className="block mx-auto mt-2 text-[#0F4C81] underline text-sm">+ Add a lesson</button>
                                        </div>
                                    )}
                                    {(activeTopic.lessons || []).sort((a, b) => a.order - b.order).map(l => (
                                        <div key={`l-${l.id}`} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600">
                                                    <PlayCircleIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-800 text-sm">Lesson {l.order}: {l.title}</p>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block">{(l.contents || []).length} Blocks</span>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => setLessonModalCtx({ lesson: l, chapterId: selectedChapterId, topicId: selectedTopicId })}
                                                className="text-blue-500 font-bold text-xs hover:underline"
                                            >
                                                Manage Content
                                            </button>
                                        </div>
                                    ))}
                                    {(activeTopic.quiz || []).map(q => (
                                        <div key={`q-${q.id}`} className="bg-white rounded-2xl p-4 border border-gray-200 shadow-sm flex items-center justify-between hover:border-blue-200 transition">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-purple-600">
                                                    <DocumentCheckIcon className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <p className="font-extrabold text-gray-800 text-sm">Quiz: {q.title}</p>
                                                    <span className="text-[10px] bg-gray-100 text-gray-500 font-bold px-2 py-0.5 rounded uppercase mt-1 inline-block">{q.passingScore}% pass mark</span>
                                                </div>
                                            </div>
                                            <span className="text-xs font-bold text-gray-400">Quiz Builder →</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* ── Lesson Content Modal ── */}
            {lessonModalCtx && (
                <AdminLessonModal
                    courseId={selCourseId}
                    chapterId={lessonModalCtx.chapterId}
                    topicId={lessonModalCtx.topicId}
                    lesson={lessonModalCtx.lesson}
                    onClose={() => {
                        setLessonModalCtx(null);
                        fetchCourseDetail(selCourseId, true);
                    }}
                />
            )}

            {/* ── Quiz Builder Modal ── */}
            {quizModalCtx && (
                <AdminQuizBuilder
                    courseId={selCourseId}
                    chapterId={quizModalCtx.chapterId}
                    topicId={quizModalCtx.topicId}
                    topicName={quizModalCtx.topicName}
                    onClose={() => {
                        setQuizModalCtx(null);
                        fetchCourseDetail(selCourseId, true);
                    }}
                />
            )}

            {/* ────────── Other MODALS ────────── */}

            {showCourseModal && (
                <Modal title="Create Course" onClose={() => setShowCourseModal(false)}>
                    <form onSubmit={handleCreateCourse} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Course Title</label>
                            <input
                                required value={courseForm.title}
                                onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81]"
                                placeholder="e.g. Mathematics Grade 5"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                            <textarea
                                value={courseForm.description}
                                onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81] resize-none h-20"
                                placeholder="Short description..."
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Grade Level</label>
                            <select
                                value={courseForm.gradeLevel}
                                onChange={e => setCourseForm(f => ({ ...f, gradeLevel: parseInt(e.target.value) }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81]"
                            >
                                {GRADE_LEVELS.map(g => <option key={g} value={g}>Grade {g}</option>)}
                            </select>
                        </div>
                        <CoverUpload preview={courseCoverPreview} onFile={f => setFileWithPreview(f, setCourseCoverFile, setCourseCoverPreview)} />
                        <button type="submit" disabled={saving} className="w-full py-3 bg-[#0F4C81] text-white font-bold rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50">
                            {saving ? 'Creating...' : 'Create Course'}
                        </button>
                    </form>
                </Modal>
            )}

            {showChapterModal && (
                <Modal title="Add Chapter" onClose={() => setShowChapterModal(false)}>
                    <form onSubmit={handleCreateChapter} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Chapter Title</label>
                            <input
                                required value={chapterForm.title}
                                onChange={e => setChapterForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81]"
                                placeholder="e.g. Unit 1: Introduction"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                            <textarea
                                value={chapterForm.description}
                                onChange={e => setChapterForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81] resize-none h-20"
                            />
                        </div>
                        <CoverUpload preview={chapterCoverPreview} onFile={f => setFileWithPreview(f, setChapterCoverFile, setChapterCoverPreview)} />
                        <button type="submit" disabled={saving} className="w-full py-3 bg-[#0F4C81] text-white font-bold rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50">
                            {saving ? 'Adding...' : 'Add Chapter'}
                        </button>
                    </form>
                </Modal>
            )}

            {showTopicModal && (
                <Modal title="Add Topic" onClose={() => setShowTopicModal(false)}>
                    <form onSubmit={handleCreateTopic} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Topic Title</label>
                            <input
                                required value={topicForm.title}
                                onChange={e => setTopicForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81]"
                                placeholder="e.g. Lesson 1: Addition"
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                            <textarea
                                value={topicForm.description}
                                onChange={e => setTopicForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81] resize-none h-20"
                            />
                        </div>
                        <CoverUpload preview={topicCoverPreview} onFile={f => setFileWithPreview(f, setTopicCoverFile, setTopicCoverPreview)} />
                        <button type="submit" disabled={saving} className="w-full py-3 bg-[#0F4C81] text-white font-bold rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50">
                            {saving ? 'Adding...' : 'Add Topic'}
                        </button>
                    </form>
                </Modal>
            )}

            {showLessonModal && (
                <Modal title="Add Lesson" onClose={() => setShowLessonModal(false)}>
                    <form onSubmit={handleCreateLesson} className="space-y-4">
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Lesson Title</label>
                            <input
                                required value={lessonForm.title}
                                onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81]"
                                placeholder='e.g. "What is a Fraction?"'
                            />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-gray-500 mb-1 block">Description</label>
                            <textarea
                                value={lessonForm.description}
                                onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))}
                                className="w-full p-3 border-2 border-gray-200 rounded-xl font-bold text-sm outline-none focus:border-[#0F4C81] resize-none h-20"
                            />
                        </div>
                        <CoverUpload preview={lessonCoverPreview} onFile={f => setFileWithPreview(f, setLessonCoverFile, setLessonCoverPreview)} />
                        <p className="text-xs font-bold text-gray-400">After creating the lesson, click "Manage Content" to add videos, text and images.</p>
                        <button type="submit" disabled={saving} className="w-full py-3 bg-[#0F4C81] text-white font-bold rounded-xl hover:bg-[#0B3A63] transition disabled:opacity-50">
                            {saving ? 'Adding...' : 'Add Lesson'}
                        </button>
                    </form>
                </Modal>
            )}
        </div>
    );
}
