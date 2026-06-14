const path = require('path');
const fs = require('fs');
const { run, get, all } = require('../models/db');

const emit = (req, title, body) => {
  if (req.user) {
    run('INSERT INTO notifications(user_id,title,body) VALUES(?,?,?)', [req.user.id, title, body]);
    if (req.io) req.io.to(`user-${req.user.id}`).emit('notification', { title, body });
  }
};

function listDir(req, res) {
  const { parentId } = req.query;
  const uid = req.user.id;
  const nodes = parentId
    ? all('SELECT * FROM fs_nodes WHERE parent_id=? AND user_id=? AND is_deleted=0 ORDER BY type DESC,name ASC', [parentId, uid])
    : all('SELECT * FROM fs_nodes WHERE parent_id IS NULL AND user_id=? AND is_deleted=0 ORDER BY type DESC,name ASC', [uid]);
  res.json({ nodes });
}

function getNode(req, res) {
  const node = get('SELECT * FROM fs_nodes WHERE id=? AND user_id=? AND is_deleted=0', [req.params.id, req.user.id]);
  if (!node) return res.status(404).json({ error: 'Not found' });
  res.json({ node });
}

function createFolder(req, res) {
  const { name, parentId } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { lastInsertRowid } = run(
    'INSERT INTO fs_nodes(user_id,parent_id,name,type) VALUES(?,?,?,"folder")',
    [req.user.id, parentId || null, name]
  );
  emit(req, '📁 Folder Created', `"${name}" created`);
  res.status(201).json({ node: get('SELECT * FROM fs_nodes WHERE id=?', [lastInsertRowid]) });
}

function createTextFile(req, res) {
  const { name, parentId, content = '' } = req.body;
  if (!name) return res.status(400).json({ error: 'Name required' });
  const { lastInsertRowid } = run(
    'INSERT INTO fs_nodes(user_id,parent_id,name,type,mime,content,size) VALUES(?,?,?,"file",?,?,?)',
    [req.user.id, parentId || null, name, getMime(name), content, Buffer.byteLength(content)]
  );
  res.status(201).json({ node: get('SELECT * FROM fs_nodes WHERE id=?', [lastInsertRowid]) });
}

function uploadFile(req, res) {
  if (!req.file) return res.status(400).json({ error: 'No file' });
  const diskPath = `/uploads/${req.user.id}/${req.file.filename}`;
  const { lastInsertRowid } = run(
    'INSERT INTO fs_nodes(user_id,parent_id,name,type,mime,size,disk_path) VALUES(?,?,?,"file",?,?,?)',
    [req.user.id, req.body.parentId || null, req.file.originalname, req.file.mimetype, req.file.size, diskPath]
  );
  emit(req, '⬆️ Uploaded', `"${req.file.originalname}" uploaded`);
  res.status(201).json({ node: get('SELECT * FROM fs_nodes WHERE id=?', [lastInsertRowid]) });
}

function updateContent(req, res) {
  const node = get('SELECT * FROM fs_nodes WHERE id=? AND user_id=? AND is_deleted=0', [req.params.id, req.user.id]);
  if (!node) return res.status(404).json({ error: 'Not found' });
  const { content } = req.body;
  run('UPDATE fs_nodes SET content=?,size=?,updated_at=datetime("now") WHERE id=?',
    [content, Buffer.byteLength(content || ''), node.id]);
  res.json({ message: 'Saved' });
}

function renameNode(req, res) {
  const node = get('SELECT * FROM fs_nodes WHERE id=? AND user_id=? AND is_deleted=0', [req.params.id, req.user.id]);
  if (!node) return res.status(404).json({ error: 'Not found' });
  run('UPDATE fs_nodes SET name=?,updated_at=datetime("now") WHERE id=?', [req.body.name, node.id]);
  res.json({ message: 'Renamed' });
}

