DROP TABLE IF EXISTS notes;
DROP TABLE IF EXISTS note_edits;

CREATE TABLE notes (
  id TEXT PRIMARY KEY,
  filename TEXT UNIQUE,
  content TEXT,
  ip TEXT,
  city TEXT,
  country TEXT,
  timezone TEXT,
  user_agent TEXT,
  created_at INTEGER,
  updated_at INTEGER
);

CREATE TABLE note_edits (
  id TEXT PRIMARY KEY,
  note_id TEXT,
  previous_content TEXT,
  ip TEXT,
  city TEXT,
  created_at INTEGER,
  commit_msg TEXT,
  author_name TEXT,
  FOREIGN KEY(note_id) REFERENCES notes(id)
);
