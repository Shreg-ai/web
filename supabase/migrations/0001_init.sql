-- profiles: one row per user, holds the public username used in share URLs (/u/[username]).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text unique not null,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on public.profiles for select
  using (true);

create policy "Users can insert their own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- graphs: a compiled vault graph belonging to a user, either private or publicly shared.
create table public.graphs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  visibility text not null default 'private' check (visibility in ('private', 'public')),
  node_count integer not null default 0,
  edge_count integer not null default 0,
  graph_data jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.graphs enable row level security;

create policy "Users can view their own graphs"
  on public.graphs for select
  using (auth.uid() = user_id);

create policy "Anyone can view public graphs"
  on public.graphs for select
  using (visibility = 'public');

create policy "Users can insert their own graphs"
  on public.graphs for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own graphs"
  on public.graphs for update
  using (auth.uid() = user_id);

create policy "Users can delete their own graphs"
  on public.graphs for delete
  using (auth.uid() = user_id);

create index graphs_user_id_idx on public.graphs (user_id);
create index graphs_visibility_idx on public.graphs (visibility);
