import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/services';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import EmptyState from '../components/ui/EmptyState';
import { SkeletonList } from '../components/ui/Skeleton';
import toast from 'react-hot-toast';

const roleVariant = { owner: 'primary', editor: 'warning', viewer: 'muted' };

function ProjectCard({ project, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onClick={() => onClick(project._id)}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered ? 'var(--surface2)' : 'var(--surface)',
        border: `1px solid ${hovered ? 'var(--primary)' : 'var(--border)'}`,
        borderRadius: 'var(--radius-md)',
        padding: '20px',
        cursor: 'pointer',
        transition: 'all 0.18s ease',
        boxShadow: hovered ? '0 4px 20px rgba(59,130,246,0.1)' : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 'var(--radius-sm)',
            background: 'var(--primary-dim)',
            border: '1px solid rgba(59,130,246,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '13px', fontWeight: 700, color: 'var(--primary)',
            flexShrink: 0,
          }}>
            {project.name[0].toUpperCase()}
          </div>
          <h3 style={{
            fontWeight: 600, fontSize: '14px', color: 'var(--text)',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
            letterSpacing: '-0.01em',
          }}>{project.name}</h3>
        </div>
        <Badge variant={roleVariant[project.myRole] || 'muted'}>{project.myRole}</Badge>
      </div>

      {/* Description */}
      {project.description && (
        <p style={{
          fontSize: '13px', color: 'var(--muted)', lineHeight: 1.55,
          display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
        }}>{project.description}</p>
      )}

      {/* Stats */}
      <div style={{
        display: 'flex', gap: '16px',
        paddingTop: '12px',
        borderTop: '1px solid var(--border-subtle)',
        fontSize: '12px', color: 'var(--muted)',
      }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
          {project.members?.length || 0}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          {project.openIssues || 0} open
        </span>
        {project.github_repo && (
          <span style={{
            marginLeft: 'auto',
            fontFamily: 'var(--font-mono)', fontSize: '11px',
            background: 'var(--surface3)', border: '1px solid var(--border)',
            borderRadius: '99px', padding: '2px 8px', color: 'var(--muted)',
            maxWidth: '140px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {project.github_repo}
          </span>
        )}
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);
  const [nameError, setNameError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    projectsApi.list().then(res => { setProjects(res.data.projects); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const createProject = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setNameError('Name is required'); return; }
    setNameError('');
    setCreating(true);
    try {
      const res = await projectsApi.create({ name: name.trim(), description: description.trim() });
      setProjects(prev => [res.data.project, ...prev]);
      setShowModal(false);
      setName(''); setDescription('');
      toast.success('Project created');
      navigate(`/projects/${res.data.project._id}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally { setCreating(false); }
  };

  return (
    <div className="fade-in">
      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontSize: '20px', fontWeight: 700, letterSpacing: '-0.02em' }}>Projects</h1>
          <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '3px' }}>
            {projects.length > 0 ? `${projects.length} project${projects.length !== 1 ? 's' : ''}` : 'All your collaboration spaces'}
          </p>
        </div>
        <Button onClick={() => setShowModal(true)} style={{ gap: '6px' }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          New project
        </Button>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          <SkeletonList count={4} height="140px" />
        </div>
      ) : projects.length === 0 ? (
        <div style={{
          background: 'var(--surface)', border: '1px dashed var(--border)',
          borderRadius: 'var(--radius-lg)',
        }}>
          <EmptyState
            icon={<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>}
            title="No projects yet"
            description="Create your first project to start collaborating with your team."
            action="Create project"
            onAction={() => setShowModal(true)}
          />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '14px' }}>
          {projects.map(p => (
            <ProjectCard key={p._id} project={p} onClick={(id) => navigate(`/projects/${id}`)} />
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="New project">
        <form onSubmit={createProject} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <Input label="Project name" value={name} onChange={e => setName(e.target.value)} placeholder="My awesome project" required error={nameError} />
          <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What is this project about?" rows={3} />
          <Button type="submit" loading={creating} style={{ width: '100%' }}>Create project</Button>
        </form>
      </Modal>
    </div>
  );
}
