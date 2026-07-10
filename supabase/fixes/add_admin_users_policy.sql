-- Allow admins to read all user records so they can see developers in the dashboard
drop policy if exists users_select_admin on users;
create policy users_select_admin
on users
for select
to authenticated
using (is_admin_user(current_app_user_id()));
