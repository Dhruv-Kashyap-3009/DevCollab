import IssueCard from './IssueCard';
import EmptyState from '../ui/EmptyState';

const STATUS_OPTIONS = [
  { value: '', label: 'All' },
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

function FilterChip({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '4px 12px', borderRadius: '99px', fontSize: '12px', fontWeight: 500,
        background: active ? 'var(--primary)' : 'var(--surface2)',
        color: active ? '#fff' : 'var(--muted)',
        border: active ? '1px solid transparent' : '1px solid var(--border)',
        cursor: 'pointer', transition: 'all 0.15s ease',
        fontFamily: 'var(--font)',
      }}
    >{label}</button>
  );
}

export default function IssueList({ issues, onSelect, onFilterChange, filters = {} }) {
  return (
    <div>
      {/* Filter bar */}
      <div style={{
        display: 'flex', gap: '6px', marginBottom: '16px',
        flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)', marginRight: '4px' }}>Status</span>
        {STATUS_OPTIONS.map(s => (
          <FilterChip key={s.value || 'all'} label={s.label} active={filters.status === s.value} onClick={() => onFilterChange({ ...filters, status: s.value })} />
        ))}
        <div style={{ width: '1px', height: '16px', background: 'var(--border)', margin: '0 6px' }} />
        {PRIORITY_OPTIONS.map(p => (
          <FilterChip key={p.value || 'any'} label={p.label} active={filters.priority === p.value} onClick={() => onFilterChange({ ...filters, priority: p.value })} />
        ))}
      </div>

      {issues.length === 0 ? (
        <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
          <EmptyState icon="◎" title="No issues found" description="Create your first issue to start tracking work." />
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {issues.map(issue => <IssueCard key={issue._id} issue={issue} onClick={onSelect} />)}
        </div>
      )}
    </div>
  );
}
