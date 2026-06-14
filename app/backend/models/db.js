const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const STORAGE = path.join(__dirname, '..', 'storage');
fs.mkdirSync(STORAGE, { recursive: true });

let db;
const getDB = () => { if (!db) throw new Error('DB not initialised'); return db; };

async function initDB() {
  db = new Database(path.join(STORAGE, 'stackos.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      avatar TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS user_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      theme TEXT DEFAULT 'dark',
      accent_color TEXT DEFAULT '#0078d4',
      wallpaper TEXT DEFAULT 'cosmic',
      taskbar_pos TEXT DEFAULT 'bottom',
      blur_effects INTEGER DEFAULT 1,
      animations INTEGER DEFAULT 1,
      UNIQUE(user_id)
    );
    CREATE TABLE IF NOT EXISTS fs_nodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      parent_id INTEGER REFERENCES fs_nodes(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('file','folder')),
      mime TEXT DEFAULT NULL,
      size INTEGER DEFAULT 0,
      content TEXT DEFAULT NULL,
      disk_path TEXT DEFAULT NULL,
      is_deleted INTEGER DEFAULT 0,
      deleted_at TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS notes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL DEFAULT 'Untitled',
      content TEXT DEFAULT '',
      pinned INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS installed_apps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      app_id TEXT NOT NULL,
      app_name TEXT NOT NULL,
      installed_at TEXT DEFAULT (datetime('now')),
      UNIQUE(user_id, app_id)
    );
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      body TEXT DEFAULT '',
      icon TEXT DEFAULT '🔔',
      is_read INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS terminal_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      command TEXT NOT NULL,
      output TEXT DEFAULT '',
      exit_code INTEGER DEFAULT 0,
      ran_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS bookmarks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      favicon TEXT DEFAULT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS browser_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      url TEXT NOT NULL,
      title TEXT DEFAULT '',
      visited_at TEXT DEFAULT (datetime('now'))
    );
  `);
  console.log('  ✅ Schema ready');
}

const run = (sql, p = []) => getDB().prepare(sql).run(...p);
const get = (sql, p = []) => getDB().prepare(sql).get(...p);
const all = (sql, p = []) => getDB().prepare(sql).all(...p);

module.exports = { initDB, getDB, run, get, all };
