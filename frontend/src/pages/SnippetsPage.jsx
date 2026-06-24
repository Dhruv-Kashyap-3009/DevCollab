import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { snippetsApi } from '../api/services';
import SnippetList from '../components/snippets/SnippetList';
import SnippetForm from '../components/snippets/SnippetForm';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonList } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';
import Badge from '../components/ui/Badge';

const langColor = { javascript: 'warning', typescript: 'primary', python: 'success', rust: 'danger', go: 'muted', css: 'purple' };

export default function SnippetsPage() {
  const { projectId } = useParams();
  const [snippets, setSnippets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editSnippet, setEditSnippet] = useState(null);
  const [viewSnippet, setViewSnippet] = useState(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    snippetsApi.list(projectId).then(res => { setSnippets(res.data.snippets); setLoading(false); }).catch(() => setLoading(false));
  }, [projectId]);

  const createSnippet = async (data) => {
    setSaving(true);
    try {
      const res = await snippetsApi.create(projectId, data);
      setSnippets(prev => [res.data.snippet, ...prev]);
      setShowForm(false);
      toast.success('Snippet created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSaving(false); }
  };

  const updateSnippet = async (data) => {
    setSaving(true);
    try {
      const res = await snippetsApi.update(projectId, editSnippet._id, data);
      setSnippets(prev => prev.map(s => s._id === res.data.snippet._id ? res.data.snippet : s));
      setEditSnippet(null);
      toast.success('Snippet updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  const deleteSnippet = async (id) => {
    if (!confirm('Delete this snippet?')) return;
    try {
      await snippetsApi.delete(projectId, id);
      setSnippets(prev => prev.filter(s => s._id !== id));
      if (viewSnippet?._id === id) setViewSnippet(null);
      toast.success('Snippet deleted');
    } catch { toast.error('Failed to delete'); }
  };

  const BackButton = () => (
    <button
      onClick={() => setViewSnippet(null)}
      style={{
        background: 'none', border: 'none', color: 'var(--muted)',
        cursor: 'pointer', fontSize: '13px', marginBottom: '20px',
        display: 'flex', alignItems: 'center', gap: '6px', fontFamily: 'var(--font)',
        padding: '6px 0', transition: 'color 0.15s ease',
      }}
      onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
      onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
      Back to snippets
    </button>
  );

  return (
    <div className="fade-in">
      {!viewSnippet && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Snippets</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>Reusable code for your team</p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New snippet
          </Button>
        </div>
      )}

      {viewSnippet ? (
        <div>
          <BackButton />
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', overflow: 'hidden' }}>
            {/* Snippet header */}
            <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
              <div>
                <h2 style={{ fontSize: '16px', fontWeight: 600, letterSpacing: '-0.01em' }}>{viewSnippet.title}</h2>
                {viewSnippet.description && <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>{viewSnippet.description}</p>}
              </div>
              <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                <Button variant="ghost" size="sm" onClick={() => { setEditSnippet(viewSnippet); setViewSnippet(null); }}>Edit</Button>
                <Button variant="danger" size="sm" onClick={() => deleteSnippet(viewSnippet._id)}>Delete</Button>
              </div>
            </div>
            {/* Language bar */}
            <div style={{ padding: '10px 24px', background: 'var(--surface2)', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant={langColor[viewSnippet.language] || 'muted'}>{viewSnippet.language}</Badge>
              <span style={{ fontSize: '11px', color: 'var(--muted)', marginLeft: 'auto' }}>{viewSnippet.visibility}</span>
            </div>
            {/* Code */}
            <pre style={{
              background: 'var(--bg)', padding: '20px 24px',
              overflow: 'auto', fontSize: '13px',
              fontFamily: 'var(--font-mono)', color: 'var(--text)',
              margin: 0, lineHeight: 1.7,
            }}>
              <code>{viewSnippet.code}</code>
            </pre>
          </div>
        </div>
      ) : loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
          <SkeletonList count={4} height="140px" />
        </div>
      ) : (
        <SnippetList snippets={snippets} onSelect={setViewSnippet} onDelete={deleteSnippet} />
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New snippet" width="600px">
        <SnippetForm onSubmit={createSnippet} loading={saving} />
      </Modal>
      <Modal isOpen={!!editSnippet} onClose={() => setEditSnippet(null)} title="Edit snippet" width="600px">
        {editSnippet && <SnippetForm onSubmit={updateSnippet} loading={saving} initial={editSnippet} />}
      </Modal>
    </div>
  );
}
