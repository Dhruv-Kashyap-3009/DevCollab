const variants = {
  primary: {
    background: 'var(--primary)',
    color: '#fff',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
  danger: {
    background: 'var(--danger-dim)',
    color: 'var(--danger)',
    border: '1px solid rgba(239,68,68,0.25)',
  },
  subtle: {
    background: 'var(--surface2)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
  },
};

const sizes = {
  sm: { padding: '5px 12px', fontSize: '12px', gap: '5px' },
  md: { padding: '8px 16px', fontSize: '14px', gap: '6px' },
  lg: { padding: '11px 22px', fontSize: '15px', gap: '8px' },
};

export default function Button({
  children, variant = 'primary', size = 'md',
  disabled, loading, onClick, type = 'button', style = {},
}) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      style={{
        ...variants[variant],
        ...sizes[size],
        borderRadius: 'var(--radius)',
        fontWeight: 500,
        fontFamily: 'var(--font)',
        cursor: isDisabled ? 'not-allowed' : 'pointer',
        opacity: isDisabled ? 0.5 : 1,
        transition: 'all 0.15s ease',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: sizes[size].gap,
        whiteSpace: 'nowrap',
        letterSpacing: '-0.01em',
        ...style,
      }}
      onMouseEnter={e => {
        if (isDisabled) return;
        if (variant === 'primary') e.currentTarget.style.background = 'var(--primary-hover)';
        if (variant === 'ghost') { e.currentTarget.style.background = 'var(--surface2)'; e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--border)'; }
        if (variant === 'subtle') { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--text)'; }
        if (variant === 'danger') e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
      }}
      onMouseLeave={e => {
        if (isDisabled) return;
        Object.assign(e.currentTarget.style, variants[variant]);
      }}
    >
      {loading ? (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
          <span style={{
            width: '12px', height: '12px', borderRadius: '50%',
            border: '2px solid currentColor', borderTopColor: 'transparent',
            display: 'inline-block', animation: 'spin 0.6s linear infinite',
          }} />
          {typeof children === 'string' ? children : ''}
        </span>
      ) : children}
    </button>
  );
}
