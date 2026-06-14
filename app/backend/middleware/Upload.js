const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const storage = multer.diskStorage({
  destination(req, _f, cb) {
    const d = path.join(__dirname, '../storage/uploads', String(req.user?.id || 'guest'));
    fs.mkdirSync(d, { recursive: true });
    cb(null, d);
  },
  filename(_req, file, cb) {
    cb(null, `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const blocked = ['.exe','.bat','.sh','.cmd','.ps1'];
    if (blocked.includes(path.extname(file.originalname).toLowerCase()))
      return cb(new Error('File type not allowed'));
    cb(null, true);
  },
});

module.exports = { upload };
