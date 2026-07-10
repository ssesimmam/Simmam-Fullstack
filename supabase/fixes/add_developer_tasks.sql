-- 1. Add login tracking to admins table
alter table if exists admins
  add column if not exists is_logged_in boolean not null default false;

-- 2. Create developer_tasks table
create table if not exists developer_tasks (
  id uuid primary key default gen_random_uuid(),
  developer_id uuid not null references admins(id) on delete cascade,
  title text not null,
  status text not null default 'pending', -- 'pending', 'in_process', 'completed'
  created_by uuid references admins(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Utility Trigger for updated_at
drop trigger if exists trg_developer_tasks_updated_at on developer_tasks;
create trigger trg_developer_tasks_updated_at
before update on developer_tasks
for each row execute function set_updated_at();

-- 4. RLS for developer_tasks
alter table developer_tasks enable row level security;

-- All admins can read developer_tasks
drop policy if exists developer_tasks_select_all on developer_tasks;
create policy developer_tasks_select_all
on developer_tasks
for select
to authenticated
using (is_admin_user(current_app_user_id()));

-- Only sasvanthu.g.2006@gmail.com can insert tasks
drop policy if exists developer_tasks_insert on developer_tasks;
create policy developer_tasks_insert
on developer_tasks
for insert
to authenticated
with check (
  current_app_user_id() in (
    select id from users where email = 'sasvanthu.g.2006@gmail.com'
  )
);

-- Admins can update tasks (to change status)
drop policy if exists developer_tasks_update on developer_tasks;
create policy developer_tasks_update
on developer_tasks
for update
to authenticated
using (is_admin_user(current_app_user_id()))
with check (is_admin_user(current_app_user_id()));

-- Only sasvanthu can delete tasks
drop policy if exists developer_tasks_delete on developer_tasks;
create policy developer_tasks_delete
on developer_tasks
for delete
to authenticated
using (
  current_app_user_id() in (
    select id from users where email = 'sasvanthu.g.2006@gmail.com'
  )
);
