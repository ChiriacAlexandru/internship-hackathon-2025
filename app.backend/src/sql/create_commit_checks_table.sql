-- Table for storing pre-commit check history
CREATE TABLE IF NOT EXISTS commit_checks (
  id SERIAL PRIMARY KEY,
  project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
  commit_hash TEXT,
  branch_name TEXT,
  files_checked TEXT[], -- Array of file paths that were checked
  passed BOOLEAN DEFAULT false,
  total_findings INTEGER DEFAULT 0,
  critical_findings INTEGER DEFAULT 0,
  review_id INTEGER REFERENCES reviews(id) ON DELETE SET NULL,
  author_email TEXT,
  commit_message TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_commit_checks_project ON commit_checks(project_id);
CREATE INDEX IF NOT EXISTS idx_commit_checks_hash ON commit_checks(commit_hash);
CREATE INDEX IF NOT EXISTS idx_commit_checks_created ON commit_checks(created_at DESC);
