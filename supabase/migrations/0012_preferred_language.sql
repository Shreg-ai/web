alter table public.profiles
  add column preferred_language text not null default 'en'
  check (preferred_language in ('en', 'zh-TW', 'ja'));
