import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SpeakerWaveIcon, PlayCircleIcon, ChevronLeftIcon, CheckCircleIcon } from '@heroicons/react/24/solid';
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
                // We need to get lesson info. Since we don't have a direct /lessons/:id endpoint,
                // we'll call the lesson content endpoint using a workaround
                // For now, let's just display lesson id info and any contents
                setLesson({ id, title: 'Lesson', description: '' });
                setLoading(false);
            } catch (err) {
                console.error(err);
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
            <div className="flex items-center justify-center min-h-[60vh]">
                <div className="w-12 h-12 border-4 border-kidOrange border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="bg-[#FFFDF9] min-h-screen px-5 pt-8 pb-32">
            {/* Back Button */}
            <div className="flex justify-between items-center mb-6">
                <button onClick={() => navigate(-1)} className="bg-gray-100 p-2 rounded-full">
                    <ChevronLeftIcon className="w-5 h-5 text-gray-500" />
                </button>
                <h2 className="text-kidOrange font-bold text-sm tracking-widest uppercase">Kuta Learning</h2>
                <div className="w-9"></div>
            </div>

            <div className="text-center mb-8">
                <h1 className="text-3xl font-black text-kidPrimary mb-2">Lesson</h1>
                <p className="text-gray-500 font-bold text-sm">Let's learn something new!</p>
            </div>

            {/* Audio Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-soft text-center mb-6 border-b-8 border-blue-100">
                <h3 className="font-extrabold text-kidPrimary text-lg mb-4">Hear the Word</h3>
                <button className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-btn mb-4 border-4 border-white ring-4 ring-blue-50">
                    <SpeakerWaveIcon className="w-12 h-12 text-kidPrimary" />
                </button>
            </div>

            {/* Video Card */}
            <div className="bg-blue-50 rounded-[32px] p-4 shadow-soft mb-6 pb-6">
                <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="font-extrabold text-kidPrimary text-lg">Watch & Learn</h3>
                    <PlayCircleIcon className="w-6 h-6 text-kidPrimary" />
                </div>
                <div className="w-full aspect-video bg-gray-900 rounded-2xl relative overflow-hidden shadow-md flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1682687220198-88e9bdea9931?auto=format&fit=crop&w=600&q=80" alt="Lesson" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center z-10 shadow-lg cursor-pointer">
                        <PlayCircleIcon className="w-10 h-10 text-kidPrimary translate-x-0.5" />
                    </div>
                </div>
            </div>

            {/* Complete Button */}
            <div className="space-y-3">
                {completed ? (
                    <div className="flex items-center justify-center gap-2 bg-green-50 text-green-600 font-bold py-4 rounded-2xl border-2 border-green-100">
                        <CheckCircleIcon className="w-6 h-6" />
                        <span>Lesson Completed! 🎉</span>
                    </div>
                ) : (
                    <button
                        onClick={handleComplete}
                        disabled={completing}
                        className="kid-btn bg-kidGreen shadow-[0_6px_0_0_#16a34a]"
                    >
                        {completing ? 'Saving...' : '✅ Mark as Complete'}
                    </button>
                )}

                <button
                    onClick={() => navigate('/student/quiz/color')}
                    className="kid-btn bg-kidPrimary shadow-[0_6px_0_0_#2563eb]"
                >
                    <span>TAKE QUIZ</span>
                    <span className="text-2xl">✨</span>
                </button>
            </div>
        </div>
    );
}
