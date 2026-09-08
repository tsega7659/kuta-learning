import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    FaStar, FaCircleCheck, FaCircleXmark, FaInbox, FaTrophy,
    FaRotateRight, FaArrowRight, FaLightbulb, FaCheck, FaChevronDown,
    FaChevronUp
} from 'react-icons/fa6';
import api from '../../services/api';

export default function QuizResult() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showReview, setShowReview] = useState(false);

    useEffect(() => {
        if (attemptId) {
            api.get(`/quiz-attempts/${attemptId}`)
                .then(res => setAttempt(res.data))
                .catch(err => {
                    if (location.state?.result) {
                        setAttempt(location.state.result);
                    } else {
                        setError(err.response?.data?.message || 'Failed to load result');
                    }
                })
                .finally(() => setLoading(false));
        } else if (location.state?.result) {
            setAttempt(location.state.result);
            setLoading(false);
        } else {
            setLoading(false);
        }
    }, [attemptId, location.state]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-[#f7f5f0]">
                <div className="w-12 h-12 border-4 border-[#f26522] border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !attempt) {
        return (
            <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-8 text-center">
                <FaInbox className="text-5xl text-gray-400 mx-auto mb-4" />
                <p className="font-bold text-gray-500">{error || 'No result found'}</p>
                <button
                    onClick={() => navigate('/student/courses')}
                    className="mt-6 bg-[#f26522] text-white font-black px-6 py-3 rounded-full shadow-[0_4px_0_0_#b54611]"
                >
                    GO TO COURSES
                </button>
            </div>
        );
    }

    const percentage = attempt.percentage ?? Math.round((attempt.score / attempt.maxScore) * 100);
    const passed = attempt.passed ?? percentage >= (attempt.passingScore || 50);
    const correctAnswers = attempt.correctAnswers ?? attempt.score;
    const incorrectAnswers = attempt.incorrectAnswers ?? (attempt.maxScore - attempt.score);
    const quizId = attempt.quizId || attempt.quiz?.id;

    // Headings and subtitles based on performance (matching screenshot 4)
    let titleText = 'Outstanding! ⭐';
    let subtitleText = "Perfect score! You're amazing!";
    if (percentage < 50) {
        titleText = 'Keep Trying! 💪';
        subtitleText = "Practice makes perfect. You can do it!";
    } else if (percentage < 80) {
        titleText = 'Great Job! 🌟';
        subtitleText = 'You did well! Keep up the momentum!';
    } else if (percentage < 100) {
        titleText = 'Super Star! 🚀';
        subtitleText = 'Almost a perfect score! Fantastic!';
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-[#fff6f0] via-[#f7f5f0] to-[#edf4fc] px-4 pt-8 pb-32 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Confetti particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
                <div className="absolute top-6 left-8 text-2xl animate-bounce-subtle">🎊</div>
                <div className="absolute top-12 right-10 text-3xl animate-bounce-subtle delay-100">🎉</div>
                <div className="absolute top-1/4 left-5 text-xl text-yellow-400 animate-pulse">⭐</div>
                <div className="absolute top-1/3 right-8 text-2xl text-orange-400 animate-pulse delay-200">✨</div>
                <div className="absolute bottom-1/4 left-10 text-xl text-blue-400">🔷</div>
                <div className="absolute bottom-1/3 right-6 text-xl text-red-400">🔶</div>
            </div>

            {/* Top Brand Tag */}
            <div className="mb-4 text-center z-10">
                <span className="text-[11px] font-black tracking-widest text-[#f26522] uppercase bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full shadow-sm border border-orange-100">
                    Kuta Learning Institute
                </span>
            </div>

            {/* Floating Main Result Card (Screenshot 4) */}
            <div className="w-full max-w-sm bg-white rounded-[36px] p-6 shadow-[0_12px_40px_rgba(12,59,107,0.12)] border border-orange-100/80 text-center relative z-10 animate-spring-up">
                {/* Trophy in glowing circle */}
                <div className="w-32 h-32 rounded-full bg-gradient-to-b from-amber-100 to-yellow-50 border-4 border-amber-200 shadow-inner flex items-center justify-center mx-auto mb-5 relative">
                    <FaTrophy className="text-6xl text-amber-500 drop-shadow-md animate-bounce-subtle" />
                    <div className="absolute -top-1 -right-1 bg-yellow-400 text-white rounded-full p-1.5 shadow-sm">
                        <FaStar className="w-4 h-4 fill-white" />
                    </div>
                </div>

                {/* Celebratory Heading */}
                <h1 className="text-3xl font-black text-[#0c3b6b] mb-1.5 leading-tight">
                    {titleText}
                </h1>
                <p className="text-xs font-bold text-gray-500 mb-5 px-2">
                    {subtitleText}
                </p>

                {/* Score Pill Badge (Screenshot 4) */}
                <div className="inline-flex items-center gap-2 bg-[#f4effc] border border-[#e0d3f8] px-6 py-2.5 rounded-full mb-6 shadow-sm">
                    <FaStar className="text-amber-500 w-4 h-4 fill-amber-500" />
                    <span className="text-base font-black text-[#6d28d9]">
                        {attempt.score} / {attempt.maxScore} points
                    </span>
                </div>

                {/* Quick stats grid */}
                <div className="grid grid-cols-3 gap-2 mb-6">
                    <div className="bg-green-50/70 border border-green-100 rounded-2xl p-2.5 text-center">
                        <p className="text-lg font-black text-green-600">{correctAnswers}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Correct</p>
                    </div>
                    <div className="bg-red-50/70 border border-red-100 rounded-2xl p-2.5 text-center">
                        <p className="text-lg font-black text-red-500">{incorrectAnswers}</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Incorrect</p>
                    </div>
                    <div className="bg-orange-50/70 border border-orange-100 rounded-2xl p-2.5 text-center">
                        <p className="text-lg font-black text-[#f26522]">{percentage}%</p>
                        <p className="text-[10px] font-bold text-gray-500 uppercase">Accuracy</p>
                    </div>
                </div>

                {/* Bottom Action Controls (Screenshot 4) */}
                <div className="flex items-center gap-3">
                    {/* Retry Button */}
                    <button
                        onClick={() => {
                            if (quizId) navigate(`/student/quiz/${quizId}`);
                            else navigate(-1);
                        }}
                        title="Retry Quiz"
                        className="w-14 h-14 rounded-2xl bg-white border-2 border-gray-200 shadow-[0_4px_0_0_#d1d5db] active:translate-y-1 active:shadow-none transition flex items-center justify-center text-gray-600 hover:text-[#f26522] hover:border-orange-200 shrink-0"
                    >
                        <FaRotateRight className="w-5 h-5" />
                    </button>

                    {/* Next / Continue Primary Button */}
                    <button
                        onClick={() => navigate('/student/courses')}
                        className="flex-1 bg-gradient-to-r from-[#8b5cf6] to-[#7c3aed] text-white font-black py-4 px-6 rounded-2xl shadow-[0_4px_0_0_#5b21b6] active:translate-y-1 active:shadow-none transition flex items-center justify-center gap-2 text-base"
                    >
                        Next <FaArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Collapsible Question Review */}
            {attempt.questions && attempt.questions.length > 0 && (
                <div className="w-full max-w-sm mt-5 z-10">
                    <button
                        onClick={() => setShowReview(!showReview)}
                        className="w-full bg-white rounded-2xl p-3.5 shadow-sm border border-orange-100 flex items-center justify-between font-black text-xs text-[#0c3b6b] hover:bg-orange-50 transition"
                    >
                        <span>📝 Review Answers ({attempt.questions.length} questions)</span>
                        {showReview ? <FaChevronUp className="w-3.5 h-3.5" /> : <FaChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showReview && (
                        <div className="mt-3 space-y-3">
                            {attempt.questions.map((q, idx) => {
                                const answer = q.answer;
                                const wasCorrect = answer?.isCorrect;
                                const correctOption = q.correctOptions?.[0];
                                const studentOption = q.options?.find(o => o.id === answer?.selectedOptionId);

                                return (
                                    <div
                                        key={q.id || idx}
                                        className={`bg-white rounded-2xl p-4 border shadow-sm ${
                                            wasCorrect ? 'border-green-200 bg-green-50/30' : 'border-red-200 bg-red-50/30'
                                        }`}
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <div className={`mt-0.5 shrink-0 ${wasCorrect ? 'text-green-500' : 'text-red-400'}`}>
                                                {wasCorrect ? <FaCircleCheck className="w-5 h-5" /> : <FaCircleXmark className="w-5 h-5" />}
                                            </div>
                                            <div className="flex-1 min-w-0 text-left">
                                                <p className="text-[10px] font-black text-gray-400 uppercase mb-0.5">Q{idx + 1}</p>
                                                <p className="font-bold text-[#0c3b6b] text-xs mb-1.5">{q.text}</p>
                                                {wasCorrect ? (
                                                    <p className="text-[11px] font-black text-green-600 flex items-center gap-1">
                                                        <FaCheck className="w-3 h-3" /> Correct!
                                                    </p>
                                                ) : (
                                                    <div className="text-[11px] space-y-0.5 font-medium">
                                                        <p className="text-red-500">
                                                            Your answer: <span className="font-bold">{studentOption?.text || answer?.textResponse || 'Not answered'}</span>
                                                        </p>
                                                        <p className="text-green-600">
                                                            Correct: <span className="font-bold">{correctOption?.text || '—'}</span>
                                                        </p>
                                                    </div>
                                                )}
                                                {q.explanation && (
                                                    <p className="text-[10px] text-gray-500 font-medium mt-1.5 italic flex items-start gap-1">
                                                        <FaLightbulb className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" /> {q.explanation}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
