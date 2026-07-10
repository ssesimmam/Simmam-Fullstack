-- Insert the bucket
insert into storage.buckets (id, name, public)
values ('awards', 'awards', true)
on conflict (id) do nothing;

-- Allow public read access to the awards bucket
create policy "Public Access for awards"
  on storage.objects for select
  using ( bucket_id = 'awards' );

-- Allow authenticated users (admin panel) to upload to the awards bucket
create policy "Admin Upload Access for awards"
  on storage.objects for insert
  with check ( bucket_id = 'awards' and auth.role() = 'authenticated' );

-- Allow authenticated users to update files in the awards bucket
create policy "Admin Update Access for awards"
  on storage.objects for update
  with check ( bucket_id = 'awards' and auth.role() = 'authenticated' );

-- Allow authenticated users to delete files from the awards bucket
create policy "Admin Delete Access for awards"
  on storage.objects for delete
  using ( bucket_id = 'awards' and auth.role() = 'authenticated' );
