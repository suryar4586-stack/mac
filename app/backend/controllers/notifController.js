const { run, get, all } = require('../models/db');

exports.list = (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({ notifications: all('SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT ?', [req.user.id, limit]) });
};

exports.create = (req, res) => {
  const { title, body = '', icon = '🔔' } = req.body;
  if (!title) return res.status(400).json({ error: 'Title required' });
  const { lastInsertRowid } = run('INSERT INTO notifications(user_id,title,body,icon) VALUES(?,?,?,?)', [req.user.id, title, body, icon]);
  const n = get('SELECT * FROM notifications WHERE id=?', [lastInsertRowid]);
  if (req.io) req.io.to(`user-${req.user.id}`).emit('notification', n);
  res.status(201).json({ notification: n });
};

exports.markRead = (req, res) => {
  run('UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ message: 'Marked read' });
};

exports.markAllRead = (req, res) => {
  run('UPDATE notifications SET is_read=1 WHERE user_id=?', [req.user.id]);
  res.json({ message: 'All read' });
};

exports.clear = (req, res) => {
  run('DELETE FROM notifications WHERE user_id=?', [req.user.id]);
  res.json({ message: 'Cleared' });
};

exports.unreadCount = (req, res) => {
  const r = get('SELECT COUNT(*) as c FROM notifications WHERE user_id=? AND is_read=0', [req.user.id]);
  res.json({ count: r.c });
};
