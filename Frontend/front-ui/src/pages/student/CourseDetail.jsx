import { useNavigate } from 'react-router-dom';
import { ChevronLeftIcon, CheckCircleIcon, LockClosedIcon } from '@heroicons/react/24/solid';
import { PlayIcon } from '@heroicons/react/24/outline';

export default function CourseDetail() {
    const navigate = useNavigate();

    return (
        <div className="bg-white min-h-screen">

            {/* Hero Header */}
            <div className="bg-kidPrimary rounded-b-[40px] px-6 pt-12 pb-16 relative shadow-lg text-center">
                <button onClick={() => navigate(-1)} className="absolute top-6 left-4 bg-white/20 p-2 rounded-full text-white hover:bg-white/30 backdrop-blur-sm">
                    <ChevronLeftIcon className="w-6 h-6" />
                </button>

                <h2 className="text-white/80 font-bold tracking-widest text-sm mb-2 uppercase">Kuta Learning</h2>
                <h1 className="text-4xl font-black text-white mb-3">English<br />Adventure</h1>
                <p className="text-white/90 text-sm font-medium mb-6">Master the alphabet and basic words<br />in this fun journey!</p>

                <div className="w-3/4 h-24 bg-blue-300/30 rounded-2xl mx-auto flex items-center justify-center border-4 border-white/20 overflow-hidden shadow-inner">
                    <span className="text-5xl">🏰</span>
                </div>
            </div>

            {/* Path Map container */}
            <div className="px-6 -mt-8 relative z-10 space-y-4 pb-12">

                {/* Node 1: Completed */}
                <div className="bg-white rounded-3xl p-4 shadow-soft border-2 border-green-100 flex items-center gap-4 cursor-pointer">
                    <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center relative shrink-0">
                        <CheckCircleIcon className="w-8 h-8 text-green-500" />
                        <div className="absolute -bottom-1 -right-1 bg-yellow-400 rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold border-2 border-white text-white">1</div>
                    </div>
                    <div className="flex-1">
                        <h3 className="font-extrabold text-kidText text-lg">Unit 1: The Alphabet</h3>
                        <p className="text-xs font-bold text-green-500">Completed!</p>
                    </div>
                </div>

                {/* Path Connector Line */}
                <div className="w-1 h-8 bg-gray-200 mx-auto -my-2 rounded-full" />

                {/* Node 2: Active (Current focus pointing to LessonView) */}
                <div onClick={() => navigate('/student/lessons/1')} className="bg-white rounded-3xl p-5 shadow-lg border-2 border-kidOrange flex flex-col items-center gap-2 cursor-pointer transform scale-105 my-2">
                    <div className="text-kidOrange font-bold text-xs uppercase tracking-widest">Next Lesson</div>
                    <div className="flex w-full items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center shrink-0 border-4 border-orange-50 relative shadow-btn">
                            <PlayIcon className="w-8 h-8 text-kidOrange translate-x-0.5" />
                        </div>
                        <div className="flex-1">
                            <h3 className="font-extrabold text-kidText text-xl">Unit 2: Colors</h3>
                            <p className="text-sm font-bold text-gray-400">All About Blue!</p>
                        </div>
                    </div>

                    <div className="w-full bg-gray-100 h-2 rounded-full mt-2">
                        <div className="bg-kidOrange h-2 rounded-full w-1/4"></div>
                    </div>
                </div>

                <div className="w-1 h-8 bg-gray-200 mx-auto -my-2 rounded-full" />

                {/* Node 3: Locked */}
                <div className="bg-gray-50 opacity-70 rounded-3xl p-4 border border-gray-200 flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-gray-200 flex items-center justify-center shrink-0">
                        <LockClosedIcon className="w-6 h-6 text-gray-400" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-extrabold text-gray-500 text-lg">Unit 3: Animals</h3>
                        <p className="text-xs font-bold text-gray-400">Locked</p>
                    </div>
                </div>

            </div>

        </div>
    );
}
