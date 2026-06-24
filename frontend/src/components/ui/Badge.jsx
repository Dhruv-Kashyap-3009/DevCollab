const variantStyles = {
  success: { background: 'var(--success-dim)', color: 'var(--success)', border: '1px solid rgba(34,197,94,0.2)' },
  warning: { background: 'var(--warning-dim)', color: 'var(--warning)', border: '1px solid rgba(245,158,11,0.2)' },
  danger:  { background: 'var(--danger-dim)',  color: 'var(--danger)',  border: '1px solid rgba(239,68,68,0.2)' },
  muted:   { background: 'var(--surface3)',    color: 'var(--muted)',   border: '1px solid var(--border)' },
  primary: { background: 'var(--primary-dim)', color: 'var(--primary)', border: '1px solid rgba(59,130,246,0.2)' },
  purple:  { background: 'var(--purple-dim)',  color: 'var(--purple)',  border: '1px solid rgba(168,85,247,0.2)' },
};

export default function Badge({ children, variant = 'muted', style = {} }) {
  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '4px',
      padding: '2px 7px',
      borderRadius: '99px',
      fontSize: '11px',
      fontWeight: 600,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
      ...(variantStyles[variant] || variantStyles.muted),
      ...style,
    }}>
      {children}
    </span>
  );
}
