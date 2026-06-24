import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const selectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', color: 'var(--text)', padding: '9px 12px',
  fontSize: '14px', width: '100%', fontFamily: 'var(--font)',
  outline: 'none', transition: 'border-color 0.15s ease',
};

export default function IssueForm({ onSubmit, loading, members = [], initial = {} }) {
  const [title, setTitle] = useState(initial.title || '');
  const [body, setBody] = useState(initial.body || '');
  const [priority, setPriority] = useState(initial.priority || 'medium');
  const [status, setStatus] = useState(initial.status || 'open');
  const [assigneeId, setAssigneeId] = useState(initial.assignee_id?._id || '');
  const [labels, setLabels] = useState((initial.labels || []).join(', '));
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) { setErrors({ title: 'Title is required' }); return; }
    setErrors({});
    onSubmit({
      title: title.trim(), body: body.trim(), priority, status,
      assignee_id: assigneeId || null,
      labels: labels.split(',').map(l => l.trim()).filter(Boolean),
    });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Issue title" required error={errors.title} />
      <Input label="Description" value={body} onChange={e => setBody(e.target.value)} placeholder="Describe the issue…" rows={4} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>Priority</label>
          <select value={priority} onChange={e => setPriority(e.target.value)} style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value)} style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>
      {members.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)', letterSpacing: '0.02em' }}>Assignee</label>
          <select value={assigneeId} onChange={e => setAssigneeId(e.target.value)} style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="">Unassigned</option>
            {members.map(m => (
              <option key={m.user_id?._id || m.user_id} value={m.user_id?._id || m.user_id}>
                {m.user_id?.name || 'Unknown'}
              </option>
            ))}
          </select>
        </div>
      )}
      <Input label="Labels" value={labels} onChange={e => setLabels(e.target.value)} placeholder="bug, frontend, urgent" />
      <Button type="submit" loading={loading} style={{ width: '100%' }}>
        {initial._id ? 'Save changes' : 'Create issue'}
      </Button>
    </form>
  );
}
