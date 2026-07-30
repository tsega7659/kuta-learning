import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon, EnvelopeIcon, LockClosedIcon, UserIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gradeLevel, setGradeLevel] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!gradeLevel) {
            setError('Please select your grade level.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await register(email, password, name, parseInt(gradeLevel));
            navigate('/student/home');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-blue-100 via-white to-orange-100 flex flex-col items-center justify-center p-4">

            <div className="w-full max-w-[400px]">
                {/* Form Card */}
                <div className="bg-[#F8F9FA] rounded-[32px] p-8 shadow-sm border border-gray-100/50">
                    <div className="mb-6">
                        <h1 className="text-[28px] font-bold text-blue-700 leading-tight mb-1">Kuta Learning</h1>
                        <p className="text-gray-600 font-medium text-[15px]">Create your student account</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-[14px] font-bold text-gray-700 mb-2">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3.5 bg-gray-50/50 rounded-2xl border-none focus:ring-2 focus:ring-kidOrange transition text-gray-800 font-medium"
                                    placeholder="John Doe"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-[14px] font-bold text-gray-700 mb-2">Grade Level</label>
                            <div className="relative">
                                <select
                                    value={gradeLevel}
                                    onChange={(e) => setGradeLevel(e.target.value)}
                                    className="w-full pl-4 pr-10 py-3.5 bg-gray-50/50 rounded-2xl border-none focus:ring-2 focus:ring-kidOrange transition text-gray-800 font-medium appearance-none"
                                    required
                                >
                                    <option value="" disabled>Select your grade</option>
                                    <option value="6">Grade 6</option>
                                    <option value="7">Grade 7</option>
                                    <option value="8">Grade 8</option>
                                </select>
                                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                                    <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                </div>
                            </div>
                        </div>

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

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#f26c24] text-white font-bold py-4 rounded-full mt-2 hover:bg-[#e05b13] transition transform active:scale-95 disabled:opacity-50"
                        >
                            {loading ? 'Signing up...' : 'Sign Up →'}
                        </button>
                    </form>

                    <div className="mt-8 text-center px-4 space-y-4">
                        <p className="text-[15px] text-gray-600 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-blue-600 font-medium hover:underline">
                                Login Screen
                            </Link>
                        </p>
                        <div className="flex items-center justify-center">
                            <div className="w-12 border-t border-gray-200"></div>
                            <span className="px-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider">Safe & Secure</span>
                            <div className="w-12 border-t border-gray-200"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
