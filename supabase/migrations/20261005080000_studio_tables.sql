-- Karrot Content Studio — tables in public with studio_ prefix (does not modify other app tables)
-- Admin email must match ADMIN_EMAIL in your app. Update studio_admin_email() if needed.

create or replace function public.studio_admin_email()
returns text
language sql
immutable
as $$
  select 'darwin.chankawing@gmail.com'::text;
$$;

create or replace function public.studio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '') = public.studio_admin_email();
$$;

create table public.studio_sources (
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

create index studio_sources_platform_idx on public.studio_sources (platform);

create table public.studio_posts (
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

create index studio_posts_status_idx on public.studio_posts (status);
create index studio_posts_slug_idx on public.studio_posts (slug);

create table public.studio_post_sources (
  post_id uuid not null references public.studio_posts (id) on delete cascade,
  source_id uuid not null references public.studio_sources (id) on delete restrict,
  position int not null default 0,
  created_at timestamptz not null default now(),
  primary key (post_id, source_id)
);

create table public.studio_post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.studio_posts (id) on delete cascade,
  title text not null,
  my_take text not null,
  body text not null,
  body_language text not null,
  created_at timestamptz not null default now()
);

create index studio_post_versions_post_id_idx on public.studio_post_versions (post_id, created_at desc);

create table public.studio_suggestions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.studio_posts (id) on delete cascade,
  source_id uuid not null references public.studio_sources (id) on delete cascade,
  paragraph text not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'dismissed', 'edited')),
  created_at timestamptz not null default now()
);

create index studio_suggestions_post_idx on public.studio_suggestions (post_id, status);

create or replace function public.studio_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger studio_sources_updated_at
  before update on public.studio_sources
  for each row execute function public.studio_set_updated_at();

create trigger studio_posts_updated_at
  before update on public.studio_posts
  for each row execute function public.studio_set_updated_at();

alter table public.studio_sources enable row level security;
alter table public.studio_post_sources enable row level security;
alter table public.studio_posts enable row level security;
alter table public.studio_post_versions enable row level security;
alter table public.studio_suggestions enable row level security;

create policy studio_sources_admin_all on public.studio_sources
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

create policy studio_posts_admin_all on public.studio_posts
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

create policy studio_posts_public_read on public.studio_posts
  for select
  using (status = 'published');

create policy studio_post_sources_admin_all on public.studio_post_sources
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

create policy studio_post_sources_public_read on public.studio_post_sources
  for select
  using (
    exists (
      select 1 from public.studio_posts p
      where p.id = post_id and p.status = 'published'
    )
  );

create policy studio_post_versions_admin on public.studio_post_versions
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

create policy studio_suggestions_admin on public.studio_suggestions
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

grant execute on function public.studio_is_admin() to anon, authenticated, service_role;
grant execute on function public.studio_admin_email() to anon, authenticated, service_role;
