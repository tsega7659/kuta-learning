import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'https://kuta-learning.onrender.com/api';

const api = axios.create({
    baseURL: API_BASE,
    withCredentials: true,
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Handle 401/403 responses globally with silent token refresh
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;
        if (
            error.response?.status === 401 &&
            !originalRequest?._retry &&
            !originalRequest?.url?.includes('/auth/login') &&
            !originalRequest?.url?.includes('/auth/refresh-token')
        ) {
            originalRequest._retry = true;
            const storedRefreshToken = localStorage.getItem('refreshToken');
            if (storedRefreshToken) {
                try {
                    const res = await axios.post(`${API_BASE}/auth/refresh-token`, { refreshToken: storedRefreshToken });
                    if (res.data?.token) {
                        localStorage.setItem('token', res.data.token);
                        if (res.data.refreshToken) {
                            localStorage.setItem('refreshToken', res.data.refreshToken);
                        }
                        originalRequest.headers.Authorization = `Bearer ${res.data.token}`;
                        return api(originalRequest);
                    }
                } catch (refreshErr) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('refreshToken');
                    localStorage.removeItem('user');
                    if (!['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
                        window.location.href = '/login';
                    }
                    return Promise.reject(refreshErr);
                }
            }
        }

        if (error.response?.status === 401 || error.response?.status === 403) {
            if (!['/login', '/register', '/forgot-password'].includes(window.location.pathname)) {
                localStorage.removeItem('token');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default api;
