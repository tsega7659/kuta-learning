import { useEffect, useRef, useState } from 'react';
import {
    ArrowPathIcon,
    BookOpenIcon,
    DocumentTextIcon,
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
    const [activeTab, setActiveTab] = useState('create');
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
    const [pdfFile, setPdfFile] = useState(null);
    const [isPremium, setIsPremium] = useState(false);
    const [savingSubject, setSavingSubject] = useState(false);
    const [savingChapter, setSavingChapter] = useState(false);
    const [savingNote, setSavingNote] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [previewPdf, setPreviewPdf] = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);

    const curriculumGradeForApi = programGrade === 12 ? 12 : programGrade;
    const selectedCurriculumGrade = programGrade === 12 ? curriculumGrade : programGrade;
    const selectedSubject = subjects.find((subject) => subject.id === subjectId);
    const selectedChapter = chapters.find((chapter) => chapter.id === chapterId);

    useEffect(() => () => {
        if (previewPdf?.url) URL.revokeObjectURL(previewPdf.url);
    }, [previewPdf]);

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

    const openPdfPreview = async ({ noteId, chapterId, url }, title) => {
        setLoadingPdf(true);
        setError('');
        try {
            const filename = `${(title || 'short-note').replace(/[^\w-]/g, '_')}.pdf`;
            const { data } = await api.get('/upload/download', {
                params: { noteId, chapterId, url, filename, inline: 'true' },
                responseType: 'blob',
            });
            const pdfHeader = await data.slice(0, 5).text();
            if (pdfHeader !== '%PDF-') {
                throw new Error('The uploaded file is not a valid PDF. Please upload the PDF again.');
            }
            setPreviewPdf({
                title: title || 'Short-note PDF',
                url: URL.createObjectURL(data),
            });
        } catch (requestError) {
            let message = getErrorMessage(requestError, 'Could not open this PDF.');
            if (requestError.response?.data instanceof Blob) {
                const responseText = await requestError.response.data.text();
                try {
                    message = JSON.parse(responseText).message || message;
                } catch {
                    message = responseText || message;
                }
            }
            setError(message);
        } finally {
            setLoadingPdf(false);
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
        if (!noteContent.trim() && !pdfFile) {
            setError('Enter note text, attach a PDF, or provide both.');
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
                content: noteContent.trim() || undefined,
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
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Could not save this short note.'));
        } finally {
            setSavingNote(false);
        }
    };

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
            <header>
                <p className="text-sm font-bold uppercase tracking-wider text-[#f26c24]">Content management</p>
                <h1 className="mt-1 text-3xl font-extrabold text-[#0B3A63]">Short Notes</h1>
                <p className="mt-2 text-gray-500">Create and browse student notes by grade, stream, subject, and chapter.</p>
            </header>

            <div className="flex gap-2 border-b border-gray-200">
                {[
                    { id: 'create', label: 'Create Short Note' },
                    { id: 'list', label: 'Shortnotes' },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => {
                            setActiveTab(tab.id);
                            setError('');
                            setSuccess('');
                        }}
                        className={`border-b-2 px-4 py-3 text-sm font-extrabold transition ${
                            activeTab === tab.id
                                ? 'border-[#0F4C81] text-[#0F4C81]'
                                : 'border-transparent text-gray-500 hover:text-gray-800'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

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

            {activeTab === 'create' && (
            <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <DocumentTextIcon className="h-5 w-5 text-[#0F4C81]" />
                        <h2 className="text-lg font-extrabold text-[#0B3A63]">3. Choose or create a chapter</h2>
                    </div>
                    {selectedSubject && (
                        <span className="rounded-full bg-blue-50 px-3 py-1 text-sm font-bold text-[#0F4C81]">
                            {selectedSubject.name} · Grade {selectedCurriculumGrade}
                        </span>
                    )}
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
                                {!loadingChapters && chapters.length === 0 && <option value="">No chapters yet — create one below</option>}
                                {chapters.map((chapter) => (
                                    <option key={chapter.id} value={chapter.id}>{chapter.title}</option>
                                ))}
                            </select>
                        </label>

                        <form onSubmit={createChapter} className="mt-4 grid gap-3 rounded-xl bg-gray-50 p-4 sm:grid-cols-2">
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
                        </form>
                    </>
                )}
                </section>
            )}

            {activeTab === 'create' && selectedChapter && (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                        <h2 className="text-lg font-extrabold text-[#0B3A63]">Add a short note</h2>
                        <p className="mt-1 text-sm text-gray-500">Add student-readable text, a PDF, or both to this chapter.</p>

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
                            <label className="block text-sm font-bold text-gray-600">
                                Note text <span className="font-normal text-gray-400">(optional with PDF)</span>
                                <textarea
                                    value={noteContent}
                                    onChange={(event) => setNoteContent(event.target.value)}
                                    rows={7}
                                    className="mt-2 w-full rounded-xl border border-gray-200 px-3 py-3 font-normal text-gray-800 focus:border-[#0F4C81] focus:outline-none"
                                    placeholder="Write the note students will read..."
                                />
                            </label>
                            <label className="block text-sm font-bold text-gray-600">
                                Attach PDF <span className="font-normal text-gray-400">(optional, max {UPLOAD_LIMITS_MB.document} MB)</span>
                                <input
                                    ref={pdfInputRef}
                                    type="file"
                                    accept="application/pdf,.pdf"
                                    onChange={(event) => setPdfFile(event.target.files?.[0] || null)}
                                    className="mt-2 block w-full rounded-xl border border-gray-200 px-3 py-2 font-normal text-gray-700 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:font-bold file:text-blue-700"
                                />
                                {pdfFile && <span className="mt-1 block font-normal text-gray-500">{pdfFile.name}</span>}
                            </label>
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
                                disabled={savingNote}
                                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0F4C81] px-4 py-3 font-extrabold text-white transition hover:bg-[#0B3A63] disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                {savingNote ? <ArrowPathIcon className="h-5 w-5 animate-spin" /> : <PlusIcon className="h-5 w-5" />}
                                {savingNote ? 'Saving note...' : 'Add note to chapter'}
                            </button>
                        </form>
                </section>
            )}

            {activeTab === 'list' && (
                <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <div className="mb-5">
                        <h2 className="text-lg font-extrabold text-[#0B3A63]">Created shortnotes</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            {selectedSubject
                                ? `${selectedSubject.name} · Grade ${selectedCurriculumGrade}${programGrade === 12 ? ` · ${stream} stream` : ''}`
                                : 'Choose a subject to browse its shortnotes.'}
                        </p>
                    </div>

                    {loadingSubjects || loadingChapters ? (
                        <p className="py-8 text-center text-sm font-semibold text-gray-500">Loading shortnotes...</p>
                    ) : !selectedSubject ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                            No subject is available for this grade and stream.
                        </p>
                    ) : chapters.length === 0 ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                            No chapters or shortnotes have been created for this selection yet.
                        </p>
                    ) : chapters.every((chapter) => !chapter.notes?.length) ? (
                        <p className="rounded-xl bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                            No shortnotes have been created for this selection yet.
                        </p>
                    ) : (
                        <div className="space-y-6">
                            {chapters.filter((chapter) => chapter.notes?.length > 0).map((chapter) => (
                                <section key={chapter.id} className="rounded-xl border border-gray-200 p-4">
                                    <div className="mb-4 border-b border-gray-100 pb-3">
                                        <h3 className="font-extrabold text-[#0B3A63]">{chapter.title}</h3>
                                        {chapter.description && (
                                            <p className="mt-1 text-sm text-gray-500">{chapter.description}</p>
                                        )}
                                    </div>
                                    <div className="space-y-3">
                                        {chapter.notes.map((note) => (
                                            <article key={note.id} className="rounded-xl bg-gray-50 p-4">
                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <div className="flex flex-wrap items-center gap-2">
                                                            <h4 className="font-bold text-gray-800">{note.title}</h4>
                                                            {note.isPremium && (
                                                                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-800">
                                                                    Premium
                                                                </span>
                                                            )}
                                                        </div>
                                                        {note.subtitle && (
                                                            <p className="mt-1 text-sm font-semibold text-gray-600">{note.subtitle}</p>
                                                        )}
                                                        {note.description && (
                                                            <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">{note.description}</p>
                                                        )}
                                                    </div>
                                                    {note.pdfUrl && (
                                                        <button
                                                            type="button"
                                                            onClick={() => openPdfPreview({ noteId: note.id, url: note.pdfUrl }, note.title)}
                                                            disabled={loadingPdf}
                                                            className="shrink-0 rounded-lg border border-[#0F4C81] px-3 py-2 text-sm font-bold text-[#0F4C81] hover:bg-blue-50 disabled:opacity-50"
                                                        >
                                                            {loadingPdf ? 'Opening PDF...' : 'View PDF'}
                                                        </button>
                                                    )}
                                                </div>
                                                {note.content && (
                                                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-gray-700">{note.content}</p>
                                                )}
                                                {!note.content && !note.pdfUrl && (
                                                    <p className="mt-3 text-sm italic text-gray-500">This note has no text or PDF.</p>
                                                )}
                                            </article>
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>
                    )}
                </section>
            )}

            {previewPdf && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label={`PDF preview: ${previewPdf.title}`}
                        className="flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
                    >
                        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-3">
                            <h2 className="truncate font-extrabold text-[#0B3A63]">{previewPdf.title}</h2>
                            <button
                                type="button"
                                onClick={() => setPreviewPdf(null)}
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                                aria-label="Close PDF preview"
                            >
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </header>
                        <iframe title={previewPdf.title} src={previewPdf.url} className="min-h-0 w-full flex-1" />
                    </section>
                </div>
            )}
        </div>
    );
}
