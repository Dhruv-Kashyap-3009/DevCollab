import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';
import { ensureFreshToken } from '../api/token';

// Same-origin by default so Vite's /ws proxy (dev) and the deployed origin
// (prod) both work; the backend serves the socket on the same port as the API.
const WS_PROTO = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const WS_URL = import.meta.env.VITE_WS_URL || `${WS_PROTO}//${window.location.host}`;

export default function useProjectSocket(projectId, options = {}) {
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);
  const connectRef = useRef(null);
  const projectIdRef = useRef(projectId);
  useEffect(() => { projectIdRef.current = projectId; }, [projectId]);

  // Always call the latest handlers: the socket is opened once per projectId,
  // so callbacks must not capture stale state (e.g. the active issue filters).
  const optionsRef = useRef(options);
  useEffect(() => { optionsRef.current = options; });
  const h = () => optionsRef.current;

  const connect = useCallback(async () => {
    if (!projectId) return;

    // Refresh the access token BEFORE opening the socket. The server rejects
    // an expired token during the handshake; refreshing here keeps the socket
    // healthy for the whole session instead of failing on first connect.
    const token = await ensureFreshToken();
    if (!token || !mountedRef.current) return;
    // The await above may have resumed after navigation (projectId changed) or
    // after a StrictMode re-mount already created a socket — bail in both cases
    // so we never leak a stale/duplicate connection.
    const existing = wsRef.current;
    if (projectIdRef.current !== projectId) return;
    if (existing && existing.readyState !== WebSocket.CLOSED) return;

    // Credential goes in the first message, not the URL: query strings leak
    // into proxy and access logs, so a JWT in the URL is a credential leak.
    const url = `${WS_URL}/ws`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      if (ws._abandon) { ws.close(); return; } // unmounted while CONNECTING
      retryRef.current = 0;
      ws.send(JSON.stringify({ type: 'AUTH', token, projectId }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const opts = h();
        switch (msg.type) {
          case 'CONNECTED':
            break;
          case 'PRESENCE_SNAPSHOT':
            opts.onPresenceSnapshot && opts.onPresenceSnapshot(msg);
            break;
          case 'ISSUE_CREATED':
            opts.onIssueCreated && opts.onIssueCreated(msg.issue);
            break;
          case 'ISSUE_UPDATED':
            opts.onIssueUpdated && opts.onIssueUpdated(msg.issue);
            break;
          case 'ISSUE_DELETED':
            opts.onIssueDeleted && opts.onIssueDeleted(msg.issueId);
            break;
          case 'COMMENT_ADDED':
            opts.onCommentAdded && opts.onCommentAdded(msg.issueId, msg.comment);
            break;
          case 'DOC_UPDATED':
            opts.onDocUpdated && opts.onDocUpdated(msg);
            toast(`📄 Doc updated by ${msg.editorName}`, { duration: 3000 });
            break;
          case 'GITHUB_PUSH':
            opts.onGithubPush && opts.onGithubPush(msg);
            opts.onGithubEvent && opts.onGithubEvent(msg);
            toast.success(`🔀 Push to ${msg.branch} by ${msg.pusher}`, { duration: 4000 });
            break;
          case 'GITHUB_PR':
            opts.onGithubPR && opts.onGithubPR(msg);
            opts.onGithubEvent && opts.onGithubEvent(msg);
            toast(`🔁 PR #${msg.number} ${msg.action}: ${msg.title}`, { duration: 4000 });
            break;
          case 'MEMBER_ADDED':
            opts.onMemberAdded && opts.onMemberAdded(msg.member);
            break;
          case 'USER_ONLINE':
            opts.onUserOnline && opts.onUserOnline(msg);
            break;
          case 'USER_OFFLINE':
            opts.onUserOffline && opts.onUserOffline(msg);
            break;
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          default:
            break;
        }
      } catch { /* ignore */ }
    };

    ws.onclose = (event) => {
      // Ignore closes of superseded sockets (e.g. after projectId changes or
      // unmount) — otherwise we schedule a duplicate reconnect for a stale socket.
      if (!mountedRef.current || wsRef.current !== ws) return;
      if (event.code === 4001) return; // auth rejected by server — retrying won't help
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current += 1;
      retryTimerRef.current = setTimeout(() => connectRef.current(), delay);
    };

    // Do NOT close the socket here: the browser already tears down a failed
    // handshake itself and fires 'close'. Calling close() while the socket is
    // still CONNECTING makes the browser log "WebSocket is closed before the
    // connection is established".
    ws.onerror = () => {};
  }, [projectId]);

  useEffect(() => {
    connectRef.current = connect;
  }, [connect]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      const ws = wsRef.current;
      if (ws) {
        if (ws.readyState === WebSocket.CONNECTING) {
          // Closing a CONNECTING socket logs a scary browser warning
          // ("WebSocket is closed before the connection is established").
          // Mark it abandoned and let onopen close it cleanly instead.
          ws._abandon = true;
        } else {
          ws.close();
        }
      }
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
