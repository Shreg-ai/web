-- User- or AI-authored test questions for a graph, used to compare a baseline
-- agent against a graph-augmented one. `description` already exists on this
-- table from 0001_init.sql (added ahead of this feature, unused until now) --
-- it's what becomes the MCP server's tool description.
alter table public.graphs
  add column scenarios jsonb not null default '[]'::jsonb;
