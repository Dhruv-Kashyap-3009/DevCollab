import IssueCard from './IssueCard';
import EmptyState from '../ui/EmptyState';

export default function IssueList({ issues, onSelect }) {
  if (issues.length === 0) {
    return (
      <div style={{ background: 'var(--surface)', border: '1px dashed var(--border)', borderRadius: 'var(--radius-md)' }}>
        <EmptyState icon="◎" title="No issues found" description="Create your first issue to start tracking work." />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      {issues.map(issue => <IssueCard key={issue._id} issue={issue} onClick={onSelect} />)}
    </div>
  );
}
