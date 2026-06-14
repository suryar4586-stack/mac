const r = require('express').Router();
const c = require('../controllers/systemController');
const { requireAuth } = require('../middleware/auth');
r.use(requireAuth);
r.get('/metrics', c.getMetrics);
r.get('/info', c.getInfo);
module.exports = r;
