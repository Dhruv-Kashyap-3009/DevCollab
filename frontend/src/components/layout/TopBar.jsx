import { useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';

const SUB_PAGE_TITLES = { issues: 'Issues', snippets: 'Snippets', docs: 'Docs', github: 'GitHub' };

function pageTitle(pathname) {
  if (pathname === '/settings') return 'Settings';
  const [, root, , sub] = pathname.split('/');
  if (root === 'projects') return SUB_PAGE_TITLES[sub] || 'Overview';
  return 'Dashboard';
}

const SignOutIcon = () => (
  <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>
);

export default function TopBar() {
  const location = useLocation();
  const title = pageTitle(location.pathname);
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header className="app-topbar" style={{
      height: '52px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      background: 'var(--surface)',
      borderBottom: '1px solid var(--border-subtle)',
      flexShrink: 0,
    }}>
      <h1 style={{
        fontSize: '14px', fontWeight: 600,
        color: 'var(--text)', letterSpacing: '-0.01em',
      }}>{title}</h1>

      {user && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={() => navigate('/settings')}
            title="Settings"
            aria-label="Settings"
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: '28px', height: '28px',
              background: 'none', border: 'none',
              color: 'var(--muted)', cursor: 'pointer',
              borderRadius: 'var(--radius-sm)',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51h.01a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
            </svg>
          </button>
          <Avatar name={user.name} size={28} />
          <span className="topbar-username" style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.name}</span>
          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
          <button
            onClick={handleLogout}
            className="signout-btn"
            title="Sign out"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              background: 'none', border: 'none',
              color: 'var(--muted)', fontSize: '12px', fontWeight: 500,
              fontFamily: 'var(--font)', cursor: 'pointer',
              padding: '5px 9px', borderRadius: 'var(--radius-sm)',
              transition: 'background 0.15s ease, color 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--danger)'; e.currentTarget.style.background = 'var(--danger-dim)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'none'; }}
          >
            <SignOutIcon />
            <span className="signout-label">Sign out</span>
          </button>
        </div>
      )}
    </header>
  );
}
