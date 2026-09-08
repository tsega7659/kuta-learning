import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    FaChevronLeft, FaChevronRight, FaCircleCheck, FaVolumeHigh,
    FaCircleDot, FaSquareCheck, FaPalette, FaFont, FaLink, FaPencil,
    FaHandPointer, FaArrowRight, FaCheck, FaCircleQuestion, FaInbox,
    FaCircleXmark, FaRotateRight, FaLightbulb, FaStar,
    FaPlay
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

function MatchingQuestion({ question, answer, setAnswer }) {
    const pairs = question.options.map(o => ({
        id: o.id,
        qText: o.text,
        aText: o.imageUrl?.startsWith('match::') ? o.imageUrl.replace('match::', '') : o.imageUrl || '',
    }));

    const shuffledAnswers = useMemo(() => shuffle(pairs.map(p => ({ id: p.id, text: p.aText }))), [question.id]);

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
            <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-3 mb-4 text-center">
                <p className="text-xs font-black text-[#0c3b6b] flex items-center justify-center gap-1.5">
                    <FaLink className="text-[#f26522]" /> Tap left item, then its matching answer on right
                </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
                {/* Left column */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-[#0c3b6b]/60 uppercase tracking-widest text-center mb-1">Questions</p>
                    {pairs.map(p => {
                        const matched = selections[p.id];
                        const matchedText = shuffledAnswers.find(a => a.id === matched)?.text;
                        const isActive = activeLeft === p.id;
                        return (
                            <div key={p.id} className="relative">
                                <button
                                    type="button"
                                    onClick={() => matched ? clearPair(p.id) : handleLeftTap(p.id)}
                                    className={`w-full p-3.5 rounded-2xl border-2 text-left text-sm font-bold transition-all active:scale-95 shadow-sm ${
                                        matched
                                            ? 'border-green-400 bg-green-50 text-green-800'
                                            : isActive
                                                ? 'border-[#f26522] bg-orange-50 text-[#f26522] shadow-md scale-[1.02]'
                                                : 'border-gray-100 bg-white text-gray-700 hover:border-orange-200'
                                    }`}
                                >
                                    {p.qText}
                                    {matched && (
                                        <span className="block text-[11px] font-black text-green-600 mt-1">
                                            <FaArrowRight className="inline w-3 h-3 mr-1" /> {matchedText}
                                        </span>
                                    )}
                                </button>
                                {isActive && (
                                    <FaArrowRight className="absolute -right-2 top-1/2 -translate-y-1/2 text-[#f26522] w-4 h-4" />
                                )}
                            </div>
                        );
                    })}
                </div>

                {/* Right column */}
                <div className="space-y-2.5">
                    <p className="text-[10px] font-black text-[#0c3b6b]/60 uppercase tracking-widest text-center mb-1">Answers</p>
                    {shuffledAnswers.map(ans => {
                        const isUsed = usedRightIds.has(ans.id);
                        const isTarget = activeLeft && !isUsed;
                        return (
                            <button
                                key={ans.id}
                                type="button"
                                onClick={() => !isUsed && handleRightTap(ans.id)}
                                disabled={isUsed}
                                className={`w-full p-3.5 rounded-2xl border-2 text-sm font-bold transition-all active:scale-95 shadow-sm ${
                                    isUsed
                                        ? 'border-green-300 bg-green-50/60 text-green-700 opacity-60'
                                        : isTarget
                                            ? 'border-[#0c3b6b] bg-blue-50 text-[#0c3b6b] hover:border-[#0c3b6b]'
                                            : 'border-gray-100 bg-white text-gray-700 hover:border-orange-200'
                                }`}
                            >
                                {ans.text}
                            </button>
                        );
                    })}
                </div>
            </div>

            {Object.keys(selections).length === pairs.length && (
                <div className="mt-4 text-center text-xs font-black text-green-600 bg-green-50 py-2.5 rounded-2xl flex items-center justify-center gap-1.5 border border-green-200">
                    <FaCircleCheck className="w-4 h-4" /> All matched! Tap any left item to unlink.
                </div>
            )}
        </div>
    );
}

function WordOrderQuestion({ question, answer, setAnswer }) {
    const correctWord = question.options[0]?.text || '';
    const shuffledLetters = useMemo(() => shuffle(
        correctWord.split('').map((ch, i) => ({ ch, uid: `${i}-${ch}` }))
    ), [question.id]);

    const chosen = answer?.letterOrder || [];

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
            <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-2.5 mb-3 text-center">
                <p className="text-xs font-black text-[#0c3b6b] flex items-center justify-center gap-1.5">
                    <FaFont className="text-[#f26522]" /> Tap letters to build the word in order
                </p>
            </div>

            {/* Answer tray */}
            <div className="mb-4 min-h-[56px] bg-white border-2 border-dashed border-orange-300 rounded-2xl p-3 flex flex-wrap gap-2 items-center justify-center shadow-inner">
                {chosen.length === 0 ? (
                    <span className="text-gray-400 text-xs font-bold">Tap letters below to build the word…</span>
                ) : (
                    chosen.map(uid => {
                        const letter = shuffledLetters.find(l => l.uid === uid);
                        return (
                            <button
                                key={uid}
                                type="button"
                                onClick={() => removeLetter(uid)}
                                className="w-11 h-11 bg-[#0c3b6b] text-white font-black text-xl rounded-2xl shadow active:scale-90 transition-all border-b-4 border-[#072442]"
                            >
                                {letter?.ch}
                            </button>
                        );
                    })
                )}
            </div>

            {/* Letter pool */}
            <div className="flex flex-wrap gap-2.5 justify-center">
                {shuffledLetters.map(l => {
                    const used = chosen.includes(l.uid);
                    return (
                        <button
                            key={l.uid}
                            type="button"
                            onClick={() => !used && addLetter(l.uid)}
                            disabled={used}
                            className={`w-11 h-11 font-black text-xl rounded-2xl transition-all border-b-4 active:scale-90 ${
                                used
                                    ? 'bg-gray-100 text-gray-300 border-gray-200 opacity-40'
                                    : 'bg-[#f26522] text-white border-[#b54611] hover:scale-105 shadow-md'
                            }`}
                        >
                            {l.ch}
                        </button>
                    );
                })}
            </div>

            {chosen.length > 0 && (
                <div className="text-center mt-3">
                    <button
                        type="button"
                        onClick={clearAll}
                        className="text-xs font-black text-red-500 hover:text-red-700 underline"
                    >
                        Clear all letters
                    </button>
                </div>
            )}
        </div>
    );
}

