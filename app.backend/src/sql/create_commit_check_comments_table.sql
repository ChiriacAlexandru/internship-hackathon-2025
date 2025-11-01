-- Table for comments on commit checks
CREATE TABLE IF NOT EXISTS commit_check_comments (
  id SERIAL PRIMARY KEY,
  commit_check_id INTEGER NOT NULL REFERENCES commit_checks(id) ON DELETE CASCADE,
  author_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commit_check_comments_check ON commit_check_comments(commit_check_id);
CREATE INDEX IF NOT EXISTS idx_commit_check_comments_created ON commit_check_comments(created_at DESC);
