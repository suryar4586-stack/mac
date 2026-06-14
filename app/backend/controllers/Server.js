require ('dotenv').config();
const express =require('express');
const http =require('http');
const cors =require('cors');
const path =require('path');
const {Server}=require('socket.io');
const {initDB}=require('../models/db');
const {initSockets}=require('../sockets/socketHandler');


const authRoutes=require('../routes/auth');
const filesRoutes= require('../routes/files');
const notesRoute=require('../routes/notes');
const terminalRoutes=require('../routes/terminal');
const settingsRoutes=require('../routes/settings');
const appsRoutes=require('./routes/apps');
const systemRoutes =require('../routes/system');
const notifRoutes=require('../routes/notifications');
const browserroutes = require('../routes/browser');

const app=express();
const server=http.createServer(app);

const io=newServer(server,{
    cors:{
        origin:process.env.CLIENT_URL || 'http://localhost:3000',
        methods:['GET', 'POST' ,'PUT' , 'DELETE'],
        credentials:true,
    },
});



app.use(cors({origin:process.env.CLIENT_URL || 'http://localhost:3000',credentials:true}));
app.use(express.json({ limit:'50mb'}));
app.use(express.urlencoded({extended:true,limit:'50mb'}));
app.use('/uploads',express.static(path.join(__dirname, 'storage/uploads')));
app.use((req,_res,next) => {req.io=io;next();});


app.use('api/auth', authRoutes);
app.use('/api/files', filesRoutes);
app.use('/api/notes', notesRoutes);
app.use('/api/terminal', terminalRoutes);
app.use('/api/settings',settingsRoutes);
app.use('/api/apps',appsRoutes);
app.use('/api/system',systemRoutes);
app.use('/api/notifications',notifRoutes);
app.use('/api/browser',browserroutes);

app.get('/api/health',(_req, res)=>
res.json({status:'ok',version:'1.0.0',time:new Data().toISOString()})
);


app.use((_req,res) => res.status(404).json({ error:'Routes not found'}));
app.use((err,_req,res,_next)=>{
    console.error(['Stackos'],err.message);
    res.status(err.status|| 500).json({error:err.message || 'Interval server error'});
});

const PORT=processs.env.PORT || 5000;
(async()=>{
    await initDB();
    initSockets(io);
    server.listen(PORT, ()=>{
        console.log(`\n ⊞ StackOS Backend →  http://localhost:${PORT}`);
        console.log(` 📡 socket.io ready`);
        console.log( ` 🗄️   SQLite intialzed`);
    });
})();