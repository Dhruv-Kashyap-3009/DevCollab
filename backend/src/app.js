require('dotenv').config();

const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const { initWebSocket } = require('./websocket/wsServer');

const authRoutes = require('./routes/auth');
const projectRoutes = require('./routes/projects');
const issueRoutes = require('./routes/issues');
const snippetRoutes = require('./routes/snippets');
const docRoutes = require('./routes/docs.js');

const app = express();
const server = http.createServer(app);

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173', credentials: true }));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/projects/:id/issues', issueRoutes);
app.use('/api/projects/:id/snippets', snippetRoutes);
app.use('/api/projects/:id/docs', docRoutes);

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
