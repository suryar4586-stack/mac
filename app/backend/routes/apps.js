const r = require('express').Router();
const c = require('../controllers/appsController');
const { requireAuth } = require('../middleware/auth');
r.get('/store', c.getStore);
r.use(requireAuth);
r.get('/installed', c.getInstalled);
r.post('/install', c.install);
r.delete('/:appId', c.uninstall);
module.exports = r;
