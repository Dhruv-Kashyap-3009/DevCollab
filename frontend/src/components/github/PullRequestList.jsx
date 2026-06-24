import { useState } from 'react';
import Badge from '../ui/Badge';
import { SkeletonList } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

const stateVariant = { open: 'success', closed: 'danger', merged: 'purple' };

export default function PullRequestList({ pulls, loading }) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  if (loading) return <SkeletonList count={5} height="52px" />;
  if (!pulls?.length) return (
    <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
      <EmptyState icon="🔁" title="No pull requests found" description="Pull requests from your connected repo will appear here." />
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {pulls.map((pr, i) => (
        <div
          key={pr.number}
          onMouseEnter={() => setHoveredIdx(i)}
          onMouseLeave={() => setHoveredIdx(null)}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            background: hoveredIdx === i ? 'var(--surface2)' : 'transparent',
            borderBottom: i < pulls.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            transition: 'background 0.15s ease',
          }}
        >
          {/* PR number */}
          <span style={{
            fontSize: '11px', color: 'var(--muted)', flexShrink: 0,
            fontFamily: 'var(--font-mono)',
            background: 'var(--surface3)', padding: '3px 7px',
            borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)',
          }}>#{pr.number}</span>

          {/* Title */}
          <a
            href={pr.url} target="_blank" rel="noopener noreferrer"
            style={{
              flex: 1, fontSize: '13px', fontWeight: 500,
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              color: hoveredIdx === i ? 'var(--primary)' : 'var(--text)',
              textDecoration: 'none', transition: 'color 0.15s ease',
            }}
            onClick={e => e.stopPropagation()}
          >{pr.title}</a>

          <Badge variant={stateVariant[pr.state] || 'muted'}>{pr.state}</Badge>
          <span style={{ fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>{pr.author}</span>
          <span style={{
            fontSize: '11px', color: 'var(--muted)', flexShrink: 0,
            background: 'var(--surface3)', padding: '2px 7px',
            borderRadius: '99px', border: '1px solid var(--border)',
          }}>{timeAgo(pr.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
