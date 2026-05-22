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
revoke execute on function create_registration_safe(uuid, uuid, text) from public, anon, authenticated;
grant execute on function create_registration_safe(uuid, uuid, text) to service_role;

commit;