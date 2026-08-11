import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { userApi } from '../api/services';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import { SkeletonList } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

function timeAgo(date) {
  if (!date) return null;
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

const cardStyle = {
  background: 'var(--surface)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-md)',
  padding: '20px 24px',
};

export default function SettingsPage() {
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('return');

  const [loading, setLoading] = useState(true);
  const [hasToken, setHasToken] = useState(false);
  const [updatedAt, setUpdatedAt] = useState(null);
  const [scopes, setScopes] = useState([]);

  const [showForm, setShowForm] = useState(false);
  const [token, setToken] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState(false);
  // Show the setup guide by default until a token is saved.
  const [showGuide, setShowGuide] = useState(true);

  useEffect(() => {
    userApi.githubToken.get()
      .then(res => {
        setHasToken(!!res.data.hasToken);
        setUpdatedAt(res.data.updatedAt || null);
        setShowGuide(!res.data.hasToken);
        setLoading(false);
      })
      .catch(() => { setLoading(false); });
  }, []);

  const saveToken = async (e) => {
    e.preventDefault();
    if (!token.trim()) { setError('GitHub token is required'); return; }
    setSaving(true);
    setError('');
    try {
      const res = await userApi.githubToken.save(token.trim());
      setHasToken(true);
      setUpdatedAt(res.data.updatedAt);
      setScopes(res.data.scopes || []);
      setToken('');
      setShowForm(false);
      toast.success('GitHub token saved');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save token');
    } finally { setSaving(false); }
  };

  const removeToken = async () => {
    if (!confirm('Remove your GitHub token? Connected projects keep their repo links, but GitHub fetches will stop until you add a new token.')) return;
    setRemoving(true);
    try {
      await userApi.githubToken.remove();
      setHasToken(false);
      setUpdatedAt(null);
      setScopes([]);
      setShowForm(true);
      toast.success('GitHub token removed');
    } catch { toast.error('Failed to remove token'); }
    finally { setRemoving(false); }
  };

  const hasWebhookScope = scopes.length === 0 || scopes.includes('admin:repo_hook');

  return (
    <div className="fade-in" style={{ maxWidth: '640px' }}>
      <div className="page-header" style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Settings</h1>
        <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>Your account preferences</p>
        {returnTo && (
          <Link to={returnTo} style={{ display: 'inline-block', marginTop: '10px', fontSize: '13px', color: 'var(--primary)', textDecoration: 'none' }}>
            ← Back to the project
          </Link>
        )}
      </div>

      {loading ? <SkeletonList count={3} /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* GitHub */}
          <div>
            <h2 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              GitHub
            </h2>
            <div style={cardStyle}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', marginBottom: hasToken && !showForm ? '16px' : 0 }}>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    GitHub token
                    {hasToken && !showForm && (
                      <span style={{
                        fontSize: '11px', fontWeight: 600, color: 'var(--success)',
                        background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.2)',
                        borderRadius: '99px', padding: '2px 8px',
                      }}>
                        saved ✓
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '13px', color: 'var(--muted)', lineHeight: 1.6, marginTop: '4px' }}>
                    {hasToken && !showForm
                      ? `Saved ${timeAgo(updatedAt) || ''}. Used for every project — connect repos without pasting a token again.`
                      : 'Add a personal access token once. Every project connect then just needs the repo — no token to paste.'}
                  </p>
                  {hasToken && !showForm && !hasWebhookScope && (
                    <p style={{ fontSize: '12px', color: 'var(--warning)', marginTop: '8px', lineHeight: 1.5 }}>
                      Webhook scope not detected — classic tokens need <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>admin:repo_hook</code> for webhook management. Fine-grained tokens can't be checked; make sure you granted <code style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>Webhooks: Read and write</code>.
                    </p>
                  )}
                </div>
                {hasToken && !showForm && (
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                    <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>Update</Button>
                    <Button variant="ghost" size="sm" loading={removing} onClick={removeToken}
                      style={{ color: 'var(--danger)' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--danger-dim)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      Remove
                    </Button>
                  </div>
                )}
              </div>

              {(showForm || !hasToken) && (
                <form onSubmit={saveToken} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
                  <Input
                    label={hasToken ? 'New token' : 'Personal access token'}
                    type="password"
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    placeholder="github_pat_xxxxxxxxxxxxxxxxxxxx"
                    required
                    error={error}
                  />
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <Button type="submit" loading={saving}>Save token</Button>
                    {hasToken && (
                      <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setError(''); setToken(''); }}>Cancel</Button>
                    )}
                  </div>
                </form>
              )}
            </div>

            {/* Step-by-step guide for the whole GitHub setup */}
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '16px' }}>
              <button
                onClick={() => setShowGuide(s => !s)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: '6px',
                  fontSize: '12px', fontWeight: 600, color: 'var(--primary)',
                  padding: '2px 0', fontFamily: 'var(--font)',
                }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ transform: showGuide ? 'rotate(90deg)' : 'none', transition: 'transform 0.15s ease' }}>
                  <polyline points="9 18 15 12 9 6" />
                </svg>
                How to set up GitHub — step by step
              </button>

              {showGuide && (
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.7, marginTop: '10px' }}>
                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>1. Create a token on GitHub</div>
                    <div>GitHub → <strong style={{ color: 'var(--text-secondary)' }}>Settings</strong> → <strong style={{ color: 'var(--text-secondary)' }}>Developer settings</strong> → <strong style={{ color: 'var(--text-secondary)' }}>Personal access tokens</strong> → <strong style={{ color: 'var(--text-secondary)' }}>Generate new token</strong>.</div>
                    <div style={{ marginTop: '4px' }}>Name it “DevCollab” and set an expiration. Either token type works — the permissions are what matter.</div>

                    <div style={{ marginTop: '8px', color: 'var(--text)' }}>Classic token — tick these scopes:</div>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '4px' }}>
                      <div>• <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>repo</code> — the “read and write” permission: reads commits & pull requests and lets the app push snippets. Required for private repos.</div>
                      <div>• <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>admin:repo_hook</code> — only if you want live webhook events; otherwise skip it.</div>
                    </div>

                    <div style={{ marginTop: '8px', color: 'var(--text)' }}>Fine-grained token (GitHub’s recommended type):</div>
                    <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '3px', paddingLeft: '4px' }}>
                      <div>• Repository access → <strong style={{ color: 'var(--text-secondary)' }}>Only select repositories</strong> → pick the repos you use</div>
                      <div>• <strong style={{ color: 'var(--text-secondary)' }}>Contents</strong>: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read and write</code> — the main one: reads your code & commits, pushes snippets</div>
                      <div>• <strong style={{ color: 'var(--text-secondary)' }}>Pull requests</strong>: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read</code> to view PRs (<code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read and write</code> if you also want to create or comment on them)</div>
                      <div>• <strong style={{ color: 'var(--text-secondary)' }}>Issues</strong>: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read</code> to view issues (<code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read and write</code> if you also want to manage them)</div>
                      <div>• <strong style={{ color: 'var(--text-secondary)' }}>Webhooks</strong>: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read and write</code> — only if you want webhooks; otherwise leave it at Read</div>
                      <div>• <strong style={{ color: 'var(--text-secondary)' }}>Metadata</strong>: <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>Read</code> — always required, GitHub selects it automatically</div>
                    </div>

                    <div style={{ marginTop: '8px', color: 'var(--muted)' }}>Click <strong style={{ color: 'var(--text-secondary)' }}>Generate token</strong> and copy it right away — GitHub only shows it once.</div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>2. Save it here</div>
                    <div>Paste the token into the field above and click <strong style={{ color: 'var(--text-secondary)' }}>Save token</strong>. The app checks it against GitHub before saving — a typo or expired token is rejected immediately.</div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>3. Connect a project</div>
                    <div>Open any project → <strong style={{ color: 'var(--text-secondary)' }}>GitHub</strong> tab in the sidebar. Pick your repo (it autocompletes from your GitHub repos) or paste <code style={{ fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--primary)' }}>owner/name</code> or the full repo URL, then click <strong style={{ color: 'var(--text-secondary)' }}>Connect repository</strong>.</div>
                  </div>

                  <div style={{ marginBottom: '12px' }}>
                    <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: '4px' }}>4. Optional — live webhook events</div>
                    <div>In the project's GitHub tab → <strong style={{ color: 'var(--text-secondary)' }}>Webhook Setup</strong>, copy the URL and secret. On GitHub → your repo → <strong style={{ color: 'var(--text-secondary)' }}>Settings</strong> → <strong style={{ color: 'var(--text-secondary)' }}>Webhooks</strong> → <strong style={{ color: 'var(--text-secondary)' }}>Add webhook</strong>, paste both, pick events, and save. Pushes and pull requests then appear in DevCollab live.</div>
                  </div>

                  <div style={{ fontSize: '12px', color: 'var(--muted)' }}>
                    Your token is stored encrypted and never shown again. You can update or remove it anytime from this page — connected projects keep their repo links.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
