import { useState } from 'react';
import EmptyState from '../ui/EmptyState';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function DocList({ docs, onSelect, onDelete }) {
  const [hoveredId, setHoveredId] = useState(null);

  if (!docs.length) return (
    <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
      <EmptyState icon="≡" title="No docs yet" description="Create your first project document." />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {docs.map(doc => (
        <div
          key={doc._id}
          onClick={() => onSelect(doc)}
          onMouseEnter={() => setHoveredId(doc._id)}
          onMouseLeave={() => setHoveredId(null)}
          style={{
            background: hoveredId === doc._id ? 'var(--surface2)' : 'var(--surface)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius)',
            padding: '12px 16px',
            cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            transition: 'all 0.15s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
            {/* Doc icon */}
            <div style={{
              width: 32, height: 32, borderRadius: 'var(--radius-sm)',
              background: 'var(--surface3)', border: '1px solid var(--border)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
              </svg>
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: '14px', letterSpacing: '-0.01em', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</div>
              <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>
                Updated {timeAgo(doc.updatedAt)} · {doc.last_edited_by?.name || doc.author_id?.name || 'Unknown'}
              </div>
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onDelete(doc._id); }}
            style={{
              background: 'none', border: 'none', color: 'var(--muted)',
              cursor: 'pointer', width: '26px', height: '26px',
              borderRadius: 'var(--radius-sm)', fontSize: '16px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all 0.15s ease', flexShrink: 0,
              opacity: hoveredId === doc._id ? 1 : 0,
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--danger-dim)'; e.currentTarget.style.color = 'var(--danger)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none'; e.currentTarget.style.color = 'var(--muted)'; }}
          >×</button>
        </div>
      ))}
    </div>
  );
}
