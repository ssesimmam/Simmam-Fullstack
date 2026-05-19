-- Persist tomorrow-live state for events in existing databases.
-- Safe to run multiple times.

alter table if exists public.events
  add column if not exists is_live_tomorrow boolean not null default false;