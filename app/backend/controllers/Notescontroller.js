const { run, get, all } = require('../models/db');

exports.list = (req, res) => res.json({ notes: all('SELECT id,title,substr(content,1,120) as preview,pinned,created_at,updated_at FROM notes WHERE user_id=? ORDER BY pinned DESC,updated_at DESC', [req.user.id]) });

exports.getOne = (req, res) => {
  const n = get('SELECT * FROM notes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!n) return res.status(404).json({ error: 'Not found' });
  res.json({ note: n });
};

exports.create = (req, res) => {
  const { title = 'Untitled', content = '' } = req.body;
  const { lastInsertRowid } = run('INSERT INTO notes(user_id,title,content) VALUES(?,?,?)', [req.user.id, title, content]);
  res.status(201).json({ note: get('SELECT * FROM notes WHERE id=?', [lastInsertRowid]) });
};

exports.update = (req, res) => {
  const n = get('SELECT * FROM notes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!n) return res.status(404).json({ error: 'Not found' });
  run('UPDATE notes SET title=?,content=?,updated_at=datetime("now") WHERE id=?',
    [req.body.title ?? n.title, req.body.content ?? n.content, n.id]);
  res.json({ message: 'Saved', updated_at: new Date().toISOString() });
};

exports.pin = (req, res) => {
  const n = get('SELECT * FROM notes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!n) return res.status(404).json({ error: 'Not found' });
  run('UPDATE notes SET pinned=? WHERE id=?', [n.pinned ? 0 : 1, n.id]);
  res.json({ pinned: !n.pinned });
};

exports.remove = (req, res) => {
  run('DELETE FROM notes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ message: 'Deleted' });
};

exports.search = (req, res) => {
  const { q } = req.query;
  if (!q) return res.json({ notes: [] });
  res.json({ notes: all('SELECT id,title,substr(content,1,120) as preview,updated_at FROM notes WHERE user_id=? AND (title LIKE ? OR content LIKE ?) ORDER BY updated_at DESC LIMIT 20', [req.user.id, `%${q}%`, `%${q}%`]) });
};
