-- A lightweight feed post promoting one of the author's own graphs -- text
-- content the author writes themselves (like a status update), distinct
-- from the graph's own AI-generated/authored description.
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  graph_id uuid not null references public.graphs(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

alter table public.posts enable row level security;

create policy "Anyone can view posts about public graphs"
  on public.posts for select
  using (exists (select 1 from public.graphs g where g.id = graph_id and g.visibility = 'public'));

create policy "Users can view their own posts"
  on public.posts for select
  using (auth.uid() = user_id);

create policy "Users can insert their own posts about their own graphs"
  on public.posts for insert
  with check (
    auth.uid() = user_id
    and exists (select 1 from public.graphs g where g.id = graph_id and g.user_id = auth.uid())
  );

create policy "Users can delete their own posts"
  on public.posts for delete
  using (auth.uid() = user_id);

create index posts_graph_id_idx on public.posts (graph_id);
create index posts_created_at_idx on public.posts (created_at desc);
