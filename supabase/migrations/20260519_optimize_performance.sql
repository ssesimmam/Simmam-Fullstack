-- Database optimization: Add indexes for 10k+ user load
-- Run this migration in Supabase SQL Editor

begin;

-- Events table indexes for filtering and sorting
create index if not exists events_main_category_idx on events(main_category);
create index if not exists events_date_idx on events(date desc);
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
