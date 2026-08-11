import { create } from 'zustand';
import { authApi } from '../api/services';
import client from '../api/client';
import { ensureFreshToken, isTokenExpired } from '../api/token';

const useAuthStore = create((set) => ({
  user: null,
  loading: true,

  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { set({ loading: false }); return; }
    try {
      const res = await authApi.me();
      set({ user: res.data.user, loading: false });
    } catch {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      set({ user: null, loading: false });
    }
  },

  login: async (email, password) => {
    const res = await authApi.login({ email, password });
    const { user, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user });
    return user;
  },

  register: async (name, email, password) => {
    const res = await authApi.register({ name, email, password });
    const { user, accessToken, refreshToken } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    set({ user });
    return user;
  },

  logout: async () => {
    // Revoke with a valid token: refresh first if the stored access token has
    // already expired, so the server really bumps token_version. Then clear
    // locally so sign-out works even offline.
    let token;
    const current = localStorage.getItem('accessToken');
    if (current && !isTokenExpired(current)) {
      token = current;
    } else {
      try { token = await ensureFreshToken(); } catch { token = null; }
    }
    if (token) {
      try {
        await client.post('/auth/logout', {}, { timeout: 5000 });
      } catch { /* offline is fine */ }
    }
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null });
  },
}));

export default useAuthStore;
