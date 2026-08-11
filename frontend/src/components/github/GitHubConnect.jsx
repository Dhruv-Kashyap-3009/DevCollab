import { useState, useEffect } from 'react';
import Input from '../ui/Input';
import Button from '../ui/Button';
import { githubApi, userApi } from '../../api/services';
import toast from 'react-hot-toast';

export default function GitHubConnect({ projectId, onConnected, onGoToSettings }) {
  const [repo, setRepo] = useState('');
  // null = still loading (derived, so no synchronous setState inside the effect)
  const [repos, setRepos] = useState(null);
  const [tokenError, setTokenError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchRepos = () => {
    userApi.githubRepos()
      .then(res => setRepos(res.data.repos || []))
      .catch(err => {
        if (err.response?.status === 401 || err.response?.data?.code === 'TOKEN_INVALID') {
          setTokenError(true);
          setRepos([]);
        } else if (err.response?.data?.code === 'NO_TOKEN') {
          onGoToSettings();
        } else {
          setRepos([]);
        }
      });
  };

  useEffect(() => { fetchRepos(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const refresh = () => {
    setTokenError(false);
    setRepos(null);
    fetchRepos();
  };

  const loadingRepos = repos === null;
  const repoList = repos || [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!repo.trim()) { setError('Pick a repo or paste owner/repo'); return; }
    setError('');
    setLoading(true);
    try {
      const res = await githubApi.connect(projectId, repo.trim());
      toast.success('GitHub connected!');
      onConnected(res.data);
    } catch (err) {
      if (err.response?.data?.code === 'NO_TOKEN') {
        onGoToSettings();
      } else {
        setError(err.response?.data?.message || 'Failed to connect');
      }
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
            Your token is saved. Pick a repo — commits and pull requests work immediately. For live webhook events, set up the webhook once in the Webhook Setup tab.
          </div>
        </div>
      </div>

      {tokenError && (
        <div style={{
          background: 'var(--danger-dim)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 'var(--radius-md)', padding: '14px 18px', marginBottom: '16px',
          fontSize: '13px', color: 'var(--text)',
        }}>
          Your GitHub token is invalid or expired.{' '}
          <button onClick={onGoToSettings} style={{ background: 'none', border: 'none', padding: 0, color: 'var(--danger)', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '13px' }}>
            Update it in Settings
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <Input
            label="Repository"
            value={repo}
            onChange={e => setRepo(e.target.value)}
            placeholder="owner/name or https://github.com/owner/name"
            list="gh-repos"
            required
            error={error || undefined}
          />
          <datalist id="gh-repos">
            {repoList.map(r => <option key={r.full_name} value={r.full_name} />)}
          </datalist>
          <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '6px' }}>
            {loadingRepos ? 'Loading your repos…' : `${repoList.length} repo${repoList.length !== 1 ? 's' : ''} available`}
            {repoList.length > 0 && (
              <button type="button" onClick={refresh} style={{ background: 'none', border: 'none', padding: 0, marginLeft: '10px', color: 'var(--primary)', cursor: 'pointer', fontFamily: 'var(--font)', fontSize: '12px' }}>
                Refresh
              </button>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <button
            type="button"
            onClick={onGoToSettings}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '12px', color: 'var(--muted)', padding: '2px 0',
              fontFamily: 'var(--font)',
            }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--muted)'}
          >
            Manage token in Settings →
          </button>
          <Button type="submit" loading={loading}>Connect repository</Button>
        </div>
      </form>
    </div>
  );
}
