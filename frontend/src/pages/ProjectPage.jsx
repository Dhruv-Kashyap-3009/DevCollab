import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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

const activityColor = {
  issue_created: 'var(--success)', issue_reopened: 'var(--success)', issue_deleted: 'var(--danger)',
  issue_updated: 'var(--primary)', issue_closed: 'var(--muted)',
  comment_added: 'var(--primary)',
  snippet_created: 'var(--warning)', snippet_updated: 'var(--warning)', snippet_deleted: 'var(--muted)', snippet_pushed: 'var(--warning)',
  doc_created: 'var(--purple)', doc_updated: 'var(--purple)', doc_deleted: 'var(--muted)',
  member_added: 'var(--success)',
  github_push: 'var(--primary)', github_pr: 'var(--purple)', github_connected: 'var(--success)',
  project_created: 'var(--success)', project_updated: 'var(--warning)',
};

const svgProps = {
  width: 15, height: 15, viewBox: '0 0 24 24',
  fill: 'none', stroke: 'currentColor', strokeWidth: 2,
  strokeLinecap: 'round', strokeLinejoin: 'round',
};

const STAT_ICONS = {
  issues: (<svg {...svgProps}><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>),
  snippets: (<svg {...svgProps}><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>),
  docs: (<svg {...svgProps}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /></svg>),
  members: (<svg {...svgProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>),
};

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius-md)', padding: '16px 18px',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <span style={{ fontSize: '12px', color: 'var(--muted)', fontWeight: 500 }}>{label}</span>
        <span style={{
          width: 30, height: 30, borderRadius: 'var(--radius)',
          background: color ? `color-mix(in srgb, ${color} 14%, transparent)` : 'var(--surface2)',
          color: color || 'var(--muted)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>{icon}</span>
      </div>
      <div style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1 }}>{value}</div>
    </div>
  );
}

