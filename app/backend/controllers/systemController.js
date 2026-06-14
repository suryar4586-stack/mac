const os = require('os');

// Simulated CPU fluctuation state
let fakeCpu = 25;

exports.getMetrics = (_req, res) => {
  fakeCpu = Math.max(5, Math.min(95, fakeCpu + (Math.random() - 0.45) * 8));
  const totalMem = os.totalmem();
  const freeMem  = os.freemem();
  const usedMem  = totalMem - freeMem;

  res.json({
    cpu: {
      usage: Math.round(fakeCpu),
      cores: os.cpus().length,
      model: os.cpus()[0]?.model || 'Unknown',
    },
    memory: {
      total: totalMem,
      used: usedMem,
      free: freeMem,
      usagePercent: Math.round((usedMem / totalMem) * 100),
      totalGB: (totalMem / 1e9).toFixed(1),
      usedGB: (usedMem / 1e9).toFixed(1),
    },
    disk: {
      usagePercent: 62,   // simulated
      totalGB: 512,
      usedGB: 317,
    },
    network: {
      online: true,
      type: 'Wi-Fi',
      hostname: os.hostname(),
    },
    system: {
      platform: os.platform(),
      arch: os.arch(),
      uptime: Math.floor(os.uptime()),
      nodeVersion: process.version,
    },
  });
};

exports.getInfo = (_req, res) => {
  res.json({
    os: 'StackOS 1.0.0',
    kernel: `Node ${process.version}`,
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: Math.floor(os.uptime()),
    cpus: os.cpus().length,
    totalMemGB: (os.totalmem() / 1e9).toFixed(1),
  });
};
