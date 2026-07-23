import { useNavigate } from 'react-router-dom';
import { SparklesIcon, CheckBadgeIcon } from '@heroicons/react/24/solid';

export default function HomeProfile() {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen pb-32">
            {/* Blue Header Zone */}
            <div className="bg-kidPrimary pt-16 pb-24 px-6 rounded-b-[48px] shadow-lg relative">
                <h2 className="text-white/80 font-bold tracking-widest text-sm uppercase text-center mb-6">Kuta Learning</h2>

                <div className="absolute top-16 right-6 bg-white/20 px-3 py-1.5 rounded-full flex gap-1 items-center">
                    <span className="text-yellow-300">★</span>
                    <span className="text-white font-bold">1,250</span>
                </div>

                <div className="flex items-center gap-4">
                    <div className="w-20 h-20 bg-white rounded-full border-4 border-blue-200 shadow-lg flex justify-center items-center overflow-hidden">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Leo" alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-extrabold text-white">Hey, Little<br />Explorer!</h1>
                        <p className="text-blue-100 font-bold text-sm mt-1">Ready for a new adventure?</p>
                    </div>
                </div>
            </div>

            {/* Main Content (overlapping header) */}
            <div className="px-5 -mt-12 space-y-6 relative z-10">

                {/* Continue Playing Card */}
                <div
                    onClick={() => navigate('/student/courses/1')}
                    className="bg-white rounded-[32px] p-5 shadow-soft border border-gray-100 cursor-pointer hover:scale-[1.02] transition-transform"
                >
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-extrabold text-kidText text-lg">English Fun</h3>
                        <span className="bg-orange-100 text-kidOrange font-bold px-3 py-1 rounded-full text-xs">Unit 2</span>
                    </div>
                    <p className="text-gray-400 font-bold text-sm mb-4">Learn basic words and sounds.</p>
                    <div className="flex gap-2 items-center">
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-kidOrange h-3 rounded-full w-[40%]"></div>
                        </div>
                        <span className="text-xs font-bold text-gray-400">40%</span>
                    </div>
                </div>

                {/* Math Progress Card */}
                <div className="bg-white rounded-[32px] p-5 shadow-soft border border-gray-100">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-extrabold text-kidText text-lg">Super Science</h3>
                        <CheckBadgeIcon className="w-6 h-6 text-green-500" />
                    </div>
                    <div className="flex gap-2 items-center">
                        <div className="w-full bg-gray-100 h-3 rounded-full overflow-hidden">
                            <div className="bg-green-500 h-3 rounded-full w-[90%]"></div>
                        </div>
                        <span className="text-xs font-bold text-gray-400">90%</span>
                    </div>
                </div>

                {/* Badges Earned */}
                <div>
                    <h3 className="font-extrabold text-kidText text-lg mb-4 flex items-center gap-2">
                        Badges Earned <SparklesIcon className="w-5 h-5 text-yellow-400" />
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-yellow-50 border-2 border-yellow-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-soft">
                            <span className="text-4xl mb-2">⭐</span>
                            <span className="font-bold text-kidText text-xs">First Star</span>
                        </div>
                        <div className="bg-purple-50 border-2 border-purple-100 rounded-2xl p-4 flex flex-col items-center justify-center shadow-soft">
                            <span className="text-4xl mb-2">🧩</span>
                            <span className="font-bold text-kidText text-xs">Puzzle Master</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
