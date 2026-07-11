-- =========================================
-- ALL-IN-ONE SETUP SCRIPT
-- Includes: Base schema, 16 migrations, and 6 fixes
-- =========================================

-- =========================================
-- SOURCE: supabase/schema_zero_to_hero.sql
-- =========================================

-- SIMMAM Zero-to-Hero Supabase Schema
-- Purpose: run once on an empty database to create full schema + security + starter data.
-- Safe to re-run (idempotent where possible).

begin;

-- -----------------------------------------------------------------------------
-- 1) Extensions
-- -----------------------------------------------------------------------------
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;
create extension if not exists citext with schema extensions;

set search_path = public, extensions, pg_catalog;

-- -----------------------------------------------------------------------------
-- 2) Domain/Type Setup
-- -----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_type where typname = 'registration_status') then
    create type registration_status as enum ('confirmed', 'cancelled', 'pending');
  end if;

  if not exists (select 1 from pg_type where typname = 'event_status') then
    create type event_status as enum ('upcoming', 'live', 'completed', 'cancelled');
  end if;

  if not exists (select 1 from pg_type where typname = 'admin_role') then
    create type admin_role as enum ('coordinator', 'core_team', 'reg_team', 'developer_admin');
  end if;
end $$;

-- -----------------------------------------------------------------------------
-- 3) Core Tables (ordered to avoid FK cycles)
-- -----------------------------------------------------------------------------

-- Users: canonical profile table mapped to auth users by email.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext not null unique,
  register_number text,
  mobile_number text,
  department text,
  picture_url text,
  house text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_format_chk check (position('@' in email::text) > 1)
);

alter table if exists users
  add column if not exists mobile_number text;

alter table if exists users
  add column if not exists department text;

create table if not exists houses (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  accent text,
  points int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists admins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references users(id) on delete cascade,
  role admin_role not null,
  assigned_event_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  insert into users (name, email)
  values
    ('Suvedhan Suveg', 'suvedhansuveg14@gmail.com'),
    ('Rajese Kersudharsan', 'rajesekersudharsan@gmail.com'),
    ('Sasvanthu G', 'sasvanthu.g.2006@gmail.com')
  on conflict (email) do update set name = excluded.name;

  insert into admins (user_id, role)
  select id, 'developer_admin'::admin_role
  from users
  where email in (
    'suvedhansuveg14@gmail.com',
    'rajesekersudharsan@gmail.com',
    'sasvanthu.g.2006@gmail.com'
  )
  on conflict (user_id) do update set role = 'developer_admin';
end $$;

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text unique,
  description text,
  category text,
  main_category text,
  venue text,
  date date,
  time_slot text,
  end_time text,
  registration_open boolean not null default true,
  checkin_enabled boolean not null default false,
  is_floated boolean not null default true,
  is_live_tomorrow boolean not null default false,
  status event_status not null default 'upcoming',
  capacity int,
  prize_info text,
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint events_capacity_chk check (capacity is null or capacity > 0)
);

-- Add the deferred FK now that events exists.
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'admins_assigned_event_id_fkey'
  ) then
    alter table admins
      add constraint admins_assigned_event_id_fkey
      foreign key (assigned_event_id) references events(id) on delete set null;
  end if;
end $$;

create table if not exists registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  event_id uuid not null references events(id) on delete cascade,
  ticket_code text not null unique,
  registered_at timestamptz not null default now(),
  status registration_status not null default 'confirmed',
  metadata jsonb not null default '{}'::jsonb,
  constraint registrations_unique_user_event unique (user_id, event_id)
);

create table if not exists participants (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  reg_no text,
  email citext,
  house text,
  event_id uuid references events(id) on delete cascade,
  status registration_status not null default 'confirmed',
  check_in boolean not null default false,
  certificate boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists checkins (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references registrations(id) on delete cascade,
  checked_in_by uuid references admins(id) on delete set null,
  checked_in_at timestamptz not null default now(),
  device_info text
);

create table if not exists points_history (
  id uuid primary key default gen_random_uuid(),
  house_id uuid not null references houses(id) on delete cascade,
  points int not null,
  reason text,
  issued_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  pinned boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_time_chk check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

create table if not exists media (
  id uuid primary key default gen_random_uuid(),
  key text not null,
  url text not null,
  uploaded_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint media_url_chk check (url like 'http%')
);

-- -----------------------------------------------------------------------------
-- 4) Indexes
-- -----------------------------------------------------------------------------
create index if not exists events_date_idx on events(date);
create index if not exists events_date_time_slot_idx on events(date, time_slot);
create index if not exists events_main_category_idx on events(main_category);
create index if not exists events_registration_open_idx on events(registration_open);

create index if not exists registrations_event_idx on registrations(event_id);
create index if not exists registrations_user_idx on registrations(user_id);
create index if not exists registrations_registered_at_idx on registrations(registered_at desc);

create index if not exists users_register_number_idx on users(register_number);
create index if not exists users_mobile_number_idx on users(mobile_number);
create index if not exists users_department_idx on users(department);

create index if not exists participants_event_idx on participants(event_id);
create index if not exists participants_email_idx on participants(email);

create index if not exists checkins_registration_idx on checkins(registration_id);
create index if not exists points_history_house_idx on points_history(house_id);

-- -----------------------------------------------------------------------------
-- 5) Utility Trigger for updated_at
-- -----------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists trg_users_updated_at on users;
create trigger trg_users_updated_at
before update on users
for each row execute function set_updated_at();

