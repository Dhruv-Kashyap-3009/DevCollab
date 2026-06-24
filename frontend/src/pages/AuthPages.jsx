import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import Input from '../components/ui/Input';
import Button from '../components/ui/Button';
import toast from 'react-hot-toast';

function AuthShell({ children }) {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg)', padding: '16px',
      backgroundImage: 'radial-gradient(ellipse 80% 60% at 50% 0%, rgba(59,130,246,0.06) 0%, transparent 70%)',
    }}>
      <div style={{ width: '100%', maxWidth: '380px' }} className="fade-in">
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', justifyContent: 'center', marginBottom: '36px' }}>
          <div style={{
            width: 36, height: 36,
            background: 'linear-gradient(135deg, var(--primary) 0%, #6366f1 100%)',
            borderRadius: '10px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', fontWeight: 800, color: '#fff',
            boxShadow: '0 4px 16px rgba(59,130,246,0.4)',
          }}>D</div>
          <span style={{ fontWeight: 700, fontSize: '17px', color: 'var(--text)', letterSpacing: '-0.03em' }}>DevCollab</span>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)',
          padding: '28px',
          boxShadow: 'var(--shadow)',
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export function LoginPage() {
  const { login } = useAuthStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!email) errs.email = 'Email is required';
    if (!password) errs.password = 'Password is required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
      setErrors({ password: err.response?.data?.message });
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.02em' }}>Welcome back</h1>
      <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>Sign in to your account</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required error={errors.email} />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required error={errors.password} />
        <Button type="submit" loading={loading} style={{ marginTop: '6px', width: '100%' }}>Sign in</Button>
      </form>
      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '20px' }}>
        No account?{' '}
        <Link to="/register" style={{ color: 'var(--primary)', fontWeight: 500 }}>Create one</Link>
      </p>
    </AuthShell>
  );
}

export function RegisterPage() {
  const { register } = useAuthStore();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!name.trim()) errs.name = 'Name is required';
    if (!email) errs.email = 'Email is required';
    if (password.length < 8) errs.password = 'Password must be at least 8 characters';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    try {
      await register(name, email, password);
      navigate('/');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    } finally { setLoading(false); }
  };

  return (
    <AuthShell>
      <h1 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px', letterSpacing: '-0.02em' }}>Create an account</h1>
      <p style={{ color: 'var(--muted)', fontSize: '13px', marginBottom: '24px' }}>Start collaborating with your team</p>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <Input label="Name" value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required error={errors.name} />
        <Input label="Email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" required error={errors.email} />
        <Input label="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimum 8 characters" required error={errors.password} />
        <Button type="submit" loading={loading} style={{ marginTop: '6px', width: '100%' }}>Create account</Button>
      </form>
      <p style={{ textAlign: 'center', fontSize: '13px', color: 'var(--muted)', marginTop: '20px' }}>
        Already have an account?{' '}
        <Link to="/login" style={{ color: 'var(--primary)', fontWeight: 500 }}>Sign in</Link>
      </p>
    </AuthShell>
  );
}
