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