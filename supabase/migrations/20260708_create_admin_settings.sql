CREATE TABLE IF NOT EXISTS public.admin_settings (
  id TEXT PRIMARY KEY DEFAULT 'singleton',
  festival_status TEXT NOT NULL DEFAULT 'pre',
  registrations_open BOOLEAN NOT NULL DEFAULT true,
  coordinator_assignments JSONB NOT NULL DEFAULT '{}'::jsonb,
  house_of_the_day TEXT NOT NULL DEFAULT '',
  culturals_title TEXT NOT NULL DEFAULT '',
  culturals_artist_revealed BOOLEAN NOT NULL DEFAULT false,
  culturals_artists JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure the singleton row exists
INSERT INTO public.admin_settings (id)
VALUES ('singleton')
ON CONFLICT (id) DO NOTHING;
