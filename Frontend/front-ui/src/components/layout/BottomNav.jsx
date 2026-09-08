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
        <div className="fixed bottom-3 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
            <div className="w-full max-w-[390px] bg-white/95 backdrop-blur-md rounded-[32px] shadow-[0_10px_35px_rgba(12,59,107,0.14)] border border-orange-100 px-3 py-2 flex justify-between items-center pointer-events-auto">
                {navItems.map((item) => (
                    <NavLink
                        key={item.name}
                        to={item.path}
                        className={({ isActive }) =>
                            `flex-1 flex flex-col items-center py-1.5 px-2 rounded-[22px] transition-all duration-200 ${
                                isActive ? 'text-[#f26522]' : 'text-gray-400 hover:text-[#0c3b6b]'
                            }`
                        }
                    >
                        {({ isActive }) => (
                            <div className="flex flex-col items-center">
                                <div
                                    className={`w-11 h-8 rounded-full flex items-center justify-center transition-all ${
                                        isActive ? 'bg-[#fff0e6] text-[#f26522] shadow-sm' : 'text-gray-400'
                                    }`}
                                >
                                    <item.Icon className="w-5 h-5 transition-transform active:scale-90" />
                                </div>
                                <span className={`text-[11px] font-extrabold mt-0.5 tracking-tight ${
                                    isActive ? 'text-[#f26522]' : 'text-gray-400 font-bold'
                                }`}>
                                    {item.name}
                                </span>
                            </div>
                        )}
                    </NavLink>
                ))}
            </div>
        </div>
    );
}


