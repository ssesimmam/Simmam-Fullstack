create table if not exists developer_logout_logs (
  id uuid primary key default gen_random_uuid(),
  admin_id uuid not null references admins(id) on delete cascade,
  reason text not null,
  logged_out_at timestamptz not null default now()
);

alter table developer_logout_logs enable row level security;

drop policy if exists developer_logout_logs_insert on developer_logout_logs;
create policy developer_logout_logs_insert on developer_logout_logs
for insert to authenticated
with check (
  current_app_user_id() in (
    select user_id from admins where id = admin_id
  ) or is_admin_user(current_app_user_id())
);

drop policy if exists developer_logout_logs_select on developer_logout_logs;
create policy developer_logout_logs_select on developer_logout_logs
for select to authenticated
using (is_admin_user(current_app_user_id()));
