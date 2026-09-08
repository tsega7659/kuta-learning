import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    FaRightFromBracket, FaGear, FaXmark, FaUser, FaCheck, FaBook,
    FaCircleCheck, FaStar, FaTrophy, FaGraduationCap, FaChevronRight,
    FaIdCard, FaShieldHalved, FaPalette, FaChevronLeft, FaBookOpen,
    FaCircleQuestion, FaPencil
} from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function HomeProfile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showGate, setShowGate] = useState(false);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('menu'); // 'menu' or 'progress'
    const [selectedTheme, setSelectedTheme] = useState('kuta');

    useEffect(() => {
        api.get('/courses')
            .then(res => setCourses(res.data || []))
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
    const completedLessonsCount = courses.reduce((sum, c) => sum + (c.completedLessons || 0), 0);
    const totalLessonsCount = courses.reduce((sum, c) => sum + (c.totalLessons || 0), 0);
    const chaptersCompleted = courses.reduce((sum, c) => {
        const chs = c.chapters || [];
        return sum + chs.filter(ch => ch.topics?.every(t => t.lessons?.every(l => l.completed))).length;
    }, 0);
    const quizzesPassedCount = courses.reduce((sum, c) => {
        const qzs = c.quizzes || [];
        return sum + qzs.filter(q => q.passed).length;
    }, 0);

    const studentName = user?.name || 'Explorer';
    const gradeLevel = user?.gradeLevel || user?.studentProfile?.gradeLevel || 2;
    const todayFormatted = new Date().toLocaleDateString();

    return (
        <div className="min-h-screen pb-32">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] pt-8 pb-6 px-5 rounded-b-[36px] text-white shadow-[0_10px_25px_rgba(12,59,107,0.22)]">
                <div className="flex justify-between items-center mb-3">
                    {activeTab === 'progress' ? (
                        <button
                            onClick={() => setActiveTab('menu')}
                            className="flex items-center gap-1 text-white font-black text-sm hover:opacity-80 transition"
                        >
                            <FaChevronLeft className="w-4 h-4" /> Back to Profile
                        </button>
                    ) : (
                        <span className="text-white/80 font-black tracking-wider text-xs uppercase">kuta Learning Institute</span>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowGate(true)}
                            title="Parent Settings"
                            className="bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition active:scale-95 shadow-sm"
                        >
                            <FaGear className="w-4 h-4" />
                        </button>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="bg-white/20 backdrop-blur-md p-2.5 rounded-full text-white hover:bg-white/30 transition active:scale-95 shadow-sm"
                        >
                            <FaRightFromBracket className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Profile Header Card */}
                <div className="text-center">
                    <div className="w-20 h-20 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center mx-auto mb-2 border-4 border-white/60 shadow-lg overflow-hidden">
                        {user?.avatarUrl ? (
                            <img src={user.avatarUrl} alt={studentName} className="w-full h-full object-cover" />
                        ) : (
                            <FaUser className="text-3xl text-white" />
                        )}
                    </div>
                    <h1 className="text-2xl font-black text-white">{studentName}</h1>
                    <p className="text-orange-100 font-bold text-xs">{user?.email || 'Grade 2 Student'}</p>
                </div>
            </div>

            <div className="px-4 mt-5 space-y-4">
                {activeTab === 'menu' ? (
                    /* Profile Menu List */
                    <>
                        {/* Option 1: My Grade & Progress */}
                        <button
                            onClick={() => setActiveTab('progress')}
                            className="w-full bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100/80 flex items-center justify-between hover:shadow-card transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center text-[#f26522] border border-orange-100">
                                    <FaGraduationCap className="w-6 h-6" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-[#0c3b6b] text-base">My Grade & Progress 📊</h3>
                                    <p className="text-xs font-bold text-gray-400">View lessons, quizzes & scores</p>
                                </div>
                            </div>
                            <FaChevronRight className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Option 2: School & Grade */}
                        <div className="w-full bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100/80 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-[#0c3b6b] border border-blue-100">
                                    <FaBook className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-[#0c3b6b] text-base">School & Grade</h3>
                                    <p className="text-xs font-bold text-[#f26522]">Grade {gradeLevel} • Kuta Academy</p>
                                </div>
                            </div>
                            <span className="text-xs font-black bg-orange-50 text-[#f26522] px-3 py-1 rounded-full border border-orange-200">
                                Grade {gradeLevel}
                            </span>
                        </div>

                        {/* Option 3: Settings */}
                        <button
                            onClick={() => setShowGate(true)}
                            className="w-full bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100/80 flex items-center justify-between hover:shadow-card transition-all active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600 border border-amber-100">
                                    <FaGear className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-[#0c3b6b] text-base">Settings</h3>
                                    <p className="text-xs font-bold text-gray-400">Parent gate & preferences</p>
                                </div>
                            </div>
                            <FaChevronRight className="w-4 h-4 text-gray-400" />
                        </button>

                        {/* Option 4: National ID */}
                        <div className="w-full bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100/80 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600 border border-purple-100">
                                    <FaIdCard className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-[#0c3b6b] text-base">Student ID</h3>
                                    <p className="text-xs font-bold text-gray-400">KT-{user?.id?.slice(0, 8).toUpperCase() || '2026-001'}</p>
                                </div>
                            </div>
                            <span className="text-xs font-black text-gray-400">Verified</span>
                        </div>

                        {/* Option 5: Privacy Policy */}
                        <div className="w-full bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100/80 flex items-center justify-between">
                            <div className="flex items-center gap-3.5">
                                <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center text-green-600 border border-green-100">
                                    <FaShieldHalved className="w-5 h-5" />
                                </div>
                                <div className="text-left">
                                    <h3 className="font-black text-[#0c3b6b] text-base">Privacy Policy</h3>
                                    <p className="text-xs font-bold text-gray-400">Child-safe learning platform</p>
                                </div>
                            </div>
                            <FaChevronRight className="w-4 h-4 text-gray-400" />
                        </div>

                        {/* App Theme Selector Card */}
                        <div className="bg-white rounded-[28px] p-5 shadow-[0_6px_20px_rgba(12,59,107,0.06)] border border-orange-100">
                            <div className="flex items-center gap-2 mb-3">
                                <FaPalette className="text-[#f26522]" />
                                <h3 className="font-black text-[#0c3b6b] text-sm uppercase tracking-wider">App Theme</h3>
                            </div>

                            <div className="space-y-2.5">
                                <label
                                    onClick={() => setSelectedTheme('kuta')}
                                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                        selectedTheme === 'kuta' ? 'border-[#f26522] bg-orange-50/60' : 'border-gray-100 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-[#f26522]" />
                                        <span className="font-black text-sm text-[#0c3b6b]">Kuta Orange & Navy (Official)</span>
                                    </div>
                                    {selectedTheme === 'kuta' && <FaCircleCheck className="text-[#f26522] w-5 h-5" />}
                                </label>

                                <label
                                    onClick={() => setSelectedTheme('yellow')}
                                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                        selectedTheme === 'yellow' ? 'border-yellow-400 bg-yellow-50/60' : 'border-gray-100 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-yellow-400" />
                                        <span className="font-bold text-sm text-gray-700">Yellow Safari Theme</span>
                                    </div>
                                    {selectedTheme === 'yellow' && <FaCircleCheck className="text-yellow-500 w-5 h-5" />}
                                </label>

                                <label
                                    onClick={() => setSelectedTheme('blue')}
                                    className={`flex items-center justify-between p-3 rounded-2xl border-2 cursor-pointer transition-all ${
                                        selectedTheme === 'blue' ? 'border-blue-400 bg-blue-50/60' : 'border-gray-100 bg-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="w-4 h-4 rounded-full bg-blue-400" />
                                        <span className="font-bold text-sm text-gray-700">Ocean Blue Theme</span>
                                    </div>
                                    {selectedTheme === 'blue' && <FaCircleCheck className="text-blue-500 w-5 h-5" />}
                                </label>
                            </div>
                        </div>
                    </>
                ) : (
                    /* My Grade & Progress View */
                    <>
                        {/* Grade Pill Banner */}
                        <div className="bg-gradient-to-r from-[#0c3b6b] to-[#134980] text-white rounded-[24px] p-4 flex items-center justify-between shadow-md">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
                                    <FaGraduationCap className="text-2xl text-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase text-orange-200">Current Standing</p>
                                    <h2 className="text-2xl font-black">Grade {gradeLevel}</h2>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowGate(true)}
                                className="w-9 h-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
                            >
                                <FaPencil className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Progress Statistics 📈 */}
                        <div>
                            <h3 className="font-black text-[#0c3b6b] text-base mb-3 px-1">Progress Statistics 📈</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {/* Card 1: Lessons Completed */}
                                <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100 flex flex-col justify-between">
                                    <div className="w-10 h-10 rounded-2xl bg-orange-50 flex items-center justify-center mb-3 text-[#f26522]">
                                        <FaBook className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#0c3b6b]">{completedLessonsCount}</p>
                                        <p className="text-[11px] font-bold text-gray-400">Lessons Completed</p>
                                    </div>
                                </div>

                                {/* Card 2: Chapters Completed */}
                                <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100 flex flex-col justify-between">
                                    <div className="w-10 h-10 rounded-2xl bg-blue-50 flex items-center justify-center mb-3 text-[#0c3b6b]">
                                        <FaBookOpen className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#0c3b6b]">{chaptersCompleted}</p>
                                        <p className="text-[11px] font-bold text-gray-400">Chapters Completed</p>
                                    </div>
                                </div>

                                {/* Card 3: Quizzes Passed */}
                                <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100 flex flex-col justify-between">
                                    <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center mb-3 text-red-500">
                                        <FaCircleQuestion className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#0c3b6b]">{quizzesPassedCount}</p>
                                        <p className="text-[11px] font-bold text-gray-400">Quizzes Passed</p>
                                    </div>
                                </div>

                                {/* Card 4: Average Score */}
                                <div className="bg-white rounded-[24px] p-4 shadow-[0_4px_16px_rgba(12,59,107,0.06)] border border-orange-100 flex flex-col justify-between">
                                    <div className="w-10 h-10 rounded-2xl bg-yellow-50 flex items-center justify-center mb-3 text-yellow-500">
                                        <FaStar className="w-5 h-5 fill-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-2xl font-black text-[#f26522]">{totalProgress}%</p>
                                        <p className="text-[11px] font-bold text-gray-400">Average Score</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Grade History 📜 */}
                        <div className="bg-white rounded-[28px] p-5 shadow-[0_6px_20px_rgba(12,59,107,0.06)] border border-orange-100">
                            <h3 className="font-black text-[#0c3b6b] text-base mb-3">Grade History 📜</h3>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs">
                                    <thead>
                                        <tr className="border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                            <th className="pb-2">Grade</th>
                                            <th className="pb-2">Date</th>
                                            <th className="pb-2">Status</th>
                                            <th className="pb-2">Reason</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        <tr>
                                            <td className="py-3 font-black text-[#0c3b6b]">Grade {gradeLevel}</td>
                                            <td className="py-3 font-bold text-gray-500">{todayFormatted}</td>
                                            <td className="py-3">
                                                <span className="bg-green-100 text-green-700 font-black px-2.5 py-0.5 rounded-full text-[10px]">
                                                    ACTIVE
                                                </span>
                                            </td>
                                            <td className="py-3 font-bold text-gray-400">Profile Enrolled</td>
                                        </tr>
                                        <tr>
                                            <td className="py-3 font-bold text-gray-400">Initial</td>
                                            <td className="py-3 font-bold text-gray-400">{todayFormatted}</td>
                                            <td className="py-3">
                                                <span className="bg-gray-100 text-gray-500 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                                                    INACTIVE
                                                </span>
                                            </td>
                                            <td className="py-3 font-bold text-gray-400">Registration</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
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
    const [checking, setChecking] = useState(false);
    const [selectedId, setSelectedId] = useState(null);
    const [selectedIds, setSelectedIds] = useState([]);

    useEffect(() => {
        api.get('/practice/random-question')
            .then(res => setQuestion(res.data))
            .catch(() => {
                const n1 = 7;
                const n2 = 8;
                setQuestion({
                    id: 'local-math-56',
                    text: `Parent Verification: What is ${n1} × ${n2}?`,
                    type: 'SINGLE_CHOICE',
                    options: [
                        { id: 'opt-56', text: '56' },
                        { id: 'opt-48', text: '48' },
                        { id: 'opt-54', text: '54' },
                        { id: 'opt-64', text: '64' }
                    ].sort(() => Math.random() - 0.5)
                });
            })
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
        if (question?.id === 'local-math-56') {
            if (selectedId === 'opt-56') {
                onSuccess();
            } else {
                alert('Incorrect answer. Access denied.');
                onClose();
            }
            return;
        }

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
                    <h2 className="text-xl font-extrabold text-[#0c3b6b] mb-1">Parent Settings</h2>
                    <p className="text-sm font-bold text-gray-400 mb-6 tracking-wide">Please answer to continue</p>

                    {loading ? (
                        <div className="py-10 flex justify-center"><div className="w-8 h-8 border-4 border-[#f26522] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="text-left space-y-4">
                            <h3 className="font-bold text-[#0c3b6b] text-lg mb-4 text-center">{question?.text}</h3>
                            <div className="space-y-2">
                                {(question?.options || []).map(opt => {
                                    const isSel = question.type === 'MULTIPLE_CHOICE' ? selectedIds.includes(opt.id) : selectedId === opt.id;
                                    return (
                                        <button
                                            key={opt.id}
                                            onClick={() => toggleOption(opt.id)}
                                            className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all active:scale-[0.98] ${
                                                isSel ? 'border-[#f26522] bg-orange-50 text-[#f26522] items-center flex gap-3' : 'border-gray-200 bg-white text-gray-600'
                                            }`}
                                        >
                                            {isSel && <span className="w-5 h-5 bg-[#f26522] text-white flex items-center justify-center rounded shrink-0"><FaCheck className="w-3 h-3" /></span>}
                                            {opt.text}
                                        </button>
                                    );
                                })}
                            </div>

                            <button
                                onClick={verify}
                                disabled={checking || (!selectedId && selectedIds.length === 0)}
                                className="w-full mt-4 bg-[#f26522] text-white font-black py-4 rounded-full shadow-[0_4px_0_0_#ad3c09] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50"
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
