import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const { data } = await api.post('/auth/login', { email, password });
            localStorage.setItem('jwt', data.token);
            // role based redirect
            if (data.role === 'STUDENT') navigate('/student/home');
            else navigate('/admin/dashboard');
        } catch (err) {
            console.error(err);
            alert('Login failed');
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-kidBg">
            <form onSubmit={handleSubmit} className="rounded-xl bg-white p-8 shadow-lg max-w-sm w-full">
                <h2 className="text-2xl font-bold mb-4 text-center">Login</h2>
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2 mb-3 border rounded"
                    required
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-2 mb-4 border rounded"
                    required
                />
                <button
                    type="submit"
                    className="w-full bg-primary text-white py-2 rounded hover:bg-primary/80 transition"
                >
                    Sign In
                </button>
            </form>
        </div>
    );
}
