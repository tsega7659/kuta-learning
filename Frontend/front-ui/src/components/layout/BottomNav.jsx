import { NavLink } from 'react-router-dom';
import { FaHouse, FaBookOpen, FaPenToSquare, FaUser } from 'react-icons/fa6';

export default function BottomNav() {
    const navItems = [
        { name: 'Home', path: '/student/home', Icon: FaHouse },
        { name: 'Learn', path: '/student/courses', Icon: FaBookOpen },
        { name: 'Practice', path: '/student/practice', Icon: FaPenToSquare },
        { name: 'Profile', path: '/student/profile', Icon: FaUser },
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
                                        <item.Icon className={`w-[22px] h-[22px] mb-1 ${isActive ? 'text-white' : 'text-gray-500'}`} />
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
