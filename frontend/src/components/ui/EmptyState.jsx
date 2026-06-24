import Button from './Button';

export default function EmptyState({ icon = '📭', title, description, action, onAction }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', gap: '14px',
      padding: '72px 24px', textAlign: 'center',
    }}>
      <div style={{
        width: '56px', height: '56px',
        background: 'var(--surface2)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '22px', lineHeight: 1,
      }}>{icon}</div>
      <div>
        <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', marginBottom: '6px' }}>{title}</h3>
        {description && <p style={{ fontSize: '13px', color: 'var(--muted)', maxWidth: '280px', lineHeight: 1.6 }}>{description}</p>}
      </div>
      {action && (
        <Button onClick={onAction} size="sm" style={{ marginTop: '4px' }}>{action}</Button>
      )}
    </div>
  );
}
