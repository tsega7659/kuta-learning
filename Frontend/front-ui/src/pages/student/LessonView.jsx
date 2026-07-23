import { useNavigate } from 'react-router-dom';
import { SpeakerWaveIcon, PlayCircleIcon } from '@heroicons/react/24/solid';

export default function LessonView() {
    const navigate = useNavigate();

    return (
        <div className="bg-[#FFFDF9] min-h-screen px-5 pt-8 pb-32">

            <h2 className="text-kidOrange font-bold text-sm tracking-widest uppercase mb-1">Kuta Learning</h2>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-black text-kidPrimary mb-2">The Color Blue!</h1>
                <p className="text-gray-500 font-bold text-sm">Let's explore the beautiful blue world together!</p>
            </div>

            {/* Audio Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-soft text-center mb-6 border-b-8 border-blue-100">
                <h3 className="font-extrabold text-kidPrimary text-lg mb-4">Hear the Word</h3>
                <button className="w-24 h-24 mx-auto bg-blue-100 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-btn mb-4 border-4 border-white ring-4 ring-blue-50">
                    <SpeakerWaveIcon className="w-12 h-12 text-kidPrimary" />
                </button>
                <span className="font-black text-3xl tracking-widest text-kidPrimary">BLUE</span>
            </div>

            {/* Video Card */}
            <div className="bg-blue-50 rounded-[32px] p-4 shadow-soft mb-6 pb-6">
                <div className="flex justify-between items-center mb-3 px-2">
                    <h3 className="font-extrabold text-kidPrimary text-lg">Watch & Learn</h3>
                    <PlayCircleIcon className="w-6 h-6 text-kidPrimary" />
                </div>
                <div className="w-full aspect-video bg-gray-900 rounded-2xl relative overflow-hidden shadow-md flex items-center justify-center">
                    <img src="https://images.unsplash.com/photo-1682687220198-88e9bdea9931?auto=format&fit=crop&w=600&q=80" alt="Underwater" className="absolute inset-0 w-full h-full object-cover opacity-60" />
                    <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center z-10 shadow-lg cursor-pointer">
                        <PlayCircleIcon className="w-10 h-10 text-kidPrimary translate-x-0.5" />
                    </div>
                </div>
            </div>

            {/* Visual Examples */}
            <div className="bg-white rounded-[32px] p-5 shadow-soft mb-8">
                <h3 className="font-extrabold text-kidOrange text-lg mb-4">Blue Things</h3>

                <div className="space-y-4">
                    {/* Card 1 */}
                    <div className="h-40 rounded-2xl overflow-hidden relative shadow-sm">
                        <img src="https://images.unsplash.com/photo-1552728089-571ebd6a45ad?auto=format&fit=crop&w=600&q=80" alt="Blue Bird" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur text-center py-2 font-bold text-kidText">Blue Bird</div>
                    </div>

                    {/* Card 2 */}
                    <div className="h-40 rounded-2xl overflow-hidden relative shadow-sm">
                        <img src="https://images.unsplash.com/photo-1491295982759-99a384df86b4?auto=format&fit=crop&w=600&q=80" alt="Blueberries" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 w-full bg-white/90 backdrop-blur text-center py-2 font-bold text-kidText">Blueberries</div>
                    </div>
                </div>
            </div>

            {/* Bottom Action */}
            <button
                onClick={() => navigate('/student/quiz/color')}
                className="kid-btn bg-kidPrimary shadow-[0_6px_0_0_#2563eb]"
            >
                <span>TAKE QUIZ</span>
                <span className="text-2xl">✨</span>
            </button>

        </div>
    );
}
