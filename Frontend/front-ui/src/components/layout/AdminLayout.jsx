import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    Squares2X2Icon, BookOpenIcon, AcademicCapIcon,
    QuestionMarkCircleIcon, DocumentCheckIcon, ChartBarIcon,
    ClipboardDocumentCheckIcon, BellIcon, Cog6ToothIcon,
    MagnifyingGlassIcon, ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import { FaGraduationCap } from 'react-icons/fa';

const NAV_ITEMS = [
    { name: 'Dashboard', path: '/admin/dashboard', icon: Squares2X2Icon },
    { name: 'Lessons', path: '/admin/courses', icon: BookOpenIcon },
    { name: 'Question Bank', path: '/admin/question-bank', icon: AcademicCapIcon },
    { name: 'Quizzes', path: '/admin/quizzes', icon: QuestionMarkCircleIcon },
    { name: 'Mock Exams', path: '/admin/mock-exams', icon: DocumentCheckIcon },
];

const BOTTOM_NAV_ITEMS = [
    
];

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const displayName = user?.name || user?.email?.split('@')[0] || 'Content Manager';

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="flex h-screen bg-[#F8F9FB] overflow-hidden font-sans">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shrink-0 relative z-20">
                {/* Brand */}
                <div className="px-6 py-6 flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0F4C81] rounded-xl flex items-center justify-center">
                        <span className="text-xl text-white"><FaGraduationCap /></span>
                    </div>
                    <div>
                        <h2 className="font-extrabold text-[#0B3A63] text-lg leading-tight">Kuta Learning</h2>
                        <p className="text-[11px] font-bold text-gray-400">Teacher Portal</p>
                    </div>
                </div>

                {/* Primary Nav */}
                <nav className="flex-1 py-4 space-y-1 overflow-y-auto">
                    {NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-6 py-3 font-bold text-sm transition-all relative ${isActive
                                    ? 'bg-[#0F4C81] text-white rounded-r-full mr-4 shadow-md'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B3A63]'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* Secondary Nav + Logout */}
                <div className="border-t border-gray-100 py-4 space-y-1">
                    {BOTTOM_NAV_ITEMS.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-6 py-2.5 font-bold text-sm transition-all relative ${isActive
                                    ? 'bg-[#0F4C81] text-white rounded-r-full mr-4'
                                    : 'text-gray-500 hover:bg-gray-50 hover:text-[#0B3A63]'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5 shrink-0" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                    <button
                        onClick={handleLogout}
                        className="w-full mt-2 flex items-center gap-3 px-6 py-2.5 font-bold text-sm text-gray-500 hover:bg-red-50 hover:text-red-600 transition-all text-left"
                    >
                        <ArrowRightOnRectangleIcon className="w-5 h-5 shrink-0" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB]">
                {/* Top Header */}
                <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-end px-8 shrink-0 relative z-10">
                    {/* User Profile */}
                    <div className="flex items-center gap-4 ml-8 border-l border-gray-200 pl-8">
                        <div className="text-right">
                            <p className="font-extrabold text-[#0B3A63] text-sm">{displayName}</p>
                            <p className="text-[11px] font-bold text-gray-400">Content Manager</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[#0F4C81] flex items-center justify-center font-bold text-white shadow-sm ring-2 ring-white">
                            {displayName?.[0]?.toUpperCase() || 'C'}
                        </div>
                    </div>
                </header>

                {/* Outlet Wrapper */}
                <main className="flex-1 overflow-y-auto">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
