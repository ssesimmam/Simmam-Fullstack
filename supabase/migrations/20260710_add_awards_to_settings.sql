-- Add awards JSONB column to admin_settings table
ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS awards JSONB NOT NULL DEFAULT '[]'::jsonb;
