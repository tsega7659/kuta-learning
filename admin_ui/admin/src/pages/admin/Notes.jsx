import { useEffect, useState } from 'react';
import {
    ArrowDownTrayIcon,
    BookOpenIcon,
    DocumentTextIcon,
    EyeIcon,
    MagnifyingGlassIcon,
    XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../../services/api';
import RichNoteContent from '../../components/RichNoteContent';

const PROGRAM_GRADES = [6, 8, 12];
const HIGH_SCHOOL_GRADES = [9, 10, 11, 12];
const STREAMS = ['NATURAL', 'SOCIAL'];

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || fallback;

const getNotePreview = (content = '') => content
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' Image ')
    .replace(/[#*_`>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

export default function AdminNotes() {
    const [programGrade, setProgramGrade] = useState(6);
    const [stream, setStream] = useState('NATURAL');
    const [curriculumGrade, setCurriculumGrade] = useState(9);
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [chapters, setChapters] = useState([]);
    const [chapterId, setChapterId] = useState('ALL');
    const [searchText, setSearchText] = useState('');
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [downloadingNoteId, setDownloadingNoteId] = useState('');
    const [readingNote, setReadingNote] = useState(null);
    const [error, setError] = useState('');

    const selectedGrade = programGrade === 12 ? curriculumGrade : programGrade;
    const availableSubjects = subjects.filter((subject) =>
        subject.availableGrades?.includes(selectedGrade)
    );
    const selectedSubject = availableSubjects.find((subject) => subject.id === subjectId);

    useEffect(() => {
        let current = true;
        const requestStream = programGrade === 12 ? stream : 'COMMON';

        api.get('/short-notes/subjects', {
            params: { gradeLevel: programGrade, stream: requestStream },
        })
            .then(({ data }) => {
                if (!current) return;
                const nextSubjects = data.subjects || [];
                    const gradeSubjects = nextSubjects.filter((subject) =>
                        subject.availableGrades?.includes(selectedGrade)
                    );
                setSubjects(nextSubjects);
                    setLoadingChapters(gradeSubjects.length > 0);
                setSubjectId((currentId) => (
                        gradeSubjects.some((subject) => subject.id === currentId)
                        ? currentId
                            : gradeSubjects[0]?.id || ''
                ));
                setChapters([]);
                setChapterId('ALL');
            })
            .catch((requestError) => {
                if (!current) return;
                setSubjects([]);
                setSubjectId('');
                setChapters([]);
                setLoadingChapters(false);
                setError(getErrorMessage(requestError, 'Could not load note subjects.'));
            })
            .finally(() => {
                if (current) setLoadingSubjects(false);
            });

        return () => { current = false; };
    }, [programGrade, selectedGrade, stream]);

    useEffect(() => {
        if (!selectedSubject) return undefined;

        let current = true;
        api.get(`/short-notes/subjects/${subjectId}`, {
            params: {
                gradeLevel: programGrade,
                grade: selectedGrade,
                stream: programGrade === 12 ? stream : 'COMMON',
            },
        })
            .then(({ data }) => {
                if (!current) return;
                setChapters(data.chapters || []);
                setChapterId('ALL');
            })
            .catch((requestError) => {
                if (!current) return;
                setChapters([]);
                setError(getErrorMessage(requestError, 'Could not load notes for this subject.'));
            })
            .finally(() => {
                if (current) setLoadingChapters(false);
            });

        return () => { current = false; };
    }, [programGrade, selectedGrade, selectedSubject, stream, subjectId]);

    const changeProgramGrade = (grade) => {
        setProgramGrade(grade);
        if (grade === 12) setCurriculumGrade(9);
        setSubjectId('');
        setChapters([]);
        setChapterId('ALL');
        setLoadingSubjects(true);
        setLoadingChapters(false);
        setSearchText('');
        setError('');
    };

    const changeStream = (event) => {
        setStream(event.target.value);
        setSubjectId('');
        setChapters([]);
        setChapterId('ALL');
        setLoadingSubjects(true);
        setLoadingChapters(false);
        setError('');
    };

    const changeCurriculumGrade = (event) => {
        setCurriculumGrade(Number(event.target.value));
        setSubjectId('');
        setChapters([]);
        setChapterId('ALL');
        setLoadingSubjects(true);
        setLoadingChapters(false);
        setError('');
    };

    const changeSubject = (event) => {
        setSubjectId(event.target.value);
        setChapters([]);
        setChapterId('ALL');
        setLoadingChapters(true);
        setError('');
    };

    const downloadNotePdf = async (note) => {
        setDownloadingNoteId(note.id);
        setError('');
        try {
            const filename = `${(note.title || 'short-note').replace(/[^\w-]/g, '_')}.pdf`;
            const { data } = await api.get('/upload/download', {
                params: { noteId: note.id, filename },
                responseType: 'blob',
            });
            if (await data.slice(0, 5).text() !== '%PDF-') {
                throw new Error('The uploaded file is not a valid PDF.');
            }
            const downloadUrl = URL.createObjectURL(data);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
        } catch (requestError) {
            let message = getErrorMessage(requestError, 'Could not download this PDF.');
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
            setDownloadingNoteId('');
        }
    };

    const normalizedSearch = searchText.trim().toLowerCase();
    const filteredChapters = chapters
        .filter((chapter) => chapterId === 'ALL' || chapter.id === chapterId)
        .map((chapter) => ({
            ...chapter,
            notes: (chapter.notes || []).filter((note) => {
                if (!normalizedSearch) return true;
                return [note.title, note.subtitle, note.description, note.content]
                    .filter(Boolean)
                    .join(' ')
                    .toLowerCase()
                    .includes(normalizedSearch);
            }),
        }))
        .filter((chapter) => chapter.notes.length > 0);
    const noteCount = filteredChapters.reduce((count, chapter) => count + chapter.notes.length, 0);

    return (
        <div className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
            <header className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-sm font-bold uppercase tracking-wider text-[#f26c24]">Content library</p>
                    <h1 className="mt-1 text-3xl font-extrabold text-[#0B3A63]">Notes</h1>
                    <p className="mt-2 text-gray-500">Browse created short notes by grade, stream, subject, and chapter.</p>
                </div>
                <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm font-bold text-gray-600 shadow-sm ring-1 ring-gray-200">
                    <BookOpenIcon className="h-5 w-5 text-[#0F4C81]" />
                    {noteCount} {noteCount === 1 ? 'note' : 'notes'}
                </div>
            </header>

            {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 font-semibold text-red-700">{error}</div>}

            <section className="space-y-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h2 className="font-extrabold text-[#0B3A63]">Filters</h2>
                    {programGrade === 12 && <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-extrabold text-[#0F4C81]">High school curriculum</span>}
                </div>
                <div className="flex flex-wrap gap-2" role="group" aria-label="Program grade">
                    {PROGRAM_GRADES.map((grade) => (
                        <button
                            key={grade}
                            type="button"
                            onClick={() => changeProgramGrade(grade)}
                            aria-pressed={programGrade === grade}
                            className={`rounded-md px-4 py-2 text-sm font-extrabold transition ${programGrade === grade ? 'bg-[#0F4C81] text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                        >
                            Grade {grade}
                        </button>
                    ))}
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    {programGrade === 12 && (
                        <label className="text-sm font-bold text-gray-600">
                            Curriculum grade
                            <select value={curriculumGrade} onChange={changeCurriculumGrade} className="mt-1.5 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-gray-800">
                                {HIGH_SCHOOL_GRADES.map((grade) => <option key={grade} value={grade}>Grade {grade}</option>)}
                            </select>
                        </label>
                    )}
                    {programGrade === 12 && (
                        <label className="text-sm font-bold text-gray-600">
                            Stream
                            <select value={stream} onChange={changeStream} className="mt-1.5 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-gray-800">
                                {STREAMS.map((item) => <option key={item} value={item}>{item} Science</option>)}
                            </select>
                        </label>
                    )}
                    <label className="text-sm font-bold text-gray-600">
                        Subject
                        <select value={subjectId} onChange={changeSubject} disabled={loadingSubjects || !availableSubjects.length} className="mt-1.5 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-gray-800 disabled:bg-gray-100">
                            {loadingSubjects && <option value="">Loading subjects...</option>}
                            {!loadingSubjects && !availableSubjects.length && <option value="">No subjects available</option>}
                            {availableSubjects.map((subject) => <option key={subject.id} value={subject.id}>{subject.name}</option>)}
                        </select>
                    </label>
                    <label className="text-sm font-bold text-gray-600">
                        Chapter
                        <select value={chapterId} onChange={(event) => setChapterId(event.target.value)} disabled={loadingChapters || !chapters.length} className="mt-1.5 w-full rounded-md border border-gray-200 bg-white px-3 py-2.5 text-gray-800 disabled:bg-gray-100">
                            <option value="ALL">All chapters</option>
                            {chapters.map((chapter) => <option key={chapter.id} value={chapter.id}>{chapter.title}</option>)}
                        </select>
                    </label>
                </div>
                <label className="relative block max-w-xl text-sm font-bold text-gray-600">
                    Search notes
                    <MagnifyingGlassIcon className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 text-gray-400" />
                    <input value={searchText} onChange={(event) => setSearchText(event.target.value)} placeholder="Search title or note text" className="mt-1.5 w-full rounded-md border border-gray-200 py-2.5 pl-9 pr-3 font-normal text-gray-800 placeholder:text-gray-400" />
                </label>
            </section>

            {loadingSubjects || loadingChapters ? (
                <p className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center text-sm font-semibold text-gray-500">Loading notes...</p>
            ) : !availableSubjects.length ? (
                <p className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">No subjects are available for this grade and stream.</p>
            ) : !chapters.length ? (
                <p className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">No chapters have been created for this selection yet.</p>
            ) : !filteredChapters.length ? (
                <p className="rounded-lg border border-gray-200 bg-white px-4 py-12 text-center text-sm text-gray-500">No notes match these filters.</p>
            ) : (
                <div className="space-y-6">
                    {filteredChapters.map((chapter) => (
                        <section key={chapter.id}>
                            <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2 border-b border-gray-200 pb-2">
                                <h2 className="font-extrabold text-[#0B3A63]">{chapter.title}</h2>
                                <span className="text-xs font-semibold text-gray-500">{selectedSubject?.name} · Grade {selectedGrade}{programGrade === 12 ? ` · ${stream} stream` : ''}</span>
                            </div>
                            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                                {chapter.notes.map((note) => (
                                    <article key={note.id} className="flex min-h-48 flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                                        <div className="flex items-start justify-between gap-2">
                                            <h3 className="font-bold text-gray-800">{note.title}</h3>
                                            {note.isPremium && <span className="shrink-0 rounded-full bg-amber-100 px-2 py-1 text-xs font-bold text-amber-800">Premium</span>}
                                        </div>
                                        {note.subtitle && <p className="mt-1 text-sm font-semibold text-gray-600">{note.subtitle}</p>}
                                        <p className="mt-3 line-clamp-3 flex-1 text-sm leading-6 text-gray-600">
                                            {note.content ? getNotePreview(note.content) || 'Text note' : note.description || (note.pdfUrl ? 'PDF document' : 'No preview available.')}
                                        </p>
                                        <div className="mt-4 flex flex-wrap gap-2 border-t border-gray-100 pt-3">
                                            {note.content && <button type="button" onClick={() => setReadingNote(note)} className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-bold text-[#0F4C81] hover:bg-blue-50"><EyeIcon className="h-4 w-4" />Read note</button>}
                                            {note.pdfUrl && <button type="button" onClick={() => downloadNotePdf(note)} disabled={downloadingNoteId === note.id} className="inline-flex items-center gap-2 rounded-md px-2 py-2 text-sm font-bold text-[#0F4C81] hover:bg-blue-50 disabled:opacity-50"><ArrowDownTrayIcon className="h-4 w-4" />{downloadingNoteId === note.id ? 'Downloading...' : 'Download PDF'}</button>}
                                            {!note.content && !note.pdfUrl && <DocumentTextIcon className="mt-2 h-4 w-4 text-gray-400" aria-label="Text unavailable" />}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {readingNote && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/55 p-3 sm:p-6">
                    <section role="dialog" aria-modal="true" aria-labelledby="reading-note-title" className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
                        <header className="flex items-center justify-between gap-4 border-b border-gray-200 px-5 py-4">
                            <div>
                                <h2 id="reading-note-title" className="font-extrabold text-[#0B3A63]">{readingNote.title}</h2>
                                {readingNote.subtitle && <p className="mt-1 text-sm text-gray-500">{readingNote.subtitle}</p>}
                            </div>
                            <button type="button" onClick={() => setReadingNote(null)} aria-label="Close note" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-800">
                                <XMarkIcon className="h-5 w-5" />
                            </button>
                        </header>
                        <div className="overflow-y-auto px-5 py-4">
                            {readingNote.description && <p className="mb-4 whitespace-pre-wrap text-sm text-gray-600">{readingNote.description}</p>}
                            <RichNoteContent content={readingNote.content} />
                        </div>
                    </section>
                </div>
            )}
        </div>
    );
}