drop trigger if exists trg_houses_updated_at on houses;
create trigger trg_houses_updated_at
before update on houses
for each row execute function set_updated_at();

drop trigger if exists trg_admins_updated_at on admins;
create trigger trg_admins_updated_at
before update on admins
for each row execute function set_updated_at();

drop trigger if exists trg_events_updated_at on events;
create trigger trg_events_updated_at
before update on events
for each row execute function set_updated_at();

drop trigger if exists trg_participants_updated_at on participants;
create trigger trg_participants_updated_at
before update on participants
for each row execute function set_updated_at();

drop trigger if exists trg_announcements_updated_at on announcements;
create trigger trg_announcements_updated_at
before update on announcements
for each row execute function set_updated_at();

drop trigger if exists trg_media_updated_at on media;
create trigger trg_media_updated_at
before update on media
for each row execute function set_updated_at();

-- -----------------------------------------------------------------------------
-- 6) Views
-- -----------------------------------------------------------------------------
create or replace view leaderboard as
select
  h.id as house_id,
  h.name as house_name,
  h.accent,
  h.points as base_points,
  coalesce(sum(ph.points), 0) as bonus_points,
  h.points + coalesce(sum(ph.points), 0) as total_points
from houses h
left join points_history ph on ph.house_id = h.id
group by h.id, h.name, h.accent, h.points
order by total_points desc, h.name asc;

create or replace view user_dashboard_registrations as
select
  r.id as registration_id,
  u.id as user_id,
  u.email,
  u.name as user_name,
  u.house,
  e.id as event_id,
  e.name as event_name,
  e.main_category,
  e.category,
  e.date,
  e.time_slot,
  e.end_time,
  e.venue,
  r.ticket_code,
  r.status,
  r.registered_at
from registrations r
join users u on u.id = r.user_id
join events e on e.id = r.event_id;

-- -----------------------------------------------------------------------------
-- 7) Auth Helpers + Business RPCs
-- -----------------------------------------------------------------------------

-- Resolve app user id from Supabase Auth JWT email.
create or replace function current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select u.id
  from users u
  where lower(u.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists(select 1 from admins a where a.user_id = p_user_id);
$$;

-- Main registration function used by backend and can also be called via RPC.
create or replace function create_registration(
  p_email text,
  p_name text,
  p_register_number text,
  p_house text,
  p_event_id uuid
)
returns table(registration_id uuid, ticket_code text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid;
  v_ticket text;
  v_open boolean;
  v_capacity int;
  v_count int;
begin
  if p_email is null or trim(p_email) = '' then
    raise exception 'email_required';
  end if;

  if p_event_id is null then
    raise exception 'event_id_required';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_event_id::text)::bigint);

  insert into users (name, email, register_number, house)
  values (
    coalesce(nullif(trim(p_name), ''), split_part(lower(trim(p_email)), '@', 1)),
    lower(trim(p_email)),
    nullif(trim(p_register_number), ''),
    nullif(trim(p_house), '')
  )
  on conflict (email) do update set
    name = coalesce(excluded.name, users.name),
    register_number = coalesce(excluded.register_number, users.register_number),
    house = coalesce(excluded.house, users.house)
  returning id into v_user_id;

  select e.registration_open, e.capacity
  into v_open, v_capacity
  from events e
  where e.id = p_event_id;

  if not found then
    raise exception 'event_not_found';
  end if;

  if v_open is false then
    raise exception 'registration_closed';
  end if;

  if exists (
    select 1
    from registrations r
    where r.user_id = v_user_id and r.event_id = p_event_id
  ) then
    raise exception 'already_registered';
  end if;

  if v_capacity is not null then
    select count(*) into v_count from registrations where event_id = p_event_id;
    if v_count >= v_capacity then
      raise exception 'event_full';
    end if;
  end if;

  v_ticket := 'SMM-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

  insert into registrations (user_id, event_id, ticket_code)
  values (v_user_id, p_event_id, v_ticket)
  returning id into registration_id;

  ticket_code := v_ticket;
  return next;
end;
$$;

