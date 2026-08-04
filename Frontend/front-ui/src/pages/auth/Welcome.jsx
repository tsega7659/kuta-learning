import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const slides = [
    {
        title: 'Excel in Your Exams',
        description: 'Personalized learning paths for Grade 6 to 8. Master complex topics with interactive practice and expert guidance.',
    },
    {
        title: 'Learn at Your Pace',
        description: 'Interactive lessons with videos, audio and quizzes designed to keep you engaged and motivated every day.',
    },
    {
        title: 'Track Your Progress',
        description: 'See how far you\'ve come. Complete lessons, earn badges and show your achievements to the world!',
    },
];

export default function Welcome() {
    const [current, setCurrent] = useState(0);
    const navigate = useNavigate();

    const handleNext = () => {
        if (current < slides.length - 1) {
            setCurrent(current + 1);
        } else {
            navigate('/register');
        }
    };

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#edf4ff_0%,#f9f6ee_100%)] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white/80 shadow-[0_20px_60px_rgba(36,78,138,0.12)] border border-white/70 p-5 sm:p-7 backdrop-blur-sm">
                <div className="flex items-center justify-between mb-5">
                    <div>
                        <p className="text-[11px] font-extrabold uppercase tracking-[0.24em] text-blue-700">Welcome / Onboarding</p>
                    </div>
                    <div className="w-10 h-10 rounded-2xl bg-white shadow-md border border-orange-100 flex items-center justify-center text-xl">🧮</div>
                </div>

                <div className="rounded-[26px] bg-[linear-gradient(135deg,#eef6ff,#f8f5ee)] p-4 sm:p-5 border border-sky-100">
                    <div className="flex items-center justify-center mb-5">
                        <div className="w-16 h-16 rounded-[20px] bg-[#f26c24] text-white text-3xl shadow-lg shadow-orange-200/70 flex items-center justify-center">📖</div>
                    </div>
                    <img
                        src="https://res.cloudinary.com/demo/image/upload/v1/docs/young-students-studying.jpg"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80';
                        }}
                        alt="Students learning"
                        className="w-full h-[240px] object-cover rounded-[22px]"
                    />
                </div>

                <div className="mt-6 text-center">
                    <h1 className="text-[30px] font-black text-[#0f4c81] leading-tight mb-2">{slides[current].title}</h1>
                    <p className="text-[15px] text-gray-600 font-medium leading-relaxed">{slides[current].description}</p>
                </div>

                <div className="flex justify-center gap-2 mt-6 mb-6">
                    {slides.map((_, i) => (
                        <button
                            key={i}
                            type="button"
                            onClick={() => setCurrent(i)}
                            className={`h-2 rounded-full transition-all ${i === current ? 'w-6 bg-[#f26c24]' : 'w-2 bg-orange-200'}`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>

                <button
                    onClick={handleNext}
                    className="w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full shadow-[0_10px_20px_rgba(242,108,36,0.3)] hover:bg-[#e05b13] transition transform active:scale-95 text-[17px]"
                >
                    {current < slides.length - 1 ? 'Next' : 'Get Started'} →
                </button>

                <div className="mt-5 text-center">
                    <Link to="/login" className="text-[14px] font-bold text-gray-500 hover:text-gray-800 transition">
                        Already have an account? <span className="text-blue-600">Login</span>
                    </Link>
                </div>
            </div>
        </div>
    );
}
