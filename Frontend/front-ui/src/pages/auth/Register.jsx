import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';

export default function Register() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [gradeLevel, setGradeLevel] = useState(null);
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
            await register(email, password, name, gradeLevel);
            navigate('/student/home');
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Registration failed.');
        } finally {
            setLoading(false);
        }
    };

    const grades = [
        { level: 1, emoji: '🌱', label: 'Grade 1' },
        { level: 2, emoji: '🌿', label: 'Grade 2' },
        { level: 3, emoji: '🌳', label: 'Grade 3' },
        { level: 4, emoji: '🌲', label: 'Grade 4' },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                {/* Logo */}
                <div className="text-center mb-6">
                    <div className="w-20 h-20 bg-kidOrange rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                        <span className="text-4xl">🎒</span>
                    </div>
                    <h1 className="text-3xl font-black text-kidText">Join the Fun!</h1>
                    <p className="text-gray-400 font-bold text-sm mt-1">Create your learning account</p>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-3xl p-6 shadow-soft border border-gray-100">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-bold text-kidText mb-1.5">Your Name</label>
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none transition text-kidText font-medium"
                                placeholder="What's your name?"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-kidText mb-1.5">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none transition text-kidText font-medium"
                                placeholder="your@email.com"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-bold text-kidText mb-1.5">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full px-4 py-3 rounded-2xl border-2 border-gray-100 focus:border-kidOrange focus:outline-none transition text-kidText font-medium pr-12"
                                    placeholder="At least 6 characters"
                                    required
                                    minLength={6}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    {showPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Grade Selection */}
                        <div>
                            <label className="block text-sm font-bold text-kidText mb-2">Pick Your Grade</label>
                            <div className="grid grid-cols-4 gap-2">
                                {grades.map((g) => (
                                    <button
                                        key={g.level}
                                        type="button"
                                        onClick={() => setGradeLevel(g.level)}
                                        className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${gradeLevel === g.level
                                                ? 'border-kidOrange bg-orange-50 scale-105'
                                                : 'border-gray-100 hover:border-gray-200'
                                            }`}
                                    >
                                        <span className="text-2xl mb-1">{g.emoji}</span>
                                        <span className="text-[10px] font-bold text-kidText">{g.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-kidOrange text-white font-bold py-3.5 rounded-2xl hover:bg-orange-600 transition transform active:scale-95 shadow-btn text-lg disabled:opacity-50"
                        >
                            {loading ? 'Creating account...' : 'Start Learning! 🚀'}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <p className="text-sm text-gray-400 font-medium">
                            Already have an account?{' '}
                            <Link to="/login" className="text-kidOrange font-bold hover:underline">
                                Sign In
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
