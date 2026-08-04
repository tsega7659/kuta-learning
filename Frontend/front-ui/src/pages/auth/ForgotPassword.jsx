import { useState } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function ForgotPassword() {
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleEmailSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            setStep('reset');
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }
        setError('');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { email, password });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const subtitle = {
        email: 'Enter your email to reset your password',
        reset: 'Choose a new password for your account',
        done: 'You can now log in with your new password',
    }[step];

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#edf4ff_0%,#f9f6ee_100%)] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-[420px] rounded-[28px] bg-white/80 shadow-[0_20px_60px_rgba(36,78,138,0.12)] border border-white/70 p-5 sm:p-7 backdrop-blur-sm">
                <div className="mb-6 text-center">
                    <h1 className="text-[30px] font-black text-[#0f4c81] leading-tight">Forgot Password</h1>
                    <p className="text-[15px] text-gray-600 font-medium mt-2">{subtitle}</p>
                </div>

                <div className="rounded-[24px] bg-white/85 border border-gray-100 p-6 shadow-[0_10px_40px_rgba(36,78,138,0.08)]">
                    {step === 'done' ? (
                        <div className="space-y-5 text-center">
                            <div className="bg-green-50 text-green-700 px-4 py-4 rounded-2xl text-sm font-bold border border-green-100">
                                Your password has been updated successfully.
                            </div>
                            <Link
                                to="/login"
                                state={{ email }}
                                className="inline-block w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 shadow-[0_10px_20px_rgba(242,108,36,0.3)] text-center"
                            >
                                Go to Login
                            </Link>
                        </div>
                    ) : step === 'reset' ? (
                        <form onSubmit={handleResetSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100">
                                    {error}
                                </div>
                            )}

                            <div className="bg-blue-50 text-blue-700 px-4 py-3 rounded-2xl text-sm font-bold border border-blue-100">
                                Resetting password for <span className="font-extrabold">{email}</span>
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-gray-700 mb-2">New Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50/60 rounded-2xl border border-gray-100 focus:border-[#f26c24] focus:outline-none transition text-gray-800 font-medium"
                                        placeholder="••••••••"
                                        minLength={6}
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
                            </div>

                            <div>
                                <label className="block text-[14px] font-bold text-gray-700 mb-2">Confirm Password</label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                        <LockClosedIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showConfirmPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-12 pr-12 py-3.5 bg-gray-50/60 rounded-2xl border border-gray-100 focus:border-[#f26c24] focus:outline-none transition text-gray-800 font-medium"
                                        placeholder="••••••••"
                                        minLength={6}
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600"
                                    >
                                        {showConfirmPassword ? <EyeSlashIcon className="w-5 h-5" /> : <EyeIcon className="w-5 h-5" />}
                                    </button>
                                </div>
                                <p className="text-[11px] text-gray-500 mt-2 font-medium">Minimum 6 characters.</p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(242,108,36,0.3)]"
                            >
                                {loading ? 'Updating...' : 'Update Password'}
                            </button>
                        </form>
                    ) : (
                        <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                                        className="w-full pl-12 pr-4 py-3.5 bg-gray-50/60 rounded-2xl border border-gray-100 focus:border-[#f26c24] focus:outline-none transition text-gray-800 font-medium"
                                        placeholder="student@example.com"
                                        required
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(242,108,36,0.3)]"
                            >
                                {loading ? 'Checking...' : 'Continue'}
                            </button>
                        </form>
                    )}
                </div>

                {step !== 'done' && (
                    <div className="mt-6 text-center px-4">
                        <Link to="/login" className="text-[15px] font-bold text-blue-600 hover:underline">
                            ← Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
