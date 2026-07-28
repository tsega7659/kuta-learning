import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
    HomeIcon,
    UserGroupIcon,
    BookOpenIcon,
    ChartBarIcon,
    ArrowRightOnRectangleIcon,
} from '@heroicons/react/24/outline';

export default function AdminLayout() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const navItems = [
        { name: 'Dashboard', path: '/admin/dashboard', icon: HomeIcon },
        { name: 'Students', path: '/admin/students', icon: UserGroupIcon },
        { name: 'Courses', path: '/admin/courses', icon: BookOpenIcon },
        { name: 'Progress', path: '/admin/progress', icon: ChartBarIcon },
    ];

    return (
        <div className="flex min-h-screen bg-gray-50">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col shadow-sm">
                {/* Brand */}
                <div className="p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-kidOrange rounded-xl flex items-center justify-center">
                            <span className="text-xl">📚</span>
                        </div>
                        <div>
                            <h2 className="font-black text-kidText text-lg leading-tight">Kuta</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Content Manager</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.name}
                            to={item.path}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm transition-all ${isActive
                                    ? 'bg-orange-50 text-kidOrange'
                                    : 'text-gray-400 hover:bg-gray-50 hover:text-kidText'
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.name}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* User + Logout */}
                <div className="p-4 border-t border-gray-100">
                    <div className="flex items-center gap-3 mb-3">
                        <div className="w-9 h-9 bg-kidOrange/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-bold text-kidOrange">
                                {user?.email?.[0]?.toUpperCase() || 'A'}
                            </span>
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-kidText truncate">{user?.email}</p>
                            <p className="text-[10px] text-gray-400 font-bold">Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 text-gray-400 hover:text-red-500 transition text-sm font-bold w-full px-4 py-2 rounded-xl hover:bg-red-50"
                    >
                        <ArrowRightOnRectangleIcon className="w-4 h-4" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto">
                <Outlet />
            </main>
        </div>
    );
}
