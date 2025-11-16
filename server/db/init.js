import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../../txty.db');
const db = new Database(dbPath);

export function initDatabase() {
  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      bio TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Pastes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pastes (
      id TEXT PRIMARY KEY,
      custom_url TEXT UNIQUE,
      title TEXT,
      content TEXT NOT NULL,
      language TEXT DEFAULT 'plaintext',
      password TEXT,
      user_id INTEGER,
      folder_id INTEGER,
      forked_from TEXT,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      views INTEGER DEFAULT 0,
      unique_views INTEGER DEFAULT 0,
      max_views INTEGER,
      is_public BOOLEAN DEFAULT 1,
      is_burned BOOLEAN DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (folder_id) REFERENCES folders (id) ON DELETE SET NULL,
      FOREIGN KEY (forked_from) REFERENCES pastes (id) ON DELETE SET NULL
    )
  `);

  // Add new columns to existing pastes table (migration)
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN custom_url TEXT UNIQUE`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN language TEXT DEFAULT 'plaintext'`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN folder_id INTEGER`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN forked_from TEXT`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN unique_views INTEGER DEFAULT 0`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN max_views INTEGER`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN is_public BOOLEAN DEFAULT 1`);
  } catch (e) { /* Column already exists */ }
  try {
    db.exec(`ALTER TABLE pastes ADD COLUMN is_burned BOOLEAN DEFAULT 0`);
  } catch (e) { /* Column already exists */ }

  // Folders table
  db.exec(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )
  `);

  // Tags table
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Paste tags junction table
  db.exec(`
    CREATE TABLE IF NOT EXISTS paste_tags (
      paste_id TEXT NOT NULL,
      tag_id INTEGER NOT NULL,
      PRIMARY KEY (paste_id, tag_id),
      FOREIGN KEY (paste_id) REFERENCES pastes (id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE
    )
  `);

  // Likes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      paste_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, paste_id),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (paste_id) REFERENCES pastes (id) ON DELETE CASCADE
    )
  `);

  // Analytics table for detailed tracking
  db.exec(`
    CREATE TABLE IF NOT EXISTS paste_analytics (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      paste_id TEXT NOT NULL,
      viewer_ip TEXT,
      user_agent TEXT,
      referer TEXT,
      viewed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (paste_id) REFERENCES pastes (id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized successfully with enhanced schema');
}

export default db;
