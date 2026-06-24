import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import Avatar from '../ui/Avatar';

export default function TopBar({ title }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <header style={{
      height: '52px', display: 'flex', alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 24px',
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
          <Avatar name={user.name} size={28} />
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 500 }}>{user.name}</span>
          <div style={{ width: '1px', height: '16px', background: 'var(--border)' }} />
          <button
            onClick={handleLogout}
            style={{
              background: 'none', border: 'none',
              color: 'var(--muted)', fontSize: '12px',
              cursor: 'pointer', fontFamily: 'var(--font)',
              padding: '4px 8px', borderRadius: 'var(--radius-sm)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.background = 'none'; }}
          >Sign out</button>
        </div>
      )}
    </header>
  );
}
