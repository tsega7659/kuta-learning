import { useNavigate } from 'react-router-dom';
import { StarIcon } from '@heroicons/react/24/solid';

export default function QuizResult() {
    const navigate = useNavigate();

    return (
        <div className="bg-[#FFFDF9] min-h-screen px-5 flex flex-col items-center pt-16 pb-32">
            <h2 className="text-kidOrange font-bold text-sm tracking-widest uppercase mb-10 text-center">Kuta Learning</h2>

            {/* Trophy / Image */}
            <div className="w-48 h-48 bg-yellow-100 rounded-full border-8 border-white shadow-xl flex items-center justify-center mb-8 relative">
                <span className="text-8xl">🏆</span>
                <div className="absolute top-0 right-0 animate-spin-slow">✨</div>
            </div>

            <h1 className="text-4xl font-extrabold text-kidText mb-2">You're a Star!</h1>
            <p className="text-gray-500 font-bold text-center px-4 mb-8">
                Awesome job! You've learned all about the color <span className="text-kidPrimary">Blue</span>.
            </p>

            {/* Score */}
            <div className="flex flex-col items-center mb-16">
                <div className="text-5xl font-black text-kidPrimary mb-3 border-b-4 border-kidPrimary pb-2">
                    5/5
                </div>
                <div className="flex space-x-1">
                    {[1, 2, 3, 4, 5].map(s => (
                        <StarIcon key={s} className="w-8 h-8 text-yellow-400" />
                    ))}
                </div>
            </div>

            <div className="w-full space-y-4">
                <button
                    onClick={() => navigate('/student/courses')}
                    className="kid-btn bg-kidPrimary shadow-[0_6px_0_0_#2563eb]"
                >
                    NEXT LESSON
                </button>
                <button
                    onClick={() => navigate('/student/courses/1')}
                    className="kid-btn border-4 border-kidPrimary bg-white text-kidPrimary shadow-[0_6px_0_0_#2563eb] hover:bg-gray-50"
                >
                    GO BACK
                </button>
            </div>
        </div>
    );
}
