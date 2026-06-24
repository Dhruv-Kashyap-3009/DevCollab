import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { issuesApi, projectsApi } from '../api/services';
import IssueList from '../components/issues/IssueList';
import IssueForm from '../components/issues/IssueForm';
import IssueDetail from '../components/issues/IssueDetail';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonList } from '../components/ui/Skeleton';
import useProjectSocket from '../hooks/useProjectSocket';
import toast from 'react-hot-toast';

export default function IssuesPage() {
  const { projectId } = useParams();
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [creating, setCreating] = useState(false);
  const [members, setMembers] = useState([]);

  useEffect(() => {
    projectsApi.get(projectId).then(res => setMembers(res.data.project?.members || []));
  }, [projectId]);

  useEffect(() => {
    setLoading(true);
    const params = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    issuesApi.list(projectId, params)
      .then(res => { setIssues(res.data.issues); setLoading(false); })
      .catch(() => setLoading(false));
  }, [projectId, filters]);

  useProjectSocket(projectId, {
    onIssueCreated: (issue) => setIssues(prev => [issue, ...prev]),
    onIssueUpdated: (issue) => setIssues(prev => prev.map(i => i._id === issue._id ? issue : i)),
  });

  const createIssue = async (data) => {
    setCreating(true);
    try {
      await issuesApi.create(projectId, data);
      setShowForm(false);
      toast.success('Issue created');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create issue');
    } finally { setCreating(false); }
  };

  return (
    <div className="fade-in">
      {!selectedIssue && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Issues</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>
              {issues.length} issue{issues.length !== 1 ? 's' : ''}
            </p>
          </div>
          <Button onClick={() => setShowForm(true)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            New issue
          </Button>
        </div>
      )}

      {loading ? (
        <SkeletonList count={5} />
      ) : selectedIssue ? (
        <div>
          <button
            onClick={() => setSelectedIssue(null)}
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
            Back to issues
          </button>
          <IssueDetail
            projectId={projectId}
            issue={selectedIssue}
            onClose={() => setSelectedIssue(null)}
            onUpdate={(updated) => setIssues(prev => prev.map(i => i._id === updated._id ? updated : i))}
          />
        </div>
      ) : (
        <IssueList
          issues={issues}
          onSelect={setSelectedIssue}
          onFilterChange={setFilters}
          filters={filters}
        />
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New issue" width="560px">
        <IssueForm onSubmit={createIssue} loading={creating} members={members} />
      </Modal>
    </div>
  );
}
