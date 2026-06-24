import { useState } from 'react';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import toast from 'react-hot-toast';

const langColor = { javascript: 'warning', typescript: 'primary', python: 'success', rust: 'danger', go: 'muted', css: 'purple', html: 'danger', bash: 'muted' };

export default function SnippetCard({ snippet, onClick, onDelete }) {
  const [hovered, setHovered] = useState(false);

  const copy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(snippet.code);
    toast.success('Copied to clipboard');
  };

  return (
    <div
      onClick={() => onClick(snippet)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)', padding: '16px',
        cursor: 'pointer', transition: 'all 0.18s ease',
        display: 'flex', flexDirection: 'column', gap: '10px',
        boxShadow: hovered ? '0 4px 16px rgba(59,130,246,0.08)' : 'none',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '10px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            fontSize: '14px', fontWeight: 600, display: 'block',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>{snippet.title}</span>
          {snippet.description && (
            <span style={{
              fontSize: '12px', color: 'var(--muted)', display: 'block', marginTop: '3px',
              overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            }}>{snippet.description}</span>
          )}
        </div>
        <button
          onClick={copy}
          style={{
            background: 'var(--surface3)', border: '1px solid var(--border)',
            color: 'var(--muted)', padding: '4px 8px', borderRadius: 'var(--radius-sm)',
            fontSize: '11px', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font)',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => { e.stopPropagation(); e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--muted)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >Copy</button>
      </div>

      {/* Code preview */}
      <pre style={{
        background: 'var(--bg)', borderRadius: 'var(--radius-sm)',
        padding: '10px 12px', fontSize: '11px',
        overflow: 'hidden', maxHeight: '72px',
        color: 'var(--text-secondary)', margin: 0,
        fontFamily: 'var(--font-mono)', lineHeight: 1.6,
        borderLeft: '2px solid var(--border)',
      }}>
        {snippet.code.slice(0, 200)}{snippet.code.length > 200 ? '…' : ''}
      </pre>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Badge variant={langColor[snippet.language] || 'muted'}>{snippet.language}</Badge>
        {snippet.author_id && <Avatar name={snippet.author_id.name} size={18} />}
        <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{snippet.visibility}</span>
      </div>
    </div>
  );
}
