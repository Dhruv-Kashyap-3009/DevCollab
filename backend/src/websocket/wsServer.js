const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Project = require('../models/Project');

let wss = null;

const projectRooms = new Map();
const clientMeta = new Map();

function initWebSocket(server){
    wss = new WebSocket.Server({server, path: '/ws'});

    wss.on('connection', (ws) => {
        // Attach cleanup BEFORE any awaits: authentication is async (JWT + DB
        // lookups), and if the client closes during that window the 'close'
        // event fires before a listener exists and is lost — leaving a dead
        // socket stuck in the room forever (seen as a member "online" after
        // they left, and duplicate presence entries). meta stays null until
        // auth completes, so a pre-auth close only clears the timer.
        let meta = null;
        let authed = false;
        // The credential is sent as the first message (not in the URL — tokens
        // in query strings leak into proxy/access logs). If it never arrives,
        // drop the connection.
        const authTimer = setTimeout(() => { try { ws.close(4001, 'Auth timeout'); } catch {} }, 10000);

        ws.on('close', () => {
            clearTimeout(authTimer);
            if (!meta) return;
            const room = projectRooms.get(meta.projectId);
            if (room) {
                room.delete(ws);
                if (room.size === 0) projectRooms.delete(meta.projectId);
            }
            broadcastToProject(meta.projectId, {
                type: 'USER_OFFLINE',
                userId: meta.userId,
                userName: meta.userName,
            });
            clientMeta.delete(ws);
        });
        ws.on('error', (err) => {
            console.error('WS client error:', err.message);
            try { ws.close(); } catch {}
        });

        ws.on('message', (data) => {
            let msg;
            try { msg = JSON.parse(data.toString()); } catch { return; }
            if (authed) {
                if (msg.type === 'PING') ws.send(JSON.stringify({ type: 'PONG' }));
                return;
            }
            // Ignore anything before authentication; only the first AUTH counts.
            if (!msg || msg.type !== 'AUTH' || !msg.token || !msg.projectId) return;
            authenticate(ws, msg.token, msg.projectId, {
                onAuthed: (user, projectId) => {
                    clearTimeout(authTimer);
                    authed = true;
                    meta = { userId: user._id.toString(), projectId, userName: user.name };
                    clientMeta.set(ws, meta);
                    if (!projectRooms.has(projectId)) projectRooms.set(projectId, new Set());
                    projectRooms.get(projectId).add(ws);
                    ws.send(JSON.stringify({ type: 'CONNECTED', userId: user._id, userName: user.name }));
                    // Seed the joining client with who's already here, so presence is
                    // truthful from the first render (excludes the joiner themselves).
                    ws.send(JSON.stringify({
                        type: 'PRESENCE_SNAPSHOT',
                        members: getOnlineMembers(projectId).filter(m => m.userId !== user._id.toString()),
                    }));
                    broadcastToProject(projectId, {
                        type: 'USER_ONLINE',
                        userId: user._id,
                        userName: user.name,
                    }, ws);
                },
                onReject: (code, reason) => { try { ws.close(code, reason); } catch {} },
            });
        });
    });

    const heartbeatInterval = setInterval(() => {
        wss.clients.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
                ws.send(JSON.stringify({ type: 'PING' }));
            }
        });
    }, 30000);

    wss.on('close', () => clearInterval(heartbeatInterval));
    console.log('WebSocket server initialized');
    return wss;
}

// Verify the credential sent in the first message and join the project room.
// The token proves identity, but the room grants realtime access to the
// project's data — enforce the same membership rule as the REST API.
async function authenticate(ws, token, projectId, handlers) {
  try {
    let decoded;
    try { decoded = jwt.verify(token, process.env.JWT_SECRET); }
    catch (e) { return handlers.onReject(4001, 'Invalid Token'); }
    const user = await User.findById(decoded.userId);
    if (!user) return handlers.onReject(4001, 'User not found');
    const project = await Project.findById(projectId);
    if (!project || !project.members.some(m => m.user_id.toString() === user._id.toString())) {
      return handlers.onReject(4001, 'Not a project member');
    }
    // The client may have closed while we were verifying — don't add a dead
    // socket to the room.
    if (ws.readyState !== WebSocket.OPEN) return;
    handlers.onAuthed(user, projectId);
  } catch (err) {
    console.error('WS auth error:', err.message);
    try { ws.close(4000, 'Server error'); } catch {}
  }
}

function broadcastToProject(projectId, data, excludeWs = null) {
  const room = projectRooms.get(projectId.toString());
  if (!room) return;
  const payload = JSON.stringify(data);
  room.forEach((client) => {
    if (client !== excludeWs && client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  });
}

function getOnlineMembers(projectId) {
  const room = projectRooms.get(projectId.toString());
  if (!room) return [];
  const members = [];
  room.forEach((ws) => {
    const meta = clientMeta.get(ws);
    if (meta) members.push({ userId: meta.userId, userName: meta.userName });
  });
  return members;
}

module.exports = { initWebSocket, broadcastToProject, getOnlineMembers };