-- Idempotent: adds the category column if it's missing (matching 0005,
-- which may not have been applied), then ensures the check constraint
-- allows all 6 categories including "Defense". Safe to run regardless of
-- whether 0005 already succeeded.
alter table public.posts
  add column if not exists category text not null default 'Other';

do $$
declare
  con record;
begin
  for con in
    select conname from pg_constraint
    where conrelid = 'public.posts'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%category%'
  loop
    execute format('alter table public.posts drop constraint %I', con.conname);
  end loop;
end $$;

alter table public.posts
  add constraint posts_category_check
  check (category in ('Finance', 'Legal', 'Economics', 'Coding', 'Defense', 'Other'));

create index if not exists posts_category_idx on public.posts (category);
