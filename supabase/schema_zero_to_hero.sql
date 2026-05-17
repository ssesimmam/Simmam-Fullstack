-- SIMMAM Zero-to-Hero Supabase Schema
-- Purpose: run once on an empty database to create full schema + security + starter data.
-- Safe to re-run (idempotent where possible).

begin;

-- -----------------------------------------------------------------------------
-- 1) Extensions
-- -----------------------------------------------------------------------------
create extension if not exists pgcrypto;
create extension if not exists citext;

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
  picture_url text,
  house text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_email_format_chk check (position('@' in email::text) > 1)
);

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
create index if not exists events_main_category_idx on events(main_category);
create index if not exists events_registration_open_idx on events(registration_open);

create index if not exists registrations_event_idx on registrations(event_id);
create index if not exists registrations_user_idx on registrations(user_id);
create index if not exists registrations_registered_at_idx on registrations(registered_at desc);

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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
set search_path = public
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
grant execute on function create_registration(text, text, text, text, uuid) to anon, authenticated, service_role;
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
