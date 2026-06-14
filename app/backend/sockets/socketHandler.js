/**
 * sockets/socketHandler.js
 * Real-time events: notifications, terminal streaming, multi-user presence
 */

const jwt = require('jsonwebtoken');
const SECRET = process.env.JWT_SECRET || 'stackos-secret';

function initSockets(io) {
  // Auth middleware for socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token'));
    try {
      socket.userId = jwt.verify(token, SECRET).id;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    console.log(`  🔌 User ${uid} connected [${socket.id}]`);

    // Join personal room
    socket.join(`user-${uid}`);

    // ── System events ──────────────────────────────────────────
    socket.emit('system:ready', {
      message: 'StackOS connection established',
      time: new Date().toISOString(),
    });

    // ── Notification broadcast ─────────────────────────────────
    socket.on('notification:send', (data) => {
      io.to(`user-${uid}`).emit('notification', {
        title: data.title || 'Notification',
        body: data.body || '',
        icon: data.icon || '🔔',
        time: new Date().toISOString(),
      });
    });

    // ── Terminal streaming ─────────────────────────────────────
    socket.on('terminal:input', (data) => {
      // Echo back (real processing is via REST /api/terminal/exec)
      socket.emit('terminal:output', { line: `> ${data.command}` });
    });

    // ── File system watch events ───────────────────────────────
    socket.on('fs:watch', (path) => {
      socket.emit('fs:watching', { path });
    });

    // ── Window state sync (multi-tab) ──────────────────────────
    socket.on('window:state', (state) => {
      socket.to(`user-${uid}`).emit('window:sync', state);
    });

    // ── Disconnect ─────────────────────────────────────────────
    socket.on('disconnect', () => {
      console.log(`  🔌 User ${uid} disconnected`);
    });
  });

  // Broadcast system metrics every 5 seconds
  setInterval(() => {
    io.emit('system:metrics', {
      cpu: Math.round(Math.max(5, Math.min(95, 25 + (Math.random() - 0.5) * 20))),
      time: new Date().toISOString(),
    });
  }, 5000);
}

module.exports = { initSockets };
