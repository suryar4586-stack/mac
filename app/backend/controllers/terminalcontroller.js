const os = require('os');
const { run, all } = require('../models/db');

const vfs = {
  '~': ['documents','downloads','pictures','music','videos'],
  documents: ['report.txt','notes.md','resume.docx'],
  downloads: ['setup.zip','photo.jpg'],
  pictures: ['wallpaper.png','screenshot.jpg'],
  music: ['ambient.mp3'],
  videos: ['tutorial.mp4'],
};
const cwd = {}; // per-user cwd

exports.execute = (req, res) => {
  const { command } = req.body;
  if (!command) return res.status(400).json({ error: 'No command' });
  const uid = req.user.id;
  if (!cwd[uid]) cwd[uid] = '~';
  const [cmd, ...args] = command.trim().split(/\s+/);
  let output = '', exitCode = 0;
  try { output = exec(cmd, args, uid); }
  catch (e) { output = e.message; exitCode = 1; }
  run('INSERT INTO terminal_history(user_id,command,output,exit_code) VALUES(?,?,?,?)', [uid, command.trim(), output, exitCode]);
  res.json({ output, exitCode, cwd: cwd[uid] });
};

function exec(cmd, args, uid) {
  const dir = cwd[uid];
  switch (cmd) {
    case 'help': return ['help,clear,date,time,echo,pwd,ls,cd,mkdir,touch,rm,cat,whoami,uname,uptime,ps,history,node,npm'].join('\n  ');
    case 'clear': return '__CLEAR__';
    case 'date': return new Date().toDateString();
    case 'time': return new Date().toLocaleTimeString();
    case 'echo': return args.join(' ');
    case 'pwd': return `/home/user/${dir}`;
    case 'whoami': return 'user';
    case 'uname': return `StackOS 1.0.0 ${os.arch()} ${os.platform()}`;
    case 'uptime': { const u=Math.floor(process.uptime()); return `up ${Math.floor(u/3600)}h ${Math.floor((u%3600)/60)}m ${u%60}s`; }
    case 'ls': return (vfs[dir]||[]).join('  ')||'(empty)';
    case 'cd': {
      const d=args[0];
      if(!d||d==='~'){cwd[uid]='~';return '';}
      if(d==='..'){cwd[uid]='~';return '';}
      if((vfs[dir]||[]).includes(d)&&vfs[d]){cwd[uid]=d;return '';}
      throw new Error(`cd: ${d}: No such directory`);
    }
    case 'mkdir': {
      if(!args[0]) throw new Error('Usage: mkdir <name>');
      if(!vfs[dir])vfs[dir]=[];
      if(!vfs[dir].includes(args[0])){vfs[dir].push(args[0]);vfs[args[0]]=[];}
      return `Created: ${args[0]}`;
    }
    case 'touch': {
      if(!args[0]) throw new Error('Usage: touch <name>');
      if(!vfs[dir])vfs[dir]=[];
      if(!vfs[dir].includes(args[0]))vfs[dir].push(args[0]);
      return `Created: ${args[0]}`;
    }
    case 'rm': {
      if(!args[0]) throw new Error('Usage: rm <name>');
      const i=(vfs[dir]||[]).indexOf(args[0]);
      if(i===-1) throw new Error(`rm: ${args[0]}: No such file`);
      vfs[dir].splice(i,1);return `Removed: ${args[0]}`;
    }
    case 'cat': {
      const map={'notes.md':'# Notes\nWelcome to StackOS!','report.txt':'StackOS System Report\nAll systems nominal.'};
      if(!args[0]) throw new Error('Usage: cat <file>');
      return map[args[0]]||`[binary or empty file: ${args[0]}]`;
    }
    case 'ps': return 'PID CMD\n  1 init\n  2 stackos\n 42 winmgr\n201 node';
    case 'history': return all('SELECT command FROM terminal_history WHERE user_id=? ORDER BY id DESC LIMIT 20',[uid]).map((r,i)=>`${i+1}  ${r.command}`).join('\n')||'No history';
    case 'node': return args[0]==='--version'?'v20.11.0':'Usage: node --version';
    case 'npm':  return args[0]==='--version'?'10.2.4':'Usage: npm --version';
    case '': return '';
    default: throw new Error(`command not found: ${cmd}. Type 'help' for list.`);
  }
}

exports.getHistory = (req, res) => {
  const h = all('SELECT * FROM terminal_history WHERE user_id=? ORDER BY id DESC LIMIT ?', [req.user.id, parseInt(req.query.limit)||50]);
  res.json({ history: h.reverse() });
};

exports.clearHistory = (req, res) => {
  run('DELETE FROM terminal_history WHERE user_id=?', [req.user.id]);
  res.json({ message: 'Cleared' });
};
