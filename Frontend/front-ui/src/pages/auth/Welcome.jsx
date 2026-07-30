import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

const slides = [
    {
        title: "Excel in Your Exams",
        description: "Personalized learning paths for Grade 6 to 8. Master complex topics with interactive practice and expert guidance.",
    },
    {
        title: "Learn at Your Pace",
        description: "Interactive lessons with videos, audio and quizzes designed to keep you engaged and motivated every day.",
    },
    {
        title: "Track Your Progress",
        description: "See how far you've come. Complete lessons, earn badges and show your achievements to the world!",
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
        <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-orange-100 flex flex-col items-center justify-between p-6 relative overflow-hidden">

            {/* Floating icon top-right */}
            <div className="absolute top-8 right-6 bg-white p-3 rounded-2xl shadow-md border border-orange-100 z-10">
                <span className="text-2xl leading-none">🧮</span>
            </div>

            {/* Main content center */}
            <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm">

                {/* Hero Illustration Card */}
                <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-4 shadow-lg border border-white w-full mb-8 relative">

                    {/* Floating book icon bottom-left */}
                    <div className="absolute -bottom-5 left-5 bg-white p-2.5 rounded-2xl shadow-md border border-green-100 z-10">
                        <span className="text-xl leading-none">📖</span>
                    </div>

                    <img
                        src="https://res.cloudinary.com/demo/image/upload/v1/docs/young-students-studying.jpg"
                        onError={(e) => {
                            e.target.onerror = null;
                            e.target.src = "https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=600&q=80";
                        }}
                        alt="Students learning"
                        className="w-full h-[200px] object-cover rounded-2xl"
                    />
                </div>

                {/* Text */}
                <div className="text-center px-4 mt-8 mb-6">
                    <h1 className="text-[28px] font-black text-gray-900 mb-3 leading-tight">
                        {slides[current].title}
                    </h1>
                    <p className="text-gray-600 font-medium text-[15px] leading-relaxed">
                        {slides[current].description}
                    </p>
                </div>

                {/* Dots indicator */}
                <div className="flex gap-2 mb-8">
                    {slides.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrent(i)}
                            className={`h-2 rounded-full transition-all cursor-pointer ${i === current
                                    ? 'w-6 bg-[#b35616]'
                                    : 'w-2 bg-orange-200'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Bottom CTA */}
            <div className="w-full max-w-sm space-y-3">
                <button
                    onClick={handleNext}
                    className="w-full bg-[#f26c24] text-white font-bold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 shadow-lg shadow-orange-400/30 text-[17px] flex justify-center items-center gap-2"
                >
                    {current < slides.length - 1 ? 'Next' : 'Get Started'} <span className="text-xl">→</span>
                </button>
                <div className="text-center">
                    <Link to="/login" className="text-[14px] font-bold text-gray-500 hover:text-gray-800 transition">
                        Already have an account? <span className="text-blue-600">Login</span>
                    </Link>
                </div>
            </div>

        </div>
    );
}