create or replace function admin_checkin(
  p_registration_id uuid,
  p_device_info text default null
)
returns table(checkin_id uuid, checked_in_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_admin_id uuid;
  v_app_user_id uuid;
begin
  v_app_user_id := current_app_user_id();

  select a.id into v_admin_id
  from admins a
  where a.user_id = v_app_user_id
  limit 1;

  if v_admin_id is null then
    raise exception 'admin_required';
  end if;

  if not exists (select 1 from registrations where id = p_registration_id) then
    raise exception 'registration_not_found';
  end if;

  insert into checkins (registration_id, checked_in_by, device_info)
  values (p_registration_id, v_admin_id, p_device_info)
  returning id, checkins.checked_in_at into checkin_id, checked_in_at;

  return next;
end;
$$;

create or replace function award_house_points(
  p_house_id uuid,
  p_points int,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_admin_id uuid;
  v_app_user_id uuid;
  v_points_id uuid;
begin
  v_app_user_id := current_app_user_id();

  select a.id into v_admin_id
  from admins a
  where a.user_id = v_app_user_id
  limit 1;

  if v_admin_id is null then
    raise exception 'admin_required';
  end if;

  if not exists(select 1 from houses where id = p_house_id) then
    raise exception 'house_not_found';
  end if;

  insert into points_history (house_id, points, reason, issued_by)
  values (p_house_id, p_points, p_reason, v_admin_id)
  returning id into v_points_id;

  return v_points_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- 8) Row Level Security (RLS)
-- -----------------------------------------------------------------------------

alter table users enable row level security;
alter table admins enable row level security;
alter table houses enable row level security;
alter table events enable row level security;
alter table registrations enable row level security;
alter table participants enable row level security;
alter table checkins enable row level security;
alter table points_history enable row level security;
alter table announcements enable row level security;
alter table media enable row level security;

-- USERS

drop policy if exists users_select_self on users;
create policy users_select_self
on users
for select
to authenticated
using (id = current_app_user_id());

drop policy if exists users_update_self on users;
create policy users_update_self
on users
for update
to authenticated
using (id = current_app_user_id())
with check (id = current_app_user_id());

-- EVENTS / HOUSES / LEADERBOARD-LIKE TABLES: public readable

drop policy if exists events_select_all on events;
create policy events_select_all
on events
for select
to anon, authenticated
using (true);

drop policy if exists houses_select_all on houses;
create policy houses_select_all
on houses
for select
to anon, authenticated
using (true);

drop policy if exists announcements_select_all on announcements;
create policy announcements_select_all
on announcements
for select
to anon, authenticated
using (true);

-- REGISTRATIONS

drop policy if exists registrations_select_owner_or_admin on registrations;
create policy registrations_select_owner_or_admin
on registrations
for select
to authenticated
using (
  user_id = current_app_user_id()
  or is_admin_user(current_app_user_id())
);

drop policy if exists registrations_insert_owner_or_admin on registrations;
create policy registrations_insert_owner_or_admin
on registrations
for insert
to authenticated
with check (
  user_id = current_app_user_id()
  or is_admin_user(current_app_user_id())
);

drop policy if exists registrations_update_admin_only on registrations;
create policy registrations_update_admin_only
on registrations
for update
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

-- ADMIN-ONLY TABLES

drop policy if exists admins_select_admin_only on admins;
create policy admins_select_admin_only
on admins
for select
to authenticated
using (is_admin_user(current_app_user_id()));

drop policy if exists participants_admin_all on participants;
create policy participants_admin_all
on participants
for all
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

drop policy if exists checkins_admin_all on checkins;
create policy checkins_admin_all
on checkins
for all
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

drop policy if exists points_history_admin_all on points_history;
create policy points_history_admin_all
on points_history
for all
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

drop policy if exists announcements_admin_write on announcements;
create policy announcements_admin_write
on announcements
for insert
to authenticated
with check (is_admin_user(current_app_user_id()));

drop policy if exists announcements_admin_update_delete on announcements;
create policy announcements_admin_update_delete
on announcements
for update
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

drop policy if exists media_admin_all on media;
create policy media_admin_all
on media
for all
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

-- -----------------------------------------------------------------------------
-- 9) Starter Seed Data
-- -----------------------------------------------------------------------------
insert into houses (name, accent, points)
values
  ('Agniyas', '#FF6B00', 0),
  ('Dhronas', '#B90000', 0),
  ('Marutas', '#FFD700', 0),
  ('Rudras', '#E0E0E0', 0),
  ('Suryas', '#8A2BE2', 0),
  ('Vajras', '#50C878', 0)
on conflict (name) do update set
  accent = excluded.accent;

insert into events (name, slug, category, main_category, description, venue, date, time_slot, end_time, registration_open, is_floated)
values
  ('Competitive Coding', 'competitive-coding', 'Technical', 'Tech', 'Solve coding problems under time pressure', 'Lab 1', '2026-05-20', '10:00', '12:00', true, true),
  ('Solo Dance', 'solo-dance', 'Dance', 'Non-Tech', 'Solo dancing competition', 'Auditorium', '2026-05-21', '14:00', '15:00', true, true),
  ('Paper Presentation', 'paper-presentation', 'Technical', 'Tech', 'Present technical ideas with PPT', 'Seminar Hall', '2026-05-22', '11:00', '12:30', true, true),
  ('Battle of Bands', 'battle-of-bands', 'Music', 'Non-Tech', 'Band performance showdown', 'Main Stage', '2026-05-23', '17:00', '18:30', true, true)
on conflict (name) do nothing;

