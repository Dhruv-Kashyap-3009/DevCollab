import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { docsApi } from '../api/services';
import DocList from '../components/docs/DocList';
import DocEditor from '../components/docs/DocEditor';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { SkeletonList } from '../components/ui/Skeleton';
import useProjectSocket from '../hooks/useProjectSocket';
import toast from 'react-hot-toast';

export default function DocsPage() {
  const { projectId } = useParams();
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    docsApi.list(projectId).then(res => { setDocs(res.data.docs); setLoading(false); }).catch(() => setLoading(false));
  }, [projectId]);

  useProjectSocket(projectId, {
    onDocUpdated: (msg) => {
      setDocs(prev => prev.map(d => d._id === msg.docId ? { ...d, updatedAt: new Date().toISOString() } : d));
    },
  });

  const createDoc = async (e) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreating(true);
    try {
      const res = await docsApi.create(projectId, { title: newTitle.trim() });
      setDocs(prev => [res.data.doc, ...prev]);
      setNewTitle('');
      setShowCreate(false);
      setSelectedDoc(res.data.doc);
      toast.success('Doc created');
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setCreating(false); }
  };

  const deleteDoc = async (id) => {
    if (!confirm('Delete this document?')) return;
    try {
      await docsApi.delete(projectId, id);
      setDocs(prev => prev.filter(d => d._id !== id));
      if (selectedDoc?._id === id) setSelectedDoc(null);
      toast.success('Doc deleted');
    } catch { toast.error('Failed to delete'); }
  };

  return (
    <div className="fade-in">
      {!selectedDoc && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Docs</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>Project documentation</p>
          </div>
          <Button onClick={() => setShowCreate(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New doc
          </Button>
        </div>
      )}

      {selectedDoc ? (
        <DocEditor
          projectId={projectId}
          doc={selectedDoc}
          onSave={(updated) => { setDocs(prev => prev.map(d => d._id === updated._id ? updated : d)); setSelectedDoc(updated); }}
          onClose={() => setSelectedDoc(null)}
        />
      ) : loading ? (
        <SkeletonList count={4} />
      ) : (
        <DocList docs={docs} onSelect={setSelectedDoc} onDelete={deleteDoc} />
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New document">
        <form onSubmit={createDoc} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Title" value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Document title" required />
          <Button type="submit" loading={creating} style={{ width: '100%' }}>Create document</Button>
        </form>
      </Modal>
    </div>
  );
}
