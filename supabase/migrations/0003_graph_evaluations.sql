-- One row per scenario per evaluation run, so re-running doesn't lose history.
create table public.graph_evaluations (
  id uuid primary key default gen_random_uuid(),
  graph_id uuid not null references public.graphs(id) on delete cascade,
  question text not null,
  why_relevant text not null,
  baseline_answer text not null,
  graph_answer text not null,
  graph_tool_calls jsonb not null default '[]'::jsonb,
  baseline_groundedness integer not null,
  baseline_framework_consistency integer not null,
  baseline_specificity integer not null,
  graph_groundedness integer not null,
  graph_framework_consistency integer not null,
  graph_specificity integer not null,
  winner text not null check (winner in ('baseline', 'graph', 'tie')),
  judge_reasoning text not null,
  created_at timestamptz not null default now()
);

alter table public.graph_evaluations enable row level security;

create policy "Owners can view evaluations of their own graphs"
  on public.graph_evaluations for select
  using (exists (select 1 from public.graphs g where g.id = graph_id and g.user_id = auth.uid()));

-- Lets a public graph's evaluation results act as a visible trust signal for visitors.
create policy "Anyone can view evaluations of public graphs"
  on public.graph_evaluations for select
  using (exists (select 1 from public.graphs g where g.id = graph_id and g.visibility = 'public'));

create policy "Owners can insert evaluations for their own graphs"
  on public.graph_evaluations for insert
  with check (exists (select 1 from public.graphs g where g.id = graph_id and g.user_id = auth.uid()));

create policy "Owners can delete evaluations of their own graphs"
  on public.graph_evaluations for delete
  using (exists (select 1 from public.graphs g where g.id = graph_id and g.user_id = auth.uid()));

create index graph_evaluations_graph_id_idx on public.graph_evaluations (graph_id);
