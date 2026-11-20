import { useEffect, useRef, useState } from 'react';
import {
    ArrowPathIcon,
    ArrowDownTrayIcon,
    BookOpenIcon,
    DocumentTextIcon,
    PhotoIcon,
    PlusIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import { UPLOAD_LIMITS_MB, validateFileByKind } from '../../constants/uploadLimits';

const PROGRAM_GRADES = [6, 8, 12];
const HIGH_SCHOOL_GRADES = [9, 10, 11, 12];
const STREAMS = ['NATURAL', 'SOCIAL'];

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || fallback;

const makeSubjectPayload = ({ name, description, programGrade, stream }) => ({
    name: name.trim(),
    gradeLevels: programGrade === 12 ? HIGH_SCHOOL_GRADES : [programGrade],
    stream: programGrade === 12 ? stream : null,
    description: description.trim() || null,
    icon: '📘',
    color: '#0F4C81',
});

export default function AdminShortNotes() {
    const [programGrade, setProgramGrade] = useState(6);
    const [stream, setStream] = useState('NATURAL');
    const [curriculumGrade, setCurriculumGrade] = useState(6);
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [chapters, setChapters] = useState([]);
    const [chapterId, setChapterId] = useState('');
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingChapters, setLoadingChapters] = useState(false);

    const [showSubjectForm, setShowSubjectForm] = useState(false);
    const [showChapterForm, setShowChapterForm] = useState(false);
    const [subjectName, setSubjectName] = useState('');
    const [subjectDescription, setSubjectDescription] = useState('');
    const [chapterTitle, setChapterTitle] = useState('');
    const [chapterDescription, setChapterDescription] = useState('');

    const [noteTitle, setNoteTitle] = useState('');
    const [noteSubtitle, setNoteSubtitle] = useState('');
    const [noteDescription, setNoteDescription] = useState('');
    const [noteContent, setNoteContent] = useState('');
    const [objectivesText, setObjectivesText] = useState('');
    const pdfInputRef = useRef(null);
    const imageInputRef = useRef(null);
    const noteContentRef = useRef(null);
    const imageCursorRef = useRef({ start: 0, end: 0 });
    const [pdfFile, setPdfFile] = useState(null);
    const [uploadingImage, setUploadingImage] = useState(false);
    const [isPremium, setIsPremium] = useState(false);
    const [savingSubject, setSavingSubject] = useState(false);
    const [savingChapter, setSavingChapter] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [noteModalOpen, setNoteModalOpen] = useState(false);
    const [noteMode, setNoteMode] = useState('text');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const curriculumGradeForApi = programGrade === 12 ? 12 : programGrade;
    const selectedCurriculumGrade = programGrade === 12 ? curriculumGrade : programGrade;
    const selectedSubject = subjects.find((subject) => subject.id === subjectId);
    const selectedChapter = chapters.find((chapter) => chapter.id === chapterId);

    useEffect(() => {
        let current = true;
        const requestStream = programGrade === 12 ? stream : 'COMMON';

        api.get('/short-notes/subjects', {
            params: { gradeLevel: curriculumGradeForApi, stream: requestStream },
        })
            .then(({ data }) => {
                if (!current) return;
                const availableSubjects = (data.subjects || []).filter((subject) =>
                    subject.availableGrades?.includes(selectedCurriculumGrade)
                );
                setSubjects(availableSubjects);
                setSubjectId((currentId) => (
                    availableSubjects.some((subject) => subject.id === currentId)
                        ? currentId
                        : availableSubjects[0]?.id || ''
                ));
                setChapters([]);
                setChapterId('');
                setLoadingChapters(availableSubjects.length > 0);
            })
            .catch((requestError) => {
                if (!current) return;
                setSubjects([]);
                setSubjectId('');
                setChapters([]);
                setChapterId('');
                setLoadingChapters(false);
                setError(getErrorMessage(requestError, 'Could not load subjects.'));
            })
            .finally(() => {
                if (current) setLoadingSubjects(false);
            });

        return () => {
            current = false;
        };
    }, [curriculumGradeForApi, programGrade, selectedCurriculumGrade, stream]);

    useEffect(() => {
        if (!selectedSubject) return undefined;

        let current = true;
        api.get(`/short-notes/subjects/${subjectId}`, {
            params: {
                gradeLevel: curriculumGradeForApi,
                grade: selectedCurriculumGrade,
                stream: programGrade === 12 ? stream : 'COMMON',
            },
        })
            .then(({ data }) => {
                if (!current) return;
                const availableChapters = data.chapters || [];
                setChapters(availableChapters);
                setChapterId((currentId) => (
                    availableChapters.some((chapter) => chapter.id === currentId)
                        ? currentId
                        : availableChapters[0]?.id || ''
                ));
            })
            .catch((requestError) => {
                if (!current) return;
                setChapters([]);
                setChapterId('');
                setError(getErrorMessage(requestError, 'Could not load chapters for this subject.'));
            })
            .finally(() => {
                if (current) setLoadingChapters(false);
            });

        return () => {
            current = false;
        };
    }, [curriculumGradeForApi, programGrade, selectedCurriculumGrade, selectedSubject, stream, subjectId]);

    const changeProgramGrade = (event) => {
        const nextGrade = Number(event.target.value);
        setProgramGrade(nextGrade);
        setCurriculumGrade(nextGrade === 12 ? 9 : nextGrade);
        setSubjects([]);
        setSubjectId('');
        setChapters([]);
        setChapterId('');
        setLoadingSubjects(true);
        setLoadingChapters(false);
        setError('');
        setSuccess('');
    };

    const changeStream = (event) => {
        setStream(event.target.value);
        setSubjects([]);
        setSubjectId('');
        setChapters([]);
        setChapterId('');
        setLoadingSubjects(true);
        setLoadingChapters(false);
        setError('');
        setSuccess('');
    };

    const changeCurriculumGrade = (event) => {
        setCurriculumGrade(Number(event.target.value));
        setChapters([]);
        setChapterId('');
        setLoadingChapters(true);
        setError('');
        setSuccess('');
    };

    const changeSubject = (event) => {
        setSubjectId(event.target.value);
        setChapters([]);
        setChapterId('');
        setLoadingChapters(true);
        setError('');
        setSuccess('');
    };

    const selectImageInsertionPoint = () => {
        const textarea = noteContentRef.current;
        imageCursorRef.current = textarea
            ? { start: textarea.selectionStart, end: textarea.selectionEnd }
            : { start: noteContent.length, end: noteContent.length };
        imageInputRef.current?.click();
    };

    const uploadNoteImage = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;

        const supportedImageTypes = new Set(['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
        if (!supportedImageTypes.has(file.type.toLowerCase())) {
            setError('Choose a JPG, PNG, GIF, or WebP image.');
            return;
        }
        const fileError = validateFileByKind(file);
        if (fileError) {
            setError(fileError);
            return;
        }

        setError('');
        setSuccess('');
        setUploadingImage(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            const { data } = await api.post('/upload', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const imageUrl = new URL(data.url);
            if (imageUrl.protocol !== 'https:' || imageUrl.hostname !== 'res.cloudinary.com') {
                throw new Error('The image upload returned an unsupported image URL.');
            }

            const { start, end } = imageCursorRef.current;
            const alt = file.name
                .replace(/\.[^.]+$/, '')
                .split('[').join('')
                .split(']').join('')
                .split('\\').join('')
                .trim() || 'Note image';
            const markdownUrl = imageUrl.toString().replace(/[()]/g, (character) => encodeURIComponent(character));
            const marker = `![${alt}](${markdownUrl})`;
            const before = noteContent.slice(0, start);
            const after = noteContent.slice(end);
            const insertion = `${before && !before.endsWith('\n') ? '\n' : ''}${marker}${after && !after.startsWith('\n') ? '\n' : '\n'}`;
            const updatedContent = `${before}${insertion}${after}`;
            setNoteContent(updatedContent);
            window.setTimeout(() => {
                const textarea = noteContentRef.current;
                if (!textarea) return;
                const cursor = before.length + insertion.length;
                textarea.focus();
                textarea.setSelectionRange(cursor, cursor);
            }, 0);
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Could not upload this image.'));
        } finally {
            setUploadingImage(false);
        }
    };

    const createSubject = async (event) => {
        event.preventDefault();
        if (!subjectName.trim()) {
            setError('Enter a subject title.');
            return;
        }
        setError('');
        setSuccess('');
        setSavingSubject(true);

        try {
            const { data } = await api.post(
                '/national-exams/subjects',
                makeSubjectPayload({ name: subjectName, description: subjectDescription, programGrade, stream }),
            );
            setSubjects((currentSubjects) => [...currentSubjects, {
                ...data,
                availableGrades: data.gradeLevels,
                totalChapters: 0,
            }]);
            setSubjectId(data.id);
            setChapters([]);
            setChapterId('');
            setSubjectName('');
            setSubjectDescription('');
            setShowSubjectForm(false);
            setSuccess(`Subject “${data.name}” added.`);
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Could not create this subject.'));
        } finally {
            setSavingSubject(false);
        }
    };

    const createChapter = async (event) => {
        event.preventDefault();
        if (!chapterTitle.trim()) {
            setError('Enter a chapter title.');
            return;
        }
        if (!selectedSubject) {
            setError('Choose a subject before creating a chapter.');
            return;
        }

        setError('');
        setSuccess('');
        setSavingChapter(true);
        try {
            const { data } = await api.post('/short-notes/chapters', {
                subjectId,
                gradeLevel: selectedCurriculumGrade,
                stream: programGrade === 12 ? stream : null,
                title: chapterTitle.trim(),
                description: chapterDescription.trim() || undefined,
            });
            setChapters((currentChapters) => [...currentChapters, { ...data, notes: [] }]);
            setChapterId(data.id);
            setChapterTitle('');
            setChapterDescription('');
            setShowChapterForm(false);
            setSuccess(`Chapter “${data.title}” added.`);
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Could not create this chapter.'));
        } finally {
            setSavingChapter(false);
        }
    };

    const createNote = async (event) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedChapter) {
            setError('Choose a chapter before adding a short note.');
            return;
        }
        if (!noteTitle.trim()) {
            setError('Enter a short-note title.');
            return;
        }
        if (noteMode === 'text' && !noteContent.trim()) {
            setError('Write some note text before saving.');
            return;
        }
        if (noteMode === 'pdf' && !pdfFile) {
            setError('Choose a PDF file to upload.');
            return;
        }
        if (!noteContent.trim() && !pdfFile) {
            setError('Enter note text, insert an image, attach a PDF, or provide a combination.');
            return;
        }
        if (pdfFile) {
            const isPdf = pdfFile.type === 'application/pdf' || pdfFile.name.toLowerCase().endsWith('.pdf');
            if (!isPdf) {
                setError('Only PDF files can be attached to a short note.');
                return;
            }
            const fileError = validateFileByKind(pdfFile);
            if (fileError) {
                setError(fileError);
                return;
            }
        }

        setSavingNote(true);
        try {
            let pdfUrl;
            if (pdfFile) {
                const formData = new FormData();
                formData.append('file', pdfFile);
                const { data: uploadedFile } = await api.post('/upload', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                pdfUrl = uploadedFile.url;
            }

            const { data } = await api.post(`/short-notes/chapters/${chapterId}/notes`, {
                title: noteTitle.trim(),
                subtitle: noteSubtitle.trim() || undefined,
                description: noteDescription.trim() || undefined,
                content: noteMode === 'text' ? noteContent.trim() : undefined,
                learningObjectives: objectivesText.split('\n').map((item) => item.trim()).filter(Boolean),
                isPremium,
                ...(pdfUrl && {
                    pdfUrl,
                    fileSize: `${(pdfFile.size / (1024 * 1024)).toFixed(1)} MB`,
                }),
            });

            setChapters((currentChapters) => currentChapters.map((chapter) => (
                chapter.id === chapterId
                    ? { ...chapter, notes: [...(chapter.notes || []), data] }
                    : chapter
            )));
            setSuccess(`Short note “${data.title}” added to ${selectedChapter.title}.`);
            setNoteTitle('');
            setNoteSubtitle('');
            setNoteDescription('');
            setNoteContent('');
            setObjectivesText('');
            setPdfFile(null);
            if (pdfInputRef.current) pdfInputRef.current.value = '';
            setIsPremium(false);
            setNoteModalOpen(false);
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Could not save this short note.'));
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                <p className="text-sm font-bold uppercase tracking-wider text-[#f26c24]">Content management</p>
                <h1 className="mt-1 text-3xl font-extrabold text-[#0B3A63]">Short Notes</h1>
                <p className="mt-2 text-gray-500">Create and browse student notes by grade, stream, subject, and chapter.</p>
                </div>
                <button
                    type="button"
                    onClick={() => { setError(''); setSuccess(''); setNoteMode('text'); setNoteModalOpen(true); }}
                    disabled={!selectedChapter}
                    className="inline-flex items-center gap-2 rounded-lg bg-[#0F4C81] px-4 py-3 text-sm font-extrabold text-white shadow-sm transition hover:bg-[#0B3A63] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <PlusIcon className="h-5 w-5" />
                    Add short note
                </button>
            </header>

            {error && (
                <div role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">
                    {error}
                </div>
            )}
            {success && (
                <div role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 font-semibold text-green-700">
                    {success}
                </div>
            )}

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2">
                    <DocumentTextIcon className="h-5 w-5 text-[#0F4C81]" />
                    <h2 className="text-lg font-extrabold text-[#0B3A63]">1. Choose grade and curriculum</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                    <label className="text-sm font-bold text-gray-600">
                        Student program
                        <select
                            value={programGrade}
                            onChange={changeProgramGrade}
                            className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                        >
                            {PROGRAM_GRADES.map((item) => <option key={item} value={item}>Grade {item}</option>)}
                        </select>
                    </label>

                    {programGrade === 12 && (
                        <>
                            <label className="text-sm font-bold text-gray-600">
                                Stream
                                <select
                                    value={stream}
                                    onChange={changeStream}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                >
                                    {STREAMS.map((item) => <option key={item} value={item}>{item} Science</option>)}
                                </select>
                            </label>
                            <label className="text-sm font-bold text-gray-600 sm:col-span-2">
                                Curriculum grade
                                <select
                                    value={curriculumGrade}
                                    onChange={changeCurriculumGrade}
                                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                >
                                    {HIGH_SCHOOL_GRADES.map((item) => <option key={item} value={item}>Grade {item}</option>)}
                                </select>
                            </label>
                        </>
                    )}
                </div>
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <BookOpenIcon className="h-5 w-5 text-[#0F4C81]" />
                        <h2 className="text-lg font-extrabold text-[#0B3A63]">2. Choose or add a subject</h2>
                    </div>
                    <button
                        type="button"
                        onClick={() => setShowSubjectForm((visible) => !visible)}
                        className="flex shrink-0 items-center gap-2 rounded-xl border border-[#0F4C81] px-3 py-2 text-sm font-bold text-[#0F4C81] hover:bg-blue-50"
                    >
                        <PlusIcon className="h-4 w-4" />
                        Add subject
                    </button>
                </div>

                <label className="block text-sm font-bold text-gray-600">
                    Subject
                    <select
                        value={subjectId}
                        onChange={changeSubject}
                        disabled={loadingSubjects || subjects.length === 0}
                        className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-800 focus:border-[#0F4C81] focus:outline-none disabled:bg-gray-100"
                    >
                        {loadingSubjects && <option value="">Loading subjects...</option>}
                        {!loadingSubjects && subjects.length === 0 && <option value="">No subjects yet — add one above</option>}
                        {subjects.map((subject) => (
                            <option key={subject.id} value={subject.id}>{subject.name}</option>
                        ))}
                    </select>
                </label>

                {showSubjectForm && (
                    <form onSubmit={createSubject} className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                        <label className="text-sm font-bold text-gray-600">
                            Subject title
                            <input
                                value={subjectName}
                                onChange={(event) => setSubjectName(event.target.value)}
                                required
                                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-800"
                                placeholder="e.g. Mathematics"
                            />
                        </label>
                        <label className="text-sm font-bold text-gray-600">
                            Description <span className="font-normal text-gray-400">(optional)</span>
                            <input
                                value={subjectDescription}
                                onChange={(event) => setSubjectDescription(event.target.value)}
                                className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-800"
                            />
                        </label>
                        <div className="flex items-center gap-2 text-sm text-gray-500 sm:col-span-2">
                            This subject will be available for {programGrade === 12
                                ? `Grades 9–12, ${stream} stream`
                                : `Grade ${programGrade}`} short notes.
                        </div>
                        <button
                            type="submit"
                            disabled={savingSubject}
                            className="rounded-lg bg-[#0F4C81] px-4 py-2.5 font-bold text-white disabled:opacity-50 sm:col-span-2"
                        >
                            {savingSubject ? 'Adding subject...' : 'Create subject'}
                        </button>
                    </form>
                )}
            </section>

            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-[#0F4C81]" />
                        <h2 className="text-lg font-extrabold text-[#0B3A63]">3. Choose or create a chapter</h2>
                    </div>
                    <div className="flex items-center gap-3">
                    {selectedSubject && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-[#0F4C81]">
                            {selectedSubject.name} · Grade {selectedCurriculumGrade}
                        </span>
                    )}
                    {selectedSubject && (
                        <button
                            type="button"
                            onClick={() => setShowChapterForm((visible) => !visible)}
                            className="rounded-lg border border-[#0F4C81] px-3 py-2 text-sm font-bold text-[#0F4C81] hover:bg-blue-50"
                        >
                            {showChapterForm ? 'Cancel' : 'Add chapter'}
                        </button>
                    )}
                    </div>
                </div>

                {!selectedSubject ? (
                    <p className="text-sm text-gray-500">Select or create a subject to manage its chapters.</p>
                ) : (
                    <>
                        <label className="block text-sm font-bold text-gray-600">
                            Chapter
                            <select
                                value={chapterId}
                                onChange={(event) => {
                                    setChapterId(event.target.value);
                                    setError('');
                                    setSuccess('');
                                }}
                                disabled={loadingChapters || chapters.length === 0}
                                className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-gray-800 focus:border-[#0F4C81] focus:outline-none disabled:bg-gray-100"
                            >
                                {loadingChapters && <option value="">Loading chapters...</option>}
                                {!loadingChapters && chapters.length === 0 && <option value="">No chapters yet — add one above</option>}
                                {chapters.map((chapter) => (
                                    <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                ))}
                            </select>
                        </label>

                        {showChapterForm && <form onSubmit={createChapter} className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
                            <label className="text-sm font-bold text-gray-600">
                                New chapter title
                                <input
                                    value={chapterTitle}
                                    onChange={(event) => setChapterTitle(event.target.value)}
                                    required
                                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-800"
                                    placeholder="e.g. Chapter 1: Number Systems"
                                />
                            </label>
                            <label className="text-sm font-bold text-gray-600">
                                Description <span className="font-normal text-gray-400">(optional)</span>
                                <input
                                    value={chapterDescription}
                                    onChange={(event) => setChapterDescription(event.target.value)}
                                    className="mt-2 w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 font-normal text-gray-800"
                                />
                            </label>
                            <button
                                type="submit"
                                disabled={savingChapter}
                                className="rounded-lg bg-[#0F4C81] px-4 py-2.5 font-bold text-white disabled:opacity-50 sm:col-span-2"
                            >
                                {savingChapter ? 'Creating chapter...' : 'Create chapter'}
                            </button>
                        </form>}
                    </>
                )}
                </section>

            {noteModalOpen && selectedChapter && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 p-3 sm:p-6">
                <section role="dialog" aria-modal="true" aria-labelledby="short-note-modal-title" className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                    <header className="flex items-center justify-between border-b border-gray-200 px-5 py-4 sm:px-7">
                        <div>
                            <h2 id="short-note-modal-title" className="text-xl font-extrabold text-[#0B3A63]">Add a short note</h2>
                            <p className="mt-1 text-sm text-gray-500">For {selectedChapter.title}</p>
                        </div>
                        <button type="button" onClick={() => setNoteModalOpen(false)} aria-label="Close note form" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                            <XMarkIcon className="h-5 w-5" />
                        </button>
                    </header>
                    <div className="overflow-y-auto px-5 py-5 sm:px-7">
                        <div className="mt-4 grid grid-cols-2 gap-2" role="group" aria-label="Note format">
                            <button type="button" onClick={() => { setNoteMode('text'); setPdfFile(null); if (pdfInputRef.current) pdfInputRef.current.value = ''; setError(''); }} className={`rounded-lg border px-3 py-3 text-sm font-bold ${noteMode === 'text' ? 'border-[#0F4C81] bg-blue-50 text-[#0F4C81]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <DocumentTextIcon className="mx-auto mb-1 h-5 w-5" />Write text
                            </button>
                            <button type="button" onClick={() => { setNoteMode('pdf'); setNoteContent(''); setError(''); }} className={`rounded-lg border px-3 py-3 text-sm font-bold ${noteMode === 'pdf' ? 'border-[#0F4C81] bg-blue-50 text-[#0F4C81]' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                                <ArrowDownTrayIcon className="mx-auto mb-1 h-5 w-5" />Upload PDF
                            </button>
                        </div>

                        <form onSubmit={createNote} className="mt-5 space-y-4">
                            <label className="block text-sm font-bold text-gray-600">
                                Note title
                                <input
                                    value={noteTitle}
                                    onChange={(event) => setNoteTitle(event.target.value)}
                                    required
                                    maxLength={180}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 font-normal text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                    placeholder="e.g. Worked examples"
                                />
                            </label>
                            <label className="block text-sm font-bold text-gray-600">
                                Subtitle <span className="font-normal text-gray-400">(optional)</span>
                                <input
                                    value={noteSubtitle}
                                    onChange={(event) => setNoteSubtitle(event.target.value)}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 font-normal text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                />
                            </label>
                            <label className="block text-sm font-bold text-gray-600">
                                Description <span className="font-normal text-gray-400">(optional)</span>
                                <textarea
                                    value={noteDescription}
                                    onChange={(event) => setNoteDescription(event.target.value)}
                                    rows={2}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 font-normal text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                />
                            </label>
                            {noteMode === 'text' && <label className="block text-sm font-bold text-gray-600">
                                Note text and images
                                <textarea
                                    ref={noteContentRef}
                                    value={noteContent}
                                    onChange={(event) => setNoteContent(event.target.value)}
                                    disabled={uploadingImage}
                                    rows={7}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 font-normal text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                    placeholder="Write the note students will read. Insert images at the cursor position."
                                />
                                <span className="mt-1 block font-normal text-gray-400">
                                    Images are inserted at the cursor and displayed inline to students. Maximum image size: {UPLOAD_LIMITS_MB.image} MB.
                                </span>
                                <input
                                    ref={imageInputRef}
                                    type="file"
                                    accept="image/jpeg,image/png,image/gif,image/webp"
                                    onChange={uploadNoteImage}
                                    className="hidden"
                                />
                                <button
                                    type="button"
                                    onClick={selectImageInsertionPoint}
                                    disabled={uploadingImage}
                                    className="mt-2 inline-flex items-center gap-2 rounded-lg border border-[#0F4C81] px-3 py-2 text-sm font-bold text-[#0F4C81] hover:bg-blue-50 disabled:opacity-50"
                                >
                                    {uploadingImage
                                        ? <ArrowPathIcon className="h-4 w-4 animate-spin" />
                                        : <PhotoIcon className="h-4 w-4" />}
                                    {uploadingImage ? 'Uploading image...' : 'Insert image'}
                                </button>
                            </label>}
                            {noteMode === 'pdf' && <label className="block text-sm font-bold text-gray-600">
                                PDF document <span className="font-normal text-gray-400">(max {UPLOAD_LIMITS_MB.document} MB)</span>
                                <input
                                    ref={pdfInputRef}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                                    className="mt-2 block w-full rounded-xl border border-gray-200 px-3 py-2 font-normal text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
                                />
                                {pdfFile && <span className="mt-1 block font-normal text-gray-500">{pdfFile.name}</span>}
                            </label>}
                            <label className="block text-sm font-bold text-gray-600">
                                Learning objectives <span className="font-normal text-gray-400">(optional, one per line)</span>
                                <textarea
                                    value={objectivesText}
                                    onChange={(event) => setObjectivesText(event.target.value)}
                                    rows={3}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 font-normal text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                />
                            </label>
                            <label className="flex items-center gap-2 text-sm font-semibold text-gray-600">
                                <input
                                    type="checkbox"
                                    checked={isPremium}
                                    onChange={(event) => setIsPremium(event.target.checked)}
                                    className="h-4 w-4 accent-[#0F4C81]"
                                />
                                Premium note
                            </label>
                            <button
                                type="submit"
                                disabled={savingNote || uploadingImage}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-3 font-extrabold text-white transition hover:bg-[#0B3A63] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingNote ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                                {uploadingImage ? 'Wait for image upload...' : savingNote ? 'Saving note...' : 'Add note to chapter'}
                            </button>
                        </form>
                    </div>
                </section>
                </div>
            )}

        </div>
    );
}
