const r = require('express').Router();
const c = require('../controllers/settingsController');
const { requireAuth } = require('../middleware/auth');
r.use(requireAuth);
r.get('/', c.getSettings);
r.put('/', c.updateSettings);
module.exports = r;
