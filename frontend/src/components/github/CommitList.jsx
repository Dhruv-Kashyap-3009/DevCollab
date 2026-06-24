import { SkeletonList } from '../ui/Skeleton';
import EmptyState from '../ui/EmptyState';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function CommitList({ commits, loading }) {
  if (loading) return <SkeletonList count={5} height="52px" />;
  if (!commits?.length) return (
    <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
      <EmptyState icon="◉" title="No commits found" description="Make sure your repo and token are configured correctly." />
    </div>
  );

  return (
    <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
      {commits.map((c, i) => (
        <div
          key={c.sha}
          style={{
            display: 'flex', alignItems: 'center', gap: '12px',
            padding: '12px 16px',
            borderBottom: i < commits.length - 1 ? '1px solid var(--border-subtle)' : 'none',
            transition: 'background 0.15s ease',
          }}
          onMouseEnter={e => e.currentTarget.style.background = 'var(--surface2)'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
        >
          {/* SHA */}
          <a
            href={c.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontFamily: 'var(--font-mono)', fontSize: '11px',
              color: 'var(--primary)', background: 'var(--primary-dim)',
              padding: '3px 7px', borderRadius: 'var(--radius-sm)',
              textDecoration: 'none', flexShrink: 0,
              border: '1px solid rgba(59,130,246,0.2)',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-dim)'}
          >{c.sha}</a>

          {/* Message */}
          <span style={{
            fontSize: '13px', flex: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            color: 'var(--text)',
          }}>{c.message}</span>

          {/* Author + time */}
          <span style={{ fontSize: '12px', color: 'var(--muted)', flexShrink: 0 }}>{c.author}</span>
          <span style={{
            fontSize: '11px', color: 'var(--muted)', flexShrink: 0,
            background: 'var(--surface3)', padding: '2px 7px',
            borderRadius: '99px', border: '1px solid var(--border)',
          }}>{timeAgo(c.date)}</span>
        </div>
      ))}
    </div>
  );
}
