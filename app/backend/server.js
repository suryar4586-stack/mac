require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');
const { Server } = require('socket.io');
const { initDB } = require('./models/db');
const { initSockets } = require('./sockets/socketHandler');

const authRoutes     = require('./routes/auth');
const fileRoutes     = require('./routes/files');
const notesRoutes    = require('./routes/notes');
const terminalRoutes = require('./routes/terminal');
const settingsRoutes = require('./routes/settings');
const appsRoutes     = require('./routes/apps');
const systemRoutes   = require('./routes/system');
const notifRoutes    = require('./routes/notifications');
const browserRoutes  = require('./routes/browser');

const app = express();

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:5173',
  'https://*.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
];

app.use(cors({
  origin: (origin, cb) => cb(null, true), // allow all in dev; tighten in prod
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'storage/uploads')));

/* ── Routes ─────────────────────────────────────────────────── */
app.use('/api/auth',          authRoutes);
app.use('/api/files',         fileRoutes);
app.use('/api/notes',         notesRoutes);
app.use('/api/terminal',      terminalRoutes);
app.use('/api/settings',      settingsRoutes);
app.use('/api/apps',          appsRoutes);
app.use('/api/system',        systemRoutes);
app.use('/api/notifications', notifRoutes);
app.use('/api/browser',       browserRoutes);

app.get('/api/health', (_req, res) =>
  res.json({ status: 'ok', version: '1.0.0', time: new Date().toISOString() })
);

app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error('[StackOS]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

/* ── Start (local dev only) ─────────────────────────────────── */
// When run directly with `node server.js`, start HTTP server
if (require.main === module) {
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: { origin: '*', methods: ['GET', 'POST'], credentials: true },
  });
  app.use((req, _res, next) => { req.io = io; next(); });
  initSockets(io);

  const PORT = process.env.PORT || 5000;
  initDB().then(() => {
    server.listen(PORT, () => {
      console.log(`\n  ⊞  StackOS Backend  →  http://localhost:${PORT}`);
      console.log(`  📡 Socket.io ready`);
      console.log(`  🗄️  SQLite initialized\n`);
    });
  });
} else {
  // Exported for Vercel serverless — DB init happens once
  initDB().catch(console.error);
}

module.exports = app;
