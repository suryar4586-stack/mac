/**
 * models/db.js  —  sql.js (pure-JS SQLite, no native build needed)
 * Persists to disk via fs read/write on every write operation.
 */

const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const STORAGE = path.join(__dirname, '..', 'storage');
const DB_PATH = path.join(STORAGE, 'stackos.db');
fs.mkdirSync(STORAGE, { recursive: true });

let db; // sql.js Database instance

/* ── Boot ──────────────────────────────────────────────────────── */
async function initDB() {
  const SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const buf = fs.readFileSync(DB_PATH);
    db = new SQL.Database(buf);
  } else {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON;');

  db.run(`
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

  persist();
  console.log('  ✅ sql.js database ready →', DB_PATH);
}

/* ── Persist to disk ───────────────────────────────────────────── */
function persist() {
  if (!db) return;
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

/* ── Helpers ────────────────────────────────────────────────────── */

/**
 * Run a write statement (INSERT / UPDATE / DELETE / CREATE)
 * Returns { lastInsertRowid, changes }
 */
function run(sql, params = []) {
  if (!db) throw new Error('DB not initialised');
  db.run(sql, params);
  const lastInsertRowid = db.exec('SELECT last_insert_rowid() as id')[0]?.values[0][0] ?? null;
  persist();
  return { lastInsertRowid };
}

/**
 * Get a single row  →  plain object or undefined
 */
function get(sql, params = []) {
  if (!db) throw new Error('DB not initialised');
  const res = db.exec(sql, params);
  if (!res.length || !res[0].values.length) return undefined;
  return zipRow(res[0].columns, res[0].values[0]);
}

/**
 * Get all rows  →  array of plain objects
 */
function all(sql, params = []) {
  if (!db) throw new Error('DB not initialised');
  const res = db.exec(sql, params);
  if (!res.length) return [];
  return res[0].values.map(row => zipRow(res[0].columns, row));
}

function zipRow(cols, vals) {
  const obj = {};
  cols.forEach((c, i) => { obj[c] = vals[i]; });
  return obj;
}

module.exports = { initDB, run, get, all, persist };
