import axios from 'axios';

// Single-flight refresh: concurrent callers share one in-flight request so we
// never issue parallel /auth/refresh calls.
let refreshPromise = null;

// Decode a JWT payload without verification — we only read the exp claim to
// decide whether a proactive refresh is needed before sending a request.
function decodePayload(token) {
  try {
    const payload = token.split('.')[1];
    return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  } catch {
    return null;
  }
}

export function isTokenExpired(token) {
  const payload = decodePayload(token);
  if (!payload || !payload.exp) return true; // undecodable → treat as expired
  // Refresh a little early to absorb clock skew between browser and server.
  return payload.exp * 1000 <= Date.now() + 30000;
}

async function doRefresh() {
  const refreshToken = localStorage.getItem('refreshToken');
  if (!refreshToken) return null;
  try {
    const res = await axios.post('/api/auth/refresh', { refreshToken }, { timeout: 8000 });
    const { accessToken, refreshToken: newRefresh } = res.data;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', newRefresh);
    return accessToken;
  } catch {
    // Session is dead (invalid/expired refresh token, or offline). Return null
    // and let the API layer's 401 handling redirect to login.
    return null;
  }
}

// Returns a usable access token: the stored one if still fresh, otherwise a
// freshly refreshed one (single-flight). Returns null when no token is
// available or the refresh fails.
export function ensureFreshToken() {
  const token = localStorage.getItem('accessToken');
  if (token && !isTokenExpired(token)) return Promise.resolve(token);
  if (!refreshPromise) {
    refreshPromise = doRefresh().finally(() => { refreshPromise = null; });
  }
  return refreshPromise;
}
