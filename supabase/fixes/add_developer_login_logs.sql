create table if not exists developer_login_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  logged_in_at timestamptz not null default now()
);

alter table developer_login_logs enable row level security;

drop policy if exists developer_login_logs_insert on developer_login_logs;
create policy developer_login_logs_insert on developer_login_logs
for insert to authenticated
with check (
  current_app_user_id() in (
    select user_id from admins where id = admin_id
  ) or is_admin_user(current_app_user_id())
);

drop policy if exists developer_login_logs_select on developer_login_logs;
create policy developer_login_logs_select on developer_login_logs
for select to authenticated
using (is_admin_user(current_app_user_id()));
