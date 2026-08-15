import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { projectsApi } from '../api/services';
import BrandMark from '../components/ui/BrandMark';
import toast from 'react-hot-toast';

export default function AcceptInvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('');
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    projectsApi.acceptInvite(token)
      .then(res => {
        setStatus('success');
        toast.success('You joined the project!');
        setTimeout(() => navigate(`/projects/${res.data.project_id}`), 2000);
      })
      .catch(err => {
        if (err.response?.status === 401) {
          // Not signed in (or the session expired) — send them through login
          // while keeping the invite token in the URL via ?next=.
          navigate('/login?next=' + encodeURIComponent('/invite/' + token + '/accept'));
          return;
        }
        setStatus('error');
        setMessage(err.response?.data?.message || 'Invalid or expired invite link');
      });
  }, [token, navigate]);

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{ width: '100%', maxWidth: '400px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '11px', justifyContent: 'center', marginBottom: '28px' }}>
          <BrandMark size={30} />
          <span style={{ fontWeight: 700, fontSize: '18px', color: 'var(--text)', letterSpacing: '-0.03em' }}>DevCollab</span>
        </div>
      <div style={{
        background: 'var(--surface)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', padding: '40px',
        maxWidth: '400px', width: '100%', textAlign: 'center',
      }}>
        {status === 'loading' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>⏳</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Accepting invite...</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>Please wait</p>
          </>
        )}
        {status === 'success' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>🎉</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>You're in!</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>Redirecting to your project...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div style={{ fontSize: '32px', marginBottom: '16px' }}>❌</div>
            <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Invite Failed</h2>
            <p style={{ color: 'var(--muted)', fontSize: '13px', marginTop: '8px' }}>{message}</p>
            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '20px', padding: '10px 24px',
                background: 'var(--primary)', color: '#fff',
                border: 'none', borderRadius: 'var(--radius)',
                cursor: 'pointer', fontSize: '14px', fontFamily: 'var(--font)',
              }}
            >Go to Dashboard</button>
          </>
        )}
      </div>
      </div>
    </div>
  );
}