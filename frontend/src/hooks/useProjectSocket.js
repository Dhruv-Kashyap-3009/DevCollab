import { useEffect, useRef, useCallback } from 'react';
import toast from 'react-hot-toast';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';

export default function useProjectSocket(projectId, { onIssueCreated, onIssueUpdated, onCommentAdded, onDocUpdated, onGithubPush, onGithubPR, onUserOnline, onUserOffline, onGithubEvent } = {}) {
  const wsRef = useRef(null);
  const retryRef = useRef(0);
  const retryTimerRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!projectId) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const url = `${WS_URL}/ws?token=${token}&projectId=${projectId}`;
    const ws = new WebSocket(url);
    wsRef.current = ws;

    ws.onopen = () => {
      retryRef.current = 0;
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        switch (msg.type) {
          case 'CONNECTED':
            break;
          case 'ISSUE_CREATED':
            onIssueCreated && onIssueCreated(msg.issue);
            break;
          case 'ISSUE_UPDATED':
            onIssueUpdated && onIssueUpdated(msg.issue);
            break;
          case 'COMMENT_ADDED':
            onCommentAdded && onCommentAdded(msg.issueId, msg.comment);
            break;
          case 'DOC_UPDATED':
            onDocUpdated && onDocUpdated(msg);
            toast(`📄 Doc updated by ${msg.editorName}`, { duration: 3000 });
            break;
          case 'GITHUB_PUSH':
            onGithubPush && onGithubPush(msg);
            onGithubEvent && onGithubEvent(msg);
            toast.success(`🔀 Push to ${msg.branch} by ${msg.pusher}`, { duration: 4000 });
            break;
          case 'GITHUB_PR':
            onGithubPR && onGithubPR(msg);
            onGithubEvent && onGithubEvent(msg);
            toast(`🔁 PR #${msg.number} ${msg.action}: ${msg.title}`, { duration: 4000 });
            break;
          case 'USER_ONLINE':
            onUserOnline && onUserOnline(msg);
            break;
          case 'USER_OFFLINE':
            onUserOffline && onUserOffline(msg);
            break;
          case 'PING':
            ws.send(JSON.stringify({ type: 'PONG' }));
            break;
          default:
            break;
        }
      } catch (e) { /* ignore */ }
    };

    ws.onclose = () => {
      if (!mountedRef.current) return;
      const delay = Math.min(1000 * Math.pow(2, retryRef.current), 30000);
      retryRef.current += 1;
      retryTimerRef.current = setTimeout(connect, delay);
    };

    ws.onerror = () => { ws.close(); };
  }, [projectId]);

  useEffect(() => {
    mountedRef.current = true;
    connect();
    return () => {
      mountedRef.current = false;
      clearTimeout(retryTimerRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const send = useCallback((data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  }, []);

  return { send };
}
