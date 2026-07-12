-- Every post is tagged with one category, so the feed can be filtered by
-- topic (Finance, Legal, Economics, Coding, Other).
alter table public.posts
  add column category text not null default 'Other';

alter table public.posts
  add constraint posts_category_check
  check (category in ('Finance', 'Legal', 'Economics', 'Coding', 'Other'));

create index posts_category_idx on public.posts (category);
