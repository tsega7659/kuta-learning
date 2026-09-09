import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaCircleCheck, FaVolumeHigh, FaCirclePlay,
    FaFaceSmileBeam, FaFileLines, FaLock, FaArrowRight, FaTrophy, FaPause, FaPlay,
    FaFilePdf, FaDownload, FaSpinner
} from 'react-icons/fa6';
import api from '../../services/api';

const normalizeDocUrl = (url) => {
    if (!url) return '';
    let clean = url.trim();
    // Cloudinary PDF image URLs without extension convert multi-page PDF to single image.
    // Appending .pdf forces Cloudinary to deliver the true PDF document.
    if (clean.includes('cloudinary.com') && clean.includes('/image/upload/') && !clean.split('/').pop().includes('.')) {
        clean = `${clean}.pdf`;
    }
    return clean;
};

export default function LessonView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [locked, setLocked] = useState(false);
    const [nextLessonId, setNextLessonId] = useState(null);
    const [topicLessons, setTopicLessons] = useState([]);
    const [downloadingId, setDownloadingId] = useState(null);
    const [failedDownloadIds, setFailedDownloadIds] = useState(new Set());
    const audioRef = useRef(null);
    const [audioState, setAudioState] = useState({ url: '', status: 'idle' });

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${id}`);
                setLesson(res.data);
                setContents(res.data.contents || []);
                setCompleted(!!res.data.completed);
                setLocked(!!res.data.locked);
                setNextLessonId(res.data.nextLessonId || null);
                setTopicLessons(res.data.topicLessons || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    const handleDownloadDoc = async (url, title, itemId) => {
        const cleanUrl = normalizeDocUrl(url);
        if (!cleanUrl) return;

        setDownloadingId(itemId);

        try {
            // New uploads (raw type) are publicly accessible — open directly in browser.
            // No proxy needed; the browser will download the file natively.
            if (cleanUrl.includes('/raw/upload/')) {
                const a = document.createElement('a');
                a.href = cleanUrl;
                a.target = '_blank';
                a.rel = 'noreferrer';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                return;
            }

            // Old image-type PDFs — try backend proxy (may fail due to Cloudinary restrictions)
            let ext = cleanUrl.split('.').pop().split('?')[0].toLowerCase();
            if (!ext || ext.length > 5 || ext.includes('/')) ext = 'pdf';
            const safeTitle = (title || 'lesson-document')
                .replace(/[^a-zA-Z0-9_\-\s]/g, '')
                .trim()
                .replace(/\s+/g, '_');
            const filename = `${safeTitle}.${ext}`;

            const res = await api.get('/upload/download', {
                params: { url: cleanUrl, filename },
                responseType: 'blob',
            });

            // Clear any previous failure state for this item
            setFailedDownloadIds(prev => { const next = new Set(prev); next.delete(itemId); return next; });

            const blobUrl = window.URL.createObjectURL(res.data);
            const a = document.createElement('a');
            a.href = blobUrl;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download failed:', err);
            // Mark old image-type files as inaccessible
            setFailedDownloadIds(prev => new Set([...prev, itemId]));
        } finally {
            setDownloadingId(null);
        }
    };

    const handleComplete = async () => {
        if (locked) {
            alert('Complete the previous lesson before completing this lesson.');
            return;
        }

        setCompleting(true);
        try {
            await api.post(`/progress/lessons/${id}/complete`);
            setCompleted(true);
            setLocked(false);

            const res = await api.get(`/lessons/${id}`);
            setNextLessonId(res.data.nextLessonId || null);
            setTopicLessons(res.data.topicLessons || []);
            setLesson(res.data);
        } catch (err) {
            console.error(err);
            alert(err.response?.data?.message || 'Unable to mark the lesson complete.');
        } finally {
            setCompleting(false);
        }
    };

    const stopAudio = () => {
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
        setAudioState({ url: '', status: 'idle' });
    };

    const handleAudioToggle = (url) => {
        if (!audioRef.current) {
            const audio = new Audio(url);
            audio.onplay = () => setAudioState({ url, status: 'playing' });
            audio.onpause = () => setAudioState({ url, status: 'paused' });
            audio.onended = () => setAudioState({ url, status: 'ended' });
            audioRef.current = audio;
            audio.play();
            return;
        }

        if (audioRef.current.src === url) {
            if (audioRef.current.paused) {
                audioRef.current.play();
                setAudioState({ url, status: 'playing' });
            } else {
                audioRef.current.pause();
                setAudioState({ url, status: 'paused' });
            }
            return;
        }

        audioRef.current.pause();
        audioRef.current = new Audio(url);
        audioRef.current.onplay = () => setAudioState({ url, status: 'playing' });
        audioRef.current.onpause = () => setAudioState({ url, status: 'paused' });
        audioRef.current.onended = () => setAudioState({ url, status: 'ended' });
        audioRef.current.play();
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#f26522] border-t-transparent"></div>
            </div>
        );
    }

    const quizzes = lesson?.topic?.quizzes || lesson?.topic?.quiz || [];
    const quizAvailable = !!lesson?.topic?.quizAvailable;

    return (
        <div className="min-h-screen pb-32 font-sans text-gray-800">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] text-white pt-6 pb-6 px-4 rounded-b-[32px] shadow-[0_8px_25px_rgba(12,59,107,0.22)] sticky top-0 z-30">
                <div className="flex items-center justify-between gap-3">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition active:scale-95 shadow-sm shrink-0"
                    >
                        <FaChevronLeft className="w-5 h-5" />
                    </button>

                    <h1 className="text-[17px] font-black tracking-tight text-center truncate max-w-[220px]">
                        {lesson?.title || 'Lesson Content'}
                    </h1>

                    <div className="w-10" />
                </div>

                {/* Lesson Navigation Slider */}
                {topicLessons.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto mt-4 pb-1 no-scrollbar">
                        {topicLessons.map((tl, idx) => {
                            const isCurrent = tl.id === id;
                            const isDone = tl.completed;
                            const isLocked = tl.locked && !isCurrent;

                            return (
                                <button
                                    key={tl.id}
                                    type="button"
                                    disabled={isLocked}
                                    onClick={() => !isLocked && navigate(`/student/lessons/${tl.id}`)}
                                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${isCurrent
                                            ? 'bg-white text-[#f26522] shadow-md scale-105'
                                            : isDone
                                                ? 'bg-green-400/30 text-white border border-green-300/40'
                                                : isLocked
                                                    ? 'bg-white/10 text-white/50 cursor-not-allowed'
                                                    : 'bg-white/20 text-white hover:bg-white/30'
                                        }`}
                                >
                                    {isLocked ? <FaLock className="w-2.5 h-2.5" /> : isDone ? <FaCircleCheck className="w-3 h-3 text-green-300" /> : <span>{idx + 1}</span>}
                                    <span className="max-w-[90px] truncate">{tl.title || `Lesson ${idx + 1}`}</span>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="px-4 mt-5 space-y-4 max-w-2xl mx-auto">
                {/* Cover Image if available */}
                {lesson?.coverImage && (
                    <div className="w-full h-44 rounded-[28px] overflow-hidden shadow-soft border border-orange-100">
                        <img
                            src={lesson.coverImage}
                            alt={lesson.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                {/* Title and description */}
                {lesson?.description && (
                    <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-50 text-center">
                        <p className="text-[13px] font-bold text-[#1a2736]/85 leading-relaxed">
                            {lesson.description}
                        </p>
                    </div>
                )}

                {/* Contents list */}
                {contents.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-[28px] border border-orange-100 shadow-soft">
                        <FaFaceSmileBeam className="text-4xl text-[#f26522]/40 mx-auto mb-2" />
                        <p className="text-gray-400 font-bold text-sm">Lesson content coming soon!</p>
                    </div>
                ) : (
                    contents.map((item) => {
                        if (item.type === 'TEXT') return (
                            <div key={item.id} className="bg-white rounded-[28px] p-5 shadow-[0_4px_18px_rgba(12,59,107,0.06)] border border-orange-100/60">
                                {item.description && (
                                    <h3 className="font-black text-[#0c3b6b] text-[16px] mb-2">{item.description}</h3>
                                )}
                                <p className="text-[#1a2736]/90 font-medium text-[14px] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                            </div>
                        );

                        if (item.type === 'IMAGE') return (
                            <div key={item.id} className="bg-white rounded-[28px] p-3 shadow-[0_4px_18px_rgba(12,59,107,0.06)] border border-orange-100/60">
                                {item.description && (
                                    <h3 className="font-black text-[#0c3b6b] text-[15px] mb-2 px-2">{item.description}</h3>
                                )}
                                <img src={item.content} alt="Lesson Visual" className="w-full rounded-[20px] object-cover" />
                            </div>
                        );

                        if (item.type === 'VIDEO') return (
                            <div key={item.id} className="bg-white rounded-[28px] p-4 shadow-[0_4px_18px_rgba(12,59,107,0.06)] border border-orange-100/60">
                                <div className="flex items-center gap-2 mb-3">
                                    <FaCirclePlay className="w-5 h-5 text-[#f26522]" />
                                    <h3 className="font-black text-[#0c3b6b] text-[15px]">{item.description || 'Watch & Learn'}</h3>
                                </div>
                                <div className="w-full aspect-video bg-black rounded-[20px] overflow-hidden shadow-inner">
                                    <video src={item.content} controls className="w-full h-full" />
                                </div>
                            </div>
                        );

                        if (item.type === 'AUDIO') return (
                            <div key={item.id} className="bg-white rounded-[28px] p-5 shadow-[0_4px_18px_rgba(12,59,107,0.06)] border border-orange-100/60 text-center">
                                <h3 className="font-black text-[#0c3b6b] text-[16px] mb-3">{item.description || 'Listen & Repeat'}</h3>

                                <div className="flex items-center justify-center gap-3">
                                    <button
                                        onClick={() => handleAudioToggle(item.content)}
                                        className="w-16 h-16 bg-gradient-to-tr from-[#f26522] to-[#ff8533] rounded-full flex items-center justify-center text-white shadow-lg shadow-orange-300/50 hover:scale-105 active:scale-95 transition-transform"
                                    >
                                        {audioState.url === item.content && audioState.status === 'playing' ? (
                                            <FaPause className="w-6 h-6" />
                                        ) : (
                                            <FaPlay className="w-6 h-6 ml-0.5" />
                                        )}
                                    </button>
                                </div>

                                <p className="text-[12px] font-bold text-gray-400 mt-3">
                                    {audioState.url === item.content && audioState.status === 'playing' ? 'Playing now 🎵' : 'Tap to play audio'}
                                </p>
                            </div>
                        );

                        if (item.type === 'DOCUMENT') {
                            const docUrl = normalizeDocUrl(item.content);
                            const isDownloading = downloadingId === item.id;
                            const isFailed = failedDownloadIds.has(item.id);
                            return (
                                <div key={item.id} className={`bg-white rounded-[28px] p-4 sm:p-5 shadow-[0_4px_18px_rgba(12,59,107,0.06)] border transition ${
                                    isFailed ? 'border-amber-200 bg-amber-50/30' : 'border-orange-100/60 hover:border-orange-200'
                                }`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                        <div className="flex items-center gap-3.5 min-w-0 flex-1">
                                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shrink-0 ${
                                                isFailed ? 'bg-amber-50 border-amber-200' : 'bg-orange-50 border-orange-100'
                                            }`}>
                                                <FaFilePdf className={`text-2xl ${isFailed ? 'text-amber-500' : 'text-[#f26522]'}`} />
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-black text-[#0c3b6b] text-[15px] truncate block">
                                                    {item.description || 'Lesson Document / Material'}
                                                </span>
                                                {isFailed ? (
                                                    <span className="text-[11px] font-bold text-amber-600 block mt-0.5">
                                                        ⚠️ This file needs to be re-uploaded by your instructor
                                                    </span>
                                                ) : (
                                                    <span className="text-[12px] font-bold text-gray-400 block mt-0.5">
                                                        Downloadable Document Resource
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <button
                                            type="button"
                                            disabled={isDownloading || isFailed}
                                            onClick={() => handleDownloadDoc(docUrl, item.description || lesson.title, item.id)}
                                            className={`w-full sm:w-auto px-5 py-2.5 rounded-xl text-xs sm:text-sm font-black active:scale-95 transition-all shadow-sm flex items-center justify-center gap-2 shrink-0 ${
                                                isFailed
                                                    ? 'bg-amber-100 text-amber-700 cursor-not-allowed opacity-70'
                                                    : 'bg-[#f26522] text-white hover:bg-orange-600 cursor-pointer disabled:opacity-60'
                                            }`}
                                        >
                                            {isDownloading ? (
                                                <>
                                                    <FaSpinner className="w-4 h-4 animate-spin" />
                                                    <span>Downloading...</span>
                                                </>
                                            ) : isFailed ? (
                                                <span>Unavailable</span>
                                            ) : (
                                                <>
                                                    <FaDownload className="w-4 h-4" />
                                                    <span>Download</span>
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        }

                        return null;
                    })
                )}

                {/* Progress Completion Actions */}
                <div className="pt-2 space-y-3">
                    {locked ? (
                        <div className="flex items-center justify-center gap-2 bg-amber-50 text-amber-700 font-black py-4 rounded-full border border-amber-200 text-sm">
                            <FaLock className="w-4 h-4" />
                            <span>Complete the previous lesson first</span>
                        </div>
                    ) : completed ? (
                        <div className="flex items-center justify-center gap-2 bg-green-50 text-green-700 font-black py-3.5 rounded-full border border-green-200 text-sm">
                            <FaCircleCheck className="w-5 h-5 text-green-600" />
                            <span>Lesson Completed!</span>
                        </div>
                    ) : (
                        <button
                            onClick={handleComplete}
                            disabled={completing}
                            className="w-full bg-[#f26522] text-white font-black py-4 rounded-full hover:bg-orange-600 transition active:scale-95 shadow-[0_6px_20px_rgba(242,101,34,0.3)] text-base disabled:opacity-50"
                        >
                            {completing ? 'Saving Progress...' : 'Mark as Complete ⭐'}
                        </button>
                    )}

                    {completed && nextLessonId && (
                        <button
                            onClick={() => navigate(`/student/lessons/${nextLessonId}`)}
                            className="w-full bg-gradient-to-r from-[#0c3b6b] to-[#134980] text-white font-black py-4 rounded-full hover:bg-[#08294a] transition active:scale-95 shadow-[0_6px_20px_rgba(12,59,107,0.3)] text-base flex items-center justify-center gap-2"
                        >
                            <span>Next Lesson</span>
                            <FaArrowRight className="text-base" />
                        </button>
                    )}

                    {quizAvailable && quizzes.length > 0 && (
                        <button
                            onClick={() => navigate(`/student/quiz/${quizzes[0].id}`)}
                            className="w-full bg-gradient-to-r from-amber-400 to-[#f26522] text-white font-black py-4 rounded-full hover:from-amber-500 hover:to-orange-600 transition active:scale-95 shadow-[0_6px_20px_rgba(242,101,34,0.3)] text-base flex items-center justify-center gap-2"
                        >
                            <span>Take Chapter Quiz</span>
                            <FaTrophy className="text-lg text-white" />
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
