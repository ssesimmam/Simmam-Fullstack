-- Database optimization: Add safe read/query indexes for registration and event lookup paths
-- This migration is non-destructive and additive. It uses IF NOT EXISTS to avoid duplicate indices.

begin;

create index if not exists checkins_registration_id_idx on checkins(registration_id);
create index if not exists registrations_registered_at_idx on registrations(registered_at desc);
create index if not exists events_name_lower_idx on events(lower(name));

commit;
