/* controllers/settingsController.js */
const { run, get } = require('../models/db');

exports.getSettings = (req, res) => {
  let s = get('SELECT * FROM user_settings WHERE user_id=?', [req.user.id]);
  if (!s) { run('INSERT INTO user_settings(user_id) VALUES(?)', [req.user.id]); s = get('SELECT * FROM user_settings WHERE user_id=?', [req.user.id]); }
  res.json({ settings: s });
};

exports.updateSettings = (req, res) => {
  const { theme, accent_color, wallpaper, taskbar_pos, blur_effects, animations } = req.body;
  const s = get('SELECT * FROM user_settings WHERE user_id=?', [req.user.id]);
  if (!s) run('INSERT INTO user_settings(user_id) VALUES(?)', [req.user.id]);
  run(`UPDATE user_settings SET
    theme=COALESCE(?,theme), accent_color=COALESCE(?,accent_color),
    wallpaper=COALESCE(?,wallpaper), taskbar_pos=COALESCE(?,taskbar_pos),
    blur_effects=COALESCE(?,blur_effects), animations=COALESCE(?,animations)
    WHERE user_id=?`,
    [theme, accent_color, wallpaper, taskbar_pos,
     blur_effects !== undefined ? (blur_effects ? 1 : 0) : null,
     animations !== undefined ? (animations ? 1 : 0) : null,
     req.user.id]);
  res.json({ settings: get('SELECT * FROM user_settings WHERE user_id=?', [req.user.id]) });
};
