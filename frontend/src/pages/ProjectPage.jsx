import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectsApi, activityApi } from '../api/services';
import useProjectSocket from '../hooks/useProjectSocket';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import { SkeletonList } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
  return Math.floor(diff / 86400) + 'd ago';
}

const activityIcon = {
  issue_created: '◎', issue_updated: '◎', issue_closed: '◎', issue_reopened: '◎',
  comment_added: '💬', snippet_created: '⟨⟩', snippet_updated: '⟨⟩', snippet_deleted: '⟨⟩',
  doc_created: '≡', doc_updated: '≡', doc_deleted: '≡',
  member_added: '👤', github_push: '🔀', github_pr: '🔁', github_connected: '◉', project_updated: '⬡',
};

const activityColor = {
  issue_created: 'var(--success)', issue_closed: 'var(--muted)',
  comment_added: 'var(--primary)', snippet_created: 'var(--warning)',
  doc_created: 'var(--purple)', github_push: 'var(--primary)', github_pr: 'var(--purple)',
  member_added: 'var(--success)',
};

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '18px 20px',
      display: 'flex', alignItems: 'center', gap: '14px',
    }}>
      <div style={{
        width: 38, height: 38, borderRadius: 'var(--radius)',
        background: color ? `${color}18` : 'var(--surface2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '16px', flexShrink: 0,
      }}>{icon}</div>
      <div>
        <div style={{ fontSize: '22px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '3px' }}>{label}</div>
      </div>
    </div>
  );
}

const selectStyle = {
  background: 'var(--surface2)', border: '1px solid var(--border)',
  borderRadius: 'var(--radius)', color: 'var(--text)',
  padding: '9px 12px', fontSize: '14px', fontFamily: 'var(--font)',
};

export default function ProjectPage() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [stats, setStats] = useState({});
  const [activities, setActivities] = useState([]);
  const [onlineMembers, setOnlineMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');
  const [inviting, setInviting] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([
      projectsApi.get(projectId),
      activityApi.list(projectId, 10),
    ]).then(([projRes, actRes]) => {
      setProject(projRes.data.project);
      setStats(projRes.data.stats || {});
      setActivities(actRes.data.activities || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [projectId]);

  useProjectSocket(projectId, {
    onUserOnline: (msg) => setOnlineMembers(prev => prev.find(m => m.userId === msg.userId) ? prev : [...prev, { userId: msg.userId, userName: msg.userName }]),
    onUserOffline: (msg) => setOnlineMembers(prev => prev.filter(m => m.userId !== msg.userId)),
  });

  const sendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      const res = await projectsApi.invite(projectId, { email: inviteEmail, role: inviteRole });
      toast.success('Invite sent! Share this link: ' + res.data.inviteUrl);
      setInviteEmail('');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send invite');
    } finally { setInviting(false); }
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await projectsApi.update(projectId, { name: editName, description: editDesc });
      setProject(res.data.project);
      setShowEditModal(false);
      toast.success('Project updated');
    } catch { toast.error('Failed to update'); }
    finally { setSaving(false); }
  };

  if (loading) return <SkeletonList count={6} height="60px" />;
  if (!project) return <div style={{ color: 'var(--danger)', padding: '24px' }}>Project not found</div>;

  const roleVariant = { owner: 'primary', editor: 'warning', viewer: 'muted' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} className="fade-in">
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>{project.name}</h1>
          {project.description && <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '4px' }}>{project.description}</p>}
        </div>
        <Button variant="ghost" size="sm" onClick={() => { setEditName(project.name); setEditDesc(project.description); setShowEditModal(true); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          Edit
        </Button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
        <StatCard label="Open Issues" value={stats.openIssues || 0} icon="◎" color="var(--danger)" />
        <StatCard label="Snippets" value={stats.totalSnippets || 0} icon="⟨⟩" color="var(--warning)" />
        <StatCard label="Docs" value={stats.totalDocs || 0} icon="≡" color="var(--purple)" />
        <StatCard label="Members" value={stats.memberCount || 0} icon="👥" color="var(--success)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* Activity Feed */}
        <div>
          <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Activity</h2>
          {activities.length === 0 ? (
            <div style={{ color: 'var(--muted)', fontSize: '13px', padding: '20px 0' }}>No activity yet.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              {activities.map((a, idx) => (
                <div key={a._id} style={{
                  display: 'flex', gap: '10px', alignItems: 'flex-start',
                  padding: '10px 12px',
                  background: 'var(--surface)',
                  borderRadius: 'var(--radius)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: idx < activities.length - 1 ? '2px' : 0,
                }}>
                  <span style={{
                    width: '26px', height: '26px',
                    borderRadius: '50%',
                    background: 'var(--surface2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '12px', flexShrink: 0,
                  }}>{activityIcon[a.type] || '•'}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontSize: '13px', color: 'var(--text)', lineHeight: 1.4 }}>
                      <strong style={{ color: 'var(--text)', fontWeight: 600 }}>{a.user_id?.name || 'System'}</strong>
                      {' '}<span style={{ color: 'var(--muted)' }}>{a.type.replace(/_/g, ' ')}</span>
                      {a.payload?.title && <span style={{ color: 'var(--text-secondary)' }}> "{a.payload.title}"</span>}
                      {a.payload?.issueNumber && <span style={{ color: 'var(--primary)' }}> #{a.payload.issueNumber}</span>}
                    </span>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '2px' }}>{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Members + Invite */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <h2 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Members ({project.members?.length || 0})
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {(project.members || []).map(m => {
                const user = m.user_id;
                const isOnline = onlineMembers.some(o => o.userId === (user?._id || m.user_id));
                return (
                  <div key={m._id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '10px 12px',
                    background: 'var(--surface)', border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius)',
                  }}>
                    <div style={{ position: 'relative' }}>
                      <Avatar name={user?.name || '?'} size={30} />
                      {isOnline && (
                        <span style={{
                          position: 'absolute', bottom: 0, right: 0,
                          width: '8px', height: '8px',
                          background: 'var(--success)', borderRadius: '50%',
                          border: '2px solid var(--surface)',
                        }} />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)' }}>{user?.name || 'Unknown'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                    </div>
                    <Badge variant={roleVariant[m.role]}>{m.role}</Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Invite */}
          <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '16px' }}>
            <h3 style={{ fontSize: '13px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>Invite member</h3>
            <form onSubmit={sendInvite} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Input value={inviteEmail} onChange={e => setInviteEmail(e.target.value)} placeholder="colleague@example.com" type="email" />
              <div style={{ display: 'flex', gap: '8px' }}>
                <select value={inviteRole} onChange={e => setInviteRole(e.target.value)} style={{ ...selectStyle, flex: 1 }}>
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                </select>
                <Button type="submit" loading={inviting} size="sm">Send invite</Button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit project">
        <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Name" value={editName} onChange={e => setEditName(e.target.value)} required />
          <Input label="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
          <Button type="submit" loading={saving} style={{ width: '100%' }}>Save changes</Button>
        </form>
      </Modal>
    </div>
  );
}
