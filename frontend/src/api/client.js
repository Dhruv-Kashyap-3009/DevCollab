import axios from 'axios';
import { ensureFreshToken } from './token';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Public endpoints that must work without a token.
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/auth/refresh'];

function isPublicRequest(config) {
  const url = config.url || '';
  return PUBLIC_PATHS.some(p => url.includes(p));
}

// Attach a fresh access token to every request. The token module refreshes
// proactively when the stored token is expired, so requests never leave with
// a dead token and the browser doesn't log a 401 for the first attempt.
client.interceptors.request.use(async (config) => {
  // Login, register, and refresh must go through unauthenticated.
  if (isPublicRequest(config)) return config;

  try {
    const token = await ensureFreshToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
      // Tokens existed but are both dead — session expired mid-use.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!redirecting) {
        redirecting = true;
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired'));
    }
    // No tokens at all — unauthenticated user. Let the request through;
    // the server 401 and RequireAuth route guard handle this case.
  } catch {
    // Refresh itself failed — treat as dead session only if we had tokens.
    if (localStorage.getItem('accessToken') || localStorage.getItem('refreshToken')) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!redirecting) {
        redirecting = true;
        window.location.href = '/login';
      }
    }
    return Promise.reject(new Error('Session expired'));
  }
  return config;
});

let redirecting = false;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const config = error.config || {};
    // Only redirect to login for 401s on authenticated requests —
    // not for login/register/refresh calls that are expected to 401.
    if (error.response?.status === 401 && !isPublicRequest(config)) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!redirecting) {
        redirecting = true;
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

export default client;