function ColorMatchQuestion({ question, answers, onSelect }) {
    const selected = answers?.selectedOptionId;
    return (
        <div className="grid grid-cols-2 gap-3">
            {question.options.map(opt => {
                const isSel = selected === opt.id;
                const hasImg = opt.imageUrl && !opt.imageUrl.startsWith('match::');
                return (
                    <button
                        key={opt.id}
                        type="button"
                        onClick={() => onSelect(question, opt.id)}
                        className={`flex flex-col items-center gap-2 p-3.5 rounded-2xl border-2 transition-all active:scale-95 shadow-sm ${
                            isSel ? 'border-[#f26522] bg-orange-50 shadow-md ring-2 ring-[#f26522]/20' : 'border-gray-100 bg-white hover:border-orange-200'
                        }`}
                    >
                        {hasImg ? (
                            <img src={opt.imageUrl} alt="" className="w-full h-24 object-cover rounded-xl" />
                        ) : (
                            <div className="w-14 h-14 rounded-2xl bg-orange-50 flex items-center justify-center text-[#f26522]">
                                <FaPalette className="text-3xl" />
                            </div>
                        )}
                        <span className={`font-black text-sm ${isSel ? 'text-[#0c3b6b]' : 'text-gray-700'}`}>
                            {opt.text}
                        </span>
                        {isSel && (
                            <span className="text-[#f26522] font-black text-xs flex items-center gap-1">
                                <FaCheck className="w-3 h-3" /> Selected
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}

export default function QuizPage() {
    const { quizId } = useParams();
    const navigate = useNavigate();
    const [quiz, setQuiz] = useState(null);
    const [loading, setLoading] = useState(true);
    const [current, setCurrent] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [secondsLeft, setSecondsLeft] = useState(60);
    const [hintsRemaining, setHintsRemaining] = useState(3);
    const [speaking, setSpeaking] = useState(false);

    // Timer countdown
    useEffect(() => {
        const timer = setInterval(() => {
            setSecondsLeft(prev => (prev > 0 ? prev - 1 : 60));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        api.get(`/quizzes/${quizId}`)
            .then(res => setQuiz(res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to load quiz'))
            .finally(() => setLoading(false));
    }, [quizId]);

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

    const handleResetCurrent = () => {
        if (questions[current]) {
            setAnswer(questions[current].id, {
                selectedOptionId: null,
                selectedOptionIds: [],
                textResponse: '',
                matchSelections: {},
                letterOrder: []
            });
        }
    };

    const handleUseHint = () => {
        if (hintsRemaining > 0) {
            setHintsRemaining(prev => prev - 1);
            alert(`💡 Hint: Look carefully at the question keywords and choose the best fit! (${hintsRemaining - 1} hints remaining)`);
        }
    };

    const speakQuestion = (text) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.rate = 0.9;
            utterance.pitch = 1.1;
            utterance.onstart = () => setSpeaking(true);
            utterance.onend = () => setSpeaking(false);
            utterance.onerror = () => setSpeaking(false);
            window.speechSynthesis.speak(utterance);
        }
    };

    const handleSubmit = async () => {
        setSubmitting(true);
        try {
            const payload = questions.map(q => {
                const a = answers[q.id] || {};
                let selectedOptionIds = a.selectedOptionIds || [];
                let textResponse = a.textResponse || null;

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
            const res = await api.post(`/quizzes/${quizId}/submit`, { answers: payload });
            navigate(`/student/quiz/result/${res.data.id}`, { state: { result: res.data } });
        } catch (err) {
            if (err.response?.status === 400) {
                const attemptId = err.response.data.attemptId;
                if (attemptId) navigate(`/student/quiz/result/${attemptId}`);
                else alert(err.response.data.message);
            } else {
                alert('Failed to submit quiz. Please try again.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center min-h-screen bg-[#f7f5f0]">
            <div className="w-12 h-12 border-4 border-[#f26522] border-t-transparent rounded-full animate-spin" />
        </div>
    );

    if (error || !quiz) return (
        <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-8 text-center">
            <FaInbox className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="font-bold text-gray-500">{error || 'Quiz not found'}</p>
            <button onClick={() => navigate(-1)} className="mt-6 bg-[#f26522] text-white font-black px-6 py-3 rounded-full shadow-[0_4px_0_0_#b54611]">
                GO BACK
            </button>
        </div>
    );

    if (questions.length === 0) return (
        <div className="min-h-screen bg-[#f7f5f0] flex flex-col items-center justify-center p-8 text-center">
            <FaCircleQuestion className="text-5xl text-gray-400 mx-auto mb-4" />
            <p className="font-bold text-gray-500">This quiz has no questions yet.</p>
            <button onClick={() => navigate(-1)} className="mt-6 bg-[#f26522] text-white font-black px-6 py-3 rounded-full shadow-[0_4px_0_0_#b54611]">
                GO BACK
            </button>
        </div>
    );

    const q = questions[current];
    const isLast = current === questions.length - 1;
    const answeredCount = questions.filter(isAnswered).length;
    const minutes = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeFormatted = `${minutes}:${secs < 10 ? '0' : ''}${secs}`;

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
                    <div className="space-y-3">
                        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-2.5 text-center">
                            <p className="text-xs font-black text-[#0c3b6b] flex items-center justify-center gap-1.5">
                                <FaPencil className="text-[#f26522]" /> Type your answer in the box below
                            </p>
                        </div>
                        <input
                            value={val}
                            onChange={e => setAnswer(question.id, { textResponse: e.target.value })}
                            placeholder="Type here..."
                            className="w-full p-4 rounded-2xl border-2 border-orange-200 focus:border-[#f26522] outline-none text-center text-xl font-black text-[#0c3b6b] bg-white shadow-inner"
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
                    <div className="space-y-2.5">
                        <div className="bg-orange-50/80 border border-orange-200 rounded-2xl p-2.5 text-center mb-2">
                            <p className="text-xs font-black text-[#0c3b6b] flex items-center justify-center gap-1.5">
                                <FaSquareCheck className="text-[#f26522]" /> Select ALL correct answers
                            </p>
                        </div>
                        {question.options.map(opt => {
                            const isSel = selected.includes(opt.id);
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectOption(question, opt.id)}
                                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] shadow-sm ${
                                        isSel ? 'border-[#f26522] bg-orange-50/80' : 'border-gray-100 bg-white hover:border-orange-200'
                                    }`}
                                >
                                    <span className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center shrink-0 ${
                                        isSel ? 'bg-[#f26522] border-[#f26522] text-white' : 'border-gray-300'
                                    }`}>
                                        {isSel && <FaCheck className="w-3.5 h-3.5" />}
                                    </span>
                                    <span className={`font-black text-sm ${isSel ? 'text-[#0c3b6b]' : 'text-gray-700'}`}>{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            }

            case 'TRUE_FALSE':
                return (
                    <div className="grid grid-cols-2 gap-3">
                        {question.options.map(opt => {
                            const isSel = a?.selectedOptionId === opt.id;
                            const isTrue = opt.text.toLowerCase().includes('true');
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectOption(question, opt.id)}
                                    className={`flex flex-col items-center justify-center gap-2 p-5 rounded-2xl border-2 font-black text-lg transition-all active:scale-[0.98] shadow-sm ${
                                        isSel
                                            ? 'border-[#f26522] bg-orange-50 text-[#0c3b6b] ring-2 ring-[#f26522]/20'
                                            : 'border-gray-100 bg-white text-gray-700 hover:border-orange-200'
                                    }`}
                                >
                                    {isTrue ? (
                                        <FaCircleCheck className={`w-8 h-8 ${isSel ? 'text-green-500' : 'text-gray-300'}`} />
                                    ) : (
                                        <FaCircleXmark className={`w-8 h-8 ${isSel ? 'text-red-500' : 'text-gray-300'}`} />
                                    )}
                                    <span>{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                );

            default: {
                return (
                    <div className="space-y-2.5">
                        {question.options.map(opt => {
                            const isSel = a?.selectedOptionId === opt.id;
                            const hasImg = opt.imageUrl && !opt.imageUrl.startsWith('match::');
                            return (
                                <button
                                    key={opt.id}
                                    type="button"
                                    onClick={() => handleSelectOption(question, opt.id)}
                                    className={`w-full flex items-center gap-3.5 p-4 rounded-2xl border-2 text-left transition-all active:scale-[0.98] shadow-sm ${
                                        isSel ? 'border-[#f26522] bg-orange-50/80 ring-2 ring-[#f26522]/15' : 'border-gray-100 bg-white hover:border-orange-200'
                                    }`}
                                >
                                    <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                        isSel ? 'bg-[#f26522] border-[#f26522] text-white' : 'border-gray-300'
                                    }`}>
                                        {isSel && <FaCheck className="w-3.5 h-3.5" />}
                                    </span>
                                    {hasImg && <img src={opt.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover" />}
                                    <span className={`font-black text-sm ${isSel ? 'text-[#0c3b6b]' : 'text-gray-700'}`}>{opt.text}</span>
                                </button>
                            );
                        })}
                    </div>
                );
            }
        }
    };

    return (
        <div className="min-h-screen bg-[#f7f5f0] px-4 pt-5 pb-36">
            {/* Top Bar (matching Screenshot 3 & 5) */}
            <div className="flex items-center justify-between gap-2 mb-4">
                {/* Back button */}
                <button
                    onClick={() => navigate(-1)}
                    className="w-11 h-11 bg-white rounded-2xl shadow-[0_4px_12px_rgba(12,59,107,0.08)] border border-orange-100 flex items-center justify-center text-[#0c3b6b] hover:bg-orange-50 active:scale-95 transition"
                >
                    <FaChevronLeft className="w-5 h-5" />
                </button>

                {/* Right utility chips */}
                <div className="flex items-center gap-2">
                    {/* Timer */}
                    <div className="bg-white px-3 py-1.5 rounded-full shadow-sm border border-blue-100 flex items-center gap-1.5 text-xs font-black text-[#0c3b6b]">
                        <span>⏱️</span>
                        <span>0:{timeFormatted}</span>
                    </div>

                    {/* Reset Button */}
                    <button
                        onClick={handleResetCurrent}
                        title="Restart question"
                        className="w-9 h-9 bg-white rounded-full shadow-sm border border-orange-100 flex items-center justify-center text-[#f26522] hover:bg-orange-50 active:scale-95 transition"
                    >
                        <FaRotateRight className="w-3.5 h-3.5" />
                    </button>

                    {/* Hint Bulb Button */}
                    <button
                        onClick={handleUseHint}
                        title="Use Hint"
                        className="bg-white px-2.5 py-1 rounded-full shadow-sm border border-yellow-200 flex items-center gap-1 text-xs font-black text-yellow-600 hover:bg-yellow-50 active:scale-95 transition"
                    >
                        <FaLightbulb className="w-3.5 h-3.5 text-yellow-500" />
                        <span>{hintsRemaining}</span>
                    </button>

                    {/* Help Icon */}
                    <button
                        onClick={() => alert('Read or listen to the question carefully, then choose or tap the correct answer below!')}
                        title="Help"
                        className="w-9 h-9 bg-white rounded-full shadow-sm border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50 active:scale-95 transition"
                    >
                        <FaCircleQuestion className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Step progress with glowing capsules (Screenshot 3 & 5) */}
            <div className="mb-4">
                <div className="flex items-center justify-between mb-1.5 px-1">
                    <span className="text-xs font-black text-[#0c3b6b]">{current + 1} / {questions.length}</span>
                    <span className="text-xs font-black text-[#f26522] flex items-center gap-1">
                        <FaStar className="fill-[#f26522] w-3.5 h-3.5" /> {answeredCount} Answered
                    </span>
                </div>
                {/* Segmented capsules */}
                <div className="flex gap-1 items-center">
                    {questions.map((ques, idx) => {
                        const isCurrent = idx === current;
                        const isDone = isAnswered(ques);
                        return (
                            <button
                                key={ques.id || idx}
                                type="button"
                                onClick={() => setCurrent(idx)}
                                className={`h-2 flex-1 rounded-full transition-all duration-300 ${
                                    isCurrent
                                        ? 'bg-[#f26522] ring-2 ring-orange-300 scale-y-125'
                                        : isDone
                                            ? 'bg-[#0c3b6b]'
                                            : 'bg-gray-200'
                                }`}
                            />
                        );
                    })}
                </div>
            </div>

            {/* Mascot speech bubble prompt (Screenshot 3) */}
            <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-400 to-orange-500 border-2 border-white shadow-md flex items-center justify-center text-2xl shrink-0 animate-bounce-subtle">
                    🦜
                </div>
                <button
                    onClick={() => speakQuestion(q.text)}
                    className="bg-white py-2 px-4 rounded-2xl rounded-tl-none shadow-[0_4px_12px_rgba(12,59,107,0.06)] border border-orange-100 flex items-center gap-2 hover:bg-orange-50 transition active:scale-95"
                >
                    <span className="text-xs font-black text-[#0c3b6b]">👆 Tap me to hear it!</span>
                    <FaVolumeHigh className={`w-3.5 h-3.5 ${speaking ? 'text-[#f26522] animate-pulse' : 'text-gray-400'}`} />
                </button>
            </div>

            {/* Question Illustration / Content Card */}
            <div className="bg-white rounded-[28px] p-5 shadow-[0_6px_20px_rgba(12,59,107,0.06)] border border-orange-100 mb-5 relative overflow-hidden">
                <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-black text-[#f26522] uppercase tracking-wider bg-orange-50 border border-orange-200 px-3 py-1 rounded-full">
                        {q.type?.replace(/_/g, ' ') || 'QUESTION'}
                    </span>

                    {/* Tap to listen pill */}
                    <button
                        onClick={() => speakQuestion(q.text)}
                        className="bg-[#0c3b6b] text-white text-[11px] font-black px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm active:scale-95 transition"
                    >
                        <FaPlay className="w-2.5 h-2.5" /> Tap to listen
                    </button>
                </div>

                {/* Media representation if available */}
                {q.resourceUrl ? (
                    <div className="mb-4">
                        {q.resourceUrl.includes('.mp3') || q.resourceUrl.includes('.wav') ? (
                            <button
                                onClick={() => new Audio(q.resourceUrl).play()}
                                className="w-16 h-16 mx-auto bg-gradient-to-br from-[#f26522] to-amber-500 rounded-full flex items-center justify-center hover:scale-105 transition-transform shadow-lg text-white"
                            >
                                <FaVolumeHigh className="w-7 h-7" />
                            </button>
                        ) : (
                            <img src={q.resourceUrl} alt="Question" className="w-full max-h-44 object-contain rounded-2xl mx-auto" />
                        )}
                    </div>
                ) : (
                    /* Playful book / prompt banner */
                    <div className="w-full bg-[#f8fafc] rounded-2xl p-4 mb-4 border border-blue-50 text-center flex flex-col items-center justify-center">
                        <span className="text-4xl mb-1">📖</span>
                        <h2 className="text-xl font-black text-[#0c3b6b]">{q.text}</h2>
                    </div>
                )}

                {/* Interactive Question Content */}
                {renderQuestion(q)}
            </div>

            {/* Primary Action Button (Submit / Next) */}
            <div className="flex flex-col items-center justify-center my-6">
                {!isLast ? (
                    <button
                        type="button"
                        onClick={() => setCurrent(current + 1)}
                        className="w-full max-w-sm bg-gradient-to-r from-[#f26522] to-amber-500 text-white font-black text-lg py-4 px-8 rounded-2xl shadow-[0_5px_0_0_#b54611] active:translate-y-1 active:shadow-none hover:brightness-105 transition flex items-center justify-center gap-3"
                    >
                        <span>NEXT QUESTION</span>
                        <FaChevronRight className="w-5 h-5" />
                    </button>
                ) : (
                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={submitting}
                        className="w-full max-w-sm bg-gradient-to-r from-[#f26522] to-amber-500 text-white font-black text-lg py-4 px-8 rounded-2xl shadow-[0_5px_0_0_#b54611] active:translate-y-1 active:shadow-none hover:brightness-105 transition flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        <FaCircleCheck className="w-5 h-5" />
                        <span>{submitting ? 'SUBMITTING...' : 'SUBMIT QUIZ'}</span>
                    </button>
                )}

                {/* Question navigation helper */}
                {current > 0 && (
                    <button
                        type="button"
                        onClick={() => setCurrent(current - 1)}
                        className="mt-3 text-xs font-black text-[#0c3b6b] hover:text-[#f26522] flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-white/60 transition"
                    >
                        <FaChevronLeft className="w-3 h-3" /> Previous Question
                    </button>
                )}
            </div>
        </div>
    );
}
