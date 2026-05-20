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
  p_ticket_code text default null
)
returns table(registration_id uuid, ticket_code text)
language plpgsql
security definer
set search_path = public
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
alter table registrations
  add constraint if not exists registrations_ticket_code_unique unique(ticket_code);

-- Restrict RPC execution: only service_role should execute this RPC directly
revoke execute on function create_registration_safe(uuid, uuid, text) from public, anon, authenticated;
grant execute on function create_registration_safe(uuid, uuid, text) to service_role;

commit;
