import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaChevronRight, FaCircleCheck, FaVolumeHigh,
    FaCircleDot, FaSquareCheck, FaPalette, FaFont, FaLink, FaPencil,
    FaHandPointer, FaArrowRight, FaCheck, FaCircleQuestion, FaInbox,
    FaCircleXmark,
} from 'react-icons/fa6';
import api from '../../services/api';

const TYPE_ICONS = {
    SINGLE_CHOICE: FaCircleDot,
    MULTIPLE_CHOICE: FaSquareCheck,
    TRUE_FALSE: FaCircleCheck,
    COLOR_MATCH: FaPalette,
    WORD_ORDER: FaFont,
    MATCHING: FaLink,
    FILL_IN_BLANK: FaPencil,
    DRAG_AND_DROP: FaHandPointer,
};

// Shuffle array helper
function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}

// ─────────────────────────────────────────────────────────────────────────────
// MATCHING RENDERER
// Two columns: left = questions (fixed order), right = answers (shuffled)
// Student taps a left item then a right item to form a pair.
// ─────────────────────────────────────────────────────────────────────────────
function MatchingQuestion({ question, answer, setAnswer }) {
    // Parse pairs from options: text = question, imageUrl = "match::<answer>"
    const pairs = question.options.map(o => ({
        id: o.id,
        qText: o.text,
        aText: o.imageUrl?.startsWith('match::') ? o.imageUrl.replace('match::', '') : o.imageUrl || '',
    }));

    const shuffledAnswers = useMemo(() => shuffle(pairs.map(p => ({ id: p.id, text: p.aText }))), [question.id]);

    // selections: { [leftId]: rightId }
    const selections = answer?.matchSelections || {};
    const [activeLeft, setActiveLeft] = useState(null);

    const handleLeftTap = (id) => {
        setActiveLeft(prev => prev === id ? null : id);
    };

    const handleRightTap = (rightId) => {
        if (!activeLeft) return;
        const next = { ...selections, [activeLeft]: rightId };
        setActiveLeft(null);
        setAnswer({ matchSelections: next });
    };

    const clearPair = (leftId) => {
        const next = { ...selections };
        delete next[leftId];
        setAnswer({ matchSelections: next });
    };

    const usedRightIds = new Set(Object.values(selections));

    return (
        <div>
            <p className="text-xs font-bold text-blue-500 mb-4">
                Tap a question on the left, then its matching answer on the right <FaLink className="inline w-3 h-3" />
            </p>
            <div className="grid grid-cols-2 gap-3">
                {/* Left column */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-1">Questions</p>
                    {pairs.map(p => {
                        const matched = selections[p.id];
                        const matchedText = shuffledAnswers.find(a => a.id === matched)?.text;
                        const isActive = activeLeft === p.id;
                        return (
                            <div key={p.id} className="relative">
                                <button
                                    onClick={() => matched ? clearPair(p.id) : handleLeftTap(p.id)}
                                    className={`w-full p-3 rounded-2xl border-2 text-left text-sm font-bold transition-all active:scale-95 ${matched ? 'border-green-400 bg-green-50 text-green-800' :
                                        isActive ? 'border-kidPrimary bg-blue-50 text-kidPrimary shadow-md scale-[1.02]' :
                                            'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                        }`}
                                >
                                    {p.qText}
                                    {matched && (
                                        <span className="block text-[10px] font-bold text-green-600 mt-0.5">
                                            <FaArrowRight className="inline w-3 h-3 mr-1" /> {matchedText}
                                        </span>
                                    )}
                                </button>
                                {isActive && (
                                    <FaArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 text-kidPrimary w-4 h-4" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right column — shuffled answers */}
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest text-center mb-1">Answers</p>
                    {shuffledAnswers.map(ans => {
                        const isUsed = usedRightIds.has(ans.id);
                        const isTarget = activeLeft && !isUsed;
                        return (
                            <button
                                key={ans.id}
                                onClick={() => !isUsed && handleRightTap(ans.id)}
                                disabled={isUsed}
                                className={`w-full p-3 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 ${isUsed ? 'border-green-300 bg-green-50/60 text-green-700 opacity-60' :
                                    isTarget ? 'border-orange-300 bg-orange-50 text-orange-700 hover:border-orange-400' :
                                        'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {ans.text}
                            </button>
                        );
                    })}
                </div>
            </div>

            {Object.keys(selections).length === pairs.length && (
                <div className="mt-4 text-center text-xs font-bold text-green-600 bg-green-50 py-2 rounded-2xl flex items-center justify-center gap-1.5">
                    <FaCircleCheck className="w-3.5 h-3.5" /> All matched! Tap any left item to unlink.
                </div>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// WORD ORDER / DRAG & DROP RENDERER
// Shows scrambled letter tiles; student taps to build the word in order.
// ─────────────────────────────────────────────────────────────────────────────
function WordOrderQuestion({ question, answer, setAnswer }) {
    const correctWord = question.options[0]?.text || '';
    const shuffledLetters = useMemo(() => shuffle(
        correctWord.split('').map((ch, i) => ({ ch, uid: `${i}-${ch}` }))
    ), [question.id]);

    const chosen = answer?.letterOrder || []; // array of uid

    const addLetter = (uid) => {
        if (chosen.includes(uid)) return;
        const next = [...chosen, uid];
        setAnswer({
            letterOrder: next,
            textResponse: next.map(u => shuffledLetters.find(l => l.uid === u)?.ch || '').join('')
        });
    };

    const removeLetter = (uid) => {
        const next = chosen.filter(u => u !== uid);
        setAnswer({
            letterOrder: next,
            textResponse: next.map(u => shuffledLetters.find(l => l.uid === u)?.ch || '').join('')
        });
    };

    const clearAll = () => setAnswer({ letterOrder: [], textResponse: '' });

    return (
        <div>
            <p className="text-xs font-bold text-orange-500 mb-3 flex items-center gap-1.5"><FaFont className="w-3.5 h-3.5" /> Tap letters to spell the correct word</p>

            {/* Answer tray */}
            <div className="mb-4 min-h-[52px] bg-blue-50 border-2 border-dashed border-blue-200 rounded-2xl p-3 flex flex-wrap gap-2 items-center">
                {chosen.length === 0 ? (
                    <span className="text-gray-400 text-xs font-bold">Tap letters below to build the word…</span>
                ) : (
                    chosen.map(uid => {
                        const letter = shuffledLetters.find(l => l.uid === uid);
                        return (
                            <button key={uid} onClick={() => removeLetter(uid)}
                                className="w-10 h-10 bg-kidPrimary text-white font-black text-lg rounded-xl shadow active:scale-90 transition-all border-b-4 border-blue-700">
                                {letter?.ch}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Letter pool */}
            <div className="flex flex-wrap gap-2 justify-center">
                {shuffledLetters.map(l => {
                    const used = chosen.includes(l.uid);
                    return (
                        <button key={l.uid} onClick={() => !used && addLetter(l.uid)} disabled={used}
                            className={`w-10 h-10 font-black text-lg rounded-xl transition-all border-b-4 active:scale-90 ${used
                                ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-50'
                                : 'bg-kidOrange text-white border-orange-700 hover:scale-105 shadow'
                                }`}>
                            {l.ch}
                        </button>
                    );
                })}
            </div>

            {chosen.length > 0 && (
                <button onClick={clearAll} className="mt-3 text-xs font-bold text-red-400 hover:text-red-600 underline">
                    Clear all
                </button>
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// COLOR MATCH RENDERER — image-aware
// ─────────────────────────────────────────────────────────────────────────────
function ColorMatchQuestion({ question, answers, onSelect }) {
    const selected = answers?.selectedOptionId;
    return (
        <div className="grid grid-cols-2 gap-3">
            {question.options.map(opt => {
                const isSel = selected === opt.id;
                const hasImg = opt.imageUrl && !opt.imageUrl.startsWith('match::');
                return (
                    <button key={opt.id} onClick={() => onSelect(question, opt.id)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all active:scale-95 ${isSel ? 'border-kidPrimary bg-blue-50 shadow-md' : 'border-gray-200 bg-white hover:border-gray-300'
                            }`}>
                        {hasImg ? (
                            <img src={opt.imageUrl} alt="" className="w-full h-20 object-cover rounded-xl" />
                        ) : (
                            <FaPalette className="text-4xl text-orange-400" />
                        )}
                        <span className={`font-bold text-sm ${isSel ? 'text-kidPrimary' : 'text-gray-700'}`}>
                            {opt.text}
                        </span>
                        {isSel && <span className="text-kidPrimary font-black text-xs flex items-center gap-1"><FaCheck className="w-3 h-3" /> Selected</span>}
                    </button>
                );
            })}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN QUIZ PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function PracticeSession() {
    const { attemptId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const TOTAL_SECONDS = 10 * 60; // 10-minute exam timer
    const [timeLeft, setTimeLeft] = useState(TOTAL_SECONDS);
    const timerRef = useRef(null);
    const handleSubmitRef = useRef(null);

    useEffect(() => {
        api.get(`/practice/attempts/${attemptId}`)
            .then(res => setQuiz(res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to load module'))
            .finally(() => setLoading(false));
    }, [attemptId]);

    // Start countdown after questions load
    useEffect(() => {
        if (!quiz || loading) return;
        timerRef.current = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    handleSubmitRef.current?.();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [quiz, loading]);

    const questions = quiz?.questions || [];

    const setAnswer = useCallback((questionId, patch) => {
        setAnswers(prev => ({ ...prev, [questionId]: { ...prev[questionId], ...patch } }));
    }, []);

    const handleSelectOption = (q, optionId) => {
        if (q.type === 'MULTIPLE_CHOICE') {
            const cur = answers[q.id]?.selectedOptionIds || [];
            const exists = cur.includes(optionId);
            setAnswer(q.id, { selectedOptionIds: exists ? cur.filter(id => id !== optionId) : [...cur, optionId] });
        } else {
            setAnswer(q.id, { selectedOptionId: optionId });
        }
    };

    const isAnswered = (q) => {
        const a = answers[q.id];
        if (!a) return false;
        if (q.type === 'MULTIPLE_CHOICE') return (a.selectedOptionIds || []).length > 0;
        if (q.type === 'WORD_ORDER' || q.type === 'DRAG_AND_DROP') return !!(a.textResponse);
        if (q.type === 'FILL_IN_BLANK') return !!(a.textResponse);
        if (q.type === 'MATCHING') {
            const pairs = q.options.length;
            return Object.keys(a.matchSelections || {}).length === pairs;
        }
        return !!a.selectedOptionId;
    };

    const handleSubmit = async () => {
        clearInterval(timerRef.current);
        setSubmitting(true);
        try {
            const payload = questions.map(q => {
                const a = answers[q.id] || {};
                let selectedOptionIds = a.selectedOptionIds || [];
                let textResponse = a.textResponse || null;

                // For MATCHING, encode selections as JSON string for submission
                if (q.type === 'MATCHING') {
                    textResponse = JSON.stringify(a.matchSelections || {});
                }

                return {
                    questionId: q.id,
                    selectedOptionId: a.selectedOptionId || null,
                    selectedOptionIds,
                    textResponse,
                };
            });
            const res = await api.post(`/practice/attempts/${attemptId}/submit`, { answers: payload });
            navigate(`/student/practice/result/${res.data.id}`, { state: { result: res.data } });
        } catch (err) {
            if (err.response?.status === 400) {
                navigate(`/student/practice/result/${attemptId}`);
            } else {
                alert('Failed to submit quiz. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Keep a ref to handleSubmit so the timer effect can call it
    useEffect(() => { handleSubmitRef.current = handleSubmit; });

    if (loading) return (
        <div className="flex items-center justify-center min-h-[70vh] bg-[#E7F6FF]">
            <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !quiz) return (
        <div className="min-h-screen bg-[#E7F6FF] flex flex-col items-center justify-center p-8 text-center">
            <FaInbox className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="font-bold text-gray-500">{error || 'Quiz not found'}</p>
            <button onClick={() => navigate(-1)} className="mt-6 kid-btn bg-kidOrange shadow-[0_6px_0_0_#c2410c]">GO BACK</button>
        </div>
    );

    if (questions.length === 0) return (
        <div className="min-h-screen bg-[#E7F6FF] flex flex-col items-center justify-center p-8 text-center">
            <FaCircleQuestion className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="font-bold text-gray-500">This quiz has no questions yet.</p>
            <button onClick={() => navigate(-1)} className="mt-6 kid-btn bg-kidOrange shadow-[0_6px_0_0_#c2410c]">GO BACK</button>
        </div>
    );

    const q = questions[current];
    const isLast = current === questions.length - 1;
    const answeredCount = questions.filter(isAnswered).length;
    const progress = Math.round((answeredCount / questions.length) * 100);

    const renderQuestion = (question) => {
        const a = answers[question.id];

        switch (question.type) {

            case 'MATCHING':
                return (
                    <MatchingQuestion
                        question={question}
                        answer={a}
                        setAnswer={(patch) => setAnswer(question.id, patch)}
                    />
                );

            case 'WORD_ORDER':
            case 'DRAG_AND_DROP':
                return (
                    <WordOrderQuestion
                        question={question}
                        answer={a}
                        setAnswer={(patch) => setAnswer(question.id, patch)}
                    />
                );

            case 'FILL_IN_BLANK': {
                const val = a?.textResponse || '';
                return (
                    <div>
                        <p className="text-xs font-bold text-orange-500 mb-3 flex items-center gap-1.5"><FaPencil className="w-3.5 h-3.5" /> Type the missing word</p>
                        <input
                            value={val}
                            onChange={e => setAnswer(question.id, { textResponse: e.target.value })}
                            placeholder="Type your answer..."
                            className="w-full p-4 rounded-2xl border-2 border-gray-200 focus:border-kidPrimary outline-none text-center text-xl font-bold text-kidText"
                        />
                    </div>
                );
            }

            case 'COLOR_MATCH':
                return (
                    <ColorMatchQuestion
                        question={question}
                        answers={a}
                        onSelect={handleSelectOption}
                    />
                );

            case 'MULTIPLE_CHOICE': {
                const selected = a?.selectedOptionIds || [];
                return (
                    <div className="space-y-3">
                        <p className="text-xs font-bold text-orange-500 mb-3 flex items-center gap-1.5"><FaSquareCheck className="w-3.5 h-3.5" /> Select ALL correct answers</p>
                        {question.options.map(opt => {
                            const isSel = selected.includes(opt.id);
                            return (
                                <button key={opt.id} onClick={() => handleSelectOption(question, opt.id)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${isSel ? 'border-kidPrimary bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                    <span className={`w-6 h-6 rounded-md border-2 flex items-center justify-center shrink-0 ${isSel ? 'bg-kidPrimary border-kidPrimary text-white' : 'border-gray-300'}`}>
                                        {isSel && <FaCheck className="w-3.5 h-3.5" />}
                                    </span>
                                    <span className="font-bold text-kidText">{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            }

            case 'TRUE_FALSE':
                return (
                    <div className="space-y-3">
                        {question.options.map(opt => {
                            const isSel = a?.selectedOptionId === opt.id;
                            return (
                                <button key={opt.id} onClick={() => handleSelectOption(question, opt.id)}
                                    className={`w-full flex items-center justify-center gap-2 p-5 rounded-2xl border-2 font-bold text-xl transition-all active:scale-[0.98] ${isSel ? 'border-kidPrimary bg-blue-50 text-kidPrimary' : 'border-gray-200 bg-white text-kidText hover:border-gray-300'}`}>
                                    {opt.text === 'True' ? <FaCircleCheck className="w-5 h-5" /> : <FaCircleXmark className="w-5 h-5" />} {opt.text}
                                </button>
                            );
                        })}
                    </div>
                );

            default: {
                // SINGLE_CHOICE
                return (
                    <div className="space-y-3">
                        {question.options.map(opt => {
                            const isSel = a?.selectedOptionId === opt.id;
                            const hasImg = opt.imageUrl && !opt.imageUrl.startsWith('match::');
                            return (
                                <button key={opt.id} onClick={() => handleSelectOption(question, opt.id)}
                                    className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] ${isSel ? 'border-kidPrimary bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${isSel ? 'bg-kidPrimary border-kidPrimary text-white' : 'border-gray-300'}`}>
                                        {isSel && <FaCheck className="w-3.5 h-3.5" />}
                                    </span>
                                    {hasImg && <img src={opt.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover" />}
                                    <span className="font-bold text-kidText">{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            }
        }
    };

    return (
        <div className="bg-[#E7F6FF] min-h-screen px-5 pt-6 pb-32">
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)}
                    className="bg-white p-2.5 rounded-full shadow-sm border border-gray-100 hover:bg-gray-50 transition">
                    <FaChevronLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="flex flex-col items-center">
                    <h2 className="text-kidOrange font-bold text-xs tracking-widest uppercase">Practice Mode</h2>
                    <span className={`font-black text-lg mt-0.5 tabular-nums ${timeLeft < 60 ? 'text-red-500 animate-pulse' : 'text-kidPrimary'
                        }`}>
                        {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:{String(timeLeft % 60).padStart(2, '0')}
                    </span>
                </div>
                <div className="w-11" />
            </div>

            {/* Progress */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">Question {current + 1} of {questions.length}</span>
                <span className="text-xs font-bold text-kidOrange">{answeredCount}/{questions.length} answered</span>
            </div>
            <div className="w-full bg-white h-2.5 rounded-full mb-8 overflow-hidden">
                <div className="bg-kidOrange h-2.5 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>

            {/* Question card */}
            <div className="bg-white rounded-[28px] p-6 shadow-[0_4px_20px_rgba(0,0,0,0.06)] border border-gray-100">
                <div className="flex items-center gap-2 mb-4">
                    {(() => { const Icon = TYPE_ICONS[q.type] || FaCircleDot; return <Icon className="text-2xl text-kidOrange" />; })()}
                    <span className="text-[10px] font-bold text-gray-400 uppercase bg-gray-100 px-2 py-0.5 rounded-full">
                        {q.type.replace(/_/g, ' ')}
                    </span>
                </div>

                {q.resourceUrl && (
                    <div className="mb-4">
                        {q.resourceUrl.includes('.mp3') || q.resourceUrl.includes('.wav') ? (
                            <button onClick={() => new Audio(q.resourceUrl).play()}
                                className="w-16 h-16 mx-auto bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg shadow-blue-300/40">
                                <FaVolumeHigh className="w-8 h-8 text-white" />
                            </button>
                        ) : (
                            <img src={q.resourceUrl} alt="Question" className="w-full max-h-48 object-cover rounded-2xl" />
                        )}
                    </div>
                )}

                <h1 className="text-2xl font-extrabold text-kidText mb-6 text-center leading-snug">{q.text}</h1>
                {renderQuestion(q)}
            </div>

            {/* Navigation */}
            <div className="fixed bottom-24 left-0 w-full px-5">
                <div className="flex gap-3">
                    {current > 0 && (
                        <button onClick={() => setCurrent(current - 1)}
                            className="flex-1 kid-btn border-4 border-kidPrimary bg-white text-kidPrimary shadow-[0_6px_0_0_#2563eb] hover:bg-gray-50">
                            <FaChevronLeft className="w-5 h-5" /> PREVIOUS
                        </button>
                    )}
                    {!isLast ? (
                        <button onClick={() => setCurrent(current + 1)}
                            className="flex-1 kid-btn bg-kidPrimary shadow-[0_6px_0_0_#2563eb]">
                            NEXT <FaChevronRight className="w-5 h-5" />
                        </button>
                    ) : (
                        <button onClick={handleSubmit} disabled={submitting}
                            className="flex-1 kid-btn bg-[#f26c24] shadow-[0_6px_0_0_#c2410c] disabled:opacity-50">
                            <FaCircleCheck className="w-5 h-5" />
                            {submitting ? 'SUBMITTING...' : 'FINISH'}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
