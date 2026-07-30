import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { FcGoogle } from 'react-icons/fc';
import { FaApple } from 'react-icons/fa';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const user = await login(email, password);
            if (user.role === 'STUDENT') {
                navigate('/student/home');
            } else {
                navigate('/admin/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-orange-100 flex flex-col items-center justify-center p-4">

            <div className="w-full max-w-[400px]">
                {/* Form Card */}
                <div className="bg-[#F8F9FA] rounded-[32px] p-8 shadow-sm border border-gray-100/50">
                    <div className="text-center mb-8">
                        <h1 className="text-[28px] font-medium text-gray-900 leading-tight mb-2">Welcome Back</h1>
                        <p className="text-gray-600 font-medium text-[15px]">Continue your journey to mastery</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[14px] font-bold text-gray-700 mb-2">Email Address</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-2xl border-none focus:ring-2 focus:ring-kidOrange transition text-gray-800 font-medium"
                                    placeholder="student@example.com"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[14px] font-bold text-gray-700 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-12 pr-12 py-3.5 bg-gray-50/50 rounded-2xl border-none focus:ring-2 focus:ring-kidOrange transition text-gray-800 font-medium"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                            <p className="text-[11px] text-gray-500 mt-2 font-medium">Minimum 8 characters with a mix of letters and numbers.</p>
                        </div>

                        <div className="flex justify-end">
                            <a href="#" className="text-sm font-bold text-blue-600 hover:underline">Forgot Password?</a>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#f26c24] text-white font-bold py-4 rounded-full mt-2 hover:bg-[#e05b13] transition transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Logging in...' : 'Login'}
                        </button>
                    </form>

                    <div className="flex items-center my-6">
                        <div className="flex-1 border-t border-gray-200"></div>
                        <span className="px-3 text-xs text-gray-500 font-medium whitespace-nowrap">or continue with</span>
                        <div className="flex-1 border-t border-gray-200"></div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <button type="button" className="flex items-center justify-center gap-2 bg-white border border-[#e6c1a8] py-3 rounded-full hover:bg-orange-50/30 transition">
                            <FcGoogle className="w-5 h-5" />
                            <span className="text-[14px] font-bold text-blue-700">Google</span>
                        </button>
                        <button type="button" className="flex items-center justify-center gap-2 bg-white border border-[#e6c1a8] py-3 rounded-full hover:bg-orange-50/30 transition">
                            <FaApple className="w-5 h-5 text-blue-700" />
                            <span className="text-[14px] font-bold text-blue-700">Apple</span>
                        </button>
                    </div>
                </div>

                <div className="mt-8 text-center px-4">
                    <p className="text-[15px] text-gray-600 font-medium">
                        Don't have an account?{' '}
                        <Link to="/register" className="text-blue-600 font-medium hover:underline">
                            Sign up for free
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
