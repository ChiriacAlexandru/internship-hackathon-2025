INSERT INTO rules (project_id, key, level, message, pattern, type, global)
SELECT NULL, 'no-console-log', 'low', 'Avoid console.log statements in committed code.', 'console\\.log', 'style', true
WHERE NOT EXISTS (
  SELECT 1 FROM rules WHERE key = 'no-console-log' AND global = true
);

INSERT INTO rules (project_id, key, level, message, pattern, type, global)
SELECT NULL, 'require-docstring', 'medium', 'Functions should include basic documentation.', '', 'docs', true
WHERE NOT EXISTS (
  SELECT 1 FROM rules WHERE key = 'require-docstring' AND global = true
);
