alter table public.studio_posts
  add column if not exists generation_prefs jsonb not null default '{}'::jsonb;
