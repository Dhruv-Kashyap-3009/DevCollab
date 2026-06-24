export default function Input({ label, error, type = 'text', value, onChange, placeholder, required, style = {}, rows }) {
  const baseStyle = {
    width: '100%',
    background: 'var(--surface2)',
    border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
    borderRadius: 'var(--radius)',
    color: 'var(--text)',
    padding: '9px 12px',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
    resize: rows ? 'vertical' : undefined,
    lineHeight: 1.5,
  };

  const focusHandlers = {
    onFocus: e => {
      e.target.style.borderColor = error ? 'var(--danger)' : 'var(--primary)';
      e.target.style.boxShadow = error ? '0 0 0 3px var(--danger-dim)' : '0 0 0 3px var(--primary-dim)';
    },
    onBlur: e => {
      e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
      e.target.style.boxShadow = 'none';
    },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', ...style }}>
      {label && (
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>
          {label}{required && <span style={{ color: 'var(--danger)', marginLeft: '3px' }}>*</span>}
        </label>
      )}
      {rows ? (
        <textarea
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          rows={rows}
          style={{ ...baseStyle, resize: 'vertical' }}
          {...focusHandlers}
        />
      ) : (
        <input
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          style={baseStyle}
          {...focusHandlers}
        />
      )}
      {error && (
        <span style={{ fontSize: '12px', color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>⚠</span> {error}
        </span>
      )}
    </div>
  );
}
