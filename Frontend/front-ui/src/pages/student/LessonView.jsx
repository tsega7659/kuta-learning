import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaCircleCheck, FaVolumeHigh, FaCirclePlay,
    FaFaceSmileBeam, FaFileLines, FaLock, FaArrowRight, FaTrophy, FaPause, FaPlay
} from 'react-icons/fa6';
import api from '../../services/api';

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

    const quizAvailable = lesson?.topic?.quizAvailable;
    const quizzes = lesson?.topic?.quizzes || lesson?.topic?.quiz || [];

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[70vh]">
                <div className="w-12 h-12 border-4 border-[#f26522] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-32">
            {/* Top Bar Header with Kuta Navy & Orange */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] text-white pt-6 pb-5 px-4 rounded-b-[32px] shadow-[0_8px_20px_rgba(12,59,107,0.22)]">
                <div className="flex items-center justify-between">
                    <button
                        onClick={() => navigate(-1)}
                        className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/30 transition active:scale-95 shadow-sm"
                    >
                        <FaChevronLeft className="w-5 h-5" />
                    </button>

                    <h1 className="text-[18px] font-black tracking-tight text-center truncate max-w-[220px]">
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
                                    className={`shrink-0 flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-black transition-all ${
                                        isCurrent
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

            <div className="px-4 mt-5 space-y-4">
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

                        if (item.type === 'DOCUMENT') return (
                            <div key={item.id} className="bg-white rounded-[28px] p-4 shadow-[0_4px_18px_rgba(12,59,107,0.06)] border border-orange-100/60 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-11 h-11 bg-orange-50 rounded-2xl flex items-center justify-center border border-orange-100">
                                        <FaFileLines className="text-xl text-[#f26522]" />
                                    </div>
                                    <span className="font-black text-[#0c3b6b] text-[13px]">{item.description || 'Lesson Material'}</span>
                                </div>
                                <a
                                    href={item.content}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs font-black bg-[#f26522] text-white px-4 py-2 rounded-full hover:bg-orange-600 transition shadow-sm"
                                >
                                    Open
                                </a>
                            </div>
                        );

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


