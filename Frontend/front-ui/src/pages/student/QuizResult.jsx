import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
    FaStar, FaCircleCheck, FaCircleXmark, FaInbox, FaTrophy,
    FaDumbbell, FaWandMagicSparkles, FaLightbulb, FaCheck,
} from 'react-icons/fa6';
import api from '../../services/api';

function Stars({ ratio }) {
    const filled = Math.round(ratio * 5);
    return (
        <div className="flex space-x-1">
            {[1, 2, 3, 4, 5].map(s => (
                <FaStar key={s} className={`w-8 h-8 ${s <= filled ? 'text-yellow-400' : 'text-gray-200'}`} />
            ))}
        </div>
    );
}

export default function QuizResult() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [attempt, setAttempt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Always fetch the full attempt (with review questions) from the backend.
    // The in-memory submit response is used as a quick fallback while loading.
    useEffect(() => {
        if (attemptId) {
            api.get(`/quiz-attempts/${attemptId}`)
                .then(res => setAttempt(res.data))
                .catch(err => {
                    // Fall back to the submit result if the fetch fails
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
            <div className="flex items-center justify-center min-h-screen bg-[#FFFDF9]">
                <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    if (error || !attempt) {
        return (
            <div className="min-h-screen bg-[#FFFDF9] flex flex-col items-center justify-center p-8 text-center">
                <FaInbox className="text-5xl text-gray-400 mx-auto mb-4" />
                <p className="font-bold text-gray-500">{error || 'No result found'}</p>
                <button onClick={() => navigate('/student/courses')} className="mt-6 kid-btn bg-kidOrange shadow-[0_6px_0_0_#c2410c]">
                    GO TO COURSES
                </button>
            </div>
        );
    }

    const percentage = attempt.percentage ?? Math.round((attempt.score / attempt.maxScore) * 100);
    const passed = attempt.passed ?? percentage >= (attempt.passingScore || 50);
    const correctAnswers = attempt.correctAnswers ?? attempt.score;
    const incorrectAnswers = attempt.incorrectAnswers ?? (attempt.maxScore - attempt.score);
    const isDirectLoad = !location.state?.result;

    return (
        <div className="bg-[#FFFDF9] min-h-screen px-5 flex flex-col items-center pt-16 pb-32">
            <h2 className="text-kidOrange font-bold text-sm tracking-widest uppercase mb-10 text-center">Kuta Learning</h2>

            {/* Trophy / Result */}
            <div className={`w-48 h-48 rounded-full border-8 border-white shadow-xl flex items-center justify-center mb-8 relative ${passed ? 'bg-yellow-100' : 'bg-orange-100'}`}>
                {passed ? <FaTrophy className="text-8xl text-yellow-500" /> : <FaDumbbell className="text-8xl text-orange-500" />}
                <div className="absolute top-0 right-0 animate-spin-slow"><FaWandMagicSparkles className="text-2xl text-yellow-400" /></div>
            </div>

            <h1 className="text-4xl font-extrabold text-kidText mb-2 text-center">
                {passed ? "You're a Star!" : "Keep Trying!"}
            </h1>
            <p className="text-gray-500 font-bold text-center px-4 mb-8">
                {passed
                    ? `Amazing job on "${attempt.quiz?.title || 'the quiz'}"!`
                    : `You need ${attempt.passingScore}% to pass. Let's practice and try again!`}
            </p>

            {/* Score */}
            <div className="flex flex-col items-center mb-8">
                <div className={`text-5xl font-black mb-3 border-b-4 pb-2 ${passed ? 'text-kidPrimary border-kidPrimary' : 'text-orange-500 border-orange-500'}`}>
                    {attempt.score}/{attempt.maxScore}
                </div>
                <Stars ratio={percentage / 100} />
                <p className="text-sm font-bold text-gray-400 mt-2">{percentage}%</p>

                {/* Pass/Fail badge */}
                <span className={`mt-4 px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-1.5 ${passed ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-500'}`}>
                    {passed ? <><FaCircleCheck /> PASSED</> : <><FaCircleXmark /> NOT PASSED</>}
                </span>
            </div>

            {/* Summary stats */}
            <div className="w-full grid grid-cols-3 gap-3 mb-8">
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="text-2xl font-black text-green-500">{correctAnswers}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Correct</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="text-2xl font-black text-red-400">{incorrectAnswers}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Incorrect</p>
                </div>
                <div className="bg-white rounded-2xl p-4 text-center shadow-sm border border-gray-100">
                    <p className="text-2xl font-black text-kidOrange">{percentage}%</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Score</p>
                </div>
            </div>

            {/* Review incorrect answers */}
            {attempt.questions && attempt.questions.length > 0 && (
                <div className="w-full space-y-4 mb-8">
                    <h3 className="font-black text-kidText text-lg">Review</h3>
                    {attempt.questions.map((q, idx) => {
                        const answer = q.answer;
                        const wasCorrect = answer?.isCorrect;
                        const correctOption = q.correctOptions?.[0];
                        const studentOption = q.options?.find(o => o.id === answer?.selectedOptionId);

                        return (
                            <div key={q.id} className={`bg-white rounded-3xl p-5 border shadow-sm ${wasCorrect ? 'border-green-100' : 'border-red-100'}`}>
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 shrink-0 ${wasCorrect ? 'text-green-500' : 'text-red-400'}`}>
                                        {wasCorrect ? <FaCircleCheck className="w-6 h-6" /> : <FaCircleXmark className="w-6 h-6" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Question {idx + 1}</p>
                                        <p className="font-bold text-kidText text-sm mb-2">{q.text}</p>
                                        {wasCorrect ? (
                                            <p className="text-xs font-bold text-green-600 flex items-center gap-1"><FaCheck className="w-3 h-3" /> Correct!</p>
                                        ) : (
                                            <div className="space-y-1 text-xs font-medium">
                                                {(() => {
                                                    const type = q.type || 'SINGLE_CHOICE';
                                                    let yourAnswer = studentOption?.text || answer?.textResponse || 'Not answered';
                                                    let corrAnswer = correctOption?.text || '—';

                                                    if (type === 'MULTIPLE_CHOICE') {
                                                        const selectedIds = answer?.selectedOptionIds || [];
                                                        const selOpts = (q.options || []).filter(o => selectedIds.includes(o.id)).map(o => o.text);
                                                        yourAnswer = selOpts.length ? selOpts.join(', ') : 'Not answered';
                                                        corrAnswer = (q.correctOptions || []).map(o => o.text).join(', ');
                                                    } else if (type === 'MATCHING') {
                                                        yourAnswer = 'Incorrect matching pair(s)';
                                                        corrAnswer = (q.options || []).map(o => `${o.text} → ${o.imageUrl?.replace('match::', '')}`).join(' | ');
                                                    } else if (type === 'COLOR_MATCH') {
                                                        yourAnswer = studentOption?.text || 'Selected Color';
                                                    }

                                                    return (
                                                        <>
                                                            <p className="text-red-500">
                                                                Your answer: <span className="font-bold">{yourAnswer}</span>
                                                            </p>
                                                            <p className="text-green-600">
                                                                Correct answer: <span className="font-bold">{corrAnswer}</span>
                                                            </p>
                                                        </>
                                                    );
                                                })()}
                                            </div>
                                        )}
                                        {q.explanation && !wasCorrect && (
                                            <p className="text-xs text-gray-500 font-medium mt-2 italic flex items-start gap-1"><FaLightbulb className="w-3 h-3 mt-0.5 shrink-0" /> {q.explanation}</p>
                                        )}
                                        {q.explanation && wasCorrect && (
                                            <p className="text-xs text-gray-400 font-medium mt-2 italic flex items-start gap-1"><FaLightbulb className="w-3 h-3 mt-0.5 shrink-0" /> {q.explanation}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div className="w-full space-y-4">
                <button
                    onClick={() => navigate('/student/courses')}
                    className="kid-btn bg-kidPrimary shadow-[0_6px_0_0_#2563eb]"
                >
                    NEXT LESSON
                </button>
                <button
                    onClick={() => navigate(-1)}
                    className="kid-btn border-4 border-kidPrimary bg-white text-kidPrimary shadow-[0_6px_0_0_#2563eb] hover:bg-gray-50"
                >
                    GO BACK
                </button>
            </div>
        </div>
    );
}
