import { useEffect, useState } from 'react';
import { FaBookOpen, FaFilePdf, FaLock, FaXmark } from 'react-icons/fa6';
import api from '../../services/api';
import RichNoteContent from '../../components/shared/RichNoteContent';

const getErrorMessage = (error, fallback) =>
    error.response?.data?.message || fallback;

export default function ShortNotes() {
    const [subjects, setSubjects] = useState([]);
    const [subjectId, setSubjectId] = useState('');
    const [studentGrade, setStudentGrade] = useState(null);
    const [selectedGrade, setSelectedGrade] = useState(null);
    const [stream, setStream] = useState('');
    const [chapters, setChapters] = useState([]);
    const [loadingSubjects, setLoadingSubjects] = useState(true);
    const [loadingChapters, setLoadingChapters] = useState(false);
    const [error, setError] = useState('');
    const [previewPdf, setPreviewPdf] = useState(null);
    const [loadingPdf, setLoadingPdf] = useState(false);

    useEffect(() => {
        let current = true;
        api.get('/short-notes/subjects')
            .then(({ data }) => {
                if (!current) return;
                const availableSubjects = data.subjects || [];
                setSubjects(availableSubjects);
                setStudentGrade(data.studentGrade);
                setSelectedGrade(data.studentGrade);
                setStream(data.stream || '');
                setSubjectId(availableSubjects[0]?.id || '');
                setLoadingChapters(availableSubjects.length > 0);
            })
            .catch((requestError) => {
                if (current) setError(getErrorMessage(requestError, 'Could not load short notes.'));
            })
            .finally(() => {
                if (current) setLoadingSubjects(false);
            });

        return () => {
            current = false;
        };
    }, []);

    useEffect(() => {
        if (!subjectId || !selectedGrade) {
            return undefined;
        }

        let current = true;
        api.get(`/short-notes/subjects/${subjectId}`, {
            params: { gradeLevel: studentGrade, grade: selectedGrade, stream },
        })
            .then(({ data }) => {
                if (current) setChapters(data.chapters || []);
            })
            .catch((requestError) => {
                if (current) {
                    setChapters([]);
                    setError(getErrorMessage(requestError, 'Could not load notes for this subject.'));
                }
            })
            .finally(() => {
                if (current) setLoadingChapters(false);
            });

        return () => {
            current = false;
        };
    }, [selectedGrade, stream, studentGrade, subjectId]);

    useEffect(() => () => {
        if (previewPdf?.url) URL.revokeObjectURL(previewPdf.url);
    }, [previewPdf]);

    const openPdf = async (note) => {
        setLoadingPdf(true);
        setError('');
        try {
            const filename = `${(note.title || 'short-note').replace(/[^\w-]/g, '_')}.pdf`;
            const { data } = await api.get('/upload/download', {
                params: { url: note.pdfUrl, filename, inline: 'true' },
                responseType: 'blob',
            });
            if (await data.slice(0, 5).text() !== '%PDF-') {
                throw new Error('The attached file is not a valid PDF.');
            }
            setPreviewPdf({ title: note.title, url: URL.createObjectURL(data) });
        } catch (requestError) {
            setError(getErrorMessage(requestError, 'Could not open this PDF.'));
        } finally {
            setLoadingPdf(false);
        }
    };

    const changeSubject = (event) => {
        setSubjectId(event.target.value);
        setLoadingChapters(true);
        setError('');
    };

    const changeGrade = (grade) => {
        setSelectedGrade(grade);
        setLoadingChapters(true);
        setError('');
    };

    const hasNotes = chapters.some((chapter) => chapter.notes?.length);

    return (
        <main className="min-h-full px-4 pb-8 pt-6">
            <header className="mb-5 rounded-3xl bg-gradient-to-r from-[#0c3b6b] to-[#f26522] p-5 text-white shadow-lg">
                <div className="flex items-center gap-3">
                    <FaBookOpen className="h-6 w-6 shrink-0" />
                    <div>
                        <h1 className="text-xl font-black">Short Notes</h1>
                        <p className="mt-1 text-xs font-semibold text-white/85">
                            Study notes by grade, subject, and chapter
                        </p>
                    </div>
                </div>
            </header>

            {error && (
                <div role="alert" className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                </div>
            )}

            {studentGrade === 12 && (
                <section className="mb-4 rounded-2xl bg-white p-4 shadow-sm">
                    <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">Curriculum grade</p>
                    <div className="grid grid-cols-4 gap-2">
                        {[9, 10, 11, 12].map((grade) => (
                            <button
                                key={grade}
                                type="button"
                                onClick={() => changeGrade(grade)}
                                className={`rounded-xl px-2 py-2 text-sm font-extrabold ${
                                    selectedGrade === grade
                                        ? 'bg-[#0c3b6b] text-white'
                                        : 'bg-gray-100 text-gray-600'
                                }`}
                            >
                                Grade {grade}
                            </button>
                        ))}
                    </div>
                </section>
            )}

            <label className="mb-5 block rounded-2xl bg-white p-4 text-xs font-extrabold uppercase tracking-wide text-gray-500 shadow-sm">
                Subject
                <select
                    value={subjectId}
                    onChange={changeSubject}
                    disabled={loadingSubjects || !subjects.length}
                    className="mt-2 w-full rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm font-bold normal-case tracking-normal text-gray-800"
                >
                    {loadingSubjects && <option value="">Loading subjects...</option>}
                    {!loadingSubjects && !subjects.length && <option value="">No subjects available</option>}
                    {subjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>{subject.name}</option>
                    ))}
                </select>
                {stream && studentGrade === 12 && (
                    <span className="mt-2 block text-[11px] font-semibold normal-case tracking-normal text-gray-400">
                        {stream} stream
                    </span>
                )}
            </label>

            {loadingSubjects || loadingChapters ? (
                <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm font-semibold text-gray-500">
                    Loading notes...
                </p>
            ) : !hasNotes ? (
                <p className="rounded-2xl bg-white px-4 py-8 text-center text-sm text-gray-500">
                    No short notes are available for this subject and grade yet.
                </p>
            ) : (
                <div className="space-y-4">
                    {chapters.filter((chapter) => chapter.notes?.length).map((chapter) => (
                        <section key={chapter.id} className="rounded-2xl bg-white p-4 shadow-sm">
                            <h2 className="mb-3 border-b border-gray-100 pb-3 text-base font-black text-[#0c3b6b]">
                                {chapter.title}
                            </h2>
                            <div className="space-y-3">
                                {chapter.notes.map((note) => (
                                    <article key={note.id} className="rounded-xl border border-gray-100 bg-[#f8fafc] p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div>
                                                <h3 className="font-extrabold text-gray-800">{note.title}</h3>
                                                {note.subtitle && (
                                                    <p className="mt-1 text-xs font-semibold text-gray-500">{note.subtitle}</p>
                                                )}
                                            </div>
                                            {note.isPremium && !note.content && !note.pdfUrl && (
                                                <span className="flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-[10px] font-extrabold text-amber-800">
                                                    <FaLock /> Premium
                                                </span>
                                            )}
                                        </div>
                                        {note.description && (
                                            <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-gray-600">{note.description}</p>
                                        )}
                                        {note.content && (
                                            <div className="mt-3 border-t border-gray-100 pt-3">
                                                <RichNoteContent content={note.content} />
                                            </div>
                                        )}
                                        {note.pdfUrl && (
                                            <button
                                                type="button"
                                                onClick={() => openPdf(note)}
                                                disabled={loadingPdf}
                                                className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#0c3b6b] px-3 py-2.5 text-sm font-extrabold text-white disabled:opacity-60"
                                            >
                                                <FaFilePdf />
                                                {loadingPdf ? 'Opening PDF...' : 'View attached PDF'}
                                            </button>
                                        )}
                                    </article>
                                ))}
                            </div>
                        </section>
                    ))}
                </div>
            )}

            {previewPdf && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-3">
                    <section
                        role="dialog"
                        aria-modal="true"
                        aria-label={`PDF preview: ${previewPdf.title}`}
                        className="flex h-[88vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white"
                    >
                        <header className="flex items-center justify-between gap-3 border-b border-gray-200 px-4 py-3">
                            <h2 className="truncate font-extrabold text-[#0c3b6b]">{previewPdf.title}</h2>
                            <button
                                type="button"
                                onClick={() => setPreviewPdf(null)}
                                aria-label="Close PDF preview"
                                className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
                            >
                                <FaXmark />
                            </button>
                        </header>
                        <iframe title={previewPdf.title} src={previewPdf.url} className="min-h-0 w-full flex-1" />
                    </section>
                </div>
            )}
        </main>
    );
}
