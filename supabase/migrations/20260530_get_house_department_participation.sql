-- Migration: Add RPC to get participation counts grouped by house and department
-- Adds function: get_house_department_participation()

ALTER TABLE IF EXISTS users
  ADD COLUMN IF NOT EXISTS department text;

CREATE OR REPLACE FUNCTION get_house_department_participation()
RETURNS TABLE (
  house_name text,
  department text,
  participation_count bigint
)
LANGUAGE sql
SET search_path = pg_catalog, public, extensions
AS $$
SELECT
  u.house AS house_name,
  u.department AS department,
  COUNT(c.id) AS participation_count
FROM checkins c
JOIN registrations r ON c.registration_id = r.id
JOIN users u ON r.user_id = u.id
WHERE u.house IS NOT NULL
  AND u.house <> ''
  AND u.department IS NOT NULL
  AND u.department <> ''
GROUP BY
  u.house,
  u.department
ORDER BY
  u.house,
  participation_count DESC;
$$;
