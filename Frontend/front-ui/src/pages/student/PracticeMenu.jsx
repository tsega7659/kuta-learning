import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaWandMagicSparkles, FaArrowsRotate, FaInbox } from 'react-icons/fa6';
import api from '../../services/api';

export default function PracticeMenu() {
    const [topics, setTopics] = useState([]);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        api.get('/practice/topics')
            .then(res => setTopics(res.data))
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
        <div className="min-h-screen bg-[#FFFDF9] pb-32">
            <div className="bg-kidPrimary pt-16 pb-12 px-6 rounded-b-[48px] shadow-lg relative">
                <h2 className="text-white/80 font-bold tracking-widest text-sm uppercase text-center mb-6">Question Bank</h2>
                <h1 className="text-3xl font-extrabold text-white text-center">Practice Modules</h1>
                <p className="text-blue-100 font-bold text-sm mt-3 text-center">
                    Pick a topic to generate a random 10-question practice test!
                </p>
            </div>

            <div className="px-5 mt-6 space-y-4">
                {loading ? (
                    <div className="flex justify-center py-10">
                        <FaArrowsRotate className="w-8 h-8 text-kidOrange animate-spin" />
                    </div>
                ) : topics.length === 0 ? (
                    <div className="text-center p-8 bg-white rounded-[32px] border border-gray-100 shadow-soft">
                        <FaInbox className="text-4xl text-gray-400 mx-auto mb-4" />
                        <p className="font-bold text-gray-500">No practice questions available yet.</p>
                    </div>
                ) : (
                    topics.map(t => (
                        <div key={t.id} className="bg-white rounded-[32px] p-5 shadow-soft border border-gray-100 flex items-center hover:scale-[1.02] transition-transform">
                            <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center shrink-0 mr-4">
                                <FaWandMagicSparkles className="w-8 h-8 text-kidOrange" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t.courseTitle}</p>
                                <h3 className="font-extrabold text-kidText text-lg leading-tight truncate">{t.title}</h3>
                                <p className="text-xs font-bold text-kidPrimary mt-1">{t.totalQuestions} Questions Available</p>
                            </div>
                            <button
                                onClick={() => startModule(t.id)}
                                disabled={starting === t.id}
                                className="ml-3 shrink-0 bg-kidPrimary text-white font-bold px-4 py-2 rounded-full shadow-[0_4px_0_0_#2563eb] active:translate-y-1 active:shadow-none hover:bg-blue-600 transition-all disabled:opacity-50"
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
