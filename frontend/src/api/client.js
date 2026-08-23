import axios from 'axios';
import { ensureFreshToken } from './token';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach a fresh access token to every request. The token module refreshes
// proactively when the stored token is expired, so requests never leave with
// a dead token and the browser doesn't log a 401 for the first attempt.
client.interceptors.request.use(async (config) => {
  try {
    const token = await ensureFreshToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    } else {
      // Both access and refresh tokens are dead — session is over.
      // Don't send a doomed request; clear state and redirect to login.
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      if (!redirecting) {
        redirecting = true;
        window.location.href = '/login';
      }
      return Promise.reject(new Error('Session expired'));
    }
  } catch {
    // Refresh itself failed (network error etc.) — also treat as dead session.
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    if (!redirecting) {
      redirecting = true;
      window.location.href = '/login';
    }
    return Promise.reject(new Error('Session expired'));
  }
  return config;
});

let redirecting = false;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    // Any 401 means the session is dead — clear tokens and redirect to login.
    if (error.response?.status === 401) {
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
