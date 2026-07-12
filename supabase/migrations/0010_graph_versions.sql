-- Each graph can now have multiple stored versions. `graphs` continues to
-- hold the current/latest snapshot (so every existing query keeps working
-- unchanged), while `graph_versions` holds every snapshot ever saved,
-- including the current one. Each version gets its own permanent MCP
-- endpoint (see /api/mcp/v/[versionId]) so old links keep working even
-- after newer versions are published; /api/mcp/[graphId] keeps behaving
-- like a "latest" pointer.
create table public.graph_versions (
  id uuid primary key default gen_random_uuid(),
  graph_id uuid not null references public.graphs(id) on delete cascade,
  version_number integer not null,
  graph_data jsonb not null,
  scenarios jsonb not null default '[]',
  node_count integer not null default 0,
  edge_count integer not null default 0,
  created_at timestamptz not null default now(),
  unique (graph_id, version_number)
);

alter table public.graph_versions enable row level security;

create policy "Users can view versions of their own graphs"
  on public.graph_versions for select
  using (exists (select 1 from public.graphs g where g.id = graph_id and g.user_id = auth.uid()));

create policy "Anyone can view versions of public graphs"
  on public.graph_versions for select
  using (exists (select 1 from public.graphs g where g.id = graph_id and g.visibility = 'public'));

create policy "Users can insert versions of their own graphs"
  on public.graph_versions for insert
  with check (exists (select 1 from public.graphs g where g.id = graph_id and g.user_id = auth.uid()));

create index graph_versions_graph_id_idx on public.graph_versions (graph_id);

-- Backfill: every existing graph becomes version 1 of itself, so version
-- history isn't empty for graphs that predate this feature.
insert into public.graph_versions (graph_id, version_number, graph_data, scenarios, node_count, edge_count, created_at)
select id, 1, graph_data, scenarios, node_count, edge_count, created_at
from public.graphs
on conflict (graph_id, version_number) do nothing;
