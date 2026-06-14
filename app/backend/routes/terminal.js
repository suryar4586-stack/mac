const r = require('express').Router();
const c = require('../controllers/terminalController');
const { requireAuth } = require('../middleware/auth');
r.use(requireAuth);
r.post('/exec', c.execute);
r.get('/history', c.getHistory);
r.delete('/history', c.clearHistory);
module.exports = r;
