-- Add current user as member to a project for testing
-- Find a project and a user
DO $$
DECLARE
  project_id_var INTEGER;
  user_id_var INTEGER;
BEGIN
  -- Get first active project
  SELECT id INTO project_id_var 
  FROM projects 
  WHERE is_active = TRUE 
  LIMIT 1;

  -- Get first DEV or PO user
  SELECT id INTO user_id_var 
  FROM users 
  WHERE role IN ('DEV', 'PO') AND is_active = TRUE 
  LIMIT 1;

  -- Check if we found both
  IF project_id_var IS NOT NULL AND user_id_var IS NOT NULL THEN
    -- Add member if not already exists
    INSERT INTO project_members (project_id, user_id, role_in_project, added_by)
    VALUES (project_id_var, user_id_var, 'DEV', 1)
    ON CONFLICT (project_id, user_id) DO NOTHING;
    
    RAISE NOTICE 'Added user % to project %', user_id_var, project_id_var;
  ELSE
    RAISE NOTICE 'No project or user found!';
  END IF;
END $$;

-- Verify
SELECT 
  p.id as project_id,
  p.name as project_name,
  u.id as user_id,
  u.email as user_email,
  pm.role_in_project
FROM project_members pm
JOIN projects p ON p.id = pm.project_id
JOIN users u ON u.id = pm.user_id
WHERE p.is_active = TRUE
ORDER BY p.id, u.id;
