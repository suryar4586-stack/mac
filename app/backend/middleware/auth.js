const jwt = require('jsonwebtoken');
const { get } = require('../models/db');
const SECRET = process.env.JWT_SECRET || 'stackos-secret';

function requireAuth(req, res, next) {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
  try {
    const { id } = jwt.verify(h.slice(7), SECRET);
    const user = get('SELECT id,username,email,avatar FROM users WHERE id=?', [id]);
    if (!user) return res.status(401).json({ error: 'User not found' });
    req.user = user; next();
  } catch { res.status(401).json({ error: 'Invalid token' }); }
}

function signToken(id, remember = false) {
  return jwt.sign({ id }, SECRET, { expiresIn: remember ? '30d' : '24h' });
}

module.exports = { requireAuth, signToken };
