const WebSocket = require('ws');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

let wss = null;

const projectRooms = new Map();
const clientMeta = new Map();

function initWebSocket(server){
    wss = new WebSocket.Server({server, path: '/ws'});

    wss.on('connection', async(ws , req)=>{
        try{
            const url = new URL(req.url, `http://${req.headers.host}`);
            const token = url.searchParams.get('token');
            const projectId = url.searchParams.get('projectId');

            if (!token || !projectId) {
                ws.close(4001, 'Missing token or projectId');
                return;
            }

            let decoded;
            try{
                decoded = jwt.verify(token, process.env.JWT_SECRET);
            }catch (e) {
                ws.close(4001, 'Invalid Token');
                return;
            }

            const user = await User.findById(decoded.userId);
            if(!user){
                ws.close(4001, 'User not found');
                return;
            }

            clientMeta.set(ws, {userId: user._id.toString(), projectId, userName: user.name });

            if (!projectRooms.has(projectId)) {
                projectRooms.set(projectId, new Set());
            }
            projectRooms.get(projectId).add(ws);

            ws.send(JSON.stringify({ type: 'CONNECTED', userId: user._id, userName: user.name }));

            broadcastToProject(projectId, {
                type: 'USER_ONLINE',
                userId: user._id,
                userName: user.name,
            }, ws);

            ws.on('message', (data) =>{
                try{
                    const msg = JSON.parse(data.toString());
                    if(msg.type === 'PING') {
                        ws.send(JSON.stringify({ type: 'PONG' }));
                    }
                }catch(e){}
            })

            ws.on('close', () => {
                const meta = clientMeta.get(ws);
                if (meta) {
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
                }
            });

            ws.on('error', (err) => {
                console.error('WS client error:', err.message);
            });
        }catch(err){
            console.error('WS connection error:', err.message);
            ws.close(4000, 'Server error');
        }
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