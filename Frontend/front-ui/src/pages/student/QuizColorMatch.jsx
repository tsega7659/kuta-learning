import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CheckCircleIcon } from '@heroicons/react/24/solid';

export default function QuizColorMatch() {
    const navigate = useNavigate();
    const [selected, setSelected] = useState([]);

    const items = [
        { id: 1, name: 'Red Apple', color: 'border-red-500', isTarget: false, icon: '🍎' },
        { id: 2, name: 'Blue Car', color: 'border-blue-500', isTarget: true, icon: '🚙' },
        { id: 3, name: 'Yellow Sun', color: 'border-yellow-400', isTarget: false, icon: '☀️' },
        { id: 4, name: 'Blue Butterfly', color: 'border-blue-500', isTarget: true, icon: '🦋' },
        { id: 5, name: 'Green Leaf', color: 'border-green-500', isTarget: false, icon: '🍃' },
        { id: 6, name: 'Blue Ball', color: 'border-blue-500', isTarget: true, icon: '🏐' },
    ];

    const toggleSelect = (id) => {
        if (selected.includes(id)) {
            setSelected(selected.filter(i => i !== id));
        } else {
            setSelected([...selected, id]);
        }
    };

    const checkAnswer = () => {
        // In a real app we'd validate here
        navigate('/student/quiz/word');
    };

    return (
        <div className="bg-[#E7F6FF] min-h-screen px-5 pt-8 pb-32">
            <h2 className="text-kidOrange font-bold text-sm tracking-widest uppercase mb-6 text-center">Kuta Learning</h2>

            <div className="text-center mb-8">
                <h1 className="text-4xl font-extrabold text-kidText mb-3">
                    Can you find the <span className="text-kidPrimary underline decoration-4 underline-offset-4">Blue</span> items?
                </h1>
                <p className="text-gray-500 font-bold">Tap every blue thing you see!</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-10">
                {items.map(item => {
                    const isSelected = selected.includes(item.id);
                    return (
                        <div
                            key={item.id}
                            onClick={() => toggleSelect(item.id)}
                            className={`bg-white rounded-3xl p-4 flex flex-col items-center justify-center cursor-pointer transition-all border-b-8 ${isSelected ? 'ring-4 ring-kidPrimary scale-105' : ''
                                } ${item.color}`}
                        >
                            <div className="text-5xl mb-3 relative">
                                {item.icon}
                                {isSelected && (
                                    <CheckCircleIcon className="w-8 h-8 text-kidPrimary absolute -right-4 -bottom-2 bg-white rounded-full border-2 border-white" />
                                )}
                            </div>
                            <span className="font-extrabold text-sm text-kidText">{item.name}</span>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={checkAnswer}
                disabled={selected.length === 0}
                className={`kid-btn shadow-[0_6px_0_0_#c2410c] ${selected.length === 0 ? 'opacity-50' : 'opacity-100'}`}
            >
                <span>CHECK ANSWER</span>
            </button>

        </div>
    );
}
