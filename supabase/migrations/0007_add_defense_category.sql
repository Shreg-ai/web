-- Add "Defense" as a post category alongside Finance/Legal/Economics/Coding/Other.
alter table public.posts drop constraint posts_category_check;

alter table public.posts
  add constraint posts_category_check
  check (category in ('Finance', 'Legal', 'Economics', 'Coding', 'Defense', 'Other'));
