-- Migration: Add 'markdown' to demo_type CHECK constraint
-- D1 (SQLite) doesn't support ALTER CHECK constraints directly,
-- so we need to recreate the table if the constraint needs updating.
-- However, SQLite CHECK constraints are only enforced on INSERT/UPDATE,
-- and the existing CHECK can be updated by recreating the table.

-- For existing databases, the simplest approach:
-- 1. Create a new table with the updated constraint
-- 2. Copy data
-- 3. Drop old table
-- 4. Rename new table

CREATE TABLE IF NOT EXISTS demos_new (
  id TEXT PRIMARY KEY,
  tab_id TEXT NOT NULL,
  model_name TEXT NOT NULL,
  model_key TEXT NOT NULL,
  file_r2_key TEXT NOT NULL,
  thumbnail_r2_key TEXT,
  demo_type TEXT NOT NULL DEFAULT 'html' CHECK(demo_type IN ('html', 'python', 'markdown')),
  comment TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (tab_id) REFERENCES tabs(id) ON DELETE CASCADE
);

INSERT OR IGNORE INTO demos_new SELECT * FROM demos;

DROP TABLE demos;

ALTER TABLE demos_new RENAME TO demos;
