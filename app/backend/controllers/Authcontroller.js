const bcrypt = require('bcryptjs');
const { run, get } = require('../models/db');
const { signToken } = require('../middleware/auth');

async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });
  if (get('SELECT id FROM users WHERE username=?', [username]))
    return res.status(409).json({ error: 'Username taken' });
  if (get('SELECT id FROM users WHERE email=?', [email]))
    return res.status(409).json({ error: 'Email already registered' });

  const hash = await bcrypt.hash(password, 12);
  const { lastInsertRowid: uid } = run('INSERT INTO users(username,email,password) VALUES(?,?,?)', [username, email, hash]);
  run('INSERT INTO user_settings(user_id) VALUES(?)', [uid]);
  ['Documents','Downloads','Pictures','Music','Videos'].forEach(n =>
    run('INSERT INTO fs_nodes(user_id,parent_id,name,type) VALUES(?,NULL,?,"folder")', [uid, n])
  );
  run('INSERT INTO notifications(user_id,title,body,icon) VALUES(?,?,?,?)',
    [uid, 'Welcome to StackOS', `Hi ${username}! Your desktop is ready.`, '🎉']);
  run('INSERT INTO installed_apps(user_id,app_id,app_name) VALUES(?,?,?)', [uid,'calculator','Calculator']);
  run('INSERT INTO installed_apps(user_id,app_id,app_name) VALUES(?,?,?)', [uid,'notepad','Notepad']);
  run('INSERT INTO installed_apps(user_id,app_id,app_name) VALUES(?,?,?)', [uid,'browser','Browser']);
  run('INSERT INTO installed_apps(user_id,app_id,app_name) VALUES(?,?,?)', [uid,'mediaplayer','Media Player']);

  const user = get('SELECT id,username,email,avatar,created_at FROM users WHERE id=?', [uid]);
  if (req.io) req.io.emit('user:registered', { username });
  res.status(201).json({ token: signToken(uid), user });
}

async function login(req, res) {
  const { username, password, rememberMe } = req.body;
  const user = get('SELECT * FROM users WHERE username=? OR email=?', [username, username]);
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ error: 'Invalid credentials' });
  const { password: _p, ...safe } = user;
  run('INSERT INTO notifications(user_id,title,body,icon) VALUES(?,?,?,?)',
    [user.id, 'Sign-in', `Welcome back, ${user.username}!`, '🔓']);
  if (req.io) req.io.to(`user-${user.id}`).emit('auth:login', { username: user.username });
  res.json({ token: signToken(user.id, !!rememberMe), user: safe });
}

function getProfile(req, res) {
  const { run: _r, get: g } = require('../models/db');
  const settings = g('SELECT * FROM user_settings WHERE user_id=?', [req.user.id]);
  res.json({ ...req.user, settings });
}

async function updateProfile(req, res) {
  const { username, email, newPassword } = req.body;
  const { id } = req.user;
  if (username) run('UPDATE users SET username=? WHERE id=?', [username, id]);
  if (email) run('UPDATE users SET email=? WHERE id=?', [email, id]);
  if (newPassword) run('UPDATE users SET password=? WHERE id=?', [await bcrypt.hash(newPassword, 12), id]);
  const user = get('SELECT id,username,email,avatar,created_at FROM users WHERE id=?', [id]);
  res.json({ user });
}

function updateAvatar(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const url = `/uploads/${req.user.id}/${req.file.filename}`;
  run('UPDATE users SET avatar=? WHERE id=?', [url, req.user.id]);
  res.json({ avatar: url });
}

function logout(req, res) {
  run('INSERT INTO notifications(user_id,title,body,icon) VALUES(?,?,?,?)',
    [req.user.id, 'Signed out', 'Session ended.', '🔒']);
  res.json({ message: 'Logged out' });
}

module.exports = { register, login, getProfile, updateProfile, updateAvatar, logout };
