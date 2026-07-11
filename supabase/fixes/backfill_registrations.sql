-- Run this in the Supabase SQL Editor to backfill missing denormalized data for old registrations.

ALTER TABLE public.registrations
  ADD COLUMN IF NOT EXISTS user_name text,
  ADD COLUMN IF NOT EXISTS user_email text,
  ADD COLUMN IF NOT EXISTS register_number text,
  ADD COLUMN IF NOT EXISTS house_name text,
  ADD COLUMN IF NOT EXISTS event_name text;

UPDATE public.registrations r
SET 
  user_name = u.name,
  user_email = u.email,
  register_number = u.register_number,
  house_name = u.house,
  event_name = e.name
FROM public.users u, public.events e
WHERE r.user_id = u.id 
  AND r.event_id = e.id
  AND (
    r.user_name IS NULL OR 
    r.user_email IS NULL OR 
    r.register_number IS NULL OR 
    r.house_name IS NULL OR 
    r.event_name IS NULL
  );