-- -----------------------------------------------------------------------------
-- 10) Grant execute on RPCs
-- -----------------------------------------------------------------------------
revoke execute on function create_registration(text, text, text, text, uuid) from anon;
grant execute on function create_registration(text, text, text, text, uuid) to authenticated, service_role;
grant execute on function admin_checkin(uuid, text) to authenticated, service_role;
grant execute on function award_house_points(uuid, int, text) to authenticated, service_role;

grant execute on function current_app_user_id() to authenticated, service_role;
grant execute on function is_admin_user(uuid) to authenticated, service_role;

commit;

-- -----------------------------------------------------------------------------
-- Zero-to-Hero verification queries (run after script)
-- -----------------------------------------------------------------------------
-- 1) Table check
-- select table_name from information_schema.tables where table_schema = 'public' order by table_name;

-- 2) Core counts
-- select (select count(*) from houses) as houses_count,
--        (select count(*) from events) as events_count,
--        (select count(*) from users) as users_count,
--        (select count(*) from registrations) as registrations_count;

-- 3) Leaderboard works
-- select * from leaderboard;

-- 4) Test registration (replace with real event id)
-- select * from create_registration(
--   'student@example.com',
--   'Student One',
--   '7376221CS001',
--   'Agniyas',
--   (select id from events order by created_at asc limit 1)
-- );

-- 5) User dashboard view
-- select * from user_dashboard_registrations order by registered_at desc;


-- =========================================
-- SOURCE: supabase/house_points_migration.sql
-- =========================================

-- House Points Category Breakdown Migration
-- Adds category-based point tracking (Tech, Non-Tech, Cultural, Sports)
-- Safe to re-run (idempotent).

begin;

-- 1) Add category column to points_history
alter table points_history
  add column if not exists category text not null default 'general';

-- 2) Index for efficient category queries
create index if not exists points_history_house_category_idx
  on points_history(house_id, category);

create index if not exists points_history_created_at_idx
  on points_history(created_at);

-- 3) View: aggregate points per house per category
create or replace view house_category_points as
select
  h.id as house_id,
  h.name as house_name,
  h.accent,
  coalesce(ph.category, 'general') as category,
  coalesce(sum(ph.points), 0) as category_points
from houses h
left join points_history ph on ph.house_id = h.id
group by h.id, h.name, h.accent, ph.category
order by h.name, ph.category;

-- 4) The existing leaderboard view is unchanged — it already sums ALL points_history
--    regardless of category, so total_points remains correct.

commit;


-- =========================================
-- SOURCE: supabase/migrations/20260517_create_announcements.sql
-- =========================================

begin;

create table if not exists announcements (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  pinned boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint announcements_time_chk check (ends_at is null or starts_at is null or ends_at >= starts_at)
);

do $$
begin
  if to_regclass('public.admins') is not null
     and not exists (
       select 1
       from pg_constraint
       where conname = 'announcements_created_by_fkey'
     ) then
    alter table announcements
      add constraint announcements_created_by_fkey
      foreign key (created_by) references admins(id) on delete set null;
  end if;
end $$;

commit;

-- =========================================
-- SOURCE: supabase/migrations/20260518_add_live_tomorrow_to_events.sql
-- =========================================

-- Persist tomorrow-live state for events in existing databases.
-- Safe to run multiple times.

alter table if exists public.events
  add column if not exists is_live_tomorrow boolean not null default false;

-- =========================================
-- SOURCE: supabase/migrations/20260519_add_event_rules_and_announcements.sql
-- =========================================

begin;

alter table if exists events
  add column if not exists rules jsonb not null default '[]'::jsonb;

create index if not exists announcements_created_at_idx on announcements(created_at desc);
create index if not exists announcements_pinned_idx on announcements(pinned desc, created_at desc);

commit;

-- =========================================
-- SOURCE: supabase/migrations/20260520_harden_auth_and_registration.sql
-- =========================================

begin;

create or replace function create_registration(
  p_email text,
  p_name text,
  p_register_number text,
  p_house text,
  p_event_id uuid
)
returns table(registration_id uuid, ticket_code text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid;
  v_ticket text;
  v_open boolean;
  v_capacity int;
  v_count int;
begin
  if p_email is null or trim(p_email) = '' then
    raise exception 'email_required';
  end if;

  if p_event_id is null then
    raise exception 'event_id_required';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_event_id::text)::bigint);

  insert into users (name, email, register_number, house)
  values (
    coalesce(nullif(trim(p_name), ''), split_part(lower(trim(p_email)), '@', 1)),
    lower(trim(p_email)),
    nullif(trim(p_register_number), ''),
    nullif(trim(p_house), '')
  )
  on conflict (email) do update set
    name = coalesce(excluded.name, users.name),
    register_number = coalesce(excluded.register_number, users.register_number),
    house = coalesce(excluded.house, users.house)
  returning id into v_user_id;

  select e.registration_open, e.capacity
  into v_open, v_capacity
  from events e
  where e.id = p_event_id;

  if not found then
    raise exception 'event_not_found';
  end if;

  if v_open is false then
    raise exception 'registration_closed';
  end if;

  if exists (
    select 1
    from registrations r
    where r.user_id = v_user_id and r.event_id = p_event_id
  ) then
    raise exception 'already_registered';
  end if;

  if v_capacity is not null then
    select count(*) into v_count from registrations where event_id = p_event_id;
    if v_count >= v_capacity then
      raise exception 'event_full';
    end if;
  end if;

  v_ticket := 'SMM-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

  insert into registrations (user_id, event_id, ticket_code)
  values (v_user_id, p_event_id, v_ticket)
  returning id into registration_id;

  ticket_code := v_ticket;
  return next;