function moveNode(req, res) {
  const node = get('SELECT * FROM fs_nodes WHERE id=? AND user_id=?', [req.params.id, req.user.id]);
  if (!node) return res.status(404).json({ error: 'Not found' });
  run('UPDATE fs_nodes SET parent_id=?,updated_at=datetime("now") WHERE id=?',
    [req.body.targetParentId || null, node.id]);
  res.json({ message: 'Moved' });
}

function softDelete(req, res) {
  const node = get('SELECT * FROM fs_nodes WHERE id=? AND user_id=? AND is_deleted=0', [req.params.id, req.user.id]);
  if (!node) return res.status(404).json({ error: 'Not found' });
  run('UPDATE fs_nodes SET is_deleted=1,deleted_at=datetime("now") WHERE id=?', [node.id]);
  if (node.type === 'folder') cascadeDelete(node.id, req.user.id);
  emit(req, '🗑️ Deleted', `"${node.name}" moved to Recycle Bin`);
  res.json({ message: 'Deleted' });
}

function cascadeDelete(pid, uid) {
  all('SELECT id,type FROM fs_nodes WHERE parent_id=? AND user_id=?', [pid, uid]).forEach(c => {
    run('UPDATE fs_nodes SET is_deleted=1,deleted_at=datetime("now") WHERE id=?', [c.id]);
    if (c.type === 'folder') cascadeDelete(c.id, uid);
  });
}

function getRecycleBin(req, res) {
  res.json({ nodes: all('SELECT * FROM fs_nodes WHERE user_id=? AND is_deleted=1 ORDER BY deleted_at DESC', [req.user.id]) });
}

function restoreNode(req, res) {
  const node = get('SELECT * FROM fs_nodes WHERE id=? AND user_id=? AND is_deleted=1', [req.params.id, req.user.id]);
  if (!node) return res.status(404).json({ error: 'Not found' });
  run('UPDATE fs_nodes SET is_deleted=0,deleted_at=NULL WHERE id=?', [node.id]);
  emit(req, '↩️ Restored', `"${node.name}" restored`);
  res.json({ message: 'Restored' });
}

function emptyRecycleBin(req, res) {
  const nodes = all('SELECT * FROM fs_nodes WHERE user_id=? AND is_deleted=1', [req.user.id]);
  nodes.forEach(n => {
    if (n.disk_path) {
      try { fs.unlinkSync(path.join(__dirname, '../storage', n.disk_path.replace('/uploads', 'uploads'))); } catch (_) {}
    }
  });
  run('DELETE FROM fs_nodes WHERE user_id=? AND is_deleted=1', [req.user.id]);
  emit(req, '🗑️ Bin Emptied', 'Recycle Bin permanently cleared');
  res.json({ message: 'Emptied' });
}

function searchFiles(req, res) {
  const { q } = req.query;
  if (!q) return res.json({ nodes: [] });
  res.json({ nodes: all('SELECT * FROM fs_nodes WHERE user_id=? AND is_deleted=0 AND name LIKE ? LIMIT 50', [req.user.id, `%${q}%`]) });
}

function storageStats(req, res) {
  const r = get('SELECT COUNT(*) as c, SUM(size) as t FROM fs_nodes WHERE user_id=? AND is_deleted=0 AND type="file"', [req.user.id]);
  res.json({ fileCount: r.c, totalBytes: r.t || 0, totalMB: ((r.t || 0) / 1024 / 1024).toFixed(2), quota: 1024 });
}

function getMime(name) {
  const m = { '.txt':'text/plain','.md':'text/markdown','.html':'text/html','.js':'application/javascript','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg','.mp4':'video/mp4','.pdf':'application/pdf' };
  return m[path.extname(name).toLowerCase()] || 'application/octet-stream';
}

module.exports = { listDir, getNode, createFolder, createTextFile, uploadFile, updateContent, renameNode, moveNode, softDelete, getRecycleBin, restoreNode, emptyRecycleBin, searchFiles, storageStats };
