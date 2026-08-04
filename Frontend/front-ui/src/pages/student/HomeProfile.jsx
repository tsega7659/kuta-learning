import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaRightFromBracket, FaGear, FaXmark, FaUser, FaCheck } from 'react-icons/fa6';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

export default function HomeProfile() {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [showGate, setShowGate] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

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

            <div className="px-5">
                <div className="bg-white rounded-[32px] p-6 shadow-soft border border-gray-100 flex items-center justify-center min-h-[300px]">
                    <div className="text-center">
                        <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 overflow-hidden border-4 border-white shadow-xl">
                            <FaUser className="text-5xl text-blue-500" />
                        </div>
                        <h1 className="text-3xl font-extrabold text-kidText mb-1 tracking-tight">{user?.name || 'Explorer'}</h1>
                        <p className="text-gray-400 font-bold mb-4">{user?.email}</p>
                        <p className="text-sm font-bold text-gray-500 px-6 mt-6">
                            Progress tracking and analytics will appear here as you complete more lessons!
                        </p>
                    </div>
                </div>
            </div>

            {showGate && <ParentGateModal onClose={() => setShowGate(false)} />}
        </div>
    );
}

function ParentGateModal({ onClose }) {
    const [question, setQuestion] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [checking, setChecking] = useState(false);

    // Some questions might be MULTIPLE_CHOICE
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
                alert('Access Granted (Placeholder for Parent Settings Route)');
                onClose();
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
