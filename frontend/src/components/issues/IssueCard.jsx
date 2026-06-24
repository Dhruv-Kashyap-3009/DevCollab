import { useState } from 'react';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';

const priorityVariant = { low: 'muted', medium: 'warning', high: 'danger', critical: 'danger' };
const statusVariant = { open: 'success', in_progress: 'primary', closed: 'muted' };

const priorityDot = { low: '#64748b', medium: '#f59e0b', high: '#ef4444', critical: '#ef4444' };

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function IssueCard({ issue, onClick }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={() => onClick(issue)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--border)' : 'var(--border-subtle)'}`,
        borderLeft: `3px solid ${hovered ? 'var(--primary)' : priorityDot[issue.priority] || 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        padding: '12px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
      }}
    >
      {/* Issue number + title */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)', fontFamily: 'var(--font-mono)', flexShrink: 0 }}>#{issue.number}</span>
          <span style={{
            fontSize: '14px', fontWeight: 500, color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>{issue.title}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
          <Badge variant={priorityVariant[issue.priority]}>{issue.priority}</Badge>
          {issue.labels?.map(l => <Badge key={l} variant="muted">{l}</Badge>)}
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>{timeAgo(issue.createdAt)}</span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
        {issue.comments?.length > 0 && (
          <span style={{ fontSize: '12px', color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            {issue.comments.length}
          </span>
        )}
        {issue.assignee_id && <Avatar name={issue.assignee_id.name || '?'} size={22} />}
        <Badge variant={statusVariant[issue.status]}>{issue.status.replace('_', ' ')}</Badge>
      </div>
    </div>
  );
}
