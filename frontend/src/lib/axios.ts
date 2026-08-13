import axios from 'axios';

// ---------------------------------------------------------------------------
// Base URL resolution
// • Browser (client components): use the relative path "/api" so Next.js
//   proxy rewrites handle the request — completely avoids CORS.
// • Server (SSR / API routes): use the full NEXT_PUBLIC_API_URL so Django
//   is reached directly without going through the proxy.
// ---------------------------------------------------------------------------
const BASE_URL =
  typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') || 'http://127.0.0.1:8000/api')
    : '/api';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,          // send cookies / auth headers cross-origin
  headers: {
    'Content-Type': 'application/json',
  },
});

// ---------------------------------------------------------------------------
// Request interceptor – attach JWT access token from localStorage
// ---------------------------------------------------------------------------
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ---------------------------------------------------------------------------
// Response interceptor – silently refresh the access token on 401, then
// replay the original request.  If refresh also fails → redirect to login.
// ---------------------------------------------------------------------------
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only attempt one refresh per request
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken =
          typeof window !== 'undefined'
            ? localStorage.getItem('refresh_token')
            : null;

        if (!refreshToken) throw new Error('No refresh token');

        const res = await axios.post(`${BASE_URL}/users/token/refresh/`, {
          refresh: refreshToken,
        });

        const { access } = res.data;
        localStorage.setItem('access_token', access);
        api.defaults.headers.common['Authorization'] = `Bearer ${access}`;
        originalRequest.headers['Authorization'] = `Bearer ${access}`;
        return api(originalRequest);
      } catch {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default api;