end;
$$;

revoke execute on function create_registration(text, text, text, text, uuid) from anon;
grant execute on function create_registration(text, text, text, text, uuid) to authenticated, service_role;

commit;


-- =========================================
-- SOURCE: supabase/migrations/20260521_safer_create_registration.sql
-- =========================================

begin;

-- Add a counter on events (if not present) to avoid expensive COUNT(*) and to allow row-level locking
alter table events
  add column if not exists registrations_count integer not null default 0;

-- Backfill counts (idempotent)
update events e set registrations_count = sub.cnt
from (
  select event_id, count(*) as cnt
  from registrations
  group by event_id
) sub
where e.id = sub.event_id;

-- Safer create_registration RPC: accepts a user_id (caller must validate JWT) and is intended to be called from the server/service_role
create or replace function create_registration_safe(
  p_user_id uuid,
  p_event_id uuid,
  p_department text default null,
  p_ticket_code text default null
)
returns table(registration_id uuid, ticket_code text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_capacity int;
  v_open boolean;
  v_count int; -- kept for compatibility but we use registrations_count
  v_ticket text;
begin
  if p_user_id is null then
    raise exception 'user_id_required';
  end if;

  if p_event_id is null then
    raise exception 'event_id_required';
  end if;

  if p_department is not null then
    update users
    set department = coalesce(nullif(trim(p_department), ''), users.department)
    where id = p_user_id;
  end if;

  -- Lock the event row to serialize only this event (minimal contention)
  select e.registration_open, e.capacity, e.registrations_count
    into v_open, v_capacity, v_count
  from events e
  where e.id = p_event_id
  for update;

  if not found then
    raise exception 'event_not_found';
  end if;

  if v_open is false then
    raise exception 'registration_closed';
  end if;

  -- Prevent duplicate registration by the same user
  if exists (select 1 from registrations r where r.user_id = p_user_id and r.event_id = p_event_id) then
    raise exception 'already_registered';
  end if;

  -- Enforce capacity based on counter
  if v_capacity is not null then
    if v_count >= v_capacity then
      raise exception 'event_full';
    end if;
  end if;

  -- Generate a ticket if none provided; ensure uniqueness via unique constraint on ticket_code
  if p_ticket_code is null then
    v_ticket := 'SMM-' || upper(substring(md5(gen_random_uuid()::text || clock_timestamp()::text) from 1 for 8));
  else
    v_ticket := p_ticket_code;
  end if;

  insert into registrations (user_id, event_id, ticket_code)
    values (p_user_id, p_event_id, v_ticket)
    returning id into registration_id;

  -- Update the cached counter
  update events set registrations_count = registrations_count + 1 where id = p_event_id;

  ticket_code := v_ticket;
  return next;
end;
$$;

-- Ensure ticket_code uniqueness to avoid collisions
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'registrations_ticket_code_unique'
  ) then
    alter table registrations
      add constraint registrations_ticket_code_unique unique(ticket_code);
  end if;
end $$;

