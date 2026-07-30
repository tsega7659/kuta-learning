import { NavLink } from 'react-router-dom';
import { HomeIcon, BookOpenIcon, PencilSquareIcon, PuzzlePieceIcon, UserIcon } from '@heroicons/react/24/outline';
import { HomeIcon as HomeSolid, BookOpenIcon as BookSolid, PencilSquareIcon as PencilSolid, PuzzlePieceIcon as PuzzleSolid, UserIcon as UserSolid } from '@heroicons/react/24/solid';

export default function BottomNav() {
    const navItems = [
        { name: 'Home', path: '/student/home', Outline: HomeIcon, Solid: HomeSolid },
        { name: 'Learn', path: '/student/courses', Outline: BookOpenIcon, Solid: BookSolid },
        { name: 'Practice', path: '/student/practice', Outline: PencilSquareIcon, Solid: PencilSolid },
        { name: 'Games', path: '/student/games', Outline: PuzzlePieceIcon, Solid: PuzzleSolid },
        { name: 'Profile', path: '/student/profile', Outline: UserIcon, Solid: UserSolid },
    ];

    return (
        <div className="fixed bottom-0 w-full max-w-md bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.05)] px-4 py-2 z-50">
            <div className="flex justify-between items-center">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex flex-col items-center p-2 rounded-xl transition-all ${isActive ? 'text-kidOrange' : 'text-gray-400 hover:text-gray-600'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <>
                                <div className={`relative px-4 py-1.5 rounded-full flex flex-col items-center justify-center transition-all ${isActive ? 'text-white' : ''}`}>
                                    {isActive && <div className="absolute inset-0 bg-[#f88125] rounded-[18px]"></div>}
                                    <div className="relative z-10 flex flex-col items-center">
                                        {isActive ? <item.Outline className="w-[22px] h-[22px] mb-1" /> : <item.Outline className="w-[22px] h-[22px] mb-1 text-gray-500" />}
                                        <span className={`text-[10px] font-bold tracking-wide ${isActive ? 'text-white' : 'text-gray-500'}`}>{item.name}</span>
                                    </div>
                                </div>
                            </>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}
