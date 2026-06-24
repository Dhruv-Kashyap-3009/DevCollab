import { NavLink, useParams } from 'react-router-dom';

const navItems = [
  { to: '', label: 'Overview', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
  )},
  { to: 'issues', label: 'Issues', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
  )},
  { to: 'snippets', label: 'Snippets', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
  )},
  { to: 'docs', label: 'Docs', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
  )},
  { to: 'github', label: 'GitHub', icon: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
  )},
];

const DashboardIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
);

export default function Sidebar() {
  const { projectId } = useParams();

  const linkBase = {
    display: 'flex', alignItems: 'center', gap: '9px',
    padding: '8px 12px', borderRadius: 'var(--radius)',
    fontSize: '13px', fontWeight: 500,
    transition: 'all 0.15s ease',
    cursor: 'pointer',
    textDecoration: 'none',
    letterSpacing: '-0.01em',
  };

  const linkStyle = (isActive) => ({
    ...linkBase,
    color: isActive ? 'var(--text)' : 'var(--muted)',
    background: isActive ? 'var(--surface2)' : 'transparent',
    borderLeft: isActive ? '2px solid var(--primary)' : '2px solid transparent',
    paddingLeft: '10px',
  });

  return (
    <aside style={{
      width: '220px', flexShrink: 0,
      background: 'var(--surface)',
      borderRight: '1px solid var(--border-subtle)',
      display: 'flex', flexDirection: 'column',
      padding: '16px 10px',
      minHeight: '100vh',
    }}>
      {/* Logo */}
      <NavLink to="/" style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '8px 12px', marginBottom: '8px',
        borderRadius: 'var(--radius)', textDecoration: 'none',
      }}>
        <div style={{
          width: 30, height: 30,
          background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '14px', fontWeight: 800, color: '#fff',
          boxShadow: '0 2px 8px rgba(59,130,246,0.35)',
          flexShrink: 0,
        }}>D</div>
        <span style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text)', letterSpacing: '-0.02em' }}>DevCollab</span>
      </NavLink>

      {/* Dashboard link */}
      <NavLink to="/" end style={({ isActive }) => linkStyle(isActive)}>
        <DashboardIcon /> Dashboard
      </NavLink>

      {/* Project nav */}
      {projectId && (
        <>
          <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '12px 4px' }} />
          <p style={{
            fontSize: '10px', color: 'var(--muted)', padding: '0 12px',
            marginBottom: '4px', textTransform: 'uppercase',
            letterSpacing: '0.08em', fontWeight: 600,
          }}>Project</p>
          {navItems.map(({ to, label, icon }) => (
            <NavLink
              key={label}
              to={to === '' ? `/projects/${projectId}` : `/projects/${projectId}/${to}`}
              end={to === ''}
              style={({ isActive }) => linkStyle(isActive)}
              onMouseEnter={e => {
                const active = e.currentTarget.style.background === 'var(--surface2)';
                if (!active) { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text-secondary)'; }
              }}
              onMouseLeave={e => {
                const active = e.currentTarget.style.borderLeftColor === 'var(--primary)';
                if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--muted)'; }
              }}
            >
              {icon}
              {label}
            </NavLink>
          ))}
        </>
      )}

      {/* Bottom spacer */}
      <div style={{ flex: 1 }} />
      <div style={{
        padding: '10px 12px',
        borderTop: '1px solid var(--border-subtle)',
        marginTop: '8px',
      }}>
        <div style={{ fontSize: '10px', color: 'var(--muted)', letterSpacing: '0.03em' }}>
          Developer Collaboration Platform
        </div>
      </div>
    </aside>
  );
}
