import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRightFromBracket, FaGear, FaXmark, FaUser, FaCheck, FaBook, FaCircleCheck, FaStar } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function HomeProfile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showGate, setShowGate] = useState(false);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/courses')
            .then(res => setCourses(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const totalProgress = courses.length
        ? Math.round(courses.reduce((sum, c) => sum + (c.progressPercentage || 0), 0) / courses.length)
        : 0;
    const coursesStarted = courses.filter(c => (c.progressPercentage || 0) > 0).length;
    const coursesCompleted = courses.filter(c => c.progressPercentage === 100).length;

    return (
        <div className="min-h-screen bg-[#FFFDF9] pb-32">
            {/* Header */}
            <div className="pt-12 px-6 pb-6 relative flex justify-between items-center">
                <h2 className="text-kidOrange font-bold tracking-widest text-sm uppercase">Kuta Learning</h2>

                <div className="flex gap-2">
                    <button onClick={() => setShowGate(true)} title="Parent Settings" className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                        <FaGear className="w-5 h-5" />
                    </button>
                    <button onClick={handleLogout} title="Logout" className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition-colors">
                        <FaRightFromBracket className="w-5 h-5" />
                    </button>
                </div>
            </div>

            <div className="px-5 space-y-4">
                {/* Profile card */}
                <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100">
                    <div className="text-center mb-6">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl">
                            <FaUser className="text-5xl text-blue-500" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-kidText mb-1 tracking-tight">{user?.name || 'Explorer'}</h1>
                        <p className="text-gray-400 font-bold">{user?.email}</p>
                    </div>

                    {/* Overall progress stats */}
                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <div className="bg-blue-50 rounded-2xl p-3 text-center">
                            <p className="text-2xl font-black text-blue-600">{totalProgress}%</p>
                            <p className="text-[10px] font-extrabold uppercase text-blue-400 mt-1">Overall</p>
                        </div>
                        <div className="bg-orange-50 rounded-2xl p-3 text-center">
                            <p className="text-2xl font-black text-orange-600">{coursesStarted}</p>
                            <p className="text-[10px] font-extrabold uppercase text-orange-400 mt-1">Started</p>
                        </div>
                        <div className="bg-green-50 rounded-2xl p-3 text-center">
                            <p className="text-2xl font-black text-green-600">{coursesCompleted}</p>
                            <p className="text-[10px] font-extrabold uppercase text-green-400 mt-1">Completed</p>
                        </div>
                    </div>

                    {/* Overall progress bar */}
                    <div>
                        <div className="flex justify-between text-[12px] font-bold text-gray-500 mb-2">
                            <span>Your Progress</span>
                            <span>{totalProgress}%</span>
                        </div>
                        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full transition-all"
                                style={{ width: `${totalProgress}%` }}
                            />
                        </div>
                    </div>
                </div>

                {/* Per-course progress */}
                <div className="bg-white rounded-[32px] p-5 shadow-soft border border-gray-100">
                    <h3 className="text-[13px] font-extrabold uppercase tracking-widest text-gray-400 mb-4">Course Progress</h3>

                    {loading ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-kidOrange border-t-transparent rounded-full animate-spin" />
                        </div>
                    ) : courses.length === 0 ? (
                        <div className="text-center py-6">
                            <FaBook className="text-3xl text-gray-300 mx-auto mb-2" />
                            <p className="text-sm font-bold text-gray-400">No courses yet. Start learning!</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {courses.map((course) => {
                                const progress = Math.max(0, Math.min(100, Number(course.progressPercentage || 0)));
                                const isDone = progress === 100;
                                return (
                                    <button
                                        key={course.id}
                                        type="button"
                                        onClick={() => navigate(`/student/courses/${course.id}`)}
                                        className="w-full text-left rounded-2xl bg-gray-50 p-3 hover:bg-blue-50 transition active:scale-[0.98]"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-extrabold text-kidText text-[14px] truncate pr-2">{course.title}</span>
                                            <div className="flex items-center gap-1 shrink-0">
                                                {isDone ? (
                                                    <FaCircleCheck className="w-4 h-4 text-green-500" />
                                                ) : progress > 0 ? (
                                                    <FaStar className="w-4 h-4 text-orange-400" />
                                                ) : null}
                                                <span className="text-[12px] font-bold text-gray-500">{progress}%</span>
                                            </div>
                                        </div>
                                        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full ${isDone ? 'bg-green-500' : 'bg-blue-500'}`}
                                                style={{ width: `${progress}%` }}
                                            />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {showGate && (
                <ParentGateModal
                    onClose={() => setShowGate(false)}
                    onSuccess={() => {
                        setShowGate(false);
                        navigate('/student/parent-settings');
                    }}
                />
            )}
        </div>
    );
}

function ParentGateModal({ onClose, onSuccess }) {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(false);

    const [selectedId, setSelectedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        api.get('/practice/random-question')
            .then(res => setQuestion(res.data))
            .catch(err => setError(err.response?.data?.message || 'Failed to load question'))
            .finally(() => setLoading(false));
    }, []);

    const toggleOption = (id) => {
        if (!question) return;
        if (question.type === 'MULTIPLE_CHOICE') {
            if (selectedIds.includes(id)) setSelectedIds(prev => prev.filter(x => x !== id));
            else setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedId(id);
        }
    };

    const verify = async () => {
        if (!selectedId && selectedIds.length === 0) return;
        setChecking(true);
        try {
            const res = await api.post('/practice/random-question/verify', {
                questionId: question.id,
                selectedOptionId: selectedId,
                selectedOptionIds: selectedIds
            });
            if (res.data.isCorrect) {
                onSuccess();
            } else {
                alert('Incorrect answer. Access denied.');
                onClose();
            }
        } catch (err) {
            alert('Error verifying answer');
        } finally {
            setChecking(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-sm overflow-hidden animate-spring-up shadow-2xl relative">
                <button onClick={onClose} className="absolute top-4 right-4 bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200">
                    <FaXmark className="w-5 h-5" />
                </button>

                <div className="p-6 pt-10 text-center">
                    <h2 className="text-xl font-extrabold text-kidText mb-1">Parent Settings</h2>
                    <p className="text-sm font-bold text-gray-400 mb-6 tracking-wide">Please answer to continue</p>

                    {loading ? (
                        <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-kidPrimary border-t-transparent rounded-full animate-spin"></div></div>
                    ) : error ? (
                        <div className="py-10"><p className="text-sm font-bold text-red-500">{error}</p></div>
                    ) : (
                        <div className="text-left space-y-4">
                            <h3 className="font-bold text-kidText text-lg mb-4 text-center">{question.text}</h3>
                            <div className="space-y-2">
                                {question.options.map(opt => {
                                    const isSel = question.type === 'MULTIPLE_CHOICE' ? selectedIds.includes(opt.id) : selectedId === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleOption(opt.id)}
                                            className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all active:scale-[0.98] ${isSel ? 'border-kidPrimary bg-blue-50 text-kidPrimary items-center flex gap-3' : 'border-gray-200 bg-white text-gray-600'
                                                }`}
                                        >
                                            {isSel && <span className="w-5 h-5 bg-kidPrimary text-white flex items-center justify-center rounded shrink-0"><FaCheck className="w-3 h-3" /></span>}
                                            {opt.text}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={verify}
                                disabled={checking || (!selectedId && selectedIds.length === 0)}
                                className="w-full mt-4 bg-kidOrange text-white font-black py-4 rounded-full shadow-[0_4px_0_0_#c2410c] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
                            >
                                {checking ? 'CHECKING...' : 'CONTINUE'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
