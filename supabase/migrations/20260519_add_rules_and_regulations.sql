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