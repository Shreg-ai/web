-- A graph's actual node/edge structure is never exposed to non-owners today
-- (only the AI analysis, eval results, versions, and posts are) -- the Knowledge
-- Playground needs an explicit opt-in per graph before its real structure can
-- be imported by anyone else, separate from the existing public/private
-- visibility (which only ever gated the commentary about the graph, not the
-- graph itself).
alter table public.graphs
  add column share_full_structure boolean not null default false;
