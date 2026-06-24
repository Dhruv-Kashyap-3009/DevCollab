import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';

const LANGUAGES = ['javascript','typescript','python','rust','go','css','html','bash','java','c','cpp','json','yaml','markdown','sql'];

const selectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', color: 'var(--text)', padding: '9px 12px',
  fontSize: '14px', width: '100%', fontFamily: 'var(--font)', outline: 'none',
  transition: 'border-color 0.15s ease',
};

export default function SnippetForm({ onSubmit, loading, initial = {} }) {
  const [title, setTitle] = useState(initial.title || '');
  const [description, setDescription] = useState(initial.description || '');
  const [code, setCode] = useState(initial.code || '');
  const [language, setLanguage] = useState(initial.language || 'javascript');
  const [visibility, setVisibility] = useState(initial.visibility || 'public');
  const [errors, setErrors] = useState({});

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!title.trim()) errs.title = 'Title is required';
    if (!code.trim()) errs.code = 'Code is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSubmit({ title: title.trim(), description: description.trim(), code, language, visibility });
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <Input label="Title" value={title} onChange={e => setTitle(e.target.value)} placeholder="Snippet title" required error={errors.title} />
      <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What does this snippet do?" />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Language</label>
          <select value={language} onChange={e => setLanguage(e.target.value)} style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
          </select>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>Visibility</label>
          <select value={visibility} onChange={e => setVisibility(e.target.value)} style={selectStyle}
            onFocus={e => e.target.style.borderColor = 'var(--primary)'}
            onBlur={e => e.target.style.borderColor = 'var(--border)'}
          >
            <option value="public">Public</option>
            <option value="private">Private</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <label style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
          Code <span style={{ color: 'var(--danger)' }}>*</span>
        </label>
        <textarea
          value={code}
          onChange={e => setCode(e.target.value)}
          placeholder="Paste your code here…"
          rows={10}
          style={{
            background: 'var(--bg)',
            border: `1px solid ${errors.code ? 'var(--danger)' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', color: 'var(--text)', padding: '12px',
            fontSize: '13px', fontFamily: 'var(--font-mono)', resize: 'vertical',
            outline: 'none', lineHeight: 1.7, transition: 'border-color 0.15s ease',
          }}
          onFocus={e => e.target.style.borderColor = errors.code ? 'var(--danger)' : 'var(--primary)'}
          onBlur={e => e.target.style.borderColor = errors.code ? 'var(--danger)' : 'var(--border)'}
        />
        {errors.code && <span style={{ fontSize: '12px', color: 'var(--danger)' }}>⚠ {errors.code}</span>}
      </div>
      <Button type="submit" loading={loading} style={{ width: '100%' }}>
        {initial._id ? 'Save changes' : 'Create snippet'}
      </Button>
    </form>
  );
}
