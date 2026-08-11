import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { issuesApi } from '../api/services';
import IssueList from '../components/issues/IssueList';
import IssueFilters from '../components/issues/IssueFilters';
import IssueForm from '../components/issues/IssueForm';
import IssueDetail from '../components/issues/IssueDetail';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { SkeletonList } from '../components/ui/Skeleton';
import useProjectSocket from '../hooks/useProjectSocket';
import useMyRole from '../hooks/useMyRole';
import toast from 'react-hot-toast';

const PAGE_SIZE = 20;

// Mirror the server's filters so realtime events respect what's on screen.
function matchesFilters(issue, filters) {
  if (filters.status && issue.status !== filters.status) return false;
  if (filters.priority && issue.priority !== filters.priority) return false;
  return true;
}

export default function IssuesPage() {
  const { projectId } = useParams();
  // The list is keyed by (project, filters, page): a new key means a fetch is
  // owed, so `loading` is derived instead of set inside an effect.
  const [list, setList] = useState({ key: '', issues: [], total: 0, hasMore: false });
  const [filters, setFilters] = useState({ status: '', priority: '' });
  const [page, setPage] = useState(1);
  const [showForm, setShowForm] = useState(false);
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [creating, setCreating] = useState(false);
  const { myRole, project } = useMyRole(projectId);
  const canEdit = myRole === 'editor' || myRole === 'owner';
  const members = project?.members || [];

  const baseKey = `${projectId}|${filters.status}|${filters.priority}`;
  const key = `${baseKey}|${page}`;
  const loading = list.key !== key;
  const loadingMore = loading && page > 1;
  const issues = list.key === baseKey ? list.issues : (list.key.startsWith(baseKey + '|') ? list.issues : []);

  useEffect(() => {
    if (list.key === key) return;
    let active = true;
    const params = { page, limit: PAGE_SIZE };
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;

    issuesApi.list(projectId, params)
      .then(res => {
        if (!active) return;
        const fetched = res.data.issues || [];
        setList(prev => {
          // Append when paging through the same (project, filters); replace otherwise.
          const sameBase = prev.key.startsWith(baseKey + '|') || prev.key === baseKey;
          const merged = sameBase
            ? [...prev.issues, ...fetched.filter(i => !prev.issues.some(p => p._id === i._id))]
            : fetched;
          return { key, issues: merged, total: res.data.total || 0, hasMore: res.data.page < res.data.pages };
        });
      })
      .catch(() => {
        if (!active) return;
        if (page > 1) toast.error('Failed to load more issues');
        setList(prev => ({ ...prev, key }));
      });
    return () => { active = false; };
  }, [projectId, key, baseKey, page, filters.status, filters.priority, list.key]);

  const changeFilters = (next) => {
    setFilters(next);
    setPage(1);
  };

  useProjectSocket(projectId, {
    onIssueCreated: (issue) => {
      // Only touch the list and count when the new issue matches the active
      // filter — otherwise a filtered view's total drifts from the server's.
      if (!matchesFilters(issue, filters)) return;
      setList(prev => ({
        ...prev,
        total: prev.total + 1,
        issues: prev.issues.some(i => i._id === issue._id) ? prev.issues : [issue, ...prev.issues],
      }));
    },
    onIssueUpdated: (issue) => {
      setList(prev => {
        if (!matchesFilters(issue, filters)) {
          // It no longer matches the active filter (e.g. closed while viewing "open") — drop it.
          return { ...prev, issues: prev.issues.filter(i => i._id !== issue._id) };
        }
        return { ...prev, issues: prev.issues.map(i => i._id === issue._id ? issue : i) };
      });
    },
    onIssueDeleted: (issueId) => {
      setList(prev => {
        if (!prev.issues.some(i => i._id === issueId)) return prev;
        return { ...prev, total: Math.max(0, prev.total - 1), issues: prev.issues.filter(i => i._id !== issueId) };
      });
    },
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
        <div className="page-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Issues</h1>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>
              {list.total} issue{list.total !== 1 ? 's' : ''}
            </p>
          </div>
          {canEdit && (
            <Button onClick={() => setShowForm(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              New issue
            </Button>
          )}
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
            canEdit={canEdit}
            onClose={() => setSelectedIssue(null)}
            onUpdate={(updated) => setList(prev => ({ ...prev, issues: prev.issues.map(i => i._id === updated._id ? updated : i) }))}
          />
        </div>
      ) : (
        <div className="page-with-rail">
          <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <IssueList issues={issues} onSelect={setSelectedIssue} />
            {list.hasMore && (
              <Button
                variant="ghost"
                onClick={() => setPage(p => p + 1)}
                loading={loadingMore}
                style={{ alignSelf: 'center' }}
              >
                Load more
              </Button>
            )}
          </div>
          <aside className="rail">
            <IssueFilters filters={filters} onChange={changeFilters} />
          </aside>
        </div>
      )}

      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="New issue" width="560px">
        <IssueForm onSubmit={createIssue} loading={creating} members={members} />
      </Modal>
    </div>
  );
}
