DROP TABLE IF EXISTS notes;
CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  filename TEXT UNIQUE NOT NULL,
  content TEXT,
  ip TEXT,
  city TEXT,
  country TEXT,
  user_agent TEXT,
  created_at INTEGER,
  updated_at INTEGER
);
