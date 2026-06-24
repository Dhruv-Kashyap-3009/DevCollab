import { useState } from 'react';
import toast from 'react-hot-toast';

function timeAgo(date) {
  const diff = (Date.now() - new Date(date)) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
  return Math.floor(diff / 3600) + 'h ago';
}

function CopyBox({ label, value, masked, placeholder }) {
  const [revealed, setRevealed] = useState(false);

  const copy = () => {
    if (!value) return;
    navigator.clipboard.writeText(value);
    toast.success(`${label} copied`);
  };

  return (
    <div>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        background: 'var(--bg)', border: '1px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '10px 14px',
      }}>
        <code style={{
          flex: 1, fontFamily: 'var(--font-mono)', fontSize: '12px',
          color: value ? 'var(--text)' : 'var(--muted)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {!value ? placeholder : (masked && !revealed ? '•'.repeat(Math.min(value.length, 36)) : value)}
        </code>
        {value && masked && (
          <button
            onClick={() => setRevealed(r => !r)}
            style={{ background: 'var(--surface2)', border: '1px solid var(--border)', color: 'var(--muted)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font)' }}
          >{revealed ? 'Hide' : 'Show'}</button>
        )}
        {value && (
          <button
            onClick={copy}
            style={{ background: 'var(--primary-dim)', border: '1px solid rgba(59,130,246,0.2)', color: 'var(--primary)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', fontSize: '11px', cursor: 'pointer', flexShrink: 0, fontFamily: 'var(--font)', transition: 'all 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(59,130,246,0.2)'}
            onMouseLeave={e => e.currentTarget.style.background = 'var(--primary-dim)'}
          >Copy</button>
        )}
      </div>
    </div>
  );
}

const steps = [
  'Go to your GitHub repo → Settings → Webhooks → Add webhook',
  'Paste the Webhook URL shown above into the Payload URL field',
  'Paste the Webhook Secret into the Secret field',
  'Set Content type to application/json',
  'Select individual events: Pushes, Pull requests, Issues',
  'Click Add webhook to save',
];

export default function WebhookSetup({ webhookUrl, webhookSecret, recentEvents = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* URL + Secret */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <CopyBox
          label="Webhook URL"
          value={webhookUrl}
          placeholder="Connect GitHub first to get the webhook URL"
        />
        <CopyBox
          label="Webhook Secret"
          value={webhookSecret}
          masked
          placeholder="Connect GitHub first"
        />
      </div>

      {/* Setup steps */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>
        <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Setup Instructions</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {steps.map((step, i) => (
            <div key={i} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <span style={{
                width: '22px', height: '22px', borderRadius: '50%',
                background: 'var(--primary-dim)', color: 'var(--primary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '11px', fontWeight: 700, flexShrink: 0,
                border: '1px solid rgba(59,130,246,0.2)',
              }}>{i + 1}</span>
              <span style={{ fontSize: '13px', color: 'var(--text-secondary)', paddingTop: '2px', lineHeight: 1.55 }}>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent events */}
      {recentEvents.length > 0 && (
        <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)', padding: '20px 24px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '14px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Recent Events</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {recentEvents.slice(0, 5).map((ev, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                background: 'var(--surface2)', borderRadius: 'var(--radius)',
                padding: '8px 12px', border: '1px solid var(--border-subtle)',
              }}>
                <span style={{
                  fontSize: '11px', fontFamily: 'var(--font-mono)',
                  color: 'var(--primary)', background: 'var(--primary-dim)',
                  padding: '2px 7px', borderRadius: '4px',
                  border: '1px solid rgba(59,130,246,0.2)',
                  flexShrink: 0,
                }}>{ev.type}</span>
                <span style={{ fontSize: '13px', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                  {ev.type === 'GITHUB_PUSH' && `Push to ${ev.branch} by ${ev.pusher}`}
                  {ev.type === 'GITHUB_PR' && `PR #${ev.number} ${ev.action}: ${ev.title}`}
                </span>
                <span style={{
                  fontSize: '11px', color: 'var(--muted)', flexShrink: 0,
                  background: 'var(--surface3)', padding: '2px 7px',
                  borderRadius: '99px', border: '1px solid var(--border)',
                }}>{timeAgo(ev.timestamp)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
