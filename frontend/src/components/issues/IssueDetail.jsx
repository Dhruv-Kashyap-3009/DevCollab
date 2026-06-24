import { useState, useEffect } from 'react';
import { issuesApi } from '../../api/services';
import Badge from '../ui/Badge';
import Avatar from '../ui/Avatar';
import Button from '../ui/Button';
import Skeleton from '../ui/Skeleton';
import toast from 'react-hot-toast';

const priorityVariant = { low: 'muted', medium: 'warning', high: 'danger', critical: 'danger' };
const statusVariant = { open: 'success', in_progress: 'primary', closed: 'muted' };

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

export default function IssueDetail({ projectId, issue: initialIssue, onClose, onUpdate }) {
  const [issue, setIssue] = useState(initialIssue);
  const [loading, setLoading] = useState(true);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    issuesApi.get(projectId, initialIssue._id).then(res => {
      setIssue(res.data.issue);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId, initialIssue._id]);

  const submitComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    setSubmitting(true);
    try {
      const res = await issuesApi.addComment(projectId, issue._id, comment);
      setIssue(prev => ({ ...prev, comments: [...(prev.comments || []), res.data.comment] }));
      setComment('');
      toast.success('Comment added');
    } catch { toast.error('Failed to add comment'); }
    finally { setSubmitting(false); }
  };

  const toggleStatus = async () => {
    const newStatus = issue.status === 'closed' ? 'open' : 'closed';
    try {
      const res = await issuesApi.update(projectId, issue._id, { status: newStatus });
      setIssue(res.data.issue);
      onUpdate && onUpdate(res.data.issue);
      toast.success(`Issue ${newStatus}`);
    } catch { toast.error('Failed to update status'); }
  };

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', padding: '4px' }}>
      <Skeleton height="28px" />
      <Skeleton height="16px" width="60%" />
      <Skeleton height="80px" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} className="fade-in">
      {/* Header */}
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '20px 24px',
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', marginBottom: '14px' }}>
          <div>
            <span style={{ fontSize: '12px', color: 'var(--muted)', fontFamily: 'var(--font-mono)' }}>#{issue.number}</span>
            <h2 style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px', letterSpacing: '-0.02em' }}>{issue.title}</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={toggleStatus}>
            {issue.status === 'closed' ? 'Reopen' : 'Close issue'}
          </Button>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '14px' }}>
          <Badge variant={statusVariant[issue.status]}>{issue.status.replace('_', ' ')}</Badge>
          <Badge variant={priorityVariant[issue.priority]}>{issue.priority}</Badge>
          {issue.labels?.map(l => <Badge key={l} variant="muted">{l}</Badge>)}
        </div>

        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--muted)', flexWrap: 'wrap' }}>
          <span>By <strong style={{ color: 'var(--text-secondary)' }}>{issue.author_id?.name || 'Unknown'}</strong> · {timeAgo(issue.createdAt)}</span>
          {issue.assignee_id && (
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              Assigned to <Avatar name={issue.assignee_id.name} size={16} /> <strong style={{ color: 'var(--text-secondary)' }}>{issue.assignee_id.name}</strong>
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      {issue.body && (
        <div style={{
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)', padding: '18px 24px',
          fontSize: '14px', lineHeight: 1.75, whiteSpace: 'pre-wrap', color: 'var(--text)',
        }}>
          {issue.body}
        </div>
      )}

      {/* Comments */}
      <div>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          {issue.comments?.length || 0} Comments
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {(issue.comments || []).map((c, i) => (
            <div key={i} style={{ display: 'flex', gap: '10px' }}>
              <Avatar name={c.author_id?.name || '?'} size={28} style={{ flexShrink: 0, marginTop: '1px' }} />
              <div style={{
                flex: 1, background: 'var(--surface)', border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius)', padding: '10px 14px',
              }}>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginBottom: '6px' }}>
                  <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{c.author_id?.name || 'Unknown'}</strong>
                  {' · '}{timeAgo(c.created_at)}
                </div>
                <p style={{ fontSize: '14px', whiteSpace: 'pre-wrap', color: 'var(--text)', lineHeight: 1.6 }}>{c.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Comment form */}
        <form onSubmit={submitComment} style={{ display: 'flex', gap: '10px', marginTop: '14px', alignItems: 'flex-end' }}>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            placeholder="Add a comment…"
            rows={2}
            style={{
              flex: 1, background: 'var(--surface)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius)', color: 'var(--text)', padding: '10px 12px',
              fontSize: '14px', resize: 'vertical', fontFamily: 'var(--font)',
              transition: 'border-color 0.15s ease',
              outline: 'none',
            }}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          />
          <Button type="submit" loading={submitting} size="sm">Post</Button>
        </form>
      </div>
    </div>
  );
}
