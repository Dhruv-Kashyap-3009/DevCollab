import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './store/authStore';
import AppLayout from './components/layout/AppLayout';
import { LoginPage, RegisterPage } from './pages/AuthPages';
import DashboardPage from './pages/DashboardPage';
import ProjectPage from './pages/ProjectPage';
import IssuesPage from './pages/IssuesPage';
import SnippetsPage from './pages/SnippetsPage';
import DocsPage from './pages/DocsPage';
import GitHubPage from './pages/GitHubPage';

function RequireAuth({ children }) {
  const { user, loading } = useAuthStore();
  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--muted)' }}>
      Loading…
    </div>
  );
  return user ? children : <Navigate to="/login" replace />;
}

function ProjectLayoutWrapper({ title }) {
  return <AppLayout title={title} />;
}

export default function App() {
  const init = useAuthStore(s => s.init);

  useEffect(() => { init(); }, []);

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

        <Route path="/" element={<RequireAuth><AppLayout title="Dashboard" /></RequireAuth>}>
          <Route index element={<DashboardPage />} />
        </Route>

        <Route path="/projects/:projectId" element={<RequireAuth><AppLayout title="Project" /></RequireAuth>}>
          <Route index element={<ProjectPage />} />
          <Route path="issues" element={<IssuesPage />} />
          <Route path="snippets" element={<SnippetsPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="github" element={<GitHubPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
