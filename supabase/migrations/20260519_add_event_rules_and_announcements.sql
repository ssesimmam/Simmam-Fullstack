begin;

alter table if exists events
  add column if not exists rules jsonb not null default '[]'::jsonb;

create index if not exists announcements_created_at_idx on announcements(created_at desc);
create index if not exists announcements_pinned_idx on announcements(pinned desc, created_at desc);

commit;