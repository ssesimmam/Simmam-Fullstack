-- Insert the bucket
insert into storage.buckets (id, name, public)
values ('culturals', 'culturals', true)
on conflict (id) do nothing;

-- Allow public read access to the culturals bucket
create policy "Public Access for culturals"
  on storage.objects for select
  using ( bucket_id = 'culturals' );

-- Allow authenticated users (admin panel) to upload to the culturals bucket
create policy "Admin Upload Access for culturals"
  on storage.objects for insert
  with check ( bucket_id = 'culturals' and auth.role() = 'authenticated' );

-- Allow authenticated users to update files in the culturals bucket
create policy "Admin Update Access for culturals"
  on storage.objects for update
  with check ( bucket_id = 'culturals' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete files from the culturals bucket
create policy "Admin Delete Access for culturals"
  on storage.objects for delete
  using ( bucket_id = 'culturals' and auth.role() = 'authenticated' );
