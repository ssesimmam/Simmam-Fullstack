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
