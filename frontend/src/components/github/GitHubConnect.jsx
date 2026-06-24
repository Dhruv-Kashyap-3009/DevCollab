import { useState } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { githubApi } from '../../api/services';
import toast from 'react-hot-toast';

export default function GitHubConnect({ projectId, onConnected }) {
  const [repoOwner, setRepoOwner] = useState('');
  const [repoName, setRepoName] = useState('');
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!repoOwner.trim()) errs.repoOwner = 'Owner is required';
    if (!repoName.trim()) errs.repoName = 'Repo name is required';
    if (!token.trim()) errs.token = 'Personal access token is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await githubApi.connect(projectId, { repo_owner: repoOwner.trim(), repo_name: repoName.trim(), access_token: token.trim() });
      toast.success('GitHub connected!');
      onConnected(res.data);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to connect');
    } finally { setLoading(false); }
  };

  return (
    <div style={{ maxWidth: '480px' }}>
      {/* Info banner */}
      <div style={{
        background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.2)',
        borderRadius: 'var(--radius-md)', padding: '16px 20px',
        marginBottom: '24px', display: 'flex', gap: '12px',
      }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--primary)', flexShrink: 0, marginTop: '1px' }}>
          <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
        </svg>
        <div>
          <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>Connect a GitHub Repository</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Link your repo to see commits, pull requests, and receive real-time webhook events.
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Input label="Repository Owner" value={repoOwner} onChange={e => setRepoOwner(e.target.value)} placeholder="octocat" required error={errors.repoOwner} />
          <Input label="Repository Name" value={repoName} onChange={e => setRepoName(e.target.value)} placeholder="my-project" required error={errors.repoName} />
        </div>
        <Input label="Personal Access Token" type="password" value={token} onChange={e => setToken(e.target.value)} placeholder="ghp_xxxxxxxxxxxxxxxxxxxx" required error={errors.token} />
        <div style={{
          background: 'var(--surface2)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius)', padding: '10px 14px',
          fontSize: '12px', color: 'var(--muted)', lineHeight: 1.6,
        }}>
          Create a token at <strong style={{ color: 'var(--text-secondary)' }}>GitHub → Settings → Developer settings → Personal access tokens</strong>. Requires{' '}
          <code style={{ background: 'var(--surface3)', padding: '1px 5px', borderRadius: '4px', fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--primary)' }}>repo</code> scope.
        </div>
        <Button type="submit" loading={loading} style={{ width: '100%' }}>Connect repository</Button>
      </form>
    </div>
  );
}
