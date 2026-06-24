import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { githubApi } from '../api/services';
import GitHubConnect from '../components/github/GitHubConnect';
import GitHubStatus from '../components/github/GitHubStatus';
import CommitList from '../components/github/CommitList';
import PullRequestList from '../components/github/PullRequestList';
import WebhookSetup from '../components/github/WebhookSetup';
import useProjectSocket from '../hooks/useProjectSocket';
import toast from 'react-hot-toast';

const TABS = ['Overview', 'Commits', 'Pull Requests', 'Webhook Setup'];

export default function GitHubPage() {
  const { projectId } = useParams();
  const [activeTab, setActiveTab] = useState('Overview');
  const [status, setStatus] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [commits, setCommits] = useState([]);
  const [loadingCommits, setLoadingCommits] = useState(false);
  const [pulls, setPulls] = useState([]);
  const [loadingPulls, setLoadingPulls] = useState(false);
  const [branches, setBranches] = useState([]);
  const [webhookData, setWebhookData] = useState({ url: '', secret: '' });
  const [recentEvents, setRecentEvents] = useState([]);

  useEffect(() => {
    githubApi.status(projectId).then(res => {
      setStatus(res.data);
      setLoadingStatus(false);
    }).catch(() => setLoadingStatus(false));
  }, [projectId]);

  useEffect(() => {
    if (!status?.connected) return;
    if (activeTab === 'Commits' && commits.length === 0) {
      setLoadingCommits(true);
      githubApi.commits(projectId).then(res => { setCommits(res.data.commits || []); setLoadingCommits(false); }).catch(err => { toast.error(err.response?.data?.message || 'Failed to load commits'); setLoadingCommits(false); });
    }
    if (activeTab === 'Pull Requests' && pulls.length === 0) {
      setLoadingPulls(true);
      githubApi.pulls(projectId).then(res => { setPulls(res.data.pulls || []); setLoadingPulls(false); }).catch(err => { toast.error(err.response?.data?.message || 'Failed to load PRs'); setLoadingPulls(false); });
    }
    if (activeTab === 'Overview' && branches.length === 0 && status?.connected) {
      githubApi.branches(projectId).then(res => setBranches(res.data.branches || [])).catch(() => {});
    }
  }, [activeTab, status]);

  useProjectSocket(projectId, {
    onGithubEvent: (event) => {
      setRecentEvents(prev => [event, ...prev].slice(0, 5));
    },
  });

  const handleConnected = (data) => {
    setWebhookData({ url: data.webhookUrl, secret: data.webhookSecret });
    githubApi.status(projectId).then(res => setStatus(res.data));
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect GitHub integration?')) return;
    try {
      await githubApi.disconnect(projectId);
      setStatus({ connected: false });
      setCommits([]); setPulls([]); setBranches([]);
      toast.success('GitHub disconnected');
    } catch { toast.error('Failed to disconnect'); }
  };

  if (loadingStatus) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '80px', color: 'var(--muted)', fontSize: '14px' }}>
      Loading…
    </div>
  );

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>GitHub</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>Repository integration</p>
        </div>
        {status?.connected && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: 'var(--success)', background: 'var(--success-dim)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '99px', padding: '4px 12px' }}>
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', display: 'inline-block' }} />
            {status.repo}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex', gap: '2px', marginBottom: '24px',
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-md)', padding: '4px',
        width: 'fit-content',
      }}>
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '6px 14px', borderRadius: 'var(--radius-sm)',
              fontSize: '13px', fontWeight: 500,
              background: activeTab === tab ? 'var(--surface2)' : 'transparent',
              color: activeTab === tab ? 'var(--text)' : 'var(--muted)',
              border: activeTab === tab ? '1px solid var(--border)' : '1px solid transparent',
              cursor: 'pointer', transition: 'all 0.15s ease',
              fontFamily: 'var(--font)',
            }}
          >{tab}</button>
        ))}
      </div>

      {/* Tab content */}
      {activeTab === 'Overview' && (
        status?.connected
          ? <GitHubStatus status={status} branches={branches} onDisconnect={handleDisconnect} />
          : <GitHubConnect projectId={projectId} onConnected={handleConnected} />
      )}

      {activeTab === 'Commits' && (
        status?.connected
          ? <CommitList commits={commits} loading={loadingCommits} />
          : <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>Connect a GitHub repository first.</div>
      )}

      {activeTab === 'Pull Requests' && (
        status?.connected
          ? <PullRequestList pulls={pulls} loading={loadingPulls} />
          : <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '40px', textAlign: 'center', background: 'var(--surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>Connect a GitHub repository first.</div>
      )}

      {activeTab === 'Webhook Setup' && (
        <WebhookSetup
          webhookUrl={webhookData.url || (status?.connected ? `http://localhost:5000/api/github/webhook/${projectId}` : '')}
          webhookSecret={webhookData.secret}
          recentEvents={recentEvents}
        />
      )}
    </div>
  );
}