-- Restrict RPC execution: only service_role should execute this RPC directly
revoke execute on function create_registration_safe(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function create_registration_safe(uuid, uuid, text, text) to service_role;

commit;


-- =========================================
-- SOURCE: supabase/migrations/20260522_safe_query_indexes.sql
-- =========================================

-- Database optimization: Add safe read/query indexes for registration and event lookup paths
-- This migration is non-destructive and additive. It uses IF NOT EXISTS to avoid duplicate indices.

begin;

create index if not exists checkins_registration_id_idx on checkins(registration_id);
create index if not exists registrations_registered_at_idx on registrations(registered_at desc);
create index if not exists events_name_lower_idx on events(lower(name));

commit;


-- =========================================
-- SOURCE: supabase/migrations/20260523_add_event_rules_and_announcements.sql
-- =========================================

begin;

alter table if exists events
  add column if not exists rules jsonb not null default '[]'::jsonb;

create index if not exists announcements_created_at_idx on announcements(created_at desc);
create index if not exists announcements_pinned_idx on announcements(pinned desc, created_at desc);

commit;

-- =========================================
-- SOURCE: supabase/migrations/20260524_add_rules_and_regulations.sql
-- =========================================

begin;

create table if not exists rules_and_regulations (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text,
  pinned boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rules_and_regulations_created_at_idx on rules_and_regulations(created_at desc);
create index if not exists rules_and_regulations_pinned_idx on rules_and_regulations(pinned desc, created_at desc);

commit;

-- =========================================
-- SOURCE: supabase/migrations/20260525_optimize_performance.sql
-- =========================================

-- Database optimization: Add indexes for 10k+ user load
-- Run this migration in Supabase SQL Editor

begin;

-- Events table indexes for filtering and sorting
create index if not exists events_main_category_idx on events(main_category);
create index if not exists events_date_idx on events(date desc);
create index if not exists events_date_time_slot_idx on events(date desc, time_slot asc);
create index if not exists events_registration_open_idx on events(registration_open);
create index if not exists events_checkin_enabled_idx on events(checkin_enabled);

-- Users table indexes for lookups
create index if not exists users_email_lower_idx on users(lower(email));
create index if not exists users_created_at_idx on users(created_at desc);

-- Registrations table indexes for filtering and searches
create index if not exists registrations_event_id_idx on registrations(event_id);
do $$
begin
	-- Some deployments use `email`, others use `user_id` on registrations.
	if exists (
		select 1
		from information_schema.columns
		where table_schema = 'public' and table_name = 'registrations' and column_name = 'email'
	) then
		create index if not exists registrations_email_idx on registrations(email);
	end if;

	if exists (
		select 1
		from information_schema.columns
		where table_schema = 'public' and table_name = 'registrations' and column_name = 'user_id'
	) then
		create index if not exists registrations_user_id_idx on registrations(user_id);
	end if;

	if exists (
		select 1
		from information_schema.columns
		where table_schema = 'public' and table_name = 'registrations' and column_name = 'checked_in'
	) then
		create index if not exists registrations_checked_in_idx on registrations(checked_in);
	end if;

	-- Status column name differs across schema versions.
	if exists (
		select 1
		from information_schema.columns
		where table_schema = 'public' and table_name = 'registrations' and column_name = 'registration_status'
	) then
		create index if not exists registrations_status_idx on registrations(registration_status);
	elsif exists (
		select 1
		from information_schema.columns
		where table_schema = 'public' and table_name = 'registrations' and column_name = 'status'
	) then
		create index if not exists registrations_status_idx on registrations(status);
	end if;
end $$;

-- Leaderboard is commonly a view; index source tables instead.
create index if not exists points_history_house_id_idx on points_history(house_id);
create index if not exists houses_points_idx on houses(points desc);

-- Announcements and Rules indexes for filtering
create index if not exists announcements_pinned_created_idx on announcements(pinned desc, created_at desc);
create index if not exists announcements_starts_at_idx on announcements(starts_at);
create index if not exists announcements_ends_at_idx on announcements(ends_at);

do $$
begin
	if to_regclass('public.rules_and_regulations') is not null then
		create index if not exists rules_pinned_created_idx on rules_and_regulations(pinned desc, created_at desc);
		create index if not exists rules_starts_at_idx on rules_and_regulations(starts_at);
		create index if not exists rules_ends_at_idx on rules_and_regulations(ends_at);
	end if;
end $$;

-- Houses indexes
create index if not exists houses_name_idx on houses(lower(name));

commit;

-- =========================================
-- SOURCE: supabase/migrations/20260526_security_and_query_hardening.sql
-- =========================================

begin;

-- Move shared extensions out of public and keep public-only objects explicit.
create schema if not exists extensions;
alter extension citext set schema extensions;
alter extension pgcrypto set schema extensions;

-- Lock SECURITY DEFINER function lookup paths to trusted schemas.
create or replace function set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog, public, extensions
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create or replace function current_app_user_id()
returns uuid
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select u.id
  from users u
  where lower(u.email::text) = lower(coalesce(auth.jwt() ->> 'email', ''))
  limit 1;
$$;

create or replace function is_admin_user(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public, extensions
as $$
  select exists(select 1 from admins a where a.user_id = p_user_id);
$$;

create or replace function create_registration(
  p_email text,
  p_name text,
  p_register_number text,
  p_house text,
  p_event_id uuid
)
returns table(registration_id uuid, ticket_code text)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_user_id uuid;
  v_ticket text;
  v_open boolean;
  v_capacity int;
  v_count int;
begin
  if p_email is null or trim(p_email) = '' then
    raise exception 'email_required';
  end if;

  if p_event_id is null then
    raise exception 'event_id_required';
  end if;

  perform pg_advisory_xact_lock(hashtext(p_event_id::text)::bigint);

  insert into users (name, email, register_number, house)
  values (
    coalesce(nullif(trim(p_name), ''), split_part(lower(trim(p_email)), '@', 1)),
    lower(trim(p_email)),
    nullif(trim(p_register_number), ''),
    nullif(trim(p_house), '')
  )
  on conflict (email) do update set
    name = coalesce(excluded.name, users.name),
    register_number = coalesce(excluded.register_number, users.register_number),
    house = coalesce(excluded.house, users.house)
  returning id into v_user_id;

  select e.registration_open, e.capacity
  into v_open, v_capacity
  from events e
  where e.id = p_event_id;

  if not found then
    raise exception 'event_not_found';
  end if;

  if v_open is false then
    raise exception 'registration_closed';
  end if;

  if exists (
    select 1
    from registrations r
    where r.user_id = v_user_id and r.event_id = p_event_id
  ) then
    raise exception 'already_registered';
  end if;

  if v_capacity is not null then
    select count(*) into v_count from registrations where event_id = p_event_id;
    if v_count >= v_capacity then
      raise exception 'event_full';
    end if;
  end if;

  v_ticket := 'SMM-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 8));

  insert into registrations (user_id, event_id, ticket_code)
  values (v_user_id, p_event_id, v_ticket)
  returning id into registration_id;

  ticket_code := v_ticket;
  return next;
end;
$$;

create or replace function admin_checkin(
  p_registration_id uuid,
  p_device_info text default null
)
returns table(checkin_id uuid, checked_in_at timestamptz)
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_admin_id uuid;
  v_app_user_id uuid;
begin
  v_app_user_id := current_app_user_id();

  select a.id into v_admin_id
  from admins a
  where a.user_id = v_app_user_id
  limit 1;

  if v_admin_id is null then
    raise exception 'admin_required';
  end if;

  if not exists (select 1 from registrations where id = p_registration_id) then
    raise exception 'registration_not_found';
  end if;

  insert into checkins (registration_id, checked_in_by, device_info)
  values (p_registration_id, v_admin_id, p_device_info)
  returning id, checkins.checked_in_at into checkin_id, checked_in_at;

  return next;
end;
$$;

create or replace function award_house_points(
  p_house_id uuid,
  p_points int,
  p_reason text default null
)
returns uuid
language plpgsql
security definer
set search_path = pg_catalog, public, extensions
as $$
declare
  v_admin_id uuid;
  v_app_user_id uuid;
  v_points_id uuid;
begin
  v_app_user_id := current_app_user_id();

  select a.id into v_admin_id
  from admins a
  where a.user_id = v_app_user_id
  limit 1;

  if v_admin_id is null then
    raise exception 'admin_required';
  end if;

  if not exists(select 1 from houses where id = p_house_id) then
    raise exception 'house_not_found';
  end if;

  insert into points_history (house_id, points, reason, issued_by)
  values (p_house_id, p_points, p_reason, v_admin_id)
  returning id into v_points_id;

  return v_points_id;
end;
$$;

-- Keep function grants aligned with server-only execution for the safer RPC.
revoke execute on function create_registration_safe(uuid, uuid, text, text) from public, anon, authenticated;
grant execute on function create_registration_safe(uuid, uuid, text, text) to service_role;

commit;

-- =========================================
-- SOURCE: supabase/migrations/20260530_get_house_department_participation.sql
-- =========================================

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


-- =========================================
-- SOURCE: supabase/migrations/20260531_department_analytics_indexes.sql
-- =========================================

begin;

create index if not exists users_register_number_idx on public.users(register_number);
create index if not exists users_mobile_number_idx on public.users(mobile_number);
create index if not exists users_department_idx on public.users(department);

create or replace function public.get_department_analytics()
returns table (
  department text,
  house_name text,
  total_registrations bigint,
  percentage numeric
)
language sql
stable
security definer
set search_path = public, pg_catalog
as $$
  with department_counts as (
    select
      coalesce(nullif(trim(u.department), ''), 'Unassigned') as department,
      coalesce(nullif(trim(u.house), ''), 'Unassigned') as house_name,
      count(*)::bigint as total_registrations
    from public.registrations r
    join public.users u on u.id = r.user_id
    group by 1, 2
  ),
  totals as (
    select coalesce(sum(total_registrations), 0)::numeric as grand_total
    from department_counts
  )
  select
    dc.department,
    dc.house_name,
    dc.total_registrations,
    case
      when totals.grand_total > 0 then round((dc.total_registrations::numeric * 100) / totals.grand_total, 2)
      else 0
    end as percentage
  from department_counts dc
  cross join totals
  order by dc.total_registrations desc, dc.department asc, dc.house_name asc;
$$;

commit;


-- =========================================
-- SOURCE: supabase/migrations/20260707_create_culturals_bucket.sql
-- =========================================

-- Insert the bucket
insert into storage.buckets (id, name, public)
values ('culturals', 'culturals', true)
on conflict (id) do nothing;

-- Allow public read access to the culturals bucket
create policy "Public Access for culturals"
  on storage.objects for select
  using ( bucket_id = 'culturals' );

-- Allow authenticated users (admin panel) to upload to the culturals bucket
create policy "Admin Upload Access for culturals"
  on storage.objects for insert
  with check ( bucket_id = 'culturals' and auth.role() = 'authenticated' );

-- Allow authenticated users to update files in the culturals bucket
create policy "Admin Update Access for culturals"
  on storage.objects for update
  with check ( bucket_id = 'culturals' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete files from the culturals bucket
create policy "Admin Delete Access for culturals"
  on storage.objects for delete
  using ( bucket_id = 'culturals' and auth.role() = 'authenticated' );


-- =========================================
-- SOURCE: supabase/migrations/20260708_create_admin_settings.sql
-- =========================================

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


-- =========================================
-- SOURCE: supabase/migrations/20260710_add_awards_to_settings.sql
-- =========================================

-- Add awards JSONB column to admin_settings table
ALTER TABLE public.admin_settings
ADD COLUMN IF NOT EXISTS awards JSONB NOT NULL DEFAULT '[]'::jsonb;


-- =========================================
-- SOURCE: supabase/migrations/20260710_create_awards_bucket.sql
-- =========================================

-- Insert the bucket
insert into storage.buckets (id, name, public)
values ('awards', 'awards', true)
on conflict (id) do nothing;

-- Allow public read access to the awards bucket
create policy "Public Access for awards"
  on storage.objects for select
  using ( bucket_id = 'awards' );

-- Allow authenticated users (admin panel) to upload to the awards bucket
create policy "Admin Upload Access for awards"
  on storage.objects for insert
  with check ( bucket_id = 'awards' and auth.role() = 'authenticated' );

-- Allow authenticated users to update files in the awards bucket
create policy "Admin Update Access for awards"
  on storage.objects for update
  with check ( bucket_id = 'awards' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete files from the awards bucket
create policy "Admin Delete Access for awards"
  on storage.objects for delete
  using ( bucket_id = 'awards' and auth.role() = 'authenticated' );


-- =========================================
-- SOURCE: supabase/fixes/add_admin_users_policy.sql
-- =========================================

-- Allow admins to read all user records so they can see developers in the dashboard
drop policy if exists users_select_admin on users;
create policy users_select_admin
on users
for select
to authenticated
using (is_admin_user(current_app_user_id()));


-- =========================================
-- SOURCE: supabase/fixes/add_developer_login_logs.sql
-- =========================================

create table if not exists developer_login_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  logged_in_at timestamptz not null default now()
);

alter table developer_login_logs enable row level security;

drop policy if exists developer_login_logs_insert on developer_login_logs;
create policy developer_login_logs_insert on developer_login_logs
for insert to authenticated
with check (
  current_app_user_id() in (
    select user_id from admins where id = admin_id
  ) or is_admin_user(current_app_user_id())
);

drop policy if exists developer_login_logs_select on developer_login_logs;
create policy developer_login_logs_select on developer_login_logs
for select to authenticated
using (is_admin_user(current_app_user_id()));


-- =========================================
-- SOURCE: supabase/fixes/add_developer_logout_logs.sql
-- =========================================

create table if not exists developer_logout_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  reason text not null,
  logged_out_at timestamptz not null default now()
);

alter table developer_logout_logs enable row level security;

drop policy if exists developer_logout_logs_insert on developer_logout_logs;
create policy developer_logout_logs_insert on developer_logout_logs
for insert to authenticated
with check (
  current_app_user_id() in (
    select user_id from admins where id = admin_id
  ) or is_admin_user(current_app_user_id())
);

drop policy if exists developer_logout_logs_select on developer_logout_logs;
create policy developer_logout_logs_select on developer_logout_logs
for select to authenticated
using (is_admin_user(current_app_user_id()));


-- =========================================
-- SOURCE: supabase/fixes/add_developer_tasks.sql
-- =========================================

-- 1. Add login tracking to admins table
alter table if exists admins
  add column if not exists is_logged_in boolean not null default false;

-- 2. Create developer_tasks table
create table if not exists developer_tasks (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references admins(id) on delete cascade,
  title text not null,
  status text not null default 'pending', -- 'pending', 'in_process', 'completed'
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Utility Trigger for updated_at
drop trigger if exists trg_developer_tasks_updated_at on developer_tasks;
create trigger trg_developer_tasks_updated_at
before update on developer_tasks
for each row execute function set_updated_at();

-- 4. RLS for developer_tasks
alter table developer_tasks enable row level security;

-- All admins can read developer_tasks
drop policy if exists developer_tasks_select_all on developer_tasks;
create policy developer_tasks_select_all
on developer_tasks
for select
to authenticated
using (is_admin_user(current_app_user_id()));

-- Only sasvanthu.g.2006@gmail.com can insert tasks
drop policy if exists developer_tasks_insert on developer_tasks;
create policy developer_tasks_insert
on developer_tasks
for insert
to authenticated
with check (
  current_app_user_id() in (
    select id from users where email = 'sasvanthu.g.2006@gmail.com'
  )
);

-- Admins can update tasks (to change status)
drop policy if exists developer_tasks_update on developer_tasks;
create policy developer_tasks_update
on developer_tasks
for update
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

-- Only sasvanthu can delete tasks
drop policy if exists developer_tasks_delete on developer_tasks;
create policy developer_tasks_delete
on developer_tasks
for delete
to authenticated
using (
  current_app_user_id() in (
    select id from users where email = 'sasvanthu.g.2006@gmail.com'
  )
);


-- =========================================
-- SOURCE: supabase/fixes/apply_registration_and_leaderboard_rpcs.sql
-- =========================================

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


-- =========================================
-- SOURCE: supabase/fixes/backfill_registrations.sql
-- =========================================

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



