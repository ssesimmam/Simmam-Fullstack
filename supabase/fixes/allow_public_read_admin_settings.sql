-- Allow the public (anon) role to read the admin_settings table.
-- This is needed so the frontend can fetch settings (including awards)
-- directly from Supabase when the backend API is unavailable or outdated.

-- Enable RLS on admin_settings if not already enabled
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;

-- Drop the old policy if it exists, then recreate it cleanly
DROP POLICY IF EXISTS "allow_public_read_admin_settings" ON public.admin_settings;

-- Allow anyone (anon + authenticated) to SELECT from admin_settings
CREATE POLICY "allow_public_read_admin_settings"
  ON public.admin_settings
  FOR SELECT
  USING (true);
