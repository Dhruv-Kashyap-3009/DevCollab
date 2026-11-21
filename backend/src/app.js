require('dotenv').config();

const dns = require('dns');
// Cloud hosts (Render, etc.) often have no IPv6 route. Gmail's SMTP resolves
// to an IPv6 address first, so the connection fails with ENETUNREACH and never
// falls back to IPv4. Prefer IPv4-first resolution process-wide.
dns.setDefaultResultOrder('ipv4first');

const http = require('http');
const path = require('path');
const fs = require('fs');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const mongoose = require('mongoose');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initWebSocket } = require('./websocket/wsServer');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const issueRoutes = require('./routes/issues');
const snippetRoutes = require('./routes/snippets');
const docRoutes = require('./routes/docs.js');
const activityRoutes = require('./routes/activity.js');
const githubRoutes = require('./routes/github');
const userRoutes = require('./routes/user');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; }}));
app.use(express.urlencoded({ extended: true }));

// Liveness + readiness probe used by Docker HEALTHCHECK and orchestrators.
// Reports 503 until Mongoose reports an open connection (readyState 1).
app.get('/health', (req, res) => {
  const dbStates = ['disconnected', 'connected', 'connecting', 'disconnecting'];
  const dbState = mongoose.connection.readyState;
  const healthy = dbState === 1;
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db: dbStates[dbState] || 'unknown',
    uptime: Math.round(process.uptime()),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/issues', issueRoutes);
app.use('/api/projects/:id/snippets', snippetRoutes);
app.use('/api/projects/:id/docs', docRoutes);
app.use('/api/projects/:id/activity', activityRoutes);
app.use('/api/projects', githubRoutes);
app.use('/api/github', githubRoutes);
app.use('/api/user', userRoutes);

const { acceptInvite } = require('./controllers/projectController');
const { authenticate } = require('./middleware/auth');
app.post('/api/invite/:token/accept', authenticate, acceptInvite);

// Production: serve the built frontend from the same origin, so the relative
// /api base URL and same-origin WebSocket both work without CORS or proxies.
const distDir = path.join(__dirname, '..', '..', 'frontend', 'dist');
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  // SPA fallback: deep links (e.g. /projects/xyz) resolve to index.html so
  // react-router can handle them. API/WS/health paths keep their own routing.
  app.use((req, res, next) => {
    if (req.method === 'GET' && !req.path.startsWith('/api') && !req.path.startsWith('/ws') && !req.path.startsWith('/health')) {
      return res.sendFile(path.join(distDir, 'index.html'));
    }
    next();
  });
}

app.use((req, res) => res.status(404).json({ message: 'Route not found' }));
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

const start = async () => {
  await connectDB();
  initWebSocket(server);
  server.listen(PORT, () => {
    console.log('DevCollab API running on port ' + PORT);
    console.log('WebSocket server ready at ws://localhost:' + PORT + '/ws');
  });
};

start();