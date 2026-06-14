const r=require('express').Router();
const c=require('../controllers/appController');
const {requireAuth} =require('../middleware/auth');
r.get('/store',c.getStore);
r.use('/installed',c.getInstalled);
r.post('/install',c.install);
r.delete('/:appId',c.uninstall);
module.exports=r;