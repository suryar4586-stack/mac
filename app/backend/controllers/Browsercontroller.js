const { run, get, all } = require('../models/db');

/* ── Bookmarks ─────────────────────────────────────────────── */
exports.getBookmarks = (req, res) =>
  res.json({ bookmarks: all('SELECT * FROM bookmarks WHERE user_id=? ORDER BY created_at DESC', [req.user.id]) });

exports.addBookmark = (req, res) => {
  const { title, url, favicon } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  if (get('SELECT id FROM bookmarks WHERE user_id=? AND url=?', [req.user.id, url]))
    return res.status(409).json({ error: 'Already bookmarked' });
  const { lastInsertRowid } = run('INSERT INTO bookmarks(user_id,title,url,favicon) VALUES(?,?,?,?)', [req.user.id, title||url, url, favicon||null]);
  res.status(201).json({ bookmark: get('SELECT * FROM bookmarks WHERE id=?', [lastInsertRowid]) });
};

exports.removeBookmark = (req, res) => {
  run('DELETE FROM bookmarks WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  res.json({ message: 'Removed' });
};

/* ── History ───────────────────────────────────────────────── */
exports.getHistory = (req, res) =>
  res.json({ history: all('SELECT * FROM browser_history WHERE user_id=? ORDER BY visited_at DESC LIMIT 100', [req.user.id]) });

exports.addHistory = (req, res) => {
  const { url, title } = req.body;
  if (!url) return res.status(400).json({ error: 'URL required' });
  run('INSERT INTO browser_history(user_id,url,title) VALUES(?,?,?)', [req.user.id, url, title||url]);
  res.status(201).json({ message: 'Recorded' });
};

exports.clearHistory = (req, res) => {
  run('DELETE FROM browser_history WHERE user_id=?', [req.user.id]);
  res.json({ message: 'Cleared' });
};
