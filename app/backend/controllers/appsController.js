const { run, get, all } = require('../models/db');

const STORE_APPS = [
  { id:'calculator', name:'Calculator', icon:'🧮', desc:'Scientific calculator', free:true },
  { id:'notepad', name:'Notepad', icon:'📝', desc:'Text editor with autosave', free:true },
  { id:'browser', name:'Browser', icon:'🌐', desc:'Mini web browser with bookmarks', free:true },
  { id:'mediaplayer', name:'Media Player', icon:'🎵', desc:'MP3 & MP4 player', free:true },
  { id:'paint', name:'Paint', icon:'🎨', desc:'Drawing canvas app', free:true },
  { id:'filemanager', name:'File Manager', icon:'📁', desc:'Full virtual file system', free:true },
  { id:'terminal', name:'Terminal', icon:'⬛', desc:'Command-line interface', free:true },
  { id:'settings', name:'Settings', icon:'⚙️', desc:'System preferences', free:true },
  { id:'appstore', name:'App Store', icon:'🛒', desc:'Browse & install apps', free:true },
  { id:'recycle', name:'Recycle Bin', icon:'🗑️', desc:'Deleted files manager', free:true },
];

exports.getStore = (_req, res) => res.json({ apps: STORE_APPS });

exports.getInstalled = (req, res) => {
  const installed = all('SELECT app_id FROM installed_apps WHERE user_id=?', [req.user.id]).map(r => r.app_id);
  res.json({ installed });
};

exports.install = (req, res) => {
  const { appId } = req.body;
  if (!STORE_APPS.find(a => a.id === appId))
    return res.status(404).json({ error: 'App not found in store' });
  if (get('SELECT id FROM installed_apps WHERE user_id=? AND app_id=?', [req.user.id, appId]))
    return res.status(409).json({ error: 'Already installed' });
  const app = STORE_APPS.find(a => a.id === appId);
  run('INSERT INTO installed_apps(user_id,app_id,app_name) VALUES(?,?,?)', [req.user.id, appId, app.name]);
  run('INSERT INTO notifications(user_id,title,body,icon) VALUES(?,?,?,?)',
    [req.user.id, '✅ App Installed', `${app.name} installed successfully.`, app.icon]);
  res.status(201).json({ message: 'Installed', app });
};

exports.uninstall = (req, res) => {
  const { appId } = req.params;
  const core = ['filemanager','terminal','settings','recycle'];
  if (core.includes(appId)) return res.status(403).json({ error: 'System app cannot be removed' });
  run('DELETE FROM installed_apps WHERE user_id=? AND app_id=?', [req.user.id, appId]);
  res.json({ message: 'Uninstalled' });
};
