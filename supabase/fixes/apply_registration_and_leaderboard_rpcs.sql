-- Idempotent fixes for registration RPC and department leaderboard RPC
-- Run this in Supabase SQL Editor for the target project.

-- 1) Safer create_registration_safe: accepts optional p_department
CREATE OR REPLACE FUNCTION public.create_registration_safe(
  p_user_id uuid,
  p_event_id uuid,
  p_department text DEFAULT NULL,
  p_ticket_code text DEFAULT NULL
)
RETURNS table(registration_id uuid, ticket_code text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, extensions
AS $$
DECLARE
  v_capacity int;
  v_open boolean;
  v_count int;
  v_ticket text;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id_required';
  END IF;
  IF p_event_id IS NULL THEN
    RAISE EXCEPTION 'event_id_required';
  END IF;

  IF p_department IS NOT NULL THEN
    UPDATE users
    SET department = COALESCE(NULLIF(TRIM(p_department), ''), users.department)
    WHERE id = p_user_id;
  END IF;

  SELECT e.registration_open, e.capacity, e.registrations_count
    INTO v_open, v_capacity, v_count
  FROM events e
  WHERE e.id = p_event_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'event_not_found';
  END IF;

  IF v_open IS FALSE THEN
    RAISE EXCEPTION 'registration_closed';
  END IF;

  IF EXISTS (SELECT 1 FROM registrations r WHERE r.user_id = p_user_id AND r.event_id = p_event_id) THEN
    RAISE EXCEPTION 'already_registered';
  END IF;

  IF v_capacity IS NOT NULL AND v_count >= v_capacity THEN
    RAISE EXCEPTION 'event_full';
  END IF;

  IF p_ticket_code IS NULL THEN
    v_ticket := 'SMM-' || upper(substring(md5(gen_random_uuid()::text || clock_timestamp()::text) FROM 1 FOR 8));
  ELSE
    v_ticket := p_ticket_code;
  END IF;

  INSERT INTO registrations (user_id, event_id, ticket_code)
  VALUES (p_user_id, p_event_id, v_ticket)
  RETURNING id INTO registration_id;

  UPDATE events SET registrations_count = registrations_count + 1 WHERE id = p_event_id;

  ticket_code := v_ticket;
  RETURN NEXT;
END;
$$;

-- Align grants with repo conventions (only service_role
REVOKE EXECUTE ON FUNCTION public.create_registration_safe(uuid, uuid, text, text) FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.create_registration_safe(uuid, uuid, text, text) TO service_role;

-- 2) Department leaderboard RPC: counts checkins grouped by user.house and user.department
CREATE OR REPLACE FUNCTION public.get_house_department_participation()
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
WHERE u.house IS NOT NULL AND u.house <> ''
  AND u.department IS NOT NULL AND u.department <> ''
GROUP BY u.house, u.department
ORDER BY u.house, participation_count DESC;
$$;

-- End of file
