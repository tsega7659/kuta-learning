import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { EnvelopeIcon, LockClosedIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const { login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const user = await login(email, password);
      if (user.role !== 'CONTENT_MANAGER') {
        logout();
        setError('This account does not have access to the admin portal.');
        return;
      }

      navigate('/admin/national-exams', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[linear-gradient(180deg,#edf4ff_0%,#f9f6ee_100%)] p-4 sm:p-6">
      <section className="w-full max-w-[420px] rounded-[28px] border border-white/70 bg-white/80 p-5 shadow-[0_20px_60px_rgba(36,78,138,0.12)] backdrop-blur-sm sm:p-7">
        <header className="mb-6 text-center">
          <h1 className="text-[30px] font-black leading-tight text-[#0f4c81]">Admin Portal</h1>
          <p className="mt-2 text-[15px] font-medium text-gray-600">Sign in with your content manager account</p>
        </header>

        <form onSubmit={handleSubmit} className="space-y-5 rounded-[24px] border border-gray-100 bg-white/85 p-6 shadow-[0_10px_40px_rgba(36,78,138,0.08)]">
          {error && (
            <div role="alert" className="rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
              {error}
            </div>
          )}

          <label className="block text-sm font-bold text-gray-700">
            Email Address
            <span className="relative mt-2 block">
              <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/60 py-3.5 pl-12 pr-4 font-medium text-gray-800 transition focus:border-[#f26c24] focus:outline-none"
                placeholder="name@example.com"
                autoComplete="username"
                required
              />
            </span>
          </label>

          <label className="block text-sm font-bold text-gray-700">
            Password
            <span className="relative mt-2 block">
              <LockClosedIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-2xl border border-gray-100 bg-gray-50/60 py-3.5 pl-12 pr-4 font-medium text-gray-800 transition focus:border-[#f26c24] focus:outline-none"
                placeholder="Password"
                autoComplete="current-password"
                required
              />
            </span>
          </label>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-[#f26c24] py-4 font-extrabold text-white shadow-[0_10px_20px_rgba(242,108,36,0.3)] transition hover:bg-[#e05b13] disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>
      </section>
    </main>
  );
}
