begin;

alter table if exists users
  add column if not exists department text;

commit;
