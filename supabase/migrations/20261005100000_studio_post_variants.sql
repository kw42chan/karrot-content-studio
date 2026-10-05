-- Per-channel post content (X, Threads, social captions)

create table public.studio_post_variants (
  post_id uuid not null references public.studio_posts (id) on delete cascade,
  channel text not null check (channel in ('x', 'threads', 'zh', 'en')),
  content text not null default '',
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (post_id, channel)
);

create table public.studio_post_variant_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.studio_posts (id) on delete cascade,
  channel text not null check (channel in ('x', 'threads', 'zh', 'en')),
  content text not null,
  extra jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index studio_post_variant_versions_idx
  on public.studio_post_variant_versions (post_id, channel, created_at desc);

create trigger studio_post_variants_updated_at
  before update on public.studio_post_variants
  for each row execute function public.studio_set_updated_at();

alter table public.studio_post_variants enable row level security;
alter table public.studio_post_variant_versions enable row level security;

create policy studio_post_variants_admin on public.studio_post_variants
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

create policy studio_post_variant_versions_admin on public.studio_post_variant_versions
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

alter table public.studio_suggestions
  add column if not exists channel text not null default 'blog'
    check (channel in ('blog', 'x', 'threads', 'zh', 'en'));

create index if not exists studio_suggestions_channel_idx
  on public.studio_suggestions (post_id, channel, status);

alter table public.studio_suggestions
  add column if not exists extra jsonb;
