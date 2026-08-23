import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import { initEmailJS } from './utils/email';
import AppLayout from './components/layout/AppLayout';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import IssuesPage from './pages/IssuesPage';
import SnippetsPage from './pages/SnippetsPage';
import DocsPage from './pages/DocsPage';
import GitHubPage from './pages/GitHubPage';
import AcceptInvitePage from './pages/AcceptInvitePage';
import SettingsPage from './pages/SettingsPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>
      Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}


export default function App() {
  const init = useAuthStore(s => s.init);

  useEffect(() => { init(); initEmailJS(); }, [init]);

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--border)', fontSize: '14px' },
        }}
      />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route path="/" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
        </Route>

        <Route path="/projects/:projectId" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<ProjectPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="snippets" element={<SnippetsPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="github" element={<GitHubPage />} />
        </Route>

        <Route path="/settings" element={<RequireAuth><AppLayout /></RequireAuth>}>
          <Route index element={<SettingsPage />} />
        </Route>

        {/* NOT wrapped in RequireAuth: a new team member opening the email link
            isn't signed in yet, and a login redirect here would drop the token
            from the URL. AcceptInvitePage handles "not signed in" itself by
            routing to /login?next=... so the token survives the login. */}
        <Route path="/invite/:token/accept" element={<AcceptInvitePage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