const sectionTitle = {
  fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)',
  textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '12px',
};

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [deleting, setDeleting] = useState(false);
  // The project payload from getProject already carries myRole — derive the
  // gates from it instead of fetching the project a second time.
  const myRole = project?.myRole;
  const canEdit = myRole === 'editor' || myRole === 'owner';
  const isOwner = myRole === 'owner';

  // Latest-fetch-wins guard: a slow response from an earlier fetch (the mount
  // load, a MEMBER_ADDED refetch, or a project switch) must never clobber a
  // newer one. Without this, the initial GET could resolve after a refetch and
  // render stale members/activity — the exact out-of-sync bug this page is
  // supposed to avoid.
  const fetchSeq = useRef(0);
  const refresh = useCallback(({ silent = false } = {}) => {
    const seq = ++fetchSeq.current;
    Promise.all([
      projectsApi.get(projectId),
      activityApi.list(projectId, 10),
    ]).then(([projRes, actRes]) => {
      if (seq !== fetchSeq.current) return; // stale response — a newer fetch won
      setProject(projRes.data.project);
      setStats(projRes.data.stats || {});
      setActivities(actRes.data.activities || []);
      if (!silent) setLoading(false);
    }).catch(() => {
      if (seq !== fetchSeq.current) return;
      if (!silent) setLoading(false);
    });
  }, [projectId]);

  useEffect(() => { refresh(); }, [refresh]);

  useProjectSocket(projectId, {
    onPresenceSnapshot: (msg) => setOnlineMembers(msg.members || []),
    onUserOnline: (msg) => setOnlineMembers(prev => prev.find(m => m.userId === msg.userId) ? prev : [...prev, { userId: msg.userId, userName: msg.userName }]),
    onUserOffline: (msg) => setOnlineMembers(prev => prev.filter(m => m.userId !== msg.userId)),
    // A new member accepted an invite — re-fetch so the list, count, and
    // activity feed reflect the server truth (including the real activity
    // entry). The seq guard makes this race-free: whichever fetch issued last
    // wins, so a stale initial-load response can never undo the update.
    onMemberAdded: () => { refresh({ silent: true }); },
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
      const data = err.response?.data;
      if (err.response?.status === 409 && data?.inviteUrl) {
        toast('Invite already sent — share this link: ' + data.inviteUrl, { duration: 8000 });
      } else {
        toast.error(data?.message || 'Failed to send invite');
      }
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
    } catch (err) { toast.error(err.response?.data?.message || 'Failed to update'); }
    finally { setSaving(false); }
  };

  const navigate = useNavigate();
  const confirmDelete = async (e) => {
    e.preventDefault();
    if (deleteConfirm.trim() !== project.name) return;
    setDeleting(true);
    try {
      await projectsApi.delete(projectId);
      toast.success('Project deleted');
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to delete project');
      setDeleting(false);
    }
  };

  if (loading) return <SkeletonList count={6} height="60px" />;
  if (!project) return <div style={{ color: 'var(--danger)', padding: '24px' }}>Project not found</div>;

  const roleVariant = { owner: 'primary', editor: 'warning', viewer: 'muted' };

  return (
    <div className="page-with-rail fade-in">
      {/* Main column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', minWidth: 0 }}>
        {/* Header */}
        <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: 34, height: 34, borderRadius: 'var(--radius-sm)',
                background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.25)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'var(--primary)', flexShrink: 0,
              }}>{project.name[0].toUpperCase()}</div>
              <h1 style={{
                fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>{project.name}</h1>
            </div>
            {project.description && <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '6px' }}>{project.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {canEdit && (
              <Button variant="ghost" size="sm" onClick={() => { setEditName(project.name); setEditDesc(project.description); setShowEditModal(true); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
                Edit
              </Button>
            )}
            {isOwner && (
              <Button variant="danger" size="sm" onClick={() => { setDeleteConfirm(''); setShowDeleteModal(true); }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>
                Delete
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid-4-stats" style={{ gap: '12px' }}>
          <StatCard label="Open issues" value={stats.openIssues || 0} icon={STAT_ICONS.issues} color="var(--danger)" />
          <StatCard label="Snippets" value={stats.totalSnippets || 0} icon={STAT_ICONS.snippets} color="var(--warning)" />
          <StatCard label="Docs" value={stats.totalDocs || 0} icon={STAT_ICONS.docs} color="var(--purple)" />
          {/* Derive the count from the live members array so a MEMBER_ADDED
              socket update can never drift out of sync with the list. */}
          <StatCard label="Members" value={project.members?.length || 0} icon={STAT_ICONS.members} color="var(--success)" />
        </div>

        {/* Activity timeline */}
        <div>
          <h2 style={sectionTitle}>Recent activity</h2>
          {activities.length === 0 ? (
            <div style={{
              background: 'var(--surface)', border: '1px dashed var(--border)',
              borderRadius: 'var(--radius-md)', padding: '28px', textAlign: 'center',
              color: 'var(--muted)', fontSize: '13px',
            }}>
              No activity yet — create an issue, snippet, or doc to get started.
            </div>
          ) : (
            <div className="timeline">
              {activities.map(a => (
                <div className="timeline-item" key={a._id}>
                  <span className="timeline-dot" style={{ background: activityColor[a.type] || 'var(--muted)' }} />
                  <div className="timeline-body">
                    <div className="timeline-text">
                      <strong style={{ fontWeight: 600 }}>{a.user_id?.name || 'System'}</strong>
                      <span style={{ color: 'var(--muted)' }}> {a.type.replace(/_/g, ' ')}</span>
                      {a.payload?.title && <span style={{ color: 'var(--text-secondary)' }}> "{a.payload.title}"</span>}
                      {a.payload?.issueNumber && <span style={{ color: 'var(--primary)', fontFamily: 'var(--font-mono)', fontSize: '12px' }}> #{a.payload.issueNumber}</span>}
                    </div>
                    <div className="timeline-time">{timeAgo(a.created_at)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right rail */}
      <aside className="rail">
        {/* Members */}
        <div className="rail-card">
          <h3>Members ({project.members?.length || 0})</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {(project.members || []).map(m => {
              const user = m.user_id;
              const isOnline = onlineMembers.some(o => o.userId === (user?._id || m.user_id));
              return (
                <div key={m._id} style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '7px 8px', borderRadius: 'var(--radius)',
                  transition: 'background 0.15s ease',
                }}>
                  <div style={{ position: 'relative', flexShrink: 0 }}>
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
                    <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user?.name || 'Unknown'}
                      {isOnline && <span style={{ color: 'var(--success)', fontSize: '11px', fontWeight: 500, marginLeft: '6px' }}>online</span>}
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user?.email}</div>
                  </div>
                  <Badge variant={roleVariant[m.role]}>{m.role}</Badge>
                </div>
              );
            })}
          </div>
        </div>

        {/* Invite — owners only (the API enforces this too) */}
        {isOwner && (
          <div className="rail-card">
            <h3>Invite member</h3>
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
        )}
      </aside>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit project">
        <form onSubmit={saveEdit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Name" value={editName} onChange={e => setEditName(e.target.value)} required />
          <Input label="Description" value={editDesc} onChange={e => setEditDesc(e.target.value)} rows={3} />
          <Button type="submit" loading={saving} style={{ width: '100%' }}>Save changes</Button>
        </form>
      </Modal>

      <Modal isOpen={showDeleteModal} onClose={() => setShowDeleteModal(false)} title="Delete project" width="440px">
        <form onSubmit={confirmDelete} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            This permanently deletes <strong style={{ color: 'var(--text)' }}>{project.name}</strong> and everything in it — issues, snippets, docs, GitHub connection, invites, and activity. This can't be undone.
          </div>
          <Input
            label={`Type “${project.name}” to confirm`}
            value={deleteConfirm}
            onChange={e => setDeleteConfirm(e.target.value)}
            placeholder={project.name}
            autoFocus
          />
          <div style={{ display: 'flex', gap: '10px' }}>
            <Button type="button" variant="ghost" onClick={() => setShowDeleteModal(false)} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" variant="danger" disabled={deleteConfirm.trim() !== project.name} loading={deleting} style={{ flex: 1 }}>Delete project</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
