import axios from 'axios';
import { ensureFreshToken } from './token';

const client = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach a fresh access token to every request. The token module refreshes
// proactively when the stored token is expired, so requests never leave with
// a dead token and the browser doesn't log a 401 for the first attempt.
client.interceptors.request.use(async (config) => {
  try {
    const token = await ensureFreshToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {
    // No token available — send unauthenticated; the 401 handler below decides.
  }
  return config;
});

// Safety net for races (token expired mid-flight, server-side clock skew):
// refresh once and retry. If the refresh itself fails, the session is dead —
// clear tokens and send the user to login.
let redirecting = false;

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !original._retry
    ) {
      original._retry = true;
      try {
        const token = await ensureFreshToken();
        if (!token) throw new Error('Cannot refresh');
        original.headers.Authorization = `Bearer ${token}`;
        return client(original);
      } catch (err) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        if (!redirecting) {
          redirecting = true;
          window.location.href = '/login';
        }
        return Promise.reject(err);
      }
    }
    return Promise.reject(error);
  }
);

export default client;
