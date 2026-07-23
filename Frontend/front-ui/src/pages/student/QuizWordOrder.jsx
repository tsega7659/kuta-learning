import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { XMarkIcon } from '@heroicons/react/24/outline';

export default function QuizWordOrder() {
    const navigate = useNavigate();
    // We want to spell BLUE
    const targetWord = "BLUE";
    const [lettersInSlots, setLettersInSlots] = useState([null, null, null, null]);
    const [availableBank, setAvailableBank] = useState([
        { id: 1, char: 'B', color: 'bg-blue-400' },
        { id: 2, char: 'E', color: 'bg-cyan-400' },
        { id: 3, char: 'L', color: 'bg-indigo-400' },
        { id: 4, char: 'U', color: 'bg-blue-500' },
    ]);

    const handleTapBank = (item) => {
        // Find first empty slot
        const emptyIndex = lettersInSlots.indexOf(null);
        if (emptyIndex !== -1) {
            const newSlots = [...lettersInSlots];
            newSlots[emptyIndex] = item;
            setLettersInSlots(newSlots);
            setAvailableBank(availableBank.filter(b => b.id !== item.id));
        }
    };

    const handleTapSlot = (item, index) => {
        if (item) {
            const newSlots = [...lettersInSlots];
            newSlots[index] = null;
            setLettersInSlots(newSlots);
            setAvailableBank([...availableBank, item]);
        }
    };

    const submit = () => {
        navigate('/student/quiz/result');
    };

    const isComplete = lettersInSlots.every(slot => slot !== null);

    return (
        <div className="bg-white min-h-screen px-5 pt-8 pb-32">
            <div className="flex justify-between items-center mb-8">
                <h2 className="text-kidOrange font-bold text-sm tracking-widest uppercase">Kuta Learning</h2>
                <button onClick={() => navigate(-1)} className="bg-gray-100 p-2 rounded-full">
                    <XMarkIcon className="w-5 h-5 font-bold text-gray-500" />
                </button>
            </div>

            {/* Progress Bar */}
            <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-400">Word Challenge</span>
                <span className="text-xs font-bold text-kidOrange">4 of 5</span>
            </div>
            <div className="w-full bg-gray-100 h-2 rounded-full mb-10 overflow-hidden">
                <div className="bg-kidOrange h-2 rounded-full w-4/5"></div>
            </div>

            <div className="text-center mb-10">
                <h1 className="text-3xl font-extrabold text-kidText mb-3">Spell the word!</h1>
                <p className="text-gray-500 font-bold">Tap the letters to put them in the boxes.</p>
            </div>

            {/* Target Image Reference */}
            <div className="w-32 h-32 mx-auto bg-blue-100 rounded-3xl border-4 border-blue-50 flex items-center justify-center mb-10 shadow-inner text-6xl">
                🟦
            </div>

            {/* Slots */}
            <div className="flex justify-center gap-3 mb-16">
                {lettersInSlots.map((item, i) => (
                    <div
                        key={i}
                        onClick={() => handleTapSlot(item, i)}
                        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl font-black transition-all shadow-sm ${item
                                ? `${item.color} text-white transform scale-105 shadow-md`
                                : 'border-4 border-dashed border-gray-200 text-gray-300'
                            }`}
                    >
                        {item ? item.char : '?'}
                    </div>
                ))}
            </div>

            {/* Bank */}
            <div className="flex justify-center gap-3">
                {availableBank.map(item => (
                    <button
                        key={item.id}
                        onClick={() => handleTapBank(item)}
                        className={`w-16 h-16 rounded-2xl ${item.color} text-white font-black text-3xl shadow-btn transform active:scale-95 transition-transform`}
                    >
                        {item.char}
                    </button>
                ))}
            </div>

            <div className="fixed bottom-24 left-0 w-full px-5">
                {isComplete && (
                    <button
                        className="kid-btn shadow-[0_6px_0_0_#c2410c] animate-bounce"
                        onClick={submit}
                    >
                        CHECK WORD
                    </button>
                )}
            </div>
        </div>
    );
}
