-- Posts had select/insert/delete RLS policies but no update policy, so
-- editing a post's content/category was silently blocked by RLS (the query
-- matched zero rows instead of erroring, which surfaced as a confusing
-- "Cannot coerce the result to a single JSON object" from PostgREST).
create policy "Users can update their own posts"
  on public.posts for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
