import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon, EyeIcon, EyeSlashIcon, KeyIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import api from '../../services/api';

export default function ForgotPassword() {
    // Steps: 'email' | 'otp' | 'reset' | 'done'
    const [step, setStep] = useState('email');
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [resetToken, setResetToken] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(0);

    const otpInputsRef = useRef([]);

    // Countdown timer for resend button
    useEffect(() => {
        if (resendCooldown > 0) {
            const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendCooldown]);

    // Handle sending OTP to email
    const handleEmailSubmit = async (e) => {
        e?.preventDefault();
        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccessMessage(res.data?.message || 'Verification code sent to your email.');
            setStep('otp');
            setResendCooldown(60);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data?.errors?.[0]?.msg || 'Something went wrong. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Handle resending OTP
    const handleResendOtp = async () => {
        if (resendCooldown > 0 || loading) return;
        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            const res = await api.post('/auth/forgot-password', { email });
            setSuccessMessage(res.data?.message || 'A new code has been sent.');
            setResendCooldown(60);
            setOtp(['', '', '', '', '', '']);
            otpInputsRef.current[0]?.focus();
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to resend code. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // OTP Input handlers
    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            // Handle paste
            const digits = value.replace(/\D/g, '').slice(0, 6).split('');
            const newOtp = [...otp];
            digits.forEach((d, i) => {
                if (index + i < 6) newOtp[index + i] = d;
            });
            setOtp(newOtp);
            const nextIdx = Math.min(index + digits.length, 5);
            otpInputsRef.current[nextIdx]?.focus();
            return;
        }

        const digit = value.replace(/\D/g, '');
        const newOtp = [...otp];
        newOtp[index] = digit;
        setOtp(newOtp);

        if (digit && index < 5) {
            otpInputsRef.current[index + 1]?.focus();
        }
    };

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            otpInputsRef.current[index - 1]?.focus();
        }
    };

    // Handle OTP verification
    const handleOtpSubmit = async (e) => {
        e.preventDefault();
        const code = otp.join('');
        if (code.length !== 6) {
            setError('Please enter the complete 6-digit verification code.');
            return;
        }

        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            const res = await api.post('/auth/verify-otp', { email, otp: code, type: 'FORGOT_PASSWORD' });
            setResetToken(res.data?.resetToken);
            setSuccessMessage('Code verified successfully.');
            setStep('reset');
        } catch (err) {
            setError(err.response?.data?.message || 'Invalid or expired verification code.');
        } finally {
            setLoading(false);
        }
    };

    // Handle Password Reset Submission
    const handleResetSubmit = async (e) => {
        e.preventDefault();
        if (password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match.');
            return;
        }

        setError('');
        setSuccessMessage('');
        setLoading(true);
        try {
            await api.post('/auth/reset-password', {
                email,
                password,
                resetToken,
            });
            setStep('done');
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to update password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const subtitle = {
        email: 'Enter your email to receive a 6-digit verification code',
        otp: 'Enter the verification code sent to your email',
        reset: 'Create a new secure password for your account',
        done: 'You can now log in with your new password',
    }[step];

    return (
        <div className="min-h-screen bg-[linear-gradient(180deg,#edf4ff_0%,#f9f6ee_100%)] flex items-center justify-center p-4 sm:p-6">
            <div className="w-full max-w-[440px] rounded-[28px] bg-white/80 shadow-[0_20px_60px_rgba(36,78,138,0.12)] border border-white/70 p-5 sm:p-7 backdrop-blur-sm">
                
                {/* Header */}
                <div className="mb-6 text-center">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-orange-50 text-[#f26c24] mb-3 border border-orange-100 shadow-sm">
                        {step === 'done' ? (
                            <CheckCircleIcon className="w-7 h-7 text-green-600" />
                        ) : step === 'otp' ? (
                            <KeyIcon className="w-6 h-6" />
                        ) : (
                            <LockClosedIcon className="w-6 h-6" />
                        )}
                    </div>
                    <h1 className="text-[28px] font-black text-[#0f4c81] leading-tight">
                        {step === 'otp' ? 'Verify Code' : step === 'reset' ? 'New Password' : 'Forgot Password'}
                    </h1>
                    <p className="text-[14px] text-gray-600 font-medium mt-1.5">{subtitle}</p>

                    {/* Step indicator bar */}
                    {step !== 'done' && (
                        <div className="flex items-center justify-center gap-2 mt-4">
                            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'email' ? 'w-8 bg-[#f26c24]' : 'w-4 bg-orange-200'}`} />
                            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'otp' ? 'w-8 bg-[#f26c24]' : 'w-4 bg-orange-200'}`} />
                            <span className={`h-1.5 rounded-full transition-all duration-300 ${step === 'reset' ? 'w-8 bg-[#f26c24]' : 'w-4 bg-orange-200'}`} />
                        </div>
                    )}
                </div>

                <div className="rounded-[24px] bg-white/90 border border-gray-100 p-6 shadow-[0_10px_40px_rgba(36,78,138,0.06)]">
                    
                    {/* Error and Success banners */}
                    {error && (
                        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-2xl text-sm font-bold border border-red-100 animate-shake">
                            {error}
                        </div>
                    )}
                    {successMessage && step !== 'done' && (
                        <div className="mb-4 bg-green-50 text-green-700 px-4 py-3 rounded-2xl text-xs font-bold border border-green-100">
                            {successMessage}
                        </div>
                    )}

                    {/* STEP 4: DONE */}
                    {step === 'done' ? (
                        <div className="space-y-5 text-center">
                            <div className="bg-green-50 text-green-700 px-4 py-4 rounded-2xl text-sm font-bold border border-green-100">
                                Your password has been updated successfully!
                            </div>
                            <Link
                                to="/login"
                                state={{ email }}
                                className="inline-block w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 shadow-[0_10px_20px_rgba(242,108,36,0.3)] text-center"
                            >
                                Go to Login
                            </Link>
                        </div>

                    /* STEP 2: OTP VERIFICATION */
                    ) : step === 'otp' ? (
                        <form onSubmit={handleOtpSubmit} className="space-y-5">
                            <div className="bg-blue-50/70 text-blue-800 px-4 py-3 rounded-2xl text-xs font-semibold border border-blue-100 flex items-center justify-between">
                                <span className="truncate">Sent to: <strong className="font-extrabold">{email}</strong></span>
                                <button
                                    type="button"
                                    onClick={() => { setStep('email'); setError(''); }}
                                    className="text-xs text-[#f26c24] font-bold hover:underline shrink-0 ml-2"
                                >
                                    Change
                                </button>
                            </div>

                            <div>
                                <label className="block text-[13px] font-bold text-gray-700 mb-3 text-center">
                                    Enter 6-digit Verification Code
                                </label>
                                <div className="flex justify-center gap-2 sm:gap-2.5">
                                    {otp.map((digit, index) => (
                                        <input
                                            key={index}
                                            ref={(el) => (otpInputsRef.current[index] = el)}
                                            type="text"
                                            inputMode="numeric"
                                            maxLength={6}
                                            value={digit}
                                            onChange={(e) => handleOtpChange(index, e.target.value)}
                                            onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                            className="w-11 h-13 sm:w-12 sm:h-14 text-center text-xl sm:text-2xl font-black text-[#0f4c81] bg-gray-50/80 rounded-2xl border-2 border-gray-200 focus:border-[#f26c24] focus:bg-white focus:outline-none transition-all shadow-inner"
                                            autoFocus={index === 0}
                                        />
                                    ))}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || otp.join('').length !== 6}
                                className="w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(242,108,36,0.3)]"
                            >
                                {loading ? 'Verifying...' : 'Verify Code'}
                            </button>

                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    disabled={resendCooldown > 0 || loading}
                                    onClick={handleResendOtp}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-[#f26c24] transition disabled:opacity-50"
                                >
                                    <ArrowPathIcon className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                                    {resendCooldown > 0
                                        ? `Resend code in ${resendCooldown}s`
                                        : "Didn't receive code? Resend"}
                                </button>
                            </div>
                        </form>

                    /* STEP 3: RESET NEW PASSWORD */
                    ) : step === 'reset' ? (
                        <form onSubmit={handleResetSubmit} className="space-y-5">
                            <div className="bg-blue-50 text-blue-700 px-4 py-2.5 rounded-2xl text-xs font-bold border border-blue-100">
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
                                {loading ? 'Saving New Password...' : 'Save New Password'}
                            </button>
                        </form>

                    /* STEP 1: EMAIL INPUT */
                    ) : (
                        <form onSubmit={handleEmailSubmit} className="space-y-5">
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
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading || !email}
                                className="w-full bg-[#f26c24] text-white font-extrabold py-4 rounded-full hover:bg-[#e05b13] transition transform active:scale-95 disabled:opacity-50 shadow-[0_10px_20px_rgba(242,108,36,0.3)]"
                            >
                                {loading ? 'Sending Code...' : 'Send Verification Code'}
                            </button>
                        </form>
                    )}
                </div>

                {step !== 'done' && (
                    <div className="mt-6 text-center px-4">
                        <Link to="/login" className="text-[14px] font-bold text-[#0f4c81] hover:text-[#f26c24] transition">
                            ← Back to Login
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
