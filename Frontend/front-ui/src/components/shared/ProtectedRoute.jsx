import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ allowedRoles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-kidBg">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-kidOrange border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-kidText font-bold">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
        // Redirect to appropriate home based on role
        if (user.role === 'STUDENT') return <Navigate to="/student/home" replace />;
        if (user.role === 'CONTENT_MANAGER') return <Navigate to="/admin/dashboard" replace />;
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
}
