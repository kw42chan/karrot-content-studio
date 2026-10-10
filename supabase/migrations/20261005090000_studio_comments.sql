-- Post comments + admin JWT email fix + optional social title + nullable suggestion source

-- Match email from JWT top-level or user_metadata (magic link sessions)
create or replace function public.studio_is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(
    auth.jwt() ->> 'email',
    auth.jwt() -> 'user_metadata' ->> 'email',
    ''
  )) = lower(public.studio_admin_email());
$$;

create table public.studio_post_comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.studio_posts (id) on delete cascade,
  body text not null,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

create index studio_post_comments_post_idx on public.studio_post_comments (post_id, created_at desc);

alter table public.studio_post_comments enable row level security;

create policy studio_post_comments_admin on public.studio_post_comments
  for all
  using (public.studio_is_admin())
  with check (public.studio_is_admin());

alter table public.studio_posts
  add column if not exists social_title text;

alter table public.studio_suggestions
  alter column source_id drop not null;

alter table public.studio_suggestions
  add column if not exists label text;

comment on table public.studio_post_comments is 'Admin notes on drafts; Apply comments flows through studio_suggestions';
