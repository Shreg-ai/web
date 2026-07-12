-- Profile picture + short bio, shown on the public profile page and next to
-- the user's name in the feed and sidebar.
alter table public.profiles
  add column avatar_url text,
  add column bio text;

-- Public bucket for avatar images. Each user may only write to their own
-- folder (path prefixed by their user id), but anyone can read (the bucket
-- itself is public so avatar URLs work as plain <img src> links).
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users can delete their own avatar"
  on storage.objects for delete
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
