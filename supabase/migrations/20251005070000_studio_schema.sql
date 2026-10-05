-- Karrot Content Studio — isolated `studio` schema (do not touch public tables)
-- Admin email must match ADMIN_EMAIL in your app (.env). Update the function below if you use a different address.

create schema if not exists studio;

-- Admin check for RLS (must match ADMIN_EMAIL env, default darwin.chankawing@gmail.com)
create or replace function studio.admin_email()
returns text
language sql
immutable
as $$
  select 'darwin.chankawing@gmail.com'::text;
$$;

create or replace function studio.is_studio_admin()
returns boolean
language sql
stable
security definer
set search_path = studio
as $$
  select coalesce(auth.jwt() ->> 'email', '') = studio.admin_email();
$$;

-- Sources (deduped by normalized URL)
create table studio.sources (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  url_normalized text not null unique,
  platform text not null check (platform in ('x', 'threads', 'web')),
  title text,
  author text,
  text_content text not null default '',
  published_at timestamptz,
  full_text boolean not null default true,
  summary_en jsonb,
  summary_zh jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index studio_sources_platform_idx on studio.sources (platform);

-- Posts
create table studio.posts (
  id uuid primary key default gen_random_uuid(),
  title text not null default '',
  slug text not null unique,
  status text not null default 'draft' check (status in ('draft', 'published')),
  my_take text not null default '',
  body text not null default '',
  body_language text not null default 'zh-HK' check (body_language in ('zh-HK', 'en')),
  key_point text,
  social_captions jsonb,
  kit_broadcast_id text,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index studio_posts_status_idx on studio.posts (status);
create index studio_posts_slug_idx on studio.posts (slug);

-- Post ↔ source (many-to-many)
create table studio.post_sources (
  post_id uuid not null references studio.posts (id) on delete cascade,
  source_id uuid not null references studio.sources (id) on delete restrict,
  position int not null default 0,
  created_at timestamptz not null default now(),
  primary key (post_id, source_id)
);

-- Version history on each save
create table studio.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references studio.posts (id) on delete cascade,
  title text not null,
  my_take text not null,
  body text not null,
  body_language text not null,
  created_at timestamptz not null default now()
);

create index studio_post_versions_post_id_idx on studio.post_versions (post_id, created_at desc);

-- AI enrichment suggestions (per new source on existing post)
create table studio.post_suggestions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references studio.posts (id) on delete cascade,
  source_id uuid not null references studio.sources (id) on delete cascade,
  paragraph text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed', 'edited')),
  created_at timestamptz not null default now()
);

create index studio_post_suggestions_post_idx on studio.post_suggestions (post_id, status);

-- updated_at trigger
create or replace function studio.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger sources_updated_at
  before update on studio.sources
  for each row execute function studio.set_updated_at();

create trigger posts_updated_at
  before update on studio.posts
  for each row execute function studio.set_updated_at();

-- RLS
alter table studio.sources enable row level security;
alter table studio.post_sources enable row level security;
alter table studio.posts enable row level security;
alter table studio.post_versions enable row level security;
alter table studio.post_suggestions enable row level security;

-- Sources: admin only
create policy studio_sources_admin_all on studio.sources
  for all
  using (studio.is_studio_admin())
  with check (studio.is_studio_admin());

-- Posts: admin full access; public read when published
create policy studio_posts_admin_all on studio.posts
  for all
  using (studio.is_studio_admin())
  with check (studio.is_studio_admin());

create policy studio_posts_public_read on studio.posts
  for select
  using (status = 'published');

-- Post sources: admin; public can read links for published posts
create policy studio_post_sources_admin_all on studio.post_sources
  for all
  using (studio.is_studio_admin())
  with check (studio.is_studio_admin());

create policy studio_post_sources_public_read on studio.post_sources
  for select
  using (
    exists (
      select 1 from studio.posts p
      where p.id = post_id and p.status = 'published'
    )
  );

-- Versions & suggestions: admin only
create policy studio_post_versions_admin on studio.post_versions
  for all
  using (studio.is_studio_admin())
  with check (studio.is_studio_admin());

create policy studio_post_suggestions_admin on studio.post_suggestions
  for all
  using (studio.is_studio_admin())
  with check (studio.is_studio_admin());

-- Grant usage to API roles
grant usage on schema studio to anon, authenticated, service_role;
grant all on all tables in schema studio to anon, authenticated, service_role;
grant execute on function studio.is_studio_admin() to anon, authenticated, service_role;
grant execute on function studio.admin_email() to anon, authenticated, service_role;

-- Expose studio tables via PostgREST (optional; Supabase may need schema in API settings)
comment on schema studio is 'Karrot Content Studio — keep separate from ai-news-feed tables';
