import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWandMagicSparkles, FaArrowsRotate, FaInbox, FaStar } from 'react-icons/fa6';
import api from '../../services/api';

export default function PracticeMenu() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/practice/topics')
            .then(res => setTopics(res.data || []))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, []);

    const startModule = async (topicId) => {
        setStarting(topicId);
        try {
            const res = await api.post(`/practice/topics/${topicId}/start`);
            navigate(`/student/practice/${res.data.attemptId}`);
        } catch (err) {
            alert('Failed to start practice: ' + (err.response?.data?.message || err.message));
            setStarting(null);
        }
    };

    return (
        <div className="min-h-screen pb-28">
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-[#0c3b6b] via-[#10477d] to-[#f26522] pt-10 pb-8 px-6 rounded-b-[36px] text-white shadow-[0_10px_25px_rgba(12,59,107,0.22)] text-center relative">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <h1 className="text-[28px] font-black tracking-tight">Practice Arena</h1>
                    <span className="text-2xl">🎯</span>
                </div>
                <p className="text-[13px] font-bold text-orange-100 max-w-[260px] mx-auto leading-relaxed">
                    Pick a topic to generate a 10-question practice challenge!
                </p>
            </div>

            <div className="px-4 mt-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-12">
                        <FaArrowsRotate className="w-10 h-10 text-[#f26522] animate-spin" />
                    </div>
                ) : topics.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-[32px] border border-orange-100 shadow-soft">
                        <FaInbox className="text-4xl text-[#f26522]/40 mx-auto mb-3" />
                        <h3 className="text-lg font-black text-[#0c3b6b] mb-1">No Practice Sets</h3>
                        <p className="font-bold text-gray-400 text-sm">Practice questions will appear here once ready.</p>
                    </div>
                ) : (
                    topics.map(t => (
                        <div
                            key={t.id}
                            className="bg-white rounded-[28px] p-4 shadow-[0_6px_20px_rgba(12,59,107,0.06)] border border-orange-100/80 flex items-center justify-between hover:shadow-card transition-all"
                        >
                            <div className="w-13 h-13 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 mr-3.5 border border-orange-100">
                                <FaWandMagicSparkles className="w-6 h-6 text-[#f26522]" />
                            </div>

                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-black text-[#f26522] uppercase tracking-wider">{t.courseTitle}</p>
                                <h3 className="font-black text-[#0c3b6b] text-base leading-tight truncate">{t.title}</h3>
                                <div className="flex items-center gap-1 text-[11px] font-extrabold text-gray-400 mt-1">
                                    <FaStar className="w-3 h-3 text-yellow-500 fill-yellow-500" />
                                    <span>{t.totalQuestions} Questions</span>
                                </div>
                            </div>

                            <button
                                onClick={() => startModule(t.id)}
                                disabled={starting === t.id}
                                className="ml-3 shrink-0 bg-[#f26522] text-white font-black px-4 py-2 rounded-full shadow-[0_4px_0_0_#ad3c09] active:translate-y-0.5 active:shadow-none hover:bg-orange-600 transition-all text-xs disabled:opacity-50"
                            >
                                {starting === t.id ? '...' : 'START'}
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}


