const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'closed', label: 'Closed' },
];

const PRIORITY_OPTIONS = [
  { value: '', label: 'Any priority' },
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

function Chip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', width: '100%',
        padding: '6px 10px', borderRadius: 'var(--radius-sm)',
        fontSize: '12.5px', fontWeight: 500, textAlign: 'left',
        background: active ? 'var(--primary-dim)' : 'transparent',
        color: active ? 'var(--primary)' : 'var(--muted)',
        border: active ? '1px solid rgba(59,130,246,0.3)' : '1px solid transparent',
        cursor: 'pointer', transition: 'all 0.15s ease',
        fontFamily: 'var(--font)', letterSpacing: '-0.01em',
      }}
      onMouseEnter={e => {
        if (active) return;
        e.currentTarget.style.background = 'var(--surface2)';
        e.currentTarget.style.color = 'var(--text-secondary)';
      }}
      onMouseLeave={e => {
        if (active) return;
        e.currentTarget.style.background = 'transparent';
        e.currentTarget.style.color = 'var(--muted)';
      }}
    >{label}</button>
  );
}

export default function IssueFilters({ filters = {}, onChange }) {
  const hasFilters = filters.status || filters.priority;

  return (
    <div className="rail-card" style={{ borderLeft: '2px solid var(--primary)', paddingTop: '14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ marginBottom: 0 }}>Filters</h3>
        {hasFilters && (
          <button
            onClick={() => onChange({ status: '', priority: '' })}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--primary)', fontSize: '12px', fontWeight: 500,
              fontFamily: 'var(--font)', padding: '2px 4px',
            }}
          >Reset</button>
        )}
      </div>

      <div style={{ marginBottom: '16px' }}>
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Status</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {STATUS_OPTIONS.map(s => (
            <Chip key={s.value || 'all'} label={s.label} active={filters.status === s.value} onClick={() => onChange({ ...filters, status: s.value })} />
          ))}
        </div>
      </div>

      <div>
        <div style={{ fontSize: '11px', color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '6px' }}>Priority</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {PRIORITY_OPTIONS.map(p => (
            <Chip key={p.value || 'any'} label={p.label} active={filters.priority === p.value} onClick={() => onChange({ ...filters, priority: p.value })} />
          ))}
        </div>
      </div>
    </div>
  );
}
