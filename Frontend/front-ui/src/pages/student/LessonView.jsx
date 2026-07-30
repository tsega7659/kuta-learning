import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, CheckCircleIcon, SpeakerWaveIcon, PlayCircleIcon } from '@heroicons/react/24/solid';
import api from '../../services/api';

export default function LessonView() {
    const { id } = useParams();
    const navigate = useNavigate();
    const [lesson, setLesson] = useState(null);
    const [contents, setContents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        const fetchLesson = async () => {
            try {
                const res = await api.get(`/lessons/${id}`);
                setLesson(res.data);
                setContents(res.data.contents || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchLesson();
    }, [id]);

    const handleComplete = async () => {
        setCompleting(true);
        try {
            await api.post(`/progress/lessons/${id}/complete`);
            setCompleted(true);
        } catch (err) {
            console.error(err);
        } finally {
            setCompleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh] bg-gradient-to-b from-blue-100 via-white to-orange-100">
                <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-b from-blue-100 via-white to-orange-50 min-h-screen pb-32">

            {/* Header */}
            <div className="flex justify-between items-center px-5 pt-10 pb-4">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-white/80 p-2.5 rounded-full shadow-sm border border-gray-100 hover:bg-white transition"
                >
                    <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
                </button>
                <span className="text-[#a54c15] font-black text-[13px] tracking-widest uppercase">Kuta Learning</span>
                <div className="w-10" />
            </div>

            {/* Cover image (if exists) */}
            {lesson?.coverImage && (
                <div className="px-5 mb-6">
                    <img
                        src={lesson.coverImage}
                        alt="Lesson cover"
                        className="w-full h-[180px] object-cover rounded-[28px] shadow-md"
                    />
                </div>
            )}

            {/* Lesson Title */}
            <div className="px-6 mb-8 text-center">
                <h1 className="text-[28px] font-black text-gray-900 leading-tight mb-2">{lesson?.title || 'Lesson'}</h1>
                {lesson?.description && (
                    <p className="text-gray-500 font-medium text-[14px] leading-relaxed">{lesson.description}</p>
                )}
            </div>

            {/* Content blocks */}
            <div className="px-5 space-y-5 mb-10">
                {contents.length === 0 && (
                    <div className="text-center p-10 bg-white/70 rounded-3xl border border-gray-100">
                        <span className="text-4xl block mb-2">🎈</span>
                        <p className="text-gray-400 font-bold">Lesson content coming soon!</p>
                    </div>
                )}

                {contents.map((item) => {
                    if (item.type === 'TEXT') return (
                        <div key={item.id} className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
                            {item.description && (
                                <h3 className="font-extrabold text-gray-900 text-[17px] mb-3">{item.description}</h3>
                            )}
                            <p className="text-gray-700 font-medium text-[15px] leading-relaxed whitespace-pre-wrap">{item.content}</p>
                        </div>
                    );

                    if (item.type === 'IMAGE') return (
                        <div key={item.id} className="bg-white rounded-[28px] p-3 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50">
                            {item.description && (
                                <h3 className="font-extrabold text-gray-900 text-[15px] mb-3 px-2">{item.description}</h3>
                            )}
                            <img src={item.content} alt="Lesson Visual" className="w-full rounded-[20px] object-cover" />
                        </div>
                    );

                    if (item.type === 'VIDEO') return (
                        <div key={item.id} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-[28px] p-4 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-blue-100">
                            <div className="flex items-center gap-2 mb-3 px-1">
                                <PlayCircleIcon className="w-5 h-5 text-blue-600" />
                                <h3 className="font-extrabold text-blue-800 text-[15px]">{item.description || 'Watch & Learn'}</h3>
                            </div>
                            <div className="w-full aspect-video bg-black rounded-[18px] overflow-hidden shadow-md">
                                <video src={item.content} controls className="w-full h-full" />
                            </div>
                        </div>
                    );

                    if (item.type === 'AUDIO') return (
                        <div key={item.id} className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-blue-50 text-center">
                            <h3 className="font-extrabold text-gray-900 text-[17px] mb-4">{item.description || 'Listen'}</h3>
                            <button
                                onClick={() => new Audio(item.content).play()}
                                className="w-20 h-20 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg shadow-blue-300/40"
                            >
                                <SpeakerWaveIcon className="w-10 h-10 text-white" />
                            </button>
                            <p className="text-gray-500 font-medium text-[13px] mt-3">Tap to play</p>
                        </div>
                    );

                    if (item.type === 'DOCUMENT') return (
                        <div key={item.id} className="bg-white rounded-[28px] p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)] border border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center">
                                    <span className="text-2xl">📄</span>
                                </div>
                                <span className="font-bold text-gray-800 text-[14px]">{item.description || 'Lesson Material'}</span>
                            </div>
                            <a
                                href={item.content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[13px] font-bold bg-[#f26c24] text-white px-4 py-2 rounded-full hover:bg-[#e05b13] transition shadow-sm"
                            >
                                Open
                            </a>
                        </div>
                    );

                    return null;
                })}
            </div>

            {/* Action buttons */}
            <div className="px-5 space-y-3">
                {completed ? (
                    <div className="flex items-center justify-center gap-2 bg-green-50 text-green-600 font-bold py-4 rounded-full border-2 border-green-100">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span>Lesson Completed! 🎉</span>
                    </div>
                ) : (
                    <button
                        onClick={handleComplete}
                        disabled={completing}
                        className="w-full bg-[#f26c24] text-white font-bold py-4 rounded-full hover:bg-[#e05b13] transition active:scale-95 shadow-lg shadow-orange-400/30 text-[16px] disabled:opacity-50"
                    >
                        {completing ? 'Saving...' : '✅ Mark as Complete'}
                    </button>
                )}

                <button
                    onClick={() => navigate('/student/quiz/color')}
                    className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold py-4 rounded-full hover:from-blue-600 hover:to-blue-700 transition active:scale-95 shadow-lg shadow-blue-400/30 text-[16px] flex items-center justify-center gap-2"
                >
                    <span>Take Quiz</span>
                    <span className="text-xl">✨</span>
                </button>
            </div>
        </div>
    );
}
