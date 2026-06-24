import SnippetCard from './SnippetCard';
import EmptyState from '../ui/EmptyState';

export default function SnippetList({ snippets, onSelect, onDelete }) {
  if (!snippets.length) return <EmptyState icon="⟨⟩" title="No snippets yet" description="Save reusable code snippets for your team." />;
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '14px' }}>
      {snippets.map(s => <SnippetCard key={s._id} snippet={s} onClick={onSelect} onDelete={onDelete} />)}
    </div>
  );
}
