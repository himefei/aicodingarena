-- Migration: Add comment column to demos + create demo_likes table
-- Run: wrangler d1 execute aicodingarena-db --file=db/migrate-likes.sql

-- Add comment column to demos (nullable, no default needed)
ALTER TABLE demos ADD COLUMN comment TEXT;

-- Create demo_likes table for per-IP-per-demo likes
CREATE TABLE IF NOT EXISTS demo_likes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  demo_id TEXT NOT NULL,
  ip TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now')),
  UNIQUE(demo_id, ip),
  FOREIGN KEY (demo_id) REFERENCES demos(id) ON DELETE CASCADE
);
