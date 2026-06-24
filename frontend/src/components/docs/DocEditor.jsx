import { useState, useEffect, useRef } from 'react';
import { docsApi } from '../../api/services';
import Button from '../ui/Button';
import toast from 'react-hot-toast';

export default function DocEditor({ projectId, doc, onSave, onClose }) {
  const [title, setTitle] = useState(doc?.title || '');
  const [content, setContent] = useState(doc?.content || '');
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);
  const autoSaveRef = useRef(null);

  useEffect(() => {
    setTitle(doc?.title || '');
    setContent(doc?.content || '');
  }, [doc?._id]);

  const save = async () => {
    if (!title.trim()) { toast.error('Title is required'); return; }
    setSaving(true);
    try {
      const res = await docsApi.update(projectId, doc._id, { title, content });
      onSave && onSave(res.data.doc);
      setLastSaved(new Date());
      toast.success('Saved');
    } catch { toast.error('Save failed'); }
    finally { setSaving(false); }
  };

  useEffect(() => {
    if (!doc?._id) return;
    clearTimeout(autoSaveRef.current);
    autoSaveRef.current = setTimeout(save, 2000);
    return () => clearTimeout(autoSaveRef.current);
  }, [content, title]);

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)', minHeight: '500px' }}>
      {/* Toolbar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '12px 0 16px',
        borderBottom: '1px solid var(--border-subtle)',
        marginBottom: '0',
      }}>
        <button
          onClick={onClose}
          style={{
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--muted)', width: '30px', height: '30px',
            borderRadius: 'var(--radius-sm)', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.15s ease', flexShrink: 0,
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; e.currentTarget.style.borderColor = 'var(--muted)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--muted)'; e.currentTarget.style.borderColor = 'var(--border)'; }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
        </button>

        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="Document title"
          style={{
            flex: 1, background: 'none', border: 'none',
            color: 'var(--text)', fontSize: '17px', fontWeight: 700,
            outline: 'none', fontFamily: 'var(--font)', letterSpacing: '-0.02em',
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
          <span style={{ fontSize: '11px', color: 'var(--muted)' }}>
            {saving ? 'Saving…' : lastSaved ? `Saved ${lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Auto-saving'}
          </span>
          <Button size="sm" onClick={save} loading={saving}>Save</Button>
        </div>
      </div>

      {/* Editor area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingTop: '24px' }}>
        <textarea
          value={content}
          onChange={e => setContent(e.target.value)}
          placeholder="Start writing your document…

Use plain text, markdown-style headings (# Title), lists (- item), or code blocks (` ` `code` ` `)."
          style={{
            flex: 1, width: '100%',
            background: 'none', border: 'none',
            color: 'var(--text)', fontSize: '15px', lineHeight: 1.85,
            resize: 'none', outline: 'none', fontFamily: 'var(--font)',
            minHeight: '400px',
          }}
        />
      </div>

      {/* Status bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        padding: '8px 0 0',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '11px', color: 'var(--muted)',
      }}>
        <span>{wordCount} word{wordCount !== 1 ? 's' : ''}</span>
        <span>{content.length} chars</span>
      </div>
    </div>
  );
}
