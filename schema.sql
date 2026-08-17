CREATE TABLE IF NOT EXISTS signs (
  id TEXT PRIMARY KEY,
  spotted_by TEXT NOT NULL,
  meaning TEXT NOT NULL,
  image_key TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_signs_created_at
ON signs(created_at DESC);
